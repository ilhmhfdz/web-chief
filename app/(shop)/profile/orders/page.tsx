import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { verifyJWT } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import type { OrderSummary } from '@/app/(shop)/profile/page';
import ProfileOrdersClient from './ProfileOrdersClient';

export const metadata: Metadata = {
  title: 'Pesanan Saya - Chief Supplies',
  description: 'Daftar semua pesanan Anda di Chief Supplies',
};

export default async function ProfileOrdersPage() {
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
  const rawOrders = await Order.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const orders: OrderSummary[] = (rawOrders as any[]).map((o) => ({
    _id: o._id.toString(),
    status: o.status,
    total_price: o.total_price,
    subtotal: o.subtotal,
    shipping_cost: o.shipping_cost,
    payment_gateway: o.payment_gateway ?? null,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
    items: (o.items ?? []).map((i: any) => ({
      product_id: i.product_id?.toString() ?? '',
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image_url: i.image_url,
    })),
    shipping_address: {
      recipient_name: o.shipping_address?.recipient_name ?? '',
      phone: o.shipping_address?.phone ?? '',
      address: o.shipping_address?.address ?? '',
      city: o.shipping_address?.city ?? '',
      province: o.shipping_address?.province ?? '',
      postal_code: o.shipping_address?.postal_code ?? '',
    },
  }));

  return (
    <Suspense fallback={<div className="text-center py-20 text-surface-sub">Memuat pesanan...</div>}>
      <ProfileOrdersClient orders={orders} />
    </Suspense>
  );
}
