import mongoose, { Schema, Document } from 'mongoose';
import { User } from '@shared/schema';

export interface IEmployer extends Document, Omit<User, 'id'> {
  // Employer-specific fields
  company?: string;
  industry?: string;
  website?: string;
}

const EmployerSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, required: true, index: true, unique: true }, // Link to main user
  company: { type: String, default: '' },
  industry: { type: String, default: '' },
  website: { type: String, default: '' },
  // Additional employer-specific fields can be added here
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

// Create indexes for faster queries
EmployerSchema.index({ industry: 1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Employer || mongoose.model<IEmployer>('Employer', EmployerSchema);