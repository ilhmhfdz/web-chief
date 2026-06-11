import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import CatalogFilters from '@/components/shop/CatalogFilters';
import CatalogSidebar from '@/components/shop/CatalogSidebar';
import ProductGrid from '@/components/shop/ProductGrid';
import Pagination from '@/components/shop/Pagination';
import { ProductGridSkeleton } from '@/components/shop/ProductSkeleton';
import type { ProductCategory, ProductsApiResponse, ProductsQueryParams } from '@/types/product';
import dbConnect from '@/lib/db/mongoose';
import { Product } from '@/lib/db/models/Product';
import { serializeProducts } from '@/lib/db/serialize';

// ============================================================
// Metadata
// ============================================================

export const metadata: Metadata = {
  title: 'Katalog Produk | Chief Supplies',
  description: 'Jelajahi koleksi lengkap perlengkapan pria premium dari Chief Supplies — pomade, shampoo, tools & aksesori.',
};

// ============================================================
// Data fetching — runs on the server on every request
// ============================================================

async function fetchProducts(params: ProductsQueryParams): Promise<ProductsApiResponse> {
  const { page = 1, limit = 12, category, search, sort } = params;

  // Map UI-only sort values back to API-supported sort values
  let apiSort = sort;
  if (sort === 'popular' || sort === 'bestseller') {
    apiSort = 'newest'; // fallback — in production, API would support these
  }

  await dbConnect();

  // Build MongoDB filter
  const filter: Record<string, unknown> = { is_active: true };
  if (category && category !== 'all') filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  // Build MongoDB sort
  const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
  };
  const sortQuery = SORT_MAP[apiSort ?? 'newest'] ?? SORT_MAP.newest;
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(48, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortQuery).skip(skip).limit(safeLimit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    data: serializeProducts(products as any[]),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

// ============================================================
// Sort mode header info
// ============================================================


interface CatalogPageProps {
  searchParams: {
    page?: string;
    category?: string;
    search?: string;
    sort?: string;
    minRating?: string;
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params: ProductsQueryParams = {
    page: Number(searchParams.page ?? 1),
    limit: 12,
    category: (searchParams.category as ProductCategory) ?? 'all',
    search: searchParams.search ?? '',
    sort: (searchParams.sort as ProductsQueryParams['sort']) ?? 'popular',
    minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
  };

  const { data: products, pagination } = await fetchProducts(params);

  const hasActiveFilters =
    (params.category && params.category !== 'all') || !!params.search;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Page Header ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-10 pb-6 border-b border-[#e8e4de]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#8e8b82] uppercase mb-3">
              Chief Supplies
            </p>
            <h1 className="text-[2.5rem] lg:text-[3.5rem] font-bold text-[#1a1a1a] leading-none tracking-tight">
              All Products
            </h1>
          </div>
          <p className="text-[12px] text-[#8e8b82] pb-2">
            {pagination.total} product{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-10">
        <div className="flex gap-16 items-start">

          {/* ── Left Sidebar ── */}
          <div className="hidden lg:block w-52 xl:w-60 shrink-0 sticky top-24">
            <CatalogSidebar initialParams={params} />
          </div>

          {/* ── Product Grid Column ── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Top bar: search + count */}
            <CatalogFilters initialParams={params} total={pagination.total} />

            {/* Grid */}
            <Suspense fallback={<ProductGridSkeleton count={12} />}>
              <ProductGrid
                products={products}
                sortMode={params.sort}
                emptyMessage={
                  hasActiveFilters
                    ? 'No products match your filter. Try a different search.'
                    : 'No products available. Please check back later.'
                }
              />
            </Suspense>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              currentParams={params}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
