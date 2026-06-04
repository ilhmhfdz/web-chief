import type { Metadata } from 'next';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';

export const metadata: Metadata = { title: 'Pesanan' };

interface Order {
  _id: string;
  status: string;
  total_price: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'badge-default text-amber-700 bg-amber-50 border-amber-200',
  paid: 'badge-default text-blue-700 bg-blue-50 border-blue-200',
  processing: 'badge-default text-purple-700 bg-purple-50 border-purple-200',
  shipped: 'badge-default text-cyan-700 bg-cyan-50 border-cyan-200',
  delivered: 'badge-default text-green-700 bg-green-50 border-green-200',
  cancelled: 'badge-default text-red-700 bg-red-50 border-red-200',
};

async function fetchOrders(): Promise<Order[]> {
  try {
    await dbConnect();
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Serialize ObjectId → string and Date → ISO string for Client Component safety
    return (orders as any[]).map((o) => ({
      _id: o._id.toString(),
      status: o.status,
      total_price: o.total_price,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      items: (o.items ?? []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
      })),
    }));
  } catch {
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = await fetchOrders();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="heading-lg">Pesanan</h1>
        <p className="text-surface-sub text-sm mt-1">{orders.length} pesanan total</p>
      </div>

      {orders.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <ShoppingCart className="w-10 h-10 text-surface-border mx-auto" />
          <p className="text-surface-sub font-medium">Belum ada pesanan masuk.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-clean">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Items</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-mono text-surface-ink text-xs font-semibold uppercase">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="text-surface-sub text-xs max-w-[200px] truncate leading-relaxed">
                      {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(', ') ?? '—'}
                    </td>
                    <td className="text-center">
                      <span className={`capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-right text-surface-ink font-bold">
                      {formatPrice(order.total_price)}
                    </td>
                    <td className="text-right text-surface-sub text-xs font-medium">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
