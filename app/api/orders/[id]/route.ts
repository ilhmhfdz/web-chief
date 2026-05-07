import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import User from '@/lib/db/models/User';
import { verifyJWT } from '@/lib/auth/jwt';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const order = await Order.findById(params.id).lean();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ data: order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await req.json();

    // Fetch current order BEFORE update to check previous status
    const existingOrder = await Order.findById(params.id);
    if (!existingOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Update order with new data
    const updatedOrder = await Order.findByIdAndUpdate(params.id, body, { new: true }).lean() as any;
    if (!updatedOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // ── Auto-grant AI credit when order is delivered ──────────────────
    // Triggers only when: new status = 'delivered' AND credit not yet granted
    const isNowDelivered = body.status === 'delivered';
    const creditNotYetGranted = !existingOrder.ai_credit_granted;

    if (isNowDelivered && creditNotYetGranted) {
      // Grant +1 AI credit to the user who placed this order
      await User.findByIdAndUpdate(existingOrder.user_id, {
        $inc: { ai_credits: 1 },
      });

      // Mark credit as granted on this order (prevents duplicate grants)
      await Order.findByIdAndUpdate(params.id, {
        $set: { ai_credit_granted: true },
      });

      console.log(`[AI Credit] +1 credit granted to user ${existingOrder.user_id} for order ${params.id}`);
    }

    return NextResponse.json({ data: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
