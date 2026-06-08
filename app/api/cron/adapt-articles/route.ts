import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';
import dbConnect from '@/lib/db/mongoose';
import { AdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import { Product } from '@/lib/db/models/Product';
import type { IAdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import type { IProduct } from '@/lib/db/models/Product';
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/messages';

// ============================================================
// Constants
// ============================================================

const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 4096;

// ============================================================
// GEO System Prompt — Static instructions for AI rewriting
// ============================================================

const GEO_INSTRUCTIONS = `Kamu adalah seorang Senior Content Strategist dan GEO (Generative Engine Optimization) Expert untuk Chief Supplies — toko online perlengkapan pria premium (pomade, shampoo, tools, aksesoris).

TUGASMU: Tulis ulang artikel yang diberikan menggunakan strategi GEO agar konten mudah dikutip oleh AI search engines (Google SGE, Perplexity AI, ChatGPT Search).

ATURAN GEO WAJIB:
1. **TL;DR di paragraf pertama**: Mulai dengan ringkasan 2-3 kalimat yang menjawab pertanyaan utama artikel secara langsung. Bungkus dalam tag <div class="tldr">.
2. **Expert Consensus**: Sisipkan minimal 2 blockquote (<blockquote>) dari "expert barber" atau "ahli perawatan pria" yang mendukung poin utama. Gunakan nama fiktif yang realistis (contoh: "Menurut Rizky Hakim, barber bersertifikat dengan 12 tahun pengalaman...").
3. **Data & Statistik**: Sertakan angka/statistik yang relevan untuk meningkatkan citability (contoh: "Riset menunjukkan 78% pria menggunakan pomade setidaknya 3x seminggu").
4. **Rekomendasi Produk Chief**: Di akhir artikel, rekomendasikan 2-3 produk Chief Supplies yang relevan dari Katalog Produk yang disediakan. Format sebagai list dengan nama produk, harga, dan alasan singkat kenapa relevan. Bungkus dalam tag <div class="product-recommendations">.
5. **Struktur Heading Jelas**: Gunakan H2 dan H3 secara hierarkis. Setiap H2 harus menjawab sub-pertanyaan yang mungkin ditanyakan user.
6. **Kalimat Definitif**: Hindari bahasa ragu ("mungkin", "bisa jadi"). Gunakan bahasa percaya diri dan otoritatif.
7. **Internal Linking Hints**: Jika ada produk yang disebut, bungkus nama produk dalam <a> tag dengan href="/catalog/SLUG_PRODUK".

FORMAT OUTPUT — WAJIB JSON:
Kamu HARUS mengembalikan HANYA JSON valid (tanpa markdown code fence) dengan struktur:
{
  "content": "<html content artikel yang sudah ditulis ulang>",
  "meta_description": "<meta description SEO, maks 160 karakter>",
  "summary_of_changes": "<ringkasan perubahan yang dilakukan, 1-2 kalimat>"
}

JANGAN tambahkan teks apapun di luar JSON. JANGAN gunakan markdown code fence (\`\`\`).
Tulis konten dalam Bahasa Indonesia yang natural dan profesional.`;

// ============================================================
// Auth guard
// ============================================================

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}

// ============================================================
// Build product catalog text for the cached system block
// ============================================================

function buildProductCatalog(products: IProduct[]): string {
  const catalog = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    category: p.category,
    price: p.price,
    description: p.description.slice(0, 200),
    tags: p.tags,
  }));

  return `KATALOG PRODUK CHIEF SUPPLIES (${catalog.length} produk):
${JSON.stringify(catalog, null, 2)}

Gunakan katalog di atas untuk merekomendasikan produk yang relevan dalam artikel. Pastikan slug produk yang digunakan dalam link <a href="/catalog/SLUG"> sesuai dengan data di atas.`;
}

// ============================================================
// Parse Claude's JSON response
// ============================================================

interface ClaudeArticleResponse {
  content: string;
  meta_description: string;
  summary_of_changes: string;
}

function parseClaudeResponse(rawText: string): ClaudeArticleResponse {
  // Strip potential markdown fences if Claude ignores instructions
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.content || typeof parsed.content !== 'string') {
    throw new Error('Claude response missing "content" field');
  }

  return {
    content: parsed.content,
    meta_description: parsed.meta_description ?? '',
    summary_of_changes: parsed.summary_of_changes ?? 'Content updated by AI',
  };
}

// ============================================================
// GET /api/cron/adapt-articles
// ============================================================

export async function GET(request: Request) {
  // ── Auth check ──
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    // ── 1. Fetch active articles and products ──
    const [articles, products] = await Promise.all([
      AdaptiveArticle.find({ is_active: true }).lean<IAdaptiveArticle[]>(),
      Product.find({ is_active: true }).lean<IProduct[]>(),
    ]);

    if (articles.length === 0) {
      return NextResponse.json({
        message: 'No active articles to adapt',
        adapted: 0,
      });
    }

    // ── 2. Initialize Anthropic client ──
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // ── 3. Build system prompt with prompt caching ──
    // First block: GEO instructions (static, not cached — relatively small)
    // Second block: Product catalog (cached — reused across all article calls)
    const systemPrompt: TextBlockParam[] = [
      {
        type: 'text' as const,
        text: GEO_INSTRUCTIONS,
      },
      {
        type: 'text' as const,
        text: buildProductCatalog(products as unknown as IProduct[]),
        cache_control: { type: 'ephemeral' as const },
      },
    ];

    // ── 4. Process each article ──
    const results: Array<{
      slug: string;
      status: 'success' | 'error';
      summary?: string;
      error?: string;
    }> = [];

    for (const article of articles) {
      try {
        // Call Claude with cached system prompt
        const message = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Tulis ulang artikel berikut menggunakan strategi GEO.

JUDUL: ${article.title}
SLUG: ${article.slug}
GEO KEYWORDS: ${article.geo_keywords.join(', ')}

KONTEN SAAT INI:
${article.current_content}

Ingat: Kembalikan HANYA JSON valid sesuai format yang diinstruksikan.`,
            },
          ],
        });

        // Extract text from response
        const responseText = message.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        // Parse the JSON response
        const parsed = parseClaudeResponse(responseText);

        // ── 5. Save old content to version_history, update article ──
        await AdaptiveArticle.findByIdAndUpdate(article._id, {
          $push: {
            version_history: {
              content: article.current_content,
              adapted_at: article.last_adapted_at ?? article.createdAt ?? new Date(),
              ai_summary_of_changes: parsed.summary_of_changes,
            },
          },
          $set: {
            current_content: parsed.content,
            meta_description: parsed.meta_description,
            last_adapted_at: new Date(),
          },
        });

        // ── 6. Revalidate the article page ──
        revalidatePath(`/articles/${article.slug}`);

        results.push({
          slug: article.slug,
          status: 'success',
          summary: parsed.summary_of_changes,
        });
      } catch (articleError: any) {
        console.error(`[adapt-articles] Error processing "${article.slug}":`, articleError);
        results.push({
          slug: article.slug,
          status: 'error',
          error: articleError.message ?? 'Unknown error',
        });
      }
    }

    // ── 7. Return summary ──
    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      message: `Adapted ${successCount}/${articles.length} articles`,
      adapted: successCount,
      errors: errorCount,
      results,
    });
  } catch (error: any) {
    console.error('[adapt-articles] Fatal error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
