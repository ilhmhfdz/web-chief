'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Sparkles,
  Droplets,
  Scissors,
  Pocket,
  Star,
  MessageCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/types/product';
import type { ProductCategory, ProductsQueryParams } from '@/types/product';
import { buildQueryString } from '@/lib/utils/format';
import { CATALOG_REVIEWS } from '@/lib/dummy-reviews';

// ============================================================
// Icons
// ============================================================

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: LayoutGrid,
  pomade: Sparkles,
  shampoo: Droplets,
  tools: Scissors,
  accessories: Pocket,
};

// ============================================================
// Props
// ============================================================

interface CatalogSidebarProps {
  initialParams: ProductsQueryParams;
}

// ============================================================
// Sub-Components
// ============================================================

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const cls = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-surface-muted text-surface-muted'}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: (typeof CATALOG_REVIEWS)[0] }) {
  return (
    <div className="py-3 border-b border-surface-muted/50 last:border-0">
      {/* Author row */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-full bg-surface-ink text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {review.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-surface-ink truncate">{review.author}</span>
            {review.verified && (
              <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
            )}
          </div>
          <span className="text-[10px] text-surface-border">{review.date}</span>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-xs text-surface-sub leading-relaxed line-clamp-3">{review.comment}</p>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

const RATING_OPTIONS = [
  { label: '5 Bintang', value: 5 },
  { label: '4+ Bintang', value: 4 },
  { label: '3+ Bintang', value: 3 },
];

export default function CatalogSidebar({ initialParams }: CatalogSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [category, setCategory] = useState<ProductCategory | 'all'>(
    initialParams.category ?? 'all'
  );
  const [minRating, setMinRating] = useState<number | undefined>(
    initialParams.minRating
  );
  const [reviewsExpanded, setReviewsExpanded] = useState(true);

  const applyFilters = useCallback(
    (overrides: Partial<ProductsQueryParams> = {}) => {
      const params = { page: 1, category, minRating, ...initialParams, ...overrides };
      router.push(`${pathname}${buildQueryString(params)}`);
    },
    [router, pathname, category, minRating, initialParams]
  );

  const handleCategoryChange = (value: ProductCategory | 'all') => {
    setCategory(value);
    applyFilters({ category: value });
  };

  const handleRatingChange = (value: number | undefined) => {
    const next = minRating === value ? undefined : value;
    setMinRating(next);
    applyFilters({ minRating: next });
  };

  // Aggregate stats
  const avgRating = (
    CATALOG_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / CATALOG_REVIEWS.length
  ).toFixed(1);
  const totalReviews = 328; // dummy total

  return (
    <aside className="space-y-6">

      {/* ---- Category Filter ---- */}
      <div className="bg-white border border-surface-muted rounded-lg p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-surface-sub mb-3">
          Kategori
        </h2>
        <ul className="space-y-1">
          {PRODUCT_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.value] || LayoutGrid;
            const isActive = category === cat.value;
            return (
              <li key={cat.value}>
                <button
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-medium transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-surface-ink text-white'
                      : 'text-surface-sub hover:text-surface-ink hover:bg-surface-raised'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-surface-border'}`} />
                  {cat.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ---- Rating Filter ---- */}
      <div className="bg-white border border-surface-muted rounded-lg p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-surface-sub mb-3">
          Filter Rating
        </h2>
        <div className="space-y-2">
          {RATING_OPTIONS.map((opt) => {
            const isActive = minRating === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleRatingChange(opt.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-sm transition-all duration-150 border ${
                  isActive
                    ? 'border-surface-ink bg-surface-raised font-semibold text-surface-ink'
                    : 'border-transparent text-surface-sub hover:bg-surface-raised hover:text-surface-ink'
                }`}
              >
                <StarRating rating={opt.value} />
                <span className="text-xs">{opt.label}</span>
                {isActive && (
                  <span className="ml-auto text-[10px] font-bold text-surface-ink bg-surface-overlay px-1.5 py-0.5 rounded-xs">
                    Aktif
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {minRating && (
          <button
            onClick={() => handleRatingChange(undefined)}
            className="mt-2 w-full text-[11px] text-surface-border hover:text-surface-ink transition-colors underline underline-offset-2"
          >
            Hapus filter rating
          </button>
        )}
      </div>

      {/* ---- Ulasan / Reviews ---- */}
      <div className="bg-white border border-surface-muted rounded-lg overflow-hidden">
        {/* Header — collapsible */}
        <button
          onClick={() => setReviewsExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-raised/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-surface-border" />
            <span className="text-xs font-bold uppercase tracking-widest text-surface-sub">
              Ulasan Pembeli
            </span>
          </div>
          {reviewsExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-surface-border" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-surface-border" />
          )}
        </button>

        {reviewsExpanded && (
          <div className="px-4 pb-4">
            {/* Aggregate score */}
            <div className="flex items-center gap-3 py-3 mb-2 border-b border-surface-muted">
              <div className="text-center">
                <p className="text-3xl font-bold text-surface-ink font-display leading-none">{avgRating}</p>
                <StarRating rating={parseFloat(avgRating)} size="md" />
                <p className="text-[10px] text-surface-border mt-1">{totalReviews} ulasan</p>
              </div>
              {/* Rating bars */}
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = star === 5 ? 68 : star === 4 ? 22 : star === 3 ? 7 : star === 2 ? 2 : 1;
                  return (
                    <div key={star} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-surface-border w-2">{star}</span>
                      <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-surface-border w-5 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual reviews */}
            <div>
              {CATALOG_REVIEWS.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            <button className="mt-3 w-full text-[11px] font-semibold text-surface-sub hover:text-surface-ink transition-colors underline underline-offset-2">
              Lihat semua {totalReviews} ulasan →
            </button>
          </div>
        )}
      </div>

    </aside>
  );
}
