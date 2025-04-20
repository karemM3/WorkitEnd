import mongoose, { Schema, Document } from 'mongoose';
import { User } from '@shared/schema';

export interface IUser extends Document, Omit<User, 'id'> {
  // MongoDB will use _id, but we'll map it to id
  // Add raw password field that won't be transformed
  _rawPassword?: string;
}

const UserSchema: Schema = new Schema({
  // For compatibility with numeric IDs (from in-memory storage or imported data)
  id: { type: Number, sparse: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Store a raw copy of password that won't be deleted by toJSON/toObject transforms
  _rawPassword: { type: String },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['freelancer', 'employer', 'admin'], required: true },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: { type: [String], default: [] },
  location: { type: String, default: '' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  blockedReason: { type: String, default: '' },
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      if (!ret.id) {
        ret.id = ret._id;
      }
      
      // Copy password to a field that will be retained
      if (ret.password) {
        ret._rawPassword = ret.password;
      }
      
      delete ret.password; // Remove password for security
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (_, ret) => {
      if (!ret.id) {
        ret.id = ret._id;
      }
      
      // Copy password to a field that will be retained
      if (ret.password) {
        ret._rawPassword = ret.password;
      }
      
      delete ret.password; // Remove password for security
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Create text index for searching users by name
// We don't redefine username and email indexes as they're already set with unique: true above
UserSchema.index({ fullName: 'text' });
UserSchema.index({ role: 1 });
UserSchema.index({ skills: 1 });

// Export the model or create it if it doesn't exist
const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default UserModel;
// Also export as a named export for direct importing
export { UserModel };