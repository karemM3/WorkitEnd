import mongoose, { Schema, Document } from 'mongoose';
import { Job } from '@shared/schema';

export interface IJob extends Document, Omit<Job, 'id'> {
  // MongoDB will use _id, but we'll map it to id
}

const JobSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  currency: { type: String, default: 'USD' }, // Default to USD if not specified
  category: { type: String, required: true },
  location: { type: String, required: false },  // Made optional to match schema
  jobType: { type: String, required: true },    // Added to match schema
  image: { type: String, required: false },     // Added to match schema
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
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
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ category: 1 });
JobSchema.index({ budget: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ jobType: 1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);