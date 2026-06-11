'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCT_CATEGORIES } from '@/types/product';
import type { ProductCategory, ProductsQueryParams } from '@/types/product';
import { buildQueryString } from '@/lib/utils/format';

interface CatalogSidebarProps {
  initialParams: ProductsQueryParams;
}

// ── Expandable Filter Row ──────────────────────────────────────

function FilterSection({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#e8e4de]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left hover:opacity-70 transition-opacity"
      >
        <span className="text-[13px] font-medium text-[#1a1a1a] tracking-wide">{label}</span>
        {open ? (
          <Minus className="w-3.5 h-3.5 text-[#8e8b82] shrink-0" />
        ) : (
          <Plus className="w-3.5 h-3.5 text-[#8e8b82] shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────

const PRICE_RANGES = [
  { label: 'Under Rp50.000', min: 0, max: 50000 },
  { label: 'Rp50.000 – Rp100.000', min: 50000, max: 100000 },
  { label: 'Rp100.000 – Rp150.000', min: 100000, max: 150000 },
  { label: 'Rp150.000+', min: 150000, max: undefined },
];

export default function CatalogSidebar({ initialParams }: CatalogSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [category, setCategory] = useState<ProductCategory | 'all'>(
    initialParams.category ?? 'all'
  );
  const [inStockOnly, setInStockOnly] = useState(false);

  const applyFilters = useCallback(
    (overrides: Partial<ProductsQueryParams> = {}) => {
      const params = { page: 1, category, ...initialParams, ...overrides };
      router.push(`${pathname}${buildQueryString(params)}`);
    },
    [router, pathname, category, initialParams]
  );

  const handleCategoryChange = (value: ProductCategory | 'all') => {
    setCategory(value);
    applyFilters({ category: value });
  };

  const CATEGORY_LABELS: Record<string, string> = {
    all: 'All Products',
    pomade: 'Pomade',
    shampoo: 'Shampoo',
    tools: 'Tools',
    accessories: 'Accessories',
  };

  return (
    <aside className="w-full">
      {/* In Stock Toggle */}
      <div className="flex items-center justify-between py-4 border-b border-[#e8e4de]">
        <span className="text-[13px] font-medium text-[#1a1a1a]">In stock only</span>
        <button
          role="switch"
          aria-checked={inStockOnly}
          onClick={() => setInStockOnly((v) => !v)}
          className={`relative w-10 h-5.5 rounded-full transition-colors duration-300 flex items-center px-0.5
            ${inStockOnly ? 'bg-[#1a1a1a]' : 'bg-[#d6d2c9]'}`}
          style={{ height: '22px', width: '40px' }}
        >
          <span
            className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${inStockOnly ? 'translate-x-[18px]' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Category */}
      <FilterSection label="Product Type" defaultOpen={true}>
        {PRODUCT_CATEGORIES.map((cat) => {
          const isActive = category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`w-full flex items-center justify-between py-1.5 text-left transition-colors group`}
            >
              <span
                className={`text-[13px] transition-colors ${isActive ? 'font-semibold text-[#1a1a1a]' : 'text-[#8e8b82] hover:text-[#1a1a1a]'}`}
              >
                {CATEGORY_LABELS[cat.value]}
              </span>
              {isActive && <span className="w-1 h-1 rounded-full bg-[#1a1a1a] shrink-0" />}
            </button>
          );
        })}
      </FilterSection>

      {/* Price */}
      <FilterSection label="Price">
        {PRICE_RANGES.map((r) => (
          <button
            key={r.label}
            className="w-full text-left text-[13px] text-[#8e8b82] hover:text-[#1a1a1a] transition-colors py-1.5"
          >
            {r.label}
          </button>
        ))}
      </FilterSection>

      {/* Sort */}
      <FilterSection label="Sort By">
        {(['newest', 'price_asc', 'price_desc', 'popular'] as const).map((s) => {
          const LABELS: Record<string, string> = {
            newest: 'Newest',
            price_asc: 'Price: Low to High',
            price_desc: 'Price: High to Low',
            popular: 'Most Popular',
          };
          const isActive = initialParams.sort === s;
          return (
            <button
              key={s}
              onClick={() => applyFilters({ sort: s })}
              className={`w-full text-left text-[13px] transition-colors py-1.5 flex items-center justify-between
                ${isActive ? 'font-semibold text-[#1a1a1a]' : 'text-[#8e8b82] hover:text-[#1a1a1a]'}`}
            >
              {LABELS[s]}
              {isActive && <span className="w-1 h-1 rounded-full bg-[#1a1a1a] shrink-0" />}
            </button>
          );
        })}
      </FilterSection>
    </aside>
  );
}
