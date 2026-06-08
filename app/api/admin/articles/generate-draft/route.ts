import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import dbConnect from '@/lib/db/mongoose';
import { AdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import { Product } from '@/lib/db/models/Product';
import { serializeDoc } from '@/lib/db/serialize';
import type { IProduct } from '@/lib/db/models/Product';

// ============================================================
// Helper — Scrape URL and extract plain text
// ============================================================

async function scrapeUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ChiefSuppliesBot/1.0; +https://chief-supplies.id)',
      },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!res.ok) return `[Gagal mengambil konten dari ${url}: HTTP ${res.status}]`;

    const html = await res.text();

    // Strip HTML tags and clean whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    // Limit to 3000 chars per URL to manage token usage
    return text.slice(0, 3000);
  } catch (err: any) {
    return `[Error mengambil ${url}: ${err.message}]`;
  }
}

// ============================================================
// POST /api/admin/articles/generate-draft
// Body: { topic, referenceUrls?, geo_keywords?, tone? }
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      referenceUrls = [],
      geo_keywords = [],
      tone = 'profesional dan maskulin',
    }: {
      topic: string;
      referenceUrls?: string[];
      geo_keywords?: string[];
      tone?: string;
    } = body;

    if (!topic?.trim()) {
      return NextResponse.json(
        { error: 'Topik artikel wajib diisi' },
        { status: 400 }
      );
    }

    await dbConnect();

    // ── Fetch product catalog for recommendations ──
    const products = await Product.find({ is_active: true })
      .select('name slug price category description tags')
      .lean<IProduct[]>();

    const productCatalog = products.map((p) => ({
      name: p.name,
      slug: p.slug,
      category: p.category,
      price: p.price,
      description: String(p.description).slice(0, 150),
    }));

    // ── Scrape reference URLs in parallel ──
    let scrapedContent = '';
    if (referenceUrls.length > 0) {
      const validUrls = referenceUrls
        .filter((url: string) => url?.trim())
        .slice(0, 3); // max 3 URLs
      const scraped = await Promise.all(validUrls.map(scrapeUrl));
      scrapedContent = validUrls
        .map((url: string, i: number) => `--- Referensi dari ${url} ---\n${scraped[i]}`)
        .join('\n\n');
    }

    // ── Build prompt ──
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `Kamu adalah Senior Content Strategist untuk Chief Supplies — toko perlengkapan pria premium Indonesia.
Tugasmu: Tulis artikel blog lengkap berkualitas tinggi berdasarkan topik yang diberikan, menggunakan strategi GEO (Generative Engine Optimization).

ATURAN GEO WAJIB:
1. Mulai dengan <div class="tldr"><p><strong>TL;DR:</strong> [ringkasan 2-3 kalimat]</p></div>
2. Sisipkan minimal 2 blockquote Expert Consensus dari barber/ahli fiktif yang realistis
3. Sertakan statistik/angka konkret untuk citability
4. Di akhir: <div class="product-recommendations"><h3>🛍️ Rekomendasi Produk Chief Supplies</h3><ul>[daftar produk relevan dengan harga]</ul></div>
5. Heading H2 dan H3 yang jelas dan hierarkis
6. Bahasa Indonesia yang natural, tone: ${tone}
7. Link produk menggunakan: <a href="/catalog/SLUG">Nama Produk</a>

FORMAT OUTPUT — WAJIB JSON VALID (tanpa markdown fence):
{
  "title": "Judul artikel yang menarik dan SEO-friendly",
  "slug": "slug-url-friendly",
  "content": "<konten HTML lengkap artikel>",
  "meta_description": "Deskripsi meta max 160 karakter",
  "geo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    const userMessage = `Buat artikel tentang: **${topic}**

Keywords target: ${geo_keywords.length > 0 ? geo_keywords.join(', ') : 'sesuaikan dengan topik'}

${scrapedContent ? `REFERENSI KONTEN (ekstrak fakta penting, jangan copy-paste):\n${scrapedContent}` : ''}

KATALOG PRODUK CHIEF SUPPLIES (gunakan untuk rekomendasi):
${JSON.stringify(productCatalog, null, 2)}

Tulis artikel LENGKAP minimal 600 kata. Kembalikan HANYA JSON valid.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // ── Parse Claude response ──
    const rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    let parsed: {
      title: string;
      slug: string;
      content: string;
      meta_description: string;
      geo_keywords: string[];
    };

    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'AI gagal menghasilkan JSON yang valid. Coba lagi.' },
        { status: 500 }
      );
    }

    // ── Ensure unique slug ──
    let finalSlug = parsed.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await AdaptiveArticle.findOne({ slug: finalSlug });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // ── Save as DRAFT (is_active: false) ──
    const article = await AdaptiveArticle.create({
      title: parsed.title,
      slug: finalSlug,
      current_content: parsed.content,
      meta_description: parsed.meta_description ?? '',
      geo_keywords: parsed.geo_keywords ?? geo_keywords,
      is_active: false, // Draft — requires human review before publishing
    });

    return NextResponse.json({
      data: serializeDoc(article.toObject()),
      message: 'Draft artikel berhasil dibuat. Review dan publish jika sudah sesuai.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[generate-draft] Error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Terjadi kesalahan internal' },
      { status: 500 }
    );
  }
}
