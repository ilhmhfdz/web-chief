import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    const userId = payload.userId ?? payload.sub;
    
    await connectDB();
    const user = await User.findById(userId).select('addresses').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    return NextResponse.json({ addresses: user.addresses || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    const userId = payload.userId ?? payload.sub;
    
    const body = await req.json();
    const { recipient_name, phone, address, city, province, district, district_id, postal_code, is_default } = body;
    
    if (!recipient_name || !phone || !address || !city || !province || !district || !postal_code) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    const willBeDefault = is_default || user.addresses.length === 0;
    
    if (willBeDefault) {
      user.addresses.forEach(addr => { addr.is_default = false; });
    }
    
    user.addresses.push({
      recipient_name, phone, address, city, province, district, district_id, postal_code, is_default: willBeDefault
    });
    
    await user.save();
    return NextResponse.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Add address error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
