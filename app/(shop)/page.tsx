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
    <section className="section-container py-24 lg:py-32">
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="h-3 w-24 bg-surface-muted rounded animate-pulse mb-3" />
          <div className="h-8 w-40 bg-surface-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-[4/5] bg-surface-muted rounded-2xl animate-pulse" />
            <div className="h-3 w-16 bg-surface-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-surface-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-surface-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Products Async Component ────────────────────────

async function FeaturedProducts() {
  const featured = await getFeaturedProducts();
  if (featured.length === 0) return null;

  return (
    <section className="section-container py-24 lg:py-32">
      <div className="flex items-end justify-between mb-14">
        <div className="leading-none">
          <h2 className="text-[3.5rem] lg:text-[5rem] font-bold text-[#1a1a1a] leading-none tracking-tight">Premium</h2>
          <h2 className="text-[3.5rem] lg:text-[5rem] font-bold text-[#c0bdb7] leading-none tracking-tight -mt-2">Collection</h2>
          <p className="mt-6 max-w-xl text-[#8e8b82] text-sm sm:text-base leading-relaxed tracking-wide font-medium">
            Grooming, elevated. Chief Barber & Supplies' exclusive collection is crafted to deliver flawless results — from root to tip, morning to night.
          </p>
        </div>
        <Link
          href="/catalog"
          className="hidden sm:flex items-center px-6 py-3 border border-[#1a1a1a] text-[#1a1a1a] text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors duration-300 mb-2"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {featured.map((product, index) => (
          <ProductCard key={product._id} product={product} index={index} />
        ))}
      </div>

      <div className="mt-12 sm:hidden text-center">
        <Link href="/catalog" className="btn-outline text-sm w-full">
          Lihat Semua Produk
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
    <section className="py-24 lg:py-32 bg-surface">
      <div className="section-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[1px] bg-accent" />
              <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-surface-sub">Knowledge Base</p>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-surface-ink mb-6 tracking-tight leading-[1.1]">
              Grooming & <br className="hidden md:block" />
              <span className="font-serif italic text-surface-ink/80">Gaya Pria.</span>
            </h2>
            <p className="text-base text-surface-sub max-w-md leading-relaxed font-light">
              Edukasi dan panduan terbaru untuk meningkatkan penampilan Anda setiap hari dengan gaya yang tak lekang oleh waktu.
            </p>
          </div>
          <Link href="/articles" className="group inline-flex items-center gap-4 text-xs tracking-[0.15em] uppercase font-bold text-surface-ink transition-opacity hover:text-surface-ink/70 pb-2">
            <span className="border-b border-surface-ink/30 pb-1 group-hover:border-surface-ink transition-colors">
              Semua Artikel
            </span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" strokeWidth={1.5} />
          </Link>
        </div>

        <ArticleGrid articles={articles} />

        <div className="mt-12 sm:hidden text-center border-t border-surface-muted/30 pt-8">
          <Link href="/articles" className="text-xs tracking-[0.1em] uppercase font-bold text-surface-ink border-b border-surface-ink pb-1">
            Lihat Semua
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default async function HomePage() {
  return (
    <main className="bg-surface selection:bg-accent/20">

      {/* ─── Premium Hero Section ─── */}
      <HeroParallax />

      {/* ─── Featured Products ─── */}
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      <div className="border-t border-surface-muted/30" />

      {/* ─── Premium Features ─── */}
      <FeaturesGrid />

      <div className="border-t border-surface-muted/30" />

      {/* ─── AI CTA Banner ─── */}
      <AIBannerAnimated />

      <div className="border-t border-surface-muted/30" />

      {/* ─── Latest Articles ─── */}
      <Suspense fallback={<div className="h-[400px] flex items-center justify-center text-surface-sub text-sm animate-pulse">Memuat artikel...</div>}>
        <LatestArticles />
      </Suspense>

    </main>
  );
}
