import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: Schema.Types.ObjectId | string | number;
  cardName: string;
  cardNumberLast4: string;
  expiryDate: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  orderId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  cardName: { type: String, required: true },
  cardNumberLast4: { type: String, required: true },
  expiryDate: { type: String, required: true },
  paymentMethod: { type: String, enum: ['card', 'bank_transfer'], default: 'card' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'DNT' }, // Default to Tunisian Dinar (DNT)
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Create indexes for filtering payments
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: 1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);