import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import User from '@/lib/db/models/User';
import { verifyJWT } from '@/lib/auth/jwt';
import { getTokenFromRequest } from '@/lib/auth/getToken';

// ---- GET /api/orders/[id] ----
// [SEC-03] IDOR fix: verifies ownership — customer can only see their own orders.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require authentication
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyJWT(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const order = await Order.findById(params.id).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // [SEC-03] Ownership check: admin can see all, customer only their own
    const requestUserId = (payload.userId ?? payload.sub) as string;
    if (payload.role !== 'admin' && order.user_id.toString() !== requestUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

// ---- PATCH /api/orders/[id] ----
// [SEC-04] Auth + whitelist fix: admin only, no mass assignment, atomic credit grant.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Enforce admin role via middleware-injected header
  const userRole = req.headers.get('x-user-role');
  if (!userRole || userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    // [SEC-04] Whitelist — prevent mass assignment / NoSQL injection
    const ALLOWED_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
    type OrderStatus = typeof ALLOWED_STATUSES[number];

    const safeUpdate: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status as OrderStatus)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      safeUpdate.status = body.status;
    }
    if (body.payment_gateway !== undefined) safeUpdate.payment_gateway = body.payment_gateway;
    if (body.payment_token !== undefined) safeUpdate.payment_token = body.payment_token;

    // Fetch current order BEFORE update to check previous status
    const existingOrder = await Order.findById(params.id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order with whitelisted data only
    const updatedOrder = await Order.findByIdAndUpdate(
      params.id,
      { $set: safeUpdate },
      { new: true, runValidators: true }
    ).lean() as any;

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ── [BIZ-02] Atomic AI credit grant on delivery ───────────────────────────
    // Uses findOneAndUpdate with condition to prevent race condition double-grant.
    const isNowDelivered = body.status === 'delivered';

    if (isNowDelivered) {
      // Atomic: claim the credit grant in a single operation — only succeeds once
      const claimed = await Order.findOneAndUpdate(
        { _id: params.id, ai_credit_granted: false, status: 'delivered' },
        { $set: { ai_credit_granted: true } },
        { new: true }
      );

      if (claimed) {
        await User.findByIdAndUpdate(existingOrder.user_id, {
          $inc: { ai_credits: 1 },
        });
        console.log(`[AI Credit] +1 credit granted to user ${existingOrder.user_id} for order ${params.id}`);
      }
    }

    return NextResponse.json({ data: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
