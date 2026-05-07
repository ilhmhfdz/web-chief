'use client';

import { PackageX } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-raised border border-surface-muted flex items-center justify-center">
        <PackageX className="w-7 h-7 text-surface-sub" />
      </div>
      <p className="text-surface-sub font-semibold">{message}</p>
    </div>
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
