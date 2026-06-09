"use server";

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await dbConnect();

    const allowedStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error('Invalid status');
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );

    if (!order) {
      throw new Error('Order not found');
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update order status:', error);
    return { success: false, error: 'Failed to update order status' };
  }
}
