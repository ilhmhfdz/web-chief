"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ShoppingCart, ChevronDown, ChevronUp, Search, MapPin, Package, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils/format';
import { updateOrderStatus } from '@/app/admin/orders/actions';
import { toast } from 'sonner';

export interface OrderRowDetail {
  _id: string;
  status: string;
  total_price: number;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
  shipping_address: {
    recipient_name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
  };
  subtotal: number;
  shipping_cost: number;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'text-amber-700 bg-amber-50 border-amber-200',
  paid:       'text-blue-700 bg-blue-50 border-blue-200',
  processing: 'text-purple-700 bg-purple-50 border-purple-200',
  shipped:    'text-cyan-700 bg-cyan-50 border-cyan-200',
  delivered:  'text-green-700 bg-green-50 border-green-200',
  cancelled:  'text-red-700 bg-red-50 border-red-200',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface Props {
  initialOrders: OrderRowDetail[];
}

export default function OrdersTableClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<OrderRowDetail[]>(initialOrders);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRowId(prev => (prev === id ? null : id));
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    
    // Optimistic update
    setOrders(prev => 
      prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o)
    );

    const res = await updateOrderStatus(orderId, newStatus);
    if (!res.success) {
      toast.error('Gagal memperbarui status pesanan');
      // Revert if failed
      setOrders(initialOrders);
    } else {
      toast.success('Status pesanan diperbarui');
    }
    
    setIsUpdating(null);
  };

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    const matchId = order._id.toLowerCase().includes(query);
    const matchName = order.shipping_address?.recipient_name.toLowerCase().includes(query);
    return matchId || matchName;
  });

  if (orders.length === 0) {
    return (
      <div className="glass-card p-12 text-center space-y-3">
        <ShoppingCart className="w-10 h-10 text-surface-border mx-auto" />
        <p className="text-surface-sub font-medium">Belum ada pesanan masuk.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-surface-sub" />
        </div>
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Cari ID Pesanan atau Nama Pelanggan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-clean border-collapse">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Order ID</th>
                <th>Pelanggan</th>
                <th className="text-center">Status</th>
                <th className="text-right">Total</th>
                <th className="text-right">Tanggal</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-surface-sub">
                    Pesanan tidak ditemukan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedRowId === order._id;

                  return (
                    <React.Fragment key={order._id}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-surface-raised' : 'hover:bg-surface-raised/50'
                        }`}
                        onClick={() => toggleExpand(order._id)}
                      >
                        <td className="text-center text-surface-sub">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="font-mono text-surface-ink text-xs font-semibold uppercase">
                          #{order._id.slice(-8)}
                        </td>
                        <td className="text-surface-sub text-xs max-w-[150px] truncate">
                          {order.shipping_address?.recipient_name || 'N/A'}
                        </td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={isUpdating === order._id}
                            className={`badge capitalize appearance-none cursor-pointer pr-6 pl-3 focus:outline-none focus:ring-2 focus:ring-surface-ink/20 ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending} ${isUpdating === order._id ? 'opacity-50' : ''}`}
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="text-right text-surface-ink font-bold">
                          {formatPrice(order.total_price)}
                        </td>
                        <td className="text-right text-surface-sub text-xs font-medium">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg border border-surface-muted text-surface-sub hover:border-surface-ink hover:text-surface-ink transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Detail
                          </Link>
                        </td>
                      </tr>
                      
                      {/* Expanded Row */}
                      <tr>
                        <td colSpan={7} className="p-0 border-0">
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden bg-surface-raised/30 border-b border-surface-muted"
                              >
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {/* Shipping Details */}
                                  <div>
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-ink mb-3">
                                      <MapPin className="w-4 h-4 text-surface-sub" /> Alamat Pengiriman
                                    </h4>
                                    <div className="text-sm text-surface-sub bg-white p-4 rounded-lg border border-surface-muted/60 space-y-1">
                                      <p className="font-medium text-surface-ink">{order.shipping_address?.recipient_name}</p>
                                      <p>{order.shipping_address?.phone}</p>
                                      <p className="mt-2">{order.shipping_address?.address}</p>
                                      <p>{order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}</p>
                                    </div>
                                  </div>

                                  {/* Order Items & Summary */}
                                  <div>
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-ink mb-3">
                                      <Package className="w-4 h-4 text-surface-sub" /> Rincian Produk
                                    </h4>
                                    <div className="bg-white rounded-lg border border-surface-muted/60 overflow-hidden">
                                      <ul className="divide-y divide-surface-muted/60">
                                        {order.items?.map((item, idx) => (
                                          <li key={idx} className="p-3 text-sm flex justify-between items-start gap-4">
                                            <div>
                                              <p className="font-medium text-surface-ink leading-tight">{item.name}</p>
                                              <p className="text-xs text-surface-sub mt-0.5">{item.quantity} x {formatPrice(item.price || 0)}</p>
                                            </div>
                                            <p className="font-semibold text-surface-ink whitespace-nowrap">
                                              {formatPrice((item.price || 0) * item.quantity)}
                                            </p>
                                          </li>
                                        ))}
                                      </ul>
                                      <div className="bg-surface-raised p-3 text-sm space-y-1 border-t border-surface-muted/60">
                                        <div className="flex justify-between text-surface-sub">
                                          <span>Subtotal</span>
                                          <span>{formatPrice(order.subtotal || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-surface-sub">
                                          <span>Ongkos Kirim</span>
                                          <span>{formatPrice(order.shipping_cost || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-surface-ink font-bold pt-2 border-t border-surface-muted border-dashed mt-1">
                                          <span>Total Akhir</span>
                                          <span>{formatPrice(order.total_price)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
