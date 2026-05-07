import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { Filter, Flame, Trophy, Clock } from 'lucide-react';
import CatalogFilters from '@/components/shop/CatalogFilters';
import CatalogSidebar from '@/components/shop/CatalogSidebar';
import ProductGrid from '@/components/shop/ProductGrid';
import Pagination from '@/components/shop/Pagination';
import { ProductGridSkeleton } from '@/components/shop/ProductSkeleton';
import type { ProductCategory, ProductsApiResponse, ProductsQueryParams } from '@/types/product';

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

  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  if (category && category !== 'all') qs.set('category', category);
  if (search) qs.set('search', search);
  if (apiSort) qs.set('sort', apiSort);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/products?${qs.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
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
    <div className="section-container py-10 lg:py-14">
      {/* ---- Page Header ---- */}
      <div className="mb-8">
        <p className="label-upper mb-2">Chief Supplies</p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="heading-lg">Katalog Produk</h1>
            <p className="text-surface-sub mt-1 text-sm">
              {pagination.total > 0
                ? `Menampilkan ${products.length} dari ${pagination.total} produk`
                : 'Tidak ada produk ditemukan'}
            </p>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 text-xs text-surface-ink bg-surface-raised border border-surface-muted px-3 py-1.5 rounded uppercase tracking-wider font-semibold">
              <Filter className="w-3 h-3" />
              Filter aktif
            </div>
          )}
        </div>
      </div>

      {/* ---- Sort context banner ---- */}
      {sortMeta && (
        <div className="flex items-center gap-3 mb-6 p-3.5 bg-surface-raised border border-surface-muted rounded-lg">
          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
            params.sort === 'popular'    ? 'bg-orange-100' :
            params.sort === 'bestseller' ? 'bg-amber-100'  :
            'bg-surface-overlay'
          }`}>
            <SortIcon className={`w-4 h-4 ${
              params.sort === 'popular'    ? 'text-orange-500' :
              params.sort === 'bestseller' ? 'text-amber-600'  :
              'text-surface-sub'
            }`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-surface-ink">{sortMeta.label}</p>
            <p className="text-xs text-surface-sub">{sortMeta.description}</p>
          </div>
          {/* BUG-009: Disclaimer when sort is popular/bestseller but API falls back to newest */}
          {(params.sort === 'popular' || params.sort === 'bestseller') && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded shrink-0">
              Data: Terbaru
            </span>
          )}
        </div>
      )}

      {/* ---- Main layout: Sidebar + Content ---- */}
      <div className="flex gap-8 items-start">

        {/* Sidebar (desktop) */}
        <div className="hidden lg:block w-60 xl:w-64 shrink-0 sticky top-24">
          <CatalogSidebar initialParams={params} />
        </div>

        {/* Main content column */}
        <div className="flex-1 min-w-0 space-y-6">

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

          {/* Pagination */}
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
