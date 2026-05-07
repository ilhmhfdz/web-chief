import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import { verifyJWT } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Parse body
    const body = await request.json();
    const { items, shipping_address, payment_method, shipping_cost = 15000 } = body;

    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

    const subtotal: number = items.reduce(
      (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
      0
    );
    const total_price = subtotal + shipping_cost;

    // 3. Save to DB
    await dbConnect();
    const order = await Order.create({
      user_id: payload.sub,
      items: items.map((i: any) => ({
        product_id: i.product_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
      })),
      subtotal,
      shipping_cost,
      total_price,
      status: 'pending',
      payment_gateway: payment_method === 'cod' ? null : 'midtrans',
      shipping_address,
    });

    return NextResponse.json({ success: true, orderId: order._id.toString() }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
