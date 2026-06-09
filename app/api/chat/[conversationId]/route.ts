import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/lib/db/models/Conversation';
import User from '@/lib/db/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { conversationId: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    await connectDB();
    
    const conversation = await Conversation.findById(params.conversationId).populate('userId', 'name email').lean();
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Check permission
    const conv = conversation as any;
    const convUserId = conv.userId?._id?.toString() || conv.userId?.toString();
    if (user.role !== 'admin' && convUserId !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('API Chat [id] GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { conversationId: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    await connectDB();
    
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const conversation = await Conversation.findById(params.conversationId);
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const conv = conversation as any;
    const convUserId = conv.userId?._id?.toString() || conv.userId?.toString();
    if (user.role !== 'admin' && convUserId !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    
    // If admin replies, automatically switch handledBy to 'human'
    if (user.role === 'admin' && conversation.handledBy === 'ai') {
      conversation.handledBy = 'human';
    }

    // Add user/admin message using direct DB update
    await Conversation.findByIdAndUpdate(params.conversationId, {
      $push: { messages: { senderRole: user.role === 'admin' ? 'admin' : 'user', message } },
      $set: { lastMessageAt: new Date() }
    });

    // Update memory for subsequent logic
    conversation.messages.push({
      senderRole: user.role === 'admin' ? 'admin' : 'user',
      message
    });
    conversation.lastMessageAt = new Date();

    // If it's a user message and handled by AI (or default undefined), trigger AI response
    if (user.role !== 'admin' && (!conversation.handledBy || conversation.handledBy === 'ai')) {
      try {
        // Dynamic import to avoid circular dependencies if any
        const { generateResponse } = await import('@/lib/ai/rag');
        
        // Format history
        const history = conversation.messages.slice(0, -1).map((msg: any) => ({
          role: msg.senderRole === 'user' ? 'user' : 'assistant',
          content: msg.message
        }));

        const aiReply = await generateResponse(message, history);

        // Add AI message using direct DB update
        await Conversation.findByIdAndUpdate(params.conversationId, {
          $push: { messages: { senderRole: 'ai', message: aiReply } },
          $set: { lastMessageAt: new Date() }
        });

        // Update memory for response
        conversation.messages.push({
          senderRole: 'ai',
          message: aiReply
        });
        conversation.lastMessageAt = new Date();
      } catch (aiError) {
        console.error('AI Response generation error:', aiError);
        // We don't fail the request, just log it. The user message is already saved.
      }
    }
    
    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error('API Chat [id] POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { conversationId: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJWT(token);
    await connectDB();
    
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const conversation = await Conversation.findById(params.conversationId);
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const conv = conversation as any;
    const convUserId = conv.userId?._id?.toString() || conv.userId?.toString();
    if (user.role !== 'admin' && convUserId !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { handledBy } = await req.json();
    if (handledBy && ['ai', 'human'].includes(handledBy)) {
      conversation.handledBy = handledBy;
      await conversation.save();
    }
    
    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error('API Chat [id] PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
