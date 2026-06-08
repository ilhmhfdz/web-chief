'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, X,
  LayoutGrid, Sparkles, Droplets, Scissors, Pocket,
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/types/product';
import type { ProductCategory, ProductsQueryParams } from '@/types/product';
import { buildQueryString } from '@/lib/utils/format';
import MobileFilterDrawer from './MobileFilterDrawer';

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
      {/* ── Search bar & Filter Trigger ── */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative group flex-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Search className={`h-4.5 w-4.5 transition-colors duration-300 ${focused ? 'text-surface-ink' : 'text-surface-sub group-hover:text-surface-ink/70'}`} />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Cari produk..."
          className={`w-full h-12 pl-12 pr-12 text-[15px] font-medium bg-white border rounded-2xl transition-all duration-300 placeholder:text-surface-border outline-none ${
            focused
              ? 'border-surface-ink shadow-lg shadow-surface-ink/5 bg-white ring-4 ring-surface-ink/5'
              : 'border-surface-muted/60 bg-surface-raised/40 hover:border-surface-border/80 hover:bg-white hover:shadow-sm'
          }`}
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-sub hover:text-surface-ink transition-colors"
            aria-label="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        </form>
        
        {/* Filter Popup Trigger */}
        <MobileFilterDrawer initialParams={initialParams} />
      </div>


    </div>
  );
}
