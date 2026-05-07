import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';

// GET /api/orders — admin only (protected by middleware)
export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
