import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    const userId = payload.userId ?? payload.sub;
    
    const body = await req.json();
    const { recipient_name, phone, address, city, province, district, district_id, postal_code, is_default } = body;
    
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    const addressItem = (user.addresses as any).id(params.id);
    if (!addressItem) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    
    if (is_default) {
      user.addresses.forEach((addr: any) => { addr.is_default = false; });
    }
    
    if (recipient_name !== undefined) addressItem.recipient_name = recipient_name;
    if (phone !== undefined) addressItem.phone = phone;
    if (address !== undefined) addressItem.address = address;
    if (city !== undefined) addressItem.city = city;
    if (province !== undefined) addressItem.province = province;
    if (district !== undefined) addressItem.district = district;
    if (district_id !== undefined) addressItem.district_id = district_id;
    if (postal_code !== undefined) addressItem.postal_code = postal_code;
    if (is_default !== undefined) addressItem.is_default = is_default;
    
    await user.save();
    return NextResponse.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    const userId = payload.userId ?? payload.sub;
    
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    const addressItem = (user.addresses as any).id(params.id);
    if (!addressItem) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    
    (user.addresses as any).pull({ _id: params.id });
    
    // If we deleted the default, set the first one as default if it exists
    if (user.addresses.length > 0 && !user.addresses.some((a: any) => a.is_default)) {
      user.addresses[0].is_default = true;
    }
    
    await user.save();
    return NextResponse.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
