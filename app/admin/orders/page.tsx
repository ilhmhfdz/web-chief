import type { Metadata } from 'next';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import OrdersTableClient, { OrderRowDetail } from '@/components/admin/OrdersTableClient';

export const metadata: Metadata = { title: 'Pesanan' };

async function fetchOrders(): Promise<OrderRowDetail[]> {
  try {
    await dbConnect();
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return (orders as any[]).map((o) => ({
      _id: o._id.toString(),
      status: o.status,
      total_price: o.total_price,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      items: (o.items ?? []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price || 0,
      })),
      shipping_address: o.shipping_address || {
        recipient_name: 'Unknown',
        phone: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
      },
      subtotal: o.subtotal || 0,
      shipping_cost: o.shipping_cost || 0,
    }));
  } catch {
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = await fetchOrders();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="heading-lg tracking-tight">Manajemen Pesanan</h1>
        <p className="text-surface-sub text-sm mt-1">{orders.length} pesanan bulan ini</p>
      </div>

      <OrdersTableClient initialOrders={orders} />
    </div>
  );
}
