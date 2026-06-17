/**
 * scripts/embed-products.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script: generates text-embedding-3-small vectors for every active
 * product and saves them back to MongoDB.
 *
 * Run: npx ts-node --project tsconfig.json -e "require('./scripts/embed-products.ts')"
 * Or:  npx tsx scripts/embed-products.ts
 *
 * Safe to re-run — only updates products missing an embedding or when forced.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import OpenAI from 'openai';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local manually (avoid dotenv module dependency in scripts)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

if (!MONGODB_URI || !OPENAI_API_KEY) {
  console.error('❌ Missing MONGODB_URI or OPENAI_API_KEY in .env.local');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ── Inline Product schema (avoid Next.js module resolution issues) ─────────
const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  category: String,
  tags: [String],
  hair_benefits: String,
  embedding: [Number],
  is_active: Boolean,
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

/**
 * Builds a rich text representation of a product for embedding.
 * Combine all semantically meaningful fields to maximise retrieval accuracy.
 */
function buildEmbedText(p: any): string {
  const parts = [
    `Produk: ${p.name}`,
    `Kategori: ${p.category}`,
    `Deskripsi: ${p.description ?? ''}`,
    p.tags?.length ? `Tags: ${p.tags.join(', ')}` : '',
    p.hair_benefits ? `Manfaat rambut: ${p.hair_benefits}` : '',
  ];
  return parts.filter(Boolean).join('\n').replace(/\n/g, ' ');
}

async function embedProducts(forceAll = false) {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const filter: any = { is_active: true };
  if (!forceAll) {
    // Only process products that have no embedding yet
    filter.$or = [
      { embedding: { $exists: false } },
      { embedding: { $size: 0 } },
    ];
  }

  const products = await Product.find(filter).lean();
  console.log(`📦 Found ${products.length} products to embed`);

  if (products.length === 0) {
    console.log('✨ All products already have embeddings. Pass --force to re-embed all.');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const text = buildEmbedText(product);
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      const embedding = response.data[0].embedding;
      await Product.findByIdAndUpdate((product as any)._id, { embedding });

      console.log(`  ✅ [${++success}/${products.length}] ${(product as any).name}`);

      // Small delay to avoid rate limit (OpenAI free tier: 3 req/min)
      await new Promise(r => setTimeout(r, 350));
    } catch (err: any) {
      console.error(`  ❌ Failed: ${(product as any).name} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n🎉 Done! Success: ${success}, Failed: ${failed}`);
  await mongoose.disconnect();
}

const forceAll = process.argv.includes('--force');
embedProducts(forceAll).catch(e => {
  console.error(e);
  process.exit(1);
});
