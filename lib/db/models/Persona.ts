import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Stores the AI bot persona / system prompt.
 * Only one active persona document is expected (singleton pattern).
 */
export interface IPersona extends Document {
  name: string;
  systemPrompt: string;
  isActive: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const personaSchema = new Schema<IPersona>(
  {
    name: {
      type: String,
      required: true,
      default: 'Chief Assistant',
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Persona: Model<IPersona> =
  mongoose.models.Persona ||
  mongoose.model<IPersona>('Persona', personaSchema);

export default Persona;
