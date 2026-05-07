'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, Flame, Clock, Trophy, TrendingUp, TrendingDown, LayoutGrid, Sparkles, Droplets, Scissors, Pocket } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/types/product';
import type { ProductCategory, ProductsQueryParams } from '@/types/product';
import { buildQueryString } from '@/lib/utils/format';

// ============================================================
// Sort pill config
// ============================================================

interface SortOption {
  value: NonNullable<ProductsQueryParams['sort']>;
  label: string;
  Icon: React.ElementType;
  description?: string;
}

const SORT_PILLS: SortOption[] = [
  { value: 'popular',    label: 'Populer',   Icon: Flame,         description: 'Paling banyak dibeli' },
  { value: 'newest',     label: 'Terbaru',   Icon: Clock,         description: 'Produk terbaru' },
  { value: 'bestseller', label: 'Terlaris',  Icon: Trophy,        description: 'Terlaris bulan ini' },
  { value: 'price_asc',  label: 'Termurah',  Icon: TrendingDown,  description: 'Harga rendah ke tinggi' },
  { value: 'price_desc', label: 'Termahal',  Icon: TrendingUp,    description: 'Harga tinggi ke rendah' },
];

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

interface CatalogFiltersProps {
  initialParams: ProductsQueryParams;
}

// ============================================================
// Component
// ============================================================

export default function CatalogFilters({ initialParams }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialParams.search ?? '');
  const [sort, setSort] = useState<NonNullable<ProductsQueryParams['sort']>>(
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
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-surface-border" />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk pomade, shampoo, tools..."
          className="input-field pl-10 pr-10"
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-sub hover:text-surface-ink transition-colors"
            aria-label="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Mobile Category Scroll */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2 w-max">
          {PRODUCT_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.value] || LayoutGrid;
            const isActive = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 border whitespace-nowrap ${
                  isActive
                    ? 'bg-surface-ink text-white border-surface-ink shadow-md'
                    : 'bg-white text-surface-sub border-surface-muted hover:border-surface-border'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-surface-border'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort pills */}
      <div className="flex flex-wrap gap-2">
        {SORT_PILLS.map(({ value, label, Icon }) => {
          const isActive = sort === value;
          return (
            <button
              key={value}
              onClick={() => handleSortChange(value)}
              title={SORT_PILLS.find((p) => p.value === value)?.description}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                isActive
                  ? value === 'popular'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                    : value === 'bestseller'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-surface-ink text-white border-surface-ink shadow-md'
                  : 'bg-white text-surface-sub border-surface-muted hover:text-surface-ink hover:border-surface-border hover:shadow-sm'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive
                    ? 'text-white'
                    : value === 'popular'
                    ? 'text-orange-400'
                    : value === 'bestseller'
                    ? 'text-amber-400'
                    : 'text-surface-border'
                }`}
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
