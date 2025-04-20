import mongoose, { Schema, Document } from 'mongoose';
import { User } from '@shared/schema';

export interface IFreelancer extends Document, Omit<User, 'id'> {
  // Freelancer-specific fields
  education?: string;
  hourlyRate?: number;
  yearsExperience?: number;
  categories?: string[];
}

const FreelancerSchema: Schema = new Schema({
  userId: { type: Schema.Types.Mixed, required: true, index: true, unique: true }, // Link to main user
  education: { type: String, default: '' },
  hourlyRate: { type: Number, default: 0 },
  yearsExperience: { type: Number, default: 0 },
  categories: { type: [String], default: [] },
  // Additional freelancer-specific fields can be added here
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
FreelancerSchema.index({ hourlyRate: 1 });
FreelancerSchema.index({ yearsExperience: 1 });
FreelancerSchema.index({ categories: 1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Freelancer || mongoose.model<IFreelancer>('Freelancer', FreelancerSchema);