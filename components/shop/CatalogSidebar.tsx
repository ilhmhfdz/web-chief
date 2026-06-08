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
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="py-3.5 border-b border-surface-muted/40 last:border-0 group/review">
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-surface-ink to-surface-sub text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
          {review.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-surface-ink truncate">{review.author}</span>
            {review.verified && (
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
            )}
          </div>
          <span className="text-[10px] text-surface-border">{review.date}</span>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-[11px] text-surface-sub leading-relaxed line-clamp-3 pl-10.5">{review.comment}</p>
    </div>
  );
}

// ============================================================
// Section Card Wrapper
// ============================================================

function SidebarCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-surface-muted/50 rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-surface-sub/70">
      {children}
    </h2>
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
  const totalReviews = 328;

  return (
    <aside className="space-y-4">

      {/* ---- Filter Label ---- */}
      <div className="flex items-center gap-2 px-1 mb-1">
        <SlidersHorizontal className="w-3.5 h-3.5 text-surface-sub" />
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-surface-sub">Filter</span>
      </div>

      {/* ---- Category Filter ---- */}
      <SidebarCard>
        <div className="px-4 pt-4 pb-3">
          <SectionHeader>Kategori</SectionHeader>
        </div>
        <ul className="px-2 pb-2 space-y-0.5">
          {PRODUCT_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.value] || LayoutGrid;
            const isActive = category === cat.value;
            return (
              <li key={cat.value}>
                <button
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 text-left group/cat ${
                    isActive
                      ? 'bg-surface-ink text-white shadow-md shadow-surface-ink/10'
                      : 'text-surface-sub hover:text-surface-ink hover:bg-surface-raised/60'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      isActive
                        ? 'bg-white/15 shadow-inner'
                        : 'bg-surface-raised group-hover/cat:bg-white group-hover/cat:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-surface-border group-hover/cat:text-surface-ink'}`} />
                  </span>
                  <span className="flex-1">{cat.label}</span>
                  {isActive && (
                    <motion.span layoutId="activeCat" className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </SidebarCard>

      {/* ---- Rating Filter ---- */}
      <SidebarCard>
        <div className="px-4 pt-4 pb-3">
          <SectionHeader>Filter Rating</SectionHeader>
        </div>
        <div className="px-2 pb-2 space-y-0.5">
          {RATING_OPTIONS.map((opt) => {
            const isActive = minRating === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleRatingChange(opt.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-50 border border-amber-200/70 text-surface-ink'
                    : 'text-surface-sub hover:bg-surface-raised/80 hover:text-surface-ink'
                }`}
              >
                <StarRating rating={opt.value} />
                <span className="text-[12px] font-semibold flex-1 text-left">{opt.label}</span>
                {isActive && (
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                    Aktif
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {minRating && (
          <div className="px-4 pb-3">
            <button
              onClick={() => handleRatingChange(undefined)}
              className="w-full text-[11px] text-surface-border hover:text-surface-ink transition-colors underline underline-offset-2 font-medium"
            >
              Hapus filter rating
            </button>
          </div>
        )}
      </SidebarCard>

      {/* ---- Ulasan / Reviews ---- */}
      <SidebarCard>
        {/* Header — collapsible */}
        <button
          onClick={() => setReviewsExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-raised/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-surface-border" />
            </div>
            <SectionHeader>Ulasan Pembeli</SectionHeader>
          </div>
          <motion.div
            animate={{ rotate: reviewsExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-surface-border" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {reviewsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {/* Aggregate score */}
                <div className="flex items-center gap-4 py-3.5 mb-2 border-b border-surface-muted/40">
                  <div className="text-center">
                    <p className="text-4xl font-black text-surface-ink font-display leading-none tracking-tight">
                      {avgRating}
                    </p>
                    <StarRating rating={parseFloat(avgRating)} size="md" />
                    <p className="text-[10px] text-surface-border mt-1.5 font-medium">{totalReviews} ulasan</p>
                  </div>
                  {/* Rating bars */}
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct = star === 5 ? 68 : star === 4 ? 22 : star === 3 ? 7 : star === 2 ? 2 : 1;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-[10px] text-surface-border w-2 font-medium">{star}</span>
                          <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.1 * (5 - star), ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                            />
                          </div>
                          <span className="text-[10px] text-surface-border w-5 text-right font-medium">{pct}%</span>
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

                <button className="mt-3 w-full text-[11px] font-bold text-surface-sub hover:text-surface-ink transition-colors">
                  Lihat semua {totalReviews} ulasan →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarCard>

    </aside>
  );
}
