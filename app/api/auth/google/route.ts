import { OAuth2Client } from 'google-auth-library';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { signJWT } from '@/lib/auth/jwt';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { credential } = body;

    if (!credential || typeof credential !== 'string') {
      return NextResponse.json({ error: 'Google credential is required' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      return NextResponse.json({ error: 'Google Login is not configured on the server' }, { status: 500 });
    }

    // Verify the Google JWT
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 400 });
    }

    const { email, name } = payload;

    // Find user by email
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not exists
      user = await User.create({
        name: name || 'Google User',
        email,
        authProvider: 'google',
      });
    }

    // Sign our own JWT token
    const token = await signJWT({ userId: (user._id as unknown) as string, role: user.role });

    const response = NextResponse.json(
      { message: 'Logged in successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Google Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
