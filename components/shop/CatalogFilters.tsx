'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, X, Flame, Clock, Trophy, TrendingUp, TrendingDown,
  LayoutGrid, Sparkles, Droplets, Scissors, Pocket,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  color?: string;
}

const SORT_PILLS: SortOption[] = [
  { value: 'popular',    label: 'Populer',   Icon: Flame,        color: 'orange' },
  { value: 'newest',     label: 'Terbaru',   Icon: Clock,        color: 'blue'   },
  { value: 'bestseller', label: 'Terlaris',  Icon: Trophy,       color: 'amber'  },
  { value: 'price_asc',  label: 'Termurah',  Icon: TrendingDown, color: 'green'  },
  { value: 'price_desc', label: 'Termahal',  Icon: TrendingUp,   color: 'purple' },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all:         LayoutGrid,
  pomade:      Sparkles,
  shampoo:     Droplets,
  tools:       Scissors,
  accessories: Pocket,
};

const ACTIVE_COLORS: Record<string, string> = {
  orange: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-orange-400/25',
  blue:   'bg-gradient-to-r from-blue-500 to-sky-400 text-white border-blue-500 shadow-blue-400/25',
  amber:  'bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-amber-500 shadow-amber-400/25',
  green:  'bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-emerald-500 shadow-emerald-400/25',
  purple: 'bg-gradient-to-r from-violet-500 to-purple-400 text-white border-violet-500 shadow-violet-400/25',
};

const ICON_COLORS: Record<string, string> = {
  orange: 'text-orange-500',
  blue:   'text-blue-500',
  amber:  'text-amber-500',
  green:  'text-emerald-500',
  purple: 'text-violet-500',
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
  const [focused, setFocused] = useState(false);

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
    <div className="space-y-3.5">
      {/* ── Search bar ── */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Search className={`h-4 w-4 transition-colors duration-200 ${focused ? 'text-surface-ink' : 'text-surface-border'}`} />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Cari produk..."
          className={`w-full h-11 pl-11 pr-10 text-sm bg-white border rounded-2xl transition-all duration-300 placeholder:text-surface-border outline-none ${
            focused
              ? 'border-surface-ink shadow-md shadow-surface-ink/8 bg-white'
              : 'border-surface-muted/70 bg-surface-raised/50 hover:border-surface-border hover:bg-white'
          }`}
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-sub hover:text-surface-ink transition-colors"
            aria-label="Hapus pencarian"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* ── Mobile Category Scroll ── */}
      <div className="lg:hidden relative">
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar pb-0.5">
          <div className="flex items-center gap-2 w-max pr-8">
            {PRODUCT_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.value] || LayoutGrid;
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-surface-ink text-white shadow-md shadow-surface-ink/20'
                      : 'bg-white text-surface-sub border border-surface-muted/70 hover:border-surface-border hover:text-surface-ink'
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
          <div className="flex items-center gap-2 w-max lg:flex-wrap lg:w-auto pr-8 lg:pr-0">
            {SORT_PILLS.map(({ value, label, Icon, color = 'default' }) => {
              const isActive = sort === value;
              return (
                <motion.button
                  key={value}
                  onClick={() => handleSortChange(value)}
                  whileTap={{ scale: 0.96 }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold border uppercase tracking-wider transition-all duration-200 whitespace-nowrap shadow-sm ${
                    isActive
                      ? `${ACTIVE_COLORS[color]} shadow-md`
                      : 'bg-white text-surface-sub border-surface-muted/70 hover:text-surface-ink hover:border-surface-border hover:shadow-md'
                  }`}
                >
                  <Icon
                    className={`w-3 h-3 ${
                      isActive ? 'text-white' : ICON_COLORS[color] ?? 'text-surface-border'
                    }`}
                  />
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
