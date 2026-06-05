import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  ArrowLeft, MapPin, Package, CheckCircle2, Truck, Loader2, Clock, XCircle,
} from 'lucide-react';
import { verifyJWT } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import { formatPrice } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Detail Pesanan - Chief Supplies' };

// ── Status config ────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:    { label: 'Menunggu Pembayaran', icon: Clock,        color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  paid:       { label: 'Pesanan Diproses',    icon: Loader2,      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  processing: { label: 'Pesanan Diproses',    icon: Loader2,      color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  shipped:    { label: 'Sedang Dikirim',      icon: Truck,        color: 'text-cyan-700',   bg: 'bg-cyan-50 border-cyan-200' },
  delivered:  { label: 'Sampai Tujuan',       icon: CheckCircle2, color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  cancelled:  { label: 'Dibatalkan',          icon: XCircle,      color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
};

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

// ── Page ─────────────────────────────────────────────────────────

export default async function ProfileOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let payload: any;
  try {
    payload = await verifyJWT(token);
  } catch {
    redirect('/login');
  }

  const userId = (payload.userId ?? payload.sub) as string;

  await connectDB();
  const raw = await Order.findById(params.id).lean() as any;

  if (!raw) notFound();

  // Ownership check
  if (raw.user_id?.toString() !== userId) notFound();

  // Serialize
  const order = {
    _id: raw._id.toString(),
    status: raw.status as string,
    total_price: raw.total_price as number,
    subtotal: raw.subtotal as number,
    shipping_cost: raw.shipping_cost as number,
    payment_gateway: raw.payment_gateway as string | null,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
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
  };

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const stepIndex = STATUS_STEPS.indexOf(order.status === 'paid' ? 'processing' : order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile/orders" className="btn-ghost p-1.5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-surface-ink">
            Pesanan #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-xs text-surface-sub">
            {new Date(order.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${statusCfg.bg}`}>
        <StatusIcon className={`w-6 h-6 ${statusCfg.color} shrink-0`} />
        <div>
          <p className={`font-semibold ${statusCfg.color}`}>{statusCfg.label}</p>
          {order.status === 'pending' && (
            <p className="text-xs text-amber-600 mt-0.5">Silakan selesaikan pembayaran Anda.</p>
          )}
          {order.status === 'shipped' && (
            <p className="text-xs text-cyan-600 mt-0.5">Paket sedang dalam perjalanan menuju Anda.</p>
          )}
          {order.status === 'delivered' && (
            <p className="text-xs text-green-600 mt-0.5">Paket telah tiba. Terima kasih telah berbelanja! 🎉</p>
          )}
        </div>
      </div>

      {/* Progress bar (non-cancelled) */}
      {order.status !== 'cancelled' && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-surface-muted -z-0" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-surface-ink transition-all duration-500 -z-0"
              style={{ width: stepIndex >= 0 ? `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
            />
            {STATUS_STEPS.map((step, i) => {
              const cfg = STATUS_CONFIG[step];
              const Icon = cfg.icon;
              const done = i <= stepIndex;
              return (
                <div key={step} className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    done
                      ? 'bg-surface-ink border-surface-ink text-white'
                      : 'bg-white border-surface-muted text-surface-border'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight ${done ? 'text-surface-ink' : 'text-surface-border'}`}>
                    {cfg.label.split(' ').slice(0, 2).join('\n')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-muted">
          <p className="text-sm font-semibold text-surface-ink">Item Pesanan</p>
        </div>
        <div className="divide-y divide-surface-muted">
          {order.items.map((item: { product_id: string; name: string; price: number; quantity: number; image_url: string }, i: number) => (
            <div key={i} className="flex items-center gap-3 p-4">
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
                <p className="text-sm font-medium text-surface-ink truncate">{item.name}</p>
                <p className="text-xs text-surface-sub">{formatPrice(item.price)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-surface-ink shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="px-4 py-3 border-t border-surface-muted space-y-1.5 bg-surface-raised">
          <div className="flex justify-between text-sm text-surface-sub">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-surface-sub">
            <span>Ongkos Kirim</span>
            <span>{formatPrice(order.shipping_cost)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-surface-ink pt-1 border-t border-surface-muted">
            <span>Total</span>
            <span>{formatPrice(order.total_price)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-muted flex items-center gap-2">
          <MapPin className="w-4 h-4 text-surface-sub" />
          <p className="text-sm font-semibold text-surface-ink">Alamat Pengiriman</p>
        </div>
        <div className="p-4 space-y-1">
          <p className="text-sm font-semibold text-surface-ink">{order.shipping_address.recipient_name}</p>
          <p className="text-sm text-surface-sub">{order.shipping_address.phone}</p>
          <p className="text-sm text-surface-sub">
            {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
          </p>
        </div>
      </div>

      {/* Payment */}
      <div className="glass-card p-4 flex items-center justify-between">
        <p className="text-sm text-surface-sub">Metode Pembayaran</p>
        <p className="text-sm font-semibold text-surface-ink capitalize">
          {order.payment_gateway ?? 'COD (Bayar di Tempat)'}
        </p>
      </div>

    </div>
  );
}
