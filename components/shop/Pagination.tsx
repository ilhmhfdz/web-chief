'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { buildQueryString } from '@/lib/utils/format';
import type { ProductsQueryParams } from '@/types/product';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  currentParams: ProductsQueryParams;
}

export default function Pagination({ currentPage, totalPages, currentParams }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    router.push(`${pathname}${buildQueryString({ ...currentParams, page })}`);
  };

  // Build page number array with ellipsis logic
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-ghost p-2 disabled:opacity-30 disabled:cursor-not-allowed text-surface-ink"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageNumbers().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-surface-sub select-none font-semibold">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`w-9 h-9 rounded text-sm font-semibold transition-all duration-200 border ${
              page === currentPage
                ? 'bg-surface-ink text-white border-surface-ink'
                : 'text-surface-ink hover:text-white hover:bg-surface-ink border-surface-muted hover:border-surface-ink bg-white'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn-ghost p-2 disabled:opacity-30 disabled:cursor-not-allowed text-surface-ink"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
