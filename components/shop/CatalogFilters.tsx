'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, X, Flame, Clock, Trophy, TrendingUp, TrendingDown,
  LayoutGrid, Sparkles, Droplets, Scissors, Pocket,
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/types/product';
import type { ProductCategory, ProductsQueryParams } from '@/types/product';
import { buildQueryString } from '@/lib/utils/format';

// ============================================================
// Config
// ============================================================

interface SortOption {
  value: NonNullable<ProductsQueryParams['sort']>;
  label: string;
  Icon: React.ElementType;
}

const SORT_PILLS: SortOption[] = [
  { value: 'popular',    label: 'Populer',   Icon: Flame        },
  { value: 'newest',     label: 'Terbaru',   Icon: Clock        },
  { value: 'bestseller', label: 'Terlaris',  Icon: Trophy       },
  { value: 'price_asc',  label: 'Termurah',  Icon: TrendingDown },
  { value: 'price_desc', label: 'Termahal',  Icon: TrendingUp   },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all:         LayoutGrid,
  pomade:      Sparkles,
  shampoo:     Droplets,
  tools:       Scissors,
  accessories: Pocket,
};

interface CatalogFiltersProps {
  initialParams: ProductsQueryParams;
}

// ============================================================
// Component
// ============================================================

export default function CatalogFilters({ initialParams }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch]   = useState(initialParams.search ?? '');
  const [sort, setSort]       = useState<NonNullable<ProductsQueryParams['sort']>>(
    (initialParams.sort as NonNullable<ProductsQueryParams['sort']>) ?? 'popular'
  );
  const [category, setCategory] = useState<ProductCategory | 'all'>(
    (initialParams.category as ProductCategory | 'all') ?? 'all'
  );

  const applyFilters = useCallback(
    (overrides: Partial<ProductsQueryParams> = {}) => {
      const params = {
        page: 1,
        category: initialParams.category,
        search,
        sort,
        minRating: initialParams.minRating,
        ...overrides,
      };
      router.push(`${pathname}${buildQueryString(params)}`);
    },
    [router, pathname, initialParams, search, sort]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleSortChange = (value: NonNullable<ProductsQueryParams['sort']>) => {
    setSort(value);
    applyFilters({ sort: value });
  };

  const handleClearSearch = () => {
    setSearch('');
    applyFilters({ search: '' });
  };

  const handleCategoryChange = (value: ProductCategory | 'all') => {
    setCategory(value);
    applyFilters({ category: value });
  };

  return (
    <div className="space-y-3">
      {/* ── Search bar ── */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-surface-border" />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          className="w-full h-10 pl-9 pr-9 text-sm bg-surface-raised border border-surface-muted rounded-xl focus:outline-none focus:border-surface-border focus:bg-white transition-colors placeholder:text-surface-border"
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-sub hover:text-surface-ink transition-colors"
            aria-label="Hapus pencarian"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* ── Mobile Category Scroll ── */}
      <div className="lg:hidden relative">
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar pb-0.5">
          <div className="flex items-center gap-1.5 w-max pr-8">
            {PRODUCT_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.value] || LayoutGrid;
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-surface-ink text-white shadow-sm'
                      : 'bg-surface-raised text-surface-sub border border-surface-muted hover:border-surface-border'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-surface-border'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sort pills ── */}
      <div className="relative">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex items-center gap-1.5 w-max lg:flex-wrap lg:w-auto pr-8 lg:pr-0">
            {SORT_PILLS.map(({ value, label, Icon }) => {
              const isActive = sort === value;
              const activeColor =
                value === 'popular'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                  : value === 'bestseller'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                  : 'bg-surface-ink text-white border-surface-ink shadow-sm';
              const iconColor =
                !isActive && value === 'popular'
                  ? 'text-orange-400'
                  : !isActive && value === 'bestseller'
                  ? 'text-amber-400'
                  : isActive
                  ? 'text-white'
                  : 'text-surface-border';

              return (
                <button
                  key={value}
                  onClick={() => handleSortChange(value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? activeColor
                      : 'bg-white text-surface-sub border-surface-muted hover:text-surface-ink hover:border-surface-border'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${iconColor}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
