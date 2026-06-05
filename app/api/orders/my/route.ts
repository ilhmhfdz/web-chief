import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import { getTokenFromRequest } from '@/lib/auth/getToken';
import { verifyJWT } from '@/lib/auth/jwt';

// GET /api/orders/my — returns only the authenticated user's own orders
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyJWT(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (payload.userId ?? payload.sub) as string;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const orders = await Order.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Serialize for Client Component safety
    const serialized = (orders as any[]).map((o) => ({
      _id: o._id.toString(),
      status: o.status,
      total_price: o.total_price,
      subtotal: o.subtotal,
      shipping_cost: o.shipping_cost,
      payment_gateway: o.payment_gateway,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      items: (o.items ?? []).map((i: any) => ({
        product_id: i.product_id?.toString() ?? '',
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
      })),
      shipping_address: o.shipping_address,
    }));

    return NextResponse.json({ data: serialized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
