'use client';

import { PackageX } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import type { Product, ProductsQueryParams } from '@/types/product';

// ============================================================
// Props
// ============================================================

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
  sortMode?: ProductsQueryParams['sort'];
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-28 gap-5 text-center"
    >
      <div className="w-18 h-18 rounded-2xl bg-surface-raised border border-surface-muted flex items-center justify-center shadow-inner">
        <PackageX className="w-8 h-8 text-surface-border" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-surface-ink">Produk tidak ditemukan</p>
        <p className="text-xs text-surface-sub max-w-xs">{message}</p>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component — pure display, no data fetching
// ============================================================

export default function ProductGrid({
  products,
  emptyMessage = 'Produk tidak ditemukan.',
  sortMode,
}: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 items-stretch`}>
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          product={product}
          index={index}
          sortMode={sortMode}
        />
      ))}
    </div>
  );
}
