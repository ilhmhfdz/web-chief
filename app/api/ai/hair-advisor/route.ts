/**
 * POST /api/ai/hair-advisor
 * ─────────────────────────────────────────────────────────────────────────────
 * Public endpoint (no auth required — accessible from landing page).
 *
 * Flow:
 *  1. Validate input (condition string)
 *  2. IP-based rate limiting (5 req / 60s)
 *  3. Embed the user's condition query (text-embedding-3-small)
 *  4. Atlas $vectorSearch → top-8 candidates (filter to relevant only)
 *  5. GPT-4o-mini: evaluate relevance + generate reason/tag per product
 *  6. Return ONLY relevant products (is_relevant: true)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import dbConnect from '@/lib/db/mongoose';
import { Product } from '@/lib/db/models/Product';
import { generateEmbedding } from '@/lib/ai/embeddings';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Rate limit ────────────────────────────────────────────────────────────────
const RATE_LIMIT = 5;          // max requests
const RATE_WINDOW_MS = 60_000; // per 60 seconds
const rateMap = new Map<string, { count: number; ts: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = rateMap.get(ip) ?? { count: 0, ts: now };
  if (now - rec.ts > RATE_WINDOW_MS) {
    rec.count = 1; rec.ts = now;
  } else {
    rec.count += 1;
  }
  rateMap.set(ip, rec);
  return rec.count > RATE_LIMIT;
}

// ── Hair science system prompt — injected to GPT so it understands hair context
const HAIR_SCIENCE_CONTEXT = `
You are an expert AI hair care and men's grooming advisor from Chief Barber & Supplies.
Your foundational hair science knowledge:
- Oily hair: caused by excess sebum, needs clarifying shampoo with zinc or salicylic acid.
- Dandruff: caused by Malassezia fungus, effective with zinc pyrithione, selenium sulfide, ketoconazole.
- Dry/damaged hair: lacks moisture, needs conditioner, hair oil, protein treatment.
- Hair loss: due to stress, hormones, or nutrition, needs products with biotin or caffeine.
- Coarse/unruly hair: needs water-based pomade or light wax for control.
- Sensitive scalp: avoid harsh alcohols/sulfates; choose gentle/hypoallergenic products.
Always recommend products based specifically on the user's described condition.
`.trim();

// ── Type for AI-annotated product ────────────────
export interface HairAdvisorRecommendation {
  product: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image_url: string;
    images: string[];
    tags: string[];
  };
  reason: string;     // "Mengandung zinc yang efektif mengatasi ketombe"
  ai_tag: string;     // "Untuk kulit kepala berminyak"
  match_score: number; // 0–100 based on vector similarity
}

// ── POST handler ───────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  // ── 1. IP Rate Limiting ────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (ip !== 'unknown' && isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Tunggu 1 menit sebelum mencoba lagi.' },
      { status: 429 }
    );
  }

  // ── 2. Parse & validate body ───────────────────────────────────────────────
  let condition: string;
  try {
    const body = await req.json();
    condition = (body.condition ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 });
  }

  if (!condition || condition.length < 5) {
    return NextResponse.json(
      { error: 'Ceritakan kondisi rambut Anda minimal 5 karakter.' },
      { status: 400 }
    );
  }

  if (condition.length > 500) {
    return NextResponse.json(
      { error: 'Deskripsi terlalu panjang. Maksimal 500 karakter.' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // ── 3. Embed the user's query ─────────────────────────────────────────
    // Enrich query with hair context so embedding is more accurate
    const enrichedQuery = `Kondisi rambut pelanggan: ${condition}. Cari produk grooming yang cocok.`;
    const queryVector = await generateEmbedding(enrichedQuery);

    // ── 4. Atlas Vector Search on products ───────────────────────────────
    // Uses the 'product_embedding_index' Atlas Search index (see setup notes)
    const vectorResults = await Product.aggregate([
      {
        $vectorSearch: {
          index: 'product_embedding_index',
          path: 'embedding',
          queryVector,
          numCandidates: 80,  // search wider pool
          limit: 8,           // get top-8, GPT will filter to relevant ones
          filter: { is_active: true },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          description: 1,
          price: 1,
          stock: 1,
          category: 1,
          image_url: 1,
          images: 1,
          tags: 1,
          hair_benefits: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    // Fallback: if no embedding index yet, use text search
    let products = vectorResults;
    if (products.length === 0) {
      products = await Product.find({ is_active: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean()
        .then(ps => ps.map(p => ({ ...p, score: 0.5 })));
    }

    // Take top-8 candidates for GPT relevance evaluation
    const topProducts = products.slice(0, 8);

    if (topProducts.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // ── 5. GPT-4o-mini: generate reason + ai_tag per product ──────────────
    const productListText = topProducts.map((p, i) => (
      `${i + 1}. ${p.name} (${p.category}) — ${p.description?.slice(0, 120) ?? ''}${p.hair_benefits ? `. Manfaat: ${p.hair_benefits}` : ''}`
    )).join('\n');

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${HAIR_SCIENCE_CONTEXT}

Your task: evaluate each candidate product and determine if it is TRULY relevant to the user's hair condition.

Relevance evaluation rules:
- is_relevant: true → the product directly addresses the mentioned hair condition.
- is_relevant: false → the product has NO relation to the condition.
- If the user mentions scalp issues/dandruff/hair loss → shampoo & hair treatment = relevant, pomade/styling = NOT relevant.
- If the user mentions coarse hair/hard to manage/needs hold → pomade/wax = relevant, shampoo alone = less relevant.
- Return a maximum of 4 relevant products.

IMPORTANT: You MUST write the \`reason\` and \`ai_tag\` in PREMIUM ENGLISH (professional, elegant, suitable for a high-end grooming brand).

Response MUST be ONLY in this JSON format:
{
  "annotations": [
    {
      "index": 0,
      "is_relevant": true,
      "reason": "Short 1-sentence explanation of why it fits (max 90 chars, premium English)",
      "ai_tag": "Short condition label (e.g. 'For Oily Scalp', 'Dandruff Control')"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `User's hair condition: "${condition}"

Candidate products:
${productListText}

Evaluate relevance and create the JSON annotation for each product above (ensure reason/tag are in premium English). Only mark is_relevant: true if the product genuinely helps the condition.`,
        },
      ],
    });

    // Parse GPT annotations
    let annotations: Array<{ index: number; is_relevant: boolean; reason: string; ai_tag: string }> = [];
    try {
      const parsed = JSON.parse(gptResponse.choices[0]?.message?.content ?? '{}');
      annotations = parsed.annotations ?? [];
    } catch {
      // If parsing fails, treat all as relevant with generic annotation
      annotations = topProducts.map((_, i) => ({
        index: i,
        is_relevant: true,
        reason: 'Premium grooming essential from Chief Barber & Supplies.',
        ai_tag: 'AI Recommended',
      }));
    }

    // ── 6. Filter ONLY relevant products, then assemble response ─────────
    const recommendations: HairAdvisorRecommendation[] = topProducts
      .map((product, i) => {
        const ann = annotations.find(a => a.index === i);

        // Skip products flagged as not relevant by GPT
        if (ann && ann.is_relevant === false) return null;

        const fallbackAnn = {
          is_relevant: true,
          reason: 'Premium grooming essential tailored for your needs.',
          ai_tag: 'AI Recommended',
        };
        const finalAnn = ann ?? fallbackAnn;

        // Normalize vector score (0.0–1.0) to 0–100
        const rawScore = (product as any).score ?? 0.5;
        const matchScore = Math.round(Math.min(100, Math.max(60, rawScore * 100)));

        return {
          product: {
            _id: product._id.toString(),
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            image_url: product.image_url,
            images: product.images ?? [],
            tags: product.tags ?? [],
          },
          reason: finalAnn.reason,
          ai_tag: finalAnn.ai_tag,
          match_score: matchScore,
        } satisfies HairAdvisorRecommendation;
      })
      .filter((r): r is HairAdvisorRecommendation => r !== null)
      .slice(0, 4); // max 4 cards

    return NextResponse.json({ recommendations });

  } catch (error: any) {
    console.error('[hair-advisor] Error:', error);
    return NextResponse.json(
      { error: 'Gagal menganalisis kondisi rambut. Coba lagi.' },
      { status: 500 }
    );
  }
}
