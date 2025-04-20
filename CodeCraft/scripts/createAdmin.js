/**
 * Script to create an admin user directly
 * Run with: node scripts/createAdmin.js
 */
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize dotenv
dotenv.config();

// Log helper
function log(message) {
  console.log(`[admin-setup] ${message}`);
}

// Connect to MongoDB
async function connectToMongo() {
  try {
    log('Connecting to MongoDB...');
    // Use MongoDB Memory Server URI if set
    if (process.env.USE_MONGODB_MEMORY_SERVER === 'true') {
      // Need to get the URI from the running memory server instance
      log('Using MongoDB Memory Server...');
      // Try to connect to the default memory server port
      const uri = 'mongodb://127.0.0.1:41847/';
      await mongoose.connect(uri);
      log(`Connected to MongoDB Memory Server at ${uri}`);
    } else {
      // Use regular MongoDB URI
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/workit';
      await mongoose.connect(uri);
      log(`Connected to MongoDB at ${uri}`);
    }
    
    return mongoose.connection;
  } catch (error) {
    log(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

// Create user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, required: true, enum: ['freelancer', 'employer', 'admin'] },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  status: { type: String, default: 'active', enum: ['active', 'blocked'] },
  createdAt: { type: Date, default: Date.now },
  blockedReason: { type: String, default: null }
});

// Create or update admin user
async function createOrUpdateAdminUser(connection) {
  try {
    // Get or create the User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    const adminUsername = 'oussama';
    const adminPassword = 'oussama123';
    
    log(`Preparing to create/update admin user: ${adminUsername}`);
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    log('Admin password hashed successfully');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: adminUsername.toLowerCase() });
    
    if (existingAdmin) {
      log('Admin user already exists, updating...');
      const updatedAdmin = await User.findByIdAndUpdate(
        existingAdmin._id,
        {
          password: hashedPassword,
          role: 'admin',
          status: 'active'
        },
        { new: true }
      );
      log(`Admin user updated successfully: ${updatedAdmin.username}`);
      return updatedAdmin;
    } else {
      log('Admin user does not exist, creating new admin...');
      const newAdmin = new User({
        username: adminUsername.toLowerCase(),
        password: hashedPassword,
        email: 'oussama@workit.com',
        fullName: 'Oussama Admin',
        role: 'admin',
        bio: 'System administrator',
        profilePicture: '',
        status: 'active'
      });
      
      await newAdmin.save();
      log(`Admin user created successfully: ${newAdmin.username}`);
      return newAdmin;
    }
  } catch (error) {
    log(`Error creating/updating admin user: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  let connection;
  try {
    connection = await connectToMongo();
    const admin = await createOrUpdateAdminUser(connection);
    log('Admin user setup completed successfully');
    log(`Username: oussama, Password: oussama123`);
  } catch (error) {
    log(`Script execution failed: ${error.message}`);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      log('Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

// Run the script
main();