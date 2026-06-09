import type { Metadata } from 'next';
import {
  Package,
  ShoppingCart,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import RevenueChart from '@/components/admin/RevenueChart';
import OrdersChart from '@/components/admin/OrdersChart';
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

interface ChartData {
  name: string;
  revenue: number;
  orders: number;
}

async function fetchDashboardData(): Promise<{
  stats: AdminStats;
  recentOrders: RecentOrder[];
  chartData: ChartData[];
}> {
  try {
    await dbConnect();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalKnowledgeDocs,
      revenueAgg,
      recentOrders,
      recentOrderStats,
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
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: sevenDaysAgo },
            status: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: '$total_price' },
            orders: { $sum: 1 }
          }
        }
      ])
    ]);

    // Serialize ObjectId → string so JSX can call .slice() and pass as key
    const serializedOrders: RecentOrder[] = (recentOrders as any[]).map((o) => ({
      _id: o._id.toString(),
      status: o.status,
      total_price: o.total_price,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
    }));

    // Build 7 days chart data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const chartData = last7Days.map(d => {
      const dateStr = d.toISOString().split('T')[0];
      const stat = recentOrderStats.find((s: any) => s._id === dateStr);
      return {
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        revenue: stat?.revenue || 0,
        orders: stat?.orders || 0,
      };
    });

    return {
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalKnowledgeDocs,
        totalRevenue: revenueAgg[0]?.total ?? 0,
      },
      recentOrders: serializedOrders,
      chartData,
    };
  } catch {
    return {
      stats: { totalProducts: 0, totalOrders: 0, totalUsers: 0, totalKnowledgeDocs: 0, totalRevenue: 0 },
      recentOrders: [],
      chartData: [],
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
  const { stats, recentOrders, chartData } = await fetchDashboardData();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="heading-xl tracking-tight">Overview</h1>
          <p className="text-surface-sub mt-2 text-lg">Pantau performa platform Chief Supplies secara real-time.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Total Produk"
          value={stats.totalProducts}
          icon={<Package className="w-6 h-6" />}
          variant="brand"
          sub="Produk aktif"
          delay={0.1}
        />
        <StatCard
          label="Total Pesanan"
          value={stats.totalOrders}
          icon={<ShoppingCart className="w-6 h-6" />}
          variant="blue"
          delay={0.2}
        />
        <StatCard
          label="Total Pengguna"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6" />}
          variant="purple"
          delay={0.3}
        />
        <StatCard
          label="Total Pendapatan"
          value={formatPrice(stats.totalRevenue)}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="green"
          sub="Pesanan terkonfirmasi"
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-h-[400px]">
          <RevenueChart data={chartData} />
        </div>
        <div className="min-h-[400px]">
          <OrdersChart data={chartData} />
        </div>
      </div>

      {/* Bottom Grid: Insights & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Base Card */}
        <div className="glass-card p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div>
            <div className="w-12 h-12 rounded-xl border border-surface-muted bg-surface-raised flex items-center justify-center shrink-0 mb-4">
              <BookOpen className="w-6 h-6 text-surface-ink" />
            </div>
            <h3 className="heading-sm">Knowledge Base AI</h3>
            <p className="text-sm text-surface-sub mt-2 leading-relaxed">
              {stats.totalKnowledgeDocs > 0
                ? `Sistem RAG AI Agent memiliki ${stats.totalKnowledgeDocs} dokumen aktif sebagai basis pengetahuan untuk merespon pertanyaan pelanggan.`
                : 'Belum ada dokumen. Sistem RAG AI belum dapat berfungsi optimal.'}
            </p>
          </div>
          <Link href="/admin/knowledge-base" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-dark group-hover:text-surface-ink transition-colors">
            Kelola Dokumen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col">
          <div className="p-6 border-b border-surface-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-surface-ink" />
              <h2 className="heading-sm">Pesanan Terbaru</h2>
            </div>
            <Link href="/admin/orders" className="text-sm font-semibold text-surface-sub hover:text-surface-ink transition-colors">
              Lihat Semua
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
              <ShoppingCart className="w-12 h-12 text-surface-muted mb-3" />
              <p className="text-surface-ink font-medium">Belum ada pesanan</p>
              <p className="text-surface-sub text-sm mt-1">Pesanan yang masuk akan muncul di sini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-clean text-left">
                <thead>
                  <tr>
                    <th>ID Pesanan</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="group">
                      <td>
                        <Link href={`/admin/orders/${order._id}`} className="font-mono text-surface-ink group-hover:text-accent-dark transition-colors">
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <span className={`capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-right font-bold text-surface-ink">
                        {formatPrice(order.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
