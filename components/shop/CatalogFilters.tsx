'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { ProductsQueryParams } from '@/types/product';
import { buildQueryString } from '@/lib/utils/format';
import MobileFilterDrawer from './MobileFilterDrawer';

interface CatalogFiltersProps {
  initialParams: ProductsQueryParams;
  total: number;
}

export default function CatalogFilters({ initialParams, total }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialParams.search ?? '');
  const [focused, setFocused] = useState(false);

  const applyFilters = useCallback(
    (overrides: Partial<ProductsQueryParams> = {}) => {
      const params = {
        page: 1,
        category: initialParams.category,
        search,
        sort: initialParams.sort,
        minRating: initialParams.minRating,
        ...overrides,
      };
      router.push(`${pathname}${buildQueryString(params)}`);
    },
    [router, pathname, initialParams, search]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleClearSearch = () => {
    setSearch('');
    applyFilters({ search: '' });
  };

  return (
    <div className="flex items-center gap-4">
      {/* Search bar — minimalist */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
        <Search className={`absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused ? 'text-[#1a1a1a]' : 'text-[#8e8b82]'}`} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search products..."
          className="w-full h-9 pl-6 pr-8 text-[13px] bg-transparent border-0 border-b border-[#d6d2c9] focus:border-[#1a1a1a] outline-none placeholder:text-[#c0bdb7] transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8e8b82] hover:text-[#1a1a1a] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Result count */}
      <span className="text-[12px] text-[#8e8b82] hidden sm:block ml-auto">
        {total} product{total !== 1 ? 's' : ''}
      </span>

      {/* Mobile filter drawer */}
      <div className="lg:hidden">
        <MobileFilterDrawer initialParams={initialParams} />
      </div>
    </div>
  );
}
