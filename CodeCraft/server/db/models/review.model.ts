import mongoose, { Schema, Document } from 'mongoose';
import { Review } from '@shared/schema';

export interface IReview extends Document, Omit<Review, 'id'> {
  // MongoDB will use _id, but we'll map it to id
}

const ReviewSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  serviceId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
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

// Create indexes for aggregations
ReviewSchema.index({ rating: 1 });

// Compound index for unique review per user per service
ReviewSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

// Export the model or create it if it doesn't exist
export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);