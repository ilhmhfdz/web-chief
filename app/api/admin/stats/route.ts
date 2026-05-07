import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Product } from '@/lib/db/models/Product';
import { Order } from '@/lib/db/models/Order';
import { User } from '@/lib/db/models/User';
import { KnowledgeBase } from '@/lib/db/models/KnowledgeBase';

// GET /api/admin/stats
export async function GET() {
  try {
    await dbConnect();

    // Run all queries in parallel for speed
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

    const totalRevenue = revenueAgg[0]?.total ?? 0;

    return NextResponse.json({
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalKnowledgeDocs,
        totalRevenue,
      },
      recentOrders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
