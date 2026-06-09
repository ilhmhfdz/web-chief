import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Interface representing a User document in MongoDB.
 */
export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  district: string;
  district_id: string;
  postal_code: string;
  is_default: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because we might not return it, and not required for Google Auth
  authProvider: 'local' | 'google';
  role: 'admin' | 'customer';
  face_shape?: 'Oval' | 'Round' | 'Square' | 'Heart' | 'Oblong';
  ai_credits: number;             // AI generate credits remaining
  ai_credits_used_total: number;  // Total credits ever used (analytics)
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress>({
  recipient_name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  province: { type: String, required: true },
  district: { type: String, required: true },
  district_id: { type: String, required: true },
  postal_code: { type: String, required: true },
  is_default: { type: Boolean, default: false }
});

const userSchema = new Schema<IUser>(
  {
    addresses: [addressSchema],
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Do not return password by default
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
    },
    face_shape: {
      type: String,
      enum: ['Oval', 'Round', 'Square', 'Heart', 'Oblong'],
    },
    ai_credits: {
      type: Number,
      default: 1, // Every new user gets 1 free credit
      min: 0,
    },
    ai_credits_used_total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Pre-save hook to hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare candidate password with the hashed password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// In development: always recreate the model to pick up schema changes via HMR.
// In production: reuse the cached model to avoid recompilation overhead.
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as any).User;
}

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
