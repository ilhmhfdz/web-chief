import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  ArrowLeft, MapPin, Package, User2, CreditCard,
  CalendarDays, Hash,
} from 'lucide-react';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import User from '@/lib/db/models/User';
import { formatPrice } from '@/lib/utils/format';
import OrderStatusUpdater from './OrderStatusUpdater';

export const metadata: Metadata = { title: 'Detail Pesanan — Admin' };

const STATUS_BADGE: Record<string, string> = {
  pending:    'text-amber-700 bg-amber-50 border-amber-200',
  paid:       'text-blue-700 bg-blue-50 border-blue-200',
  processing: 'text-purple-700 bg-purple-50 border-purple-200',
  shipped:    'text-cyan-700 bg-cyan-50 border-cyan-200',
  delivered:  'text-green-700 bg-green-50 border-green-200',
  cancelled:  'text-red-700 bg-red-50 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending:    'Menunggu Pembayaran',
  paid:       'Dibayar',
  processing: 'Diproses',
  shipped:    'Dikirim',
  delivered:  'Sampai Tujuan',
  cancelled:  'Dibatalkan',
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await dbConnect();

  const raw = await Order.findById(params.id).lean() as any;
  if (!raw) notFound();

  // Fetch user info (optional — show name/email if available)
  let customer: { name: string; email: string } | null = null;
  try {
    const userDoc = await User.findById(raw.user_id).select('name email').lean() as any;
    if (userDoc) customer = { name: userDoc.name, email: userDoc.email };
  } catch {
    // user might not exist — safe to ignore
  }

  // Serialize
  const order = {
    _id: raw._id.toString(),
    status: raw.status as string,
    total_price: raw.total_price as number,
    subtotal: raw.subtotal as number,
    shipping_cost: raw.shipping_cost as number,
    payment_gateway: raw.payment_gateway as string | null,
    ai_credit_granted: raw.ai_credit_granted as boolean,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    items: (raw.items ?? []).map((i: any) => ({
      product_id: i.product_id?.toString() ?? '',
      name: i.name as string,
      price: i.price as number,
      quantity: i.quantity as number,
      image_url: i.image_url as string,
    })),
    shipping_address: {
      recipient_name: raw.shipping_address?.recipient_name ?? '',
      phone: raw.shipping_address?.phone ?? '',
      address: raw.shipping_address?.address ?? '',
      city: raw.shipping_address?.city ?? '',
      province: raw.shipping_address?.province ?? '',
      postal_code: raw.shipping_address?.postal_code ?? '',
    },
    user_id: raw.user_id?.toString() ?? '',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="btn-ghost p-1.5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="heading-lg">Detail Pesanan</h1>
            <p className="text-xs text-surface-sub font-mono">#{order._id}</p>
          </div>
        </div>
        <span className={`capitalize px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: items + address + payment */}
        <div className="lg:col-span-2 space-y-5">

          {/* Items */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-muted flex items-center gap-2">
              <Package className="w-4 h-4 text-surface-sub" />
              <p className="text-sm font-semibold text-surface-ink">Item Pesanan ({order.items.length})</p>
            </div>
            <div className="divide-y divide-surface-muted">
              {order.items.map((item: { product_id: string; name: string; price: number; quantity: number; image_url: string }, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-lg border border-surface-muted overflow-hidden shrink-0 bg-surface-raised">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-surface-border" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-ink truncate">{item.name}</p>
                    <p className="text-xs text-surface-sub">{formatPrice(item.price)} × {item.quantity}</p>
                    {item.product_id && (
                      <p className="text-[10px] font-mono text-surface-border mt-0.5">ID: {item.product_id}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-surface-ink shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="p-4 border-t border-surface-muted bg-surface-raised space-y-1.5">
              <div className="flex justify-between text-sm text-surface-sub">
                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-surface-sub">
                <span>Ongkos Kirim</span><span>{formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-surface-ink pt-1 border-t border-surface-muted">
                <span>Total</span><span>{formatPrice(order.total_price)}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-muted flex items-center gap-2">
              <MapPin className="w-4 h-4 text-surface-sub" />
              <p className="text-sm font-semibold text-surface-ink">Alamat Pengiriman</p>
            </div>
            <div className="p-4 space-y-1">
              <p className="text-sm font-semibold text-surface-ink">{order.shipping_address.recipient_name}</p>
              <p className="text-sm text-surface-sub">{order.shipping_address.phone}</p>
              <p className="text-sm text-surface-sub">
                {order.shipping_address.address}, {order.shipping_address.city},&nbsp;
                {order.shipping_address.province} {order.shipping_address.postal_code}
              </p>
            </div>
          </div>

        </div>

        {/* Right column: meta + status updater */}
        <div className="space-y-5">

          {/* Order meta */}
          <div className="glass-card p-5 space-y-3">
            <p className="text-xs font-semibold text-surface-sub uppercase tracking-wider">Informasi Pesanan</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2">
                <Hash className="w-4 h-4 text-surface-border mt-0.5 shrink-0" />
                <div>
                  <p className="text-surface-sub text-xs">Order ID</p>
                  <p className="font-mono text-surface-ink text-xs break-all">{order._id}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="w-4 h-4 text-surface-border mt-0.5 shrink-0" />
                <div>
                  <p className="text-surface-sub text-xs">Tanggal Pesan</p>
                  <p className="text-surface-ink">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-surface-border mt-0.5 shrink-0" />
                <div>
                  <p className="text-surface-sub text-xs">Pembayaran</p>
                  <p className="text-surface-ink capitalize">
                    {order.payment_gateway ?? 'COD (Bayar di Tempat)'}
                  </p>
                </div>
              </div>
              {customer && (
                <div className="flex items-start gap-2">
                  <User2 className="w-4 h-4 text-surface-border mt-0.5 shrink-0" />
                  <div>
                    <p className="text-surface-sub text-xs">Pemesan</p>
                    <p className="text-surface-ink font-medium">{customer.name}</p>
                    <p className="text-xs text-surface-sub">{customer.email}</p>
                  </div>
                </div>
              )}
              {order.ai_credit_granted && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  ✓ AI Credit telah diberikan ke pelanggan
                </div>
              )}
            </div>
          </div>

          {/* Status updater */}
          <OrderStatusUpdater orderId={order._id} currentStatus={order.status} />

        </div>
      </div>
    </div>
  );
}
