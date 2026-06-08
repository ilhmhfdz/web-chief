import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { verifyJWT } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { Order } from '@/lib/db/models/Order';
import ProfilePageClient from '@/components/profile/ProfilePageClient';

export const metadata: Metadata = {
  title: 'Profil Saya - Chief Supplies',
  description: 'Lihat pesanan dan atur profil akun Anda',
};

export interface OrderSummary {
  _id: string;
  status: string;
  total_price: number;
  subtotal: number;
  shipping_cost: number;
  payment_gateway: string | null;
  createdAt: string;
  items: {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
  }[];
  shipping_address: {
    recipient_name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
  };
}

export default async function ProfilePage() {
  // 1. Get the session token
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  // 2. Verify token and get userId
  let payload: any;
  try {
    payload = await verifyJWT(token);
  } catch {
    redirect('/login');
  }

  const userId = (payload.userId ?? payload.sub) as string;

  // 3. Fetch user data and orders in parallel
  await connectDB();
  const [userDoc, rawOrders] = await Promise.all([
    User.findById(userId).select('name email role ai_credits addresses').lean(),
    Order.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  if (!userDoc) redirect('/login');

  // Serialize plain objects for Client Component
  const user = {
    name: (userDoc as any).name as string,
    email: (userDoc as any).email as string,
    role: (userDoc as any).role as string,
    ai_credits: ((userDoc as any).ai_credits as number) || 0,
    addresses: ((userDoc as any).addresses || []).map((a: any) => ({
      _id: a._id?.toString() || '',
      recipient_name: a.recipient_name,
      phone: a.phone,
      address: a.address,
      city: a.city,
      province: a.province,
      postal_code: a.postal_code,
      is_default: a.is_default || false,
    })),
  };

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

  return <ProfilePageClient user={user} orders={orders} />;
}
