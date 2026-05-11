'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  SlidersHorizontal,
  ChevronRight,
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

interface MobileFilterDrawerProps {
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
// Rating Options
// ============================================================

const RATING_OPTIONS = [
  { label: '5 Bintang', value: 5 },
  { label: '4+ Bintang', value: 4 },
  { label: '3+ Bintang', value: 3 },
];

// ============================================================
// Main Component
// ============================================================

export default function MobileFilterDrawer({ initialParams }: MobileFilterDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<ProductCategory | 'all'>(
    initialParams.category ?? 'all'
  );
  const [minRating, setMinRating] = useState<number | undefined>(
    initialParams.minRating
  );
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  // Drag-to-dismiss state
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  // Portal mount state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Count active filters
  const activeFilterCount = [
    category !== 'all' ? 1 : 0,
    minRating ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

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

  const handleReset = () => {
    setCategory('all');
    setMinRating(undefined);
    applyFilters({ category: 'all', minRating: undefined });
  };

  // Aggregate stats
  const avgRating = (
    CATALOG_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / CATALOG_REVIEWS.length
  ).toFixed(1);
  const totalReviews = 328;

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY - startY.current;
    if (currentY.current > 0 && drawerRef.current) {
      drawerRef.current.style.transform = `translateY(${currentY.current}px)`;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (currentY.current > 100) {
      setIsOpen(false);
    }
    if (drawerRef.current) {
      drawerRef.current.style.transform = '';
    }
    currentY.current = 0;
  };

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        id="mobile-filter-btn"
        onClick={() => setIsOpen(true)}
        className={`lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${
          activeFilterCount > 0
            ? 'bg-surface-ink text-white border-surface-ink'
            : 'bg-white text-surface-sub border-surface-muted hover:border-surface-border hover:text-surface-ink'
        }`}
        aria-label="Buka filter"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filter
        {activeFilterCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-white text-surface-ink text-[10px] font-black flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* ── Portal for Backdrop and Drawer ── */}
      {mounted && createPortal(
        <>
          {/* ── Backdrop ── */}
          {isOpen && (
            <div
              className="lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] animate-fade-in"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* ── Drawer (Bottom Sheet) ── */}
          <div
            ref={drawerRef}
            className={`lg:hidden fixed inset-x-0 bottom-0 z-[70] flex flex-col bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
              isOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ maxHeight: '88dvh' }}
            role="dialog"
            aria-modal="true"
            aria-label="Filter produk"
          >
            {/* Drag handle area */}
            <div
              className="flex-none flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-10 h-1 bg-surface-muted rounded-full" />
            </div>

            {/* Header */}
            <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-surface-muted">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-surface-ink" />
                <h2 className="text-sm font-bold text-surface-ink">Filter Produk</h2>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold bg-surface-ink text-white px-2 py-0.5 rounded-full">
                    {activeFilterCount} aktif
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors underline underline-offset-2"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center hover:bg-surface-muted transition-colors"
                  aria-label="Tutup filter"
                >
                  <X className="w-3.5 h-3.5 text-surface-sub" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 space-y-6">

                {/* ---- Category ---- */}
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-surface-sub mb-3">
                    Kategori
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {PRODUCT_CATEGORIES.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.value] || LayoutGrid;
                      const isActive = category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => handleCategoryChange(cat.value)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left border ${
                            isActive
                              ? 'bg-surface-ink text-white border-surface-ink'
                              : 'bg-surface-raised text-surface-sub border-transparent hover:border-surface-muted hover:text-surface-ink'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-surface-border'}`} />
                          <span className="truncate">{cat.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="h-px bg-surface-muted/60" />

                {/* ---- Rating ---- */}
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-surface-sub mb-3">
                    Filter Rating
                  </h3>
                  <div className="space-y-2">
                    {RATING_OPTIONS.map((opt) => {
                      const isActive = minRating === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleRatingChange(opt.value)}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm transition-all duration-150 border ${
                            isActive
                              ? 'border-surface-ink bg-surface-raised font-semibold text-surface-ink'
                              : 'border-surface-muted text-surface-sub hover:bg-surface-raised hover:text-surface-ink'
                          }`}
                        >
                          <StarRating rating={opt.value} />
                          <span className="text-xs">{opt.label}</span>
                          {isActive ? (
                            <span className="ml-auto text-[10px] font-bold text-surface-ink bg-surface-overlay px-2 py-0.5 rounded-full">
                              Aktif
                            </span>
                          ) : (
                            <ChevronRight className="ml-auto w-3.5 h-3.5 text-surface-muted" />
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
                </section>

                <div className="h-px bg-surface-muted/60" />

                {/* ---- Reviews Collapsible ---- */}
                <section>
                  <button
                    onClick={() => setReviewsExpanded((v) => !v)}
                    className="w-full flex items-center justify-between py-1 hover:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-surface-border" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-surface-sub">
                        Ulasan Pembeli
                      </span>
                    </div>
                    {reviewsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-surface-border" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-surface-border" />
                    )}
                  </button>

                  {reviewsExpanded && (
                    <div className="mt-4">
                      {/* Aggregate score */}
                      <div className="flex items-center gap-3 py-3 mb-2 border-b border-surface-muted">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-surface-ink leading-none">{avgRating}</p>
                          <StarRating rating={parseFloat(avgRating)} size="md" />
                          <p className="text-[10px] text-surface-border mt-1">{totalReviews} ulasan</p>
                        </div>
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
                </section>

              </div>
            </div>

            {/* Footer CTA */}
            <div className="flex-none border-t border-surface-muted px-5 py-4 bg-white">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-xl bg-surface-ink text-white text-sm font-bold tracking-wide active:scale-[0.98] transition-transform"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
