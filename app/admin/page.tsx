import type { Metadata } from 'next';
import {
  Package,
  ShoppingCart,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { formatPrice } from '@/lib/utils/format';
import dbConnect from '@/lib/db/mongoose';
import { Product } from '@/lib/db/models/Product';
import { Order } from '@/lib/db/models/Order';
import { User } from '@/lib/db/models/User';
import { KnowledgeBase } from '@/lib/db/models/KnowledgeBase';

export const metadata: Metadata = { title: 'Dashboard' };

// ============================================================
// Types
// ============================================================

interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalKnowledgeDocs: number;
  totalRevenue: number;
}

interface RecentOrder {
  _id: string;
  status: string;
  total_price: number;
  createdAt: string;
}

// ============================================================
// Data fetching
// ============================================================

async function fetchDashboardData(): Promise<{
  stats: AdminStats;
  recentOrders: RecentOrder[];
}> {
  try {
    await dbConnect();

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalKnowledgeDocs,
      revenueAgg,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments({ is_active: true }),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      KnowledgeBase.distinct('metadata.source').then((s: string[]) => s.length),
      Order.aggregate([
        { $match: { status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$total_price' } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('status total_price createdAt')
        .lean(),
    ]);

    // Serialize ObjectId → string so JSX can call .slice() and pass as key
    const serializedOrders: RecentOrder[] = (recentOrders as any[]).map((o) => ({
      _id: o._id.toString(),
      status: o.status,
      total_price: o.total_price,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
    }));

    return {
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalKnowledgeDocs,
        totalRevenue: revenueAgg[0]?.total ?? 0,
      },
      recentOrders: serializedOrders,
    };
  } catch {
    return {
      stats: { totalProducts: 0, totalOrders: 0, totalUsers: 0, totalKnowledgeDocs: 0, totalRevenue: 0 },
      recentOrders: [],
    };
  }
}

// ============================================================
// Status badge helper
// ============================================================

const STATUS_STYLES: Record<string, string> = {
  pending: 'badge-default text-amber-700 bg-amber-50 border-amber-200',
  paid: 'badge-default text-blue-700 bg-blue-50 border-blue-200',
  processing: 'badge-default text-purple-700 bg-purple-50 border-purple-200',
  shipped: 'badge-default text-cyan-700 bg-cyan-50 border-cyan-200',
  delivered: 'badge-default text-green-700 bg-green-50 border-green-200',
  cancelled: 'badge-default text-red-700 bg-red-50 border-red-200',
};

// ============================================================
// Page
// ============================================================

export default async function AdminDashboardPage() {
  const { stats, recentOrders } = await fetchDashboardData();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="heading-lg">Dashboard</h1>
        <p className="text-surface-sub text-sm mt-1">Overview platform Chief Supplies</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Produk"
          value={stats.totalProducts}
          icon={Package}
          variant="brand"
          sub="Produk aktif"
        />
        <StatCard
          label="Total Pesanan"
          value={stats.totalOrders}
          icon={ShoppingCart}
          variant="blue"
        />
        <StatCard
          label="Total Pengguna"
          value={stats.totalUsers}
          icon={Users}
          variant="purple"
        />
        <StatCard
          label="Total Pendapatan"
          value={formatPrice(stats.totalRevenue)}
          icon={TrendingUp}
          variant="green"
          sub="Pesanan terkonfirmasi"
        />
      </div>

      {/* Knowledge base info */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded border border-surface-muted bg-surface-raised flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-surface-ink" />
        </div>
        <div>
          <p className="text-sm font-semibold text-surface-ink">Knowledge Base</p>
          <p className="text-xs text-surface-sub mt-0.5">
            {stats.totalKnowledgeDocs > 0
              ? `${stats.totalKnowledgeDocs} dokumen tersimpan untuk RAG AI Agent`
              : 'Belum ada dokumen. Unggah melalui halaman Knowledge Base.'}
          </p>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-surface-ink" />
          <h2 className="label-upper">
            Pesanan Terbaru
          </h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="glass-card p-8 text-center text-surface-sub text-sm">
            Belum ada pesanan masuk.
          </div>
        ) : (
          <div className="glass-card divide-y divide-surface-muted">
            {recentOrders.map((order) => (
              <div key={order._id} className="flex flex-wrap items-center justify-between px-5 py-4 gap-4">
                <div>
                  <p className="text-sm font-mono font-medium text-surface-ink">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs font-medium text-surface-sub mt-1">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                    {order.status}
                  </span>
                  <p className="text-sm font-bold text-surface-ink w-24 text-right">
                    {formatPrice(order.total_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
