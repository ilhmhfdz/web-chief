'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Clock, Loader2, Truck, MapPin, CheckCircle2,
  ShoppingBag, ArrowRight, Package
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { OrderSummary } from '@/app/(shop)/profile/page';
import { formatPrice } from '@/lib/utils/format';

// ── Status helpers ──────────────────────────────────────────────

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

interface StatusButtonProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  count: number;
  filterStatuses: string[];
}

function StatusButton({ icon: Icon, label, sublabel, count, filterStatuses }: StatusButtonProps) {
  const params = filterStatuses.join(',');
  return (
    <Link
      href={`/profile/orders?status=${params}`}
      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-brand-50 transition-colors group relative"
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center group-hover:bg-brand-100 transition-colors border border-surface-muted">
          <Icon className="w-6 h-6 text-surface-ink" />
        </div>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-center text-surface-ink leading-tight">
        {label}
        {sublabel && <><br />{sublabel}</>}
      </span>
    </Link>
  );
}

// ── Main Component ──────────────────────────────────────────────

interface TransactionDropdownProps {
  orders: OrderSummary[];
}

export default function TransactionDropdown({ orders }: TransactionDropdownProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Count orders per status group
  const counts = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => ['paid', 'processing'].includes(o.status)).length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    selesai: orders.filter((o) => o.status === 'delivered').length,
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="bg-surface rounded-xl border border-surface-muted overflow-hidden">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-brand-50 hover:bg-brand-100 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-brand-700" />
          <span className="font-semibold text-brand-900 text-lg">Transaksi</span>
          {orders.length > 0 && (
            <span className="text-xs font-medium bg-brand-200 text-brand-800 px-2 py-0.5 rounded-full">
              {orders.length} pesanan
            </span>
          )}
        </div>
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-brand-700" />
        </motion.div>
      </button>

      {/* Dropdown Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-6 border-t border-surface-muted bg-white space-y-6">

              {/* Status icon buttons */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-surface-ink">Pembelian</h3>
                  <Link
                    href="/profile/orders"
                    className="text-brand-500 hover:text-brand-700 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  <StatusButton
                    icon={Clock}
                    label="Menunggu"
                    sublabel="Pembayaran"
                    count={counts.pending}
                    filterStatuses={['pending']}
                  />
                  <StatusButton
                    icon={Loader2}
                    label="Pesanan"
                    sublabel="Diproses"
                    count={counts.processing}
                    filterStatuses={['paid', 'processing']}
                  />
                  <StatusButton
                    icon={Truck}
                    label="Sedang"
                    sublabel="Dikirim"
                    count={counts.shipped}
                    filterStatuses={['shipped']}
                  />
                  <StatusButton
                    icon={MapPin}
                    label="Sampai"
                    sublabel="Tujuan"
                    count={counts.delivered}
                    filterStatuses={['delivered']}
                  />
                  <StatusButton
                    icon={CheckCircle2}
                    label="Selesai"
                    sublabel=""
                    count={counts.selesai}
                    filterStatuses={['delivered']}
                  />
                </div>
              </div>

              {/* Recent orders list */}
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-surface-sub">
                  <Package className="w-10 h-10 mx-auto mb-3 text-surface-border" />
                  <p className="text-sm font-medium">Belum ada pesanan</p>
                  <p className="text-xs mt-1">Yuk mulai belanja di katalog kami!</p>
                  <Link
                    href="/catalog"
                    className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    Lihat Katalog <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-surface-sub uppercase tracking-wider">
                    Pesanan Terbaru
                  </h4>
                  <div className="divide-y divide-surface-muted rounded-lg border border-surface-muted overflow-hidden">
                    {recentOrders.map((order) => {
                      const firstItem = order.items[0];
                      const moreCount = order.items.length - 1;
                      return (
                        <Link
                          key={order._id}
                          href={`/profile/orders/${order._id}`}
                          className="flex items-center gap-3 p-3 hover:bg-surface-raised transition-colors"
                        >
                          {/* Product thumbnail */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-surface-muted shrink-0 bg-surface-raised">
                            {firstItem?.image_url ? (
                              <Image
                                src={firstItem.image_url}
                                alt={firstItem.name}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-surface-border" />
                              </div>
                            )}
                          </div>

                          {/* Order info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-surface-sub">
                              #{order._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-sm font-medium text-surface-ink truncate">
                              {firstItem?.name ?? 'Produk'}
                              {moreCount > 0 && (
                                <span className="text-surface-sub"> +{moreCount} lainnya</span>
                              )}
                            </p>
                            <p className="text-xs text-surface-sub">
                              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>

                          {/* Price + status */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-surface-ink">
                              {formatPrice(order.total_price)}
                            </p>
                            <span
                              className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}
                            >
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
