import type { Metadata } from 'next';
import HeroAnimated from './components/HeroAnimated';
import ArticleGrid from './components/ArticleGrid';
import dbConnect from '@/lib/db/mongoose';
import { AdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import type { IAdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';

// ============================================================
// Metadata
// ============================================================

export const metadata: Metadata = {
  title: 'Artikel & Panduan Pria | Chief Supplies',
  description: 'Temukan panduan gaya rambut, tips perawatan, dan rekomendasi grooming terbaik untuk pria Indonesia dari Chief Supplies.',
};

// ============================================================
// Types
// ============================================================

interface ArticleSummary {
  _id: string;
  slug: string;
  title: string;
  meta_description: string;
  last_adapted_at: string | null;
  createdAt: string;
  geo_keywords: string[];
}

// ============================================================
// Data fetching
// ============================================================

async function getActiveArticles(): Promise<ArticleSummary[]> {
  try {
    await dbConnect();
    const articles = await AdaptiveArticle.find({ is_active: true })
      .sort({ createdAt: -1 })
      .select('slug title meta_description last_adapted_at createdAt geo_keywords')
      .lean<IAdaptiveArticle[]>();

    return articles.map((a) => ({
      _id: (a._id as any).toString(),
      slug: a.slug,
      title: a.title,
      meta_description: a.meta_description ?? '',
      last_adapted_at: a.last_adapted_at ? new Date(a.last_adapted_at).toISOString() : null,
      createdAt: new Date(a.createdAt).toISOString(),
      geo_keywords: a.geo_keywords ?? [],
    }));
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

// ============================================================
// Page Component
// ============================================================

export default async function ArticlesIndexPage() {
  const articles = await getActiveArticles();

  return (
    <div className="min-h-screen bg-surface">
      <HeroAnimated />

      {/* ── Article List ── */}
      <section className="section-container py-16 lg:py-24">
        <ArticleGrid articles={articles} />
      </section>
    </div>
  );
}
