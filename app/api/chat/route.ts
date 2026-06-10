import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/lib/db/models/Conversation';
import User from '@/lib/db/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    let conversations;
    if (user.role === 'admin') {
      conversations = await Conversation.find()
        .populate('userId', 'name email')
        .sort({ lastMessageAt: -1 })
        .lean();
    } else {
      conversations = await Conversation.find({ userId: user._id })
        .sort({ lastMessageAt: -1 })
        .lean();
    }
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('API Chat GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { orderId, subject, message } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    const newConv = new Conversation({
      userId: payload.userId,
      orderId: orderId || null,
      subject: subject || 'Layanan Pelanggan',
      messages: [{
        senderRole: user.role === 'admin' ? 'admin' : 'user',
        message
      }],
      handledBy: 'ai',
      lastMessageAt: new Date()
    });
    
    await newConv.save();

    // Trigger AI Response if created by user
    if (user.role !== 'admin') {
      try {
        const { generateResponse } = await import('@/lib/ai/rag');
        
        const aiReply = await generateResponse(message, []);

        await Conversation.findByIdAndUpdate(newConv._id, {
          $push: { messages: { senderRole: 'ai', message: aiReply } },
          $set: { lastMessageAt: new Date() }
        });

        newConv.messages.push({
          senderRole: 'ai',
          message: aiReply
        });
        newConv.lastMessageAt = new Date();
      } catch (aiError) {
        console.error('AI Response generation error on creation:', aiError);
      }
    }

    return NextResponse.json({ conversation: newConv });
  } catch (error) {
    console.error('API Chat POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
