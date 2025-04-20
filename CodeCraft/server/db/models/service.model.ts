import mongoose, { Schema, Document } from 'mongoose';
import { Service } from '@shared/schema';

export interface IService extends Document, Omit<Service, 'id'> {
  // MongoDB will use _id, but we'll map it to id
}

const ServiceSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' }, // Default to USD if not specified
  category: { type: String, required: true },
  deliveryTime: { type: String, required: false }, // Make this field optional to match schema
  image: { type: String, required: false }, // Renamed from images to match schema
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }, // Match schema enum values
  createdAt: { type: Date, default: Date.now }
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

// Create indexes for search and filtering
ServiceSchema.index({ title: 'text', description: 'text' });
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ price: 1 });
ServiceSchema.index({ status: 1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);