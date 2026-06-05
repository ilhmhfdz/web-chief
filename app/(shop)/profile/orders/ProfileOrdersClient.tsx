'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, ArrowRight } from 'lucide-react';
import type { OrderSummary } from '@/app/(shop)/profile/page';
import { formatPrice } from '@/lib/utils/format';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu Pembayaran',
  paid: 'Pesanan Diproses',
  processing: 'Pesanan Diproses',
  shipped: 'Sedang Dikirim',
  delivered: 'Sampai Tujuan',
  cancelled: 'Dibatalkan',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-50 border border-amber-200',
  paid: 'text-blue-700 bg-blue-50 border border-blue-200',
  processing: 'text-purple-700 bg-purple-50 border border-purple-200',
  shipped: 'text-cyan-700 bg-cyan-50 border border-cyan-200',
  delivered: 'text-green-700 bg-green-50 border border-green-200',
  cancelled: 'text-red-700 bg-red-50 border border-red-200',
};

const FILTER_TABS = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Diproses', value: 'paid,processing' },
  { label: 'Dikirim', value: 'shipped' },
  { label: 'Selesai', value: 'delivered' },
  { label: 'Dibatalkan', value: 'cancelled' },
];

export default function ProfileOrdersClient({ orders }: { orders: OrderSummary[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams?.get('status') ?? '';
  const [activeFilter, setActiveFilter] = useState(statusParam);

  useEffect(() => {
    setActiveFilter(searchParams?.get('status') ?? '');
  }, [searchParams]);

  const handleFilter = (value: string) => {
    setActiveFilter(value);
    router.push(value ? `/profile/orders?status=${value}` : '/profile/orders', { scroll: false });
  };

  const filtered = activeFilter
    ? orders.filter((o) => activeFilter.split(',').includes(o.status))
    : orders;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile" className="btn-ghost p-1.5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-ink">Pesanan Saya</h1>
          <p className="text-sm text-surface-sub">{orders.length} pesanan total</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilter(tab.value)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activeFilter === tab.value
                ? 'bg-surface-ink text-white border-surface-ink'
                : 'border-surface-muted text-surface-sub hover:border-surface-ink hover:text-surface-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Package className="w-12 h-12 mx-auto text-surface-border" />
          <p className="font-medium text-surface-sub">Tidak ada pesanan ditemukan</p>
          <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800">
            Mulai Belanja <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const firstItem = order.items[0];
            const moreCount = order.items.length - 1;
            return (
              <Link
                key={order._id}
                href={`/profile/orders/${order._id}`}
                className="block bg-white border border-surface-muted rounded-xl p-4 hover:border-surface-ink hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-surface-muted shrink-0 bg-surface-raised">
                    {firstItem?.image_url ? (
                      <Image
                        src={firstItem.image_url}
                        alt={firstItem.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-surface-border" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-mono text-surface-sub">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm font-semibold text-surface-ink truncate">
                          {firstItem?.name ?? 'Produk'}
                          {moreCount > 0 && (
                            <span className="text-surface-sub font-normal"> +{moreCount} lainnya</span>
                          )}
                        </p>
                        <p className="text-xs text-surface-sub mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-surface-ink">{formatPrice(order.total_price)}</p>
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items summary */}
                {order.items.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-surface-muted">
                    <p className="text-xs text-surface-sub">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
