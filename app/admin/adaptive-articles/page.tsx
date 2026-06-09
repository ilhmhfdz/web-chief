import type { Metadata } from 'next';
import {
  FileText,
  Activity,
  Clock,
  XCircle,
  Sparkles,
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import dbConnect from '@/lib/db/mongoose';
import { AdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import type { IAdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import ArticlesPageClient from './ArticlesPageClient';
import type { ArticleRow } from './ArticlesPageClient';

// ============================================================
// Metadata
// ============================================================

export const metadata: Metadata = { title: 'Artikel Adaptif GEO' };

// ============================================================
// Data fetching (Server)
// ============================================================

interface DashboardStats {
  total: number;
  active: number;
  draft: number;
  lastAdaptedAt: string | null;
}

async function fetchData(): Promise<{ stats: DashboardStats; articles: ArticleRow[] }> {
  try {
    await dbConnect();

    const docs = await AdaptiveArticle.find()
      .sort({ createdAt: -1 })
      .select('slug title current_content meta_description is_active last_adapted_at geo_keywords version_history')
      .lean<IAdaptiveArticle[]>();

    const total = docs.length;
    const active = docs.filter((d) => d.is_active).length;
    const draft = total - active;

    const lastAdapted = docs.find((d) => d.last_adapted_at);
    const lastAdaptedAt = lastAdapted?.last_adapted_at
      ? new Date(lastAdapted.last_adapted_at).toISOString()
      : null;

    const articles: ArticleRow[] = docs.map((d) => ({
      _id: (d._id as any).toString(),
      slug: d.slug,
      title: d.title,
      current_content: d.current_content,
      meta_description: d.meta_description,
      is_active: d.is_active,
      last_adapted_at: d.last_adapted_at ? new Date(d.last_adapted_at).toISOString() : null,
      geo_keywords: d.geo_keywords ?? [],
      version_count: d.version_history?.length ?? 0,
    }));

    return { stats: { total, active, draft, lastAdaptedAt }, articles };
  } catch {
    return {
      stats: { total: 0, active: 0, draft: 0, lastAdaptedAt: null },
      articles: [],
    };
  }
}

// ============================================================
// Page — Server Component (data) + Client Component (interactivity)
// ============================================================

export default async function AdaptiveArticlesPage() {
  const { stats, articles } = await fetchData();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading-lg">Artikel Adaptif GEO</h1>
          <p className="text-surface-sub text-sm mt-1">
            Kelola dan monitoring artikel yang diadaptasi AI menggunakan strategi GEO
          </p>
        </div>

        {/* Cron endpoint badge */}
        <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-surface-sub">
            Cron:{' '}
            <code className="font-mono text-surface-ink bg-surface-raised px-1.5 py-0.5 rounded text-[11px]">
              /api/cron/adapt-articles
            </code>
          </span>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Artikel"
          value={stats.total}
          icon={<FileText className="w-6 h-6" />}
          variant="brand"
        />
        <StatCard
          label="Artikel Aktif"
          value={stats.active}
          icon={<Activity className="w-6 h-6" />}
          variant="green"
          sub="Tayang & akan diadaptasi cron"
        />
        <StatCard
          label="Draft"
          value={stats.draft}
          icon={<XCircle className="w-6 h-6" />}
          variant="default"
          sub="Menunggu review & publish"
        />
        <StatCard
          label="Terakhir Diadaptasi"
          value={
            stats.lastAdaptedAt
              ? new Date(stats.lastAdaptedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })
              : '—'
          }
          icon={<Clock className="w-6 h-6" />}
          variant="purple"
          sub={
            stats.lastAdaptedAt
              ? new Date(stats.lastAdaptedAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Belum pernah'
          }
        />
      </div>

      {/* ── Daftar Artikel header ── */}
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-surface-ink" />
        <h2 className="label-upper">Daftar Artikel</h2>
      </div>

      {/* ── Client Component: buttons + table + modals ── */}
      <ArticlesPageClient initialArticles={articles} />
    </div>
  );
}
