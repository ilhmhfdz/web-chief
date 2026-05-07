import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  product_id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

/**
 * Interface representing a Customer Order in MongoDB.
 */
export interface IOrder extends Document {
  user_id: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  shipping_cost: number;
  total_price: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_gateway: 'midtrans' | 'xendit' | null;
  payment_token?: string;
  shipping_address: {
    recipient_name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
  };
  ai_credit_granted: boolean; // Guard: credit only granted once per delivered order
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image_url: { type: String, required: true },
  },
  { _id: false } // Prevent creating independent ObjectIds for sub-documents
);

const orderSchema = new Schema<IOrder>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val: any[]) => val.length > 0, 'Order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping_cost: {
      type: Number,
      required: true,
      min: 0,
    },
    total_price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    payment_gateway: {
      type: String,
      enum: ['midtrans', 'xendit', null],
      default: null,
    },
    payment_token: {
      type: String,
    },
    shipping_address: {
      recipient_name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String, required: true },
      postal_code: { type: String, required: true },
    },
    ai_credit_granted: {
      type: Boolean,
      default: false, // Set to true after credit is granted on delivery
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Use existing model if already compiled (for Next.js HMR)
export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
export default Order;
