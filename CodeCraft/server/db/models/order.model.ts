import mongoose, { Schema, Document } from 'mongoose';
import { Order } from '@shared/schema';

export interface IOrder extends Document, Omit<Order, 'id'> {
  // MongoDB will use _id, but we'll map it to id
}

const OrderSchema: Schema = new Schema({
  buyerId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  sellerId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  serviceId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  totalPrice: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['card', 'bank_transfer'], required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  // Add payment details (for card payments)
  paymentDetails: {
    cardName: { type: String },
    cardNumberLast4: { type: String },
    expiryDate: { type: String }
  }
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

// Create indexes for filtering orders
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: 1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);