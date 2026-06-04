import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { Filter, Flame, Trophy, Clock } from 'lucide-react';
import CatalogFilters from '@/components/shop/CatalogFilters';
import CatalogSidebar from '@/components/shop/CatalogSidebar';
import MobileFilterDrawer from '@/components/shop/MobileFilterDrawer';
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

const SORT_META: Record<string, { icon: React.ElementType; label: string; description: string }> = {
  popular:    { icon: Flame,  label: 'Produk Populer',  description: 'Paling banyak dibeli oleh pelanggan kami' },
  bestseller: { icon: Trophy, label: 'Produk Terlaris',  description: 'Terlaris bulan ini di Chief Supplies' },
  newest:     { icon: Clock,  label: 'Produk Terbaru',   description: 'Koleksi terbaru yang baru saja hadir' },
};

// ============================================================
// Page — Server Component
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

  const sortMeta = SORT_META[params.sort ?? 'popular'];
  const SortIcon = sortMeta?.icon ?? Flame;

  return (
    <div className="section-container py-6 lg:py-12">

      {/* ── Page Header ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-surface-ink tracking-tight">Katalog Produk</h1>
            <p className="text-xs text-surface-sub mt-0.5">
              {pagination.total > 0
                ? `${pagination.total} produk tersedia`
                : 'Tidak ada produk ditemukan'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <div className="hidden sm:flex lg:hidden items-center gap-1.5 text-[10px] text-surface-ink bg-surface-raised border border-surface-muted px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                <Filter className="w-2.5 h-2.5" />
                Filter aktif
              </div>
            )}
            {/* Mobile Filter Drawer Trigger */}
            <MobileFilterDrawer initialParams={params} />
          </div>
        </div>
      </div>

      {/* ---- Main layout: Sidebar + Content ---- */}
      <div className="flex gap-8 items-start">

        {/* Sidebar (desktop only) */}
        <div className="hidden lg:block w-60 xl:w-64 shrink-0 sticky top-24">
          <CatalogSidebar initialParams={params} />
        </div>

        {/* Main content column */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Sort pills + search */}
          <CatalogFilters initialParams={params} />

          {/* Divider */}
          <div className="divider" />

          {/* Product Grid */}
          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <ProductGrid
              products={products}
              sortMode={params.sort}
              emptyMessage={
                hasActiveFilters
                  ? 'Tidak ada produk yang sesuai dengan filter Anda. Coba ubah pencarian.'
                  : 'Belum ada produk tersedia. Silakan kembali nanti.'
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
  );
}
