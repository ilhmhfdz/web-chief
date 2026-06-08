import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/types/product';
import ProductCard from '@/components/shop/ProductCard';
import dbConnect from '@/lib/db/mongoose';
import { Product as ProductModel } from '@/lib/db/models/Product';
import { AdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import ArticleGrid from './articles/components/ArticleGrid';
import HeroParallax from './components/home/HeroParallax';
import FeaturesGrid from './components/home/FeaturesGrid';
import AIBannerAnimated from './components/home/AIBannerAnimated';
import { serializeProducts } from '@/lib/db/serialize';
import type { IAdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';

export const metadata: Metadata = {
  title: 'Chief Supplies — Perlengkapan Pria Premium',
  description: 'Temukan perlengkapan grooming terbaik untuk pria modern. Dipersonalisasi oleh AI berdasarkan bentuk wajah Anda.',
};

// ─── Data Fetching ─────────────────────────────────────────────

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    await dbConnect();
    const products = await ProductModel
      .find({ is_active: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    return serializeProducts(products);
  } catch {
    return [];
  }
}

async function getLatestArticles() {
  try {
    await dbConnect();
    const articles = await AdaptiveArticle.find({ is_active: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('slug title meta_description createdAt geo_keywords last_adapted_at')
      .lean<IAdaptiveArticle[]>();

    return articles.map(a => ({
      _id: (a._id as any).toString(),
      slug: a.slug,
      title: a.title,
      meta_description: a.meta_description ?? '',
      last_adapted_at: a.last_adapted_at ? new Date(a.last_adapted_at).toISOString() : null,
      createdAt: new Date(a.createdAt).toISOString(),
      geo_keywords: a.geo_keywords ?? [],
    }));
  } catch {
    return [];
  }
}

// ─── Skeleton ─────────────────────────────────────────────────

function FeaturedProductsSkeleton() {
  return (
    <section className="section-container py-16 lg:py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="h-3 w-24 bg-surface-muted rounded animate-pulse mb-3" />
          <div className="h-8 w-40 bg-surface-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/5] bg-surface-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-surface-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-surface-muted rounded animate-pulse" />
            <div className="h-3 w-28 bg-surface-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-surface-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Products Async Component ────────────────────────
// Uses the same ProductCard as catalog for consistency (main request)

async function FeaturedProducts() {
  const featured = await getFeaturedProducts();
  if (featured.length === 0) return null;

  return (
    <section className="section-container py-16 lg:py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="label-upper mb-2">Koleksi Terbaru</p>
          <h2 className="heading-lg">Produk Pilihan</h2>
        </div>
        <Link href="/catalog" className="btn-ghost text-sm hidden sm:flex">
          Lihat Semua <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Same grid layout as catalog, using identical ProductCard component */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
        {featured.map((product, index) => (
          <ProductCard key={product._id} product={product} index={index} />
        ))}
      </div>

      <div className="mt-8 sm:hidden text-center">
        <Link href="/catalog" className="btn-secondary text-sm">
          Lihat Semua Produk <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// ─── Latest Articles Async Component ────────────────────────

async function LatestArticles() {
  const articles = await getLatestArticles();
  if (articles.length === 0) return null;

  return (
    <section className="section-container py-16 lg:py-20 bg-surface-raised/30">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="label-upper mb-2 text-accent-dark">Knowledge Base</p>
          <h2 className="heading-lg">Edukasi Grooming & Panduan Gaya Rambut Pria Terpercaya</h2>
        </div>
        <Link href="/articles" className="btn-ghost text-sm hidden sm:flex">
          Lihat Semua Artikel <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <ArticleGrid articles={articles} />

      <div className="mt-8 sm:hidden text-center">
        <Link href="/articles" className="btn-secondary text-sm">
          Lihat Semua Artikel <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default async function HomePage() {
  return (
    <main>

      {/* ─── Hero ─── */}
      <HeroParallax />

      <div className="divider" />

      {/* ─── Featured Products — same ProductCard as catalog ─── */}
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      <div className="divider" />

      {/* ─── Features ─── */}
      <FeaturesGrid />

      <div className="divider" />

      {/* ─── Latest Articles ─── */}
      <Suspense fallback={<div className="h-[400px] flex items-center justify-center text-surface-sub text-sm animate-pulse">Memuat artikel...</div>}>
        <LatestArticles />
      </Suspense>

      <div className="divider" />

      {/* ─── AI CTA Banner ─── */}
      <AIBannerAnimated />

    </main>
  );
}
