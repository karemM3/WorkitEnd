import mongoose, { Schema, Document } from 'mongoose';
import { Application } from '@shared/schema';

export interface IApplication extends Document, Omit<Application, 'id'> {
  // MongoDB will use _id, but we'll map it to id
}

const ApplicationSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  jobId: { type: Schema.Types.Mixed, required: true, index: true }, // Allow both number and ObjectId
  coverLetter: { type: String, required: true },
  resumeFile: { type: String }, // Added to store uploaded resume file URL
  price: { type: Number, required: true },
  attachments: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
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

// Create indexes for filtering
ApplicationSchema.index({ status: 1 });

// Compound index for unique application per user per job
ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Export the model or create it if it doesn't exist
export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);