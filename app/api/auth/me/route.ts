import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's public info from their JWT cookie.
 * Used by the Navbar (client-side) to detect login state and role.
 */
export async function GET(req: Request) {
  const token = req.headers
    .get('cookie')
    ?.split('; ')
    .find((c) => c.startsWith('token='))
    ?.split('=')[1];

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const payload = await verifyJWT(token);
    await dbConnect();
    const userDoc = await User.findById(payload.userId).select('name');
    return NextResponse.json({
      user: {
        userId: payload.userId,
        role: payload.role,
        name: userDoc?.name || '',
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
