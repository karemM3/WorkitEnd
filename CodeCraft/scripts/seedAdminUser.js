/**
 * This script creates an admin user in the database
 * Run this script after starting the database to ensure an admin account is always available
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Connect to MongoDB
 */
async function connectToMongo() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workit';
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    return false;
  }
}

/**
 * Create admin user model
 */
function createUserModel() {
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, default: '' },
    role: { type: String, enum: ['freelancer', 'employer', 'admin'], default: 'freelancer' },
    profilePicture: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    blockedReason: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
  });

  try {
    return mongoose.model('User');
  } catch (e) {
    return mongoose.model('User', userSchema);
  }
}

/**
 * Create or update admin user
 */
async function createOrUpdateAdminUser() {
  const UserModel = createUserModel();
  
  const adminData = {
    username: 'oussama',
    email: 'admin@workit.com',
    password: 'oussama123',
    fullName: 'Admin User',
    role: 'admin',
    status: 'active'
  };

  try {
    // Check if admin user already exists
    const existingUser = await UserModel.findOne({ username: adminData.username });
    
    if (existingUser) {
      console.log('Admin user already exists, updating password');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Update the user
      await UserModel.updateOne(
        { username: adminData.username },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            status: 'active'
          } 
        }
      );
      
      console.log('Admin user updated successfully');
      return true;
    } else {
      console.log('Creating new admin user');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Create the user
      const adminUser = new UserModel({
        ...adminData,
        password: hashedPassword
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
      return true;
    }
  } catch (err) {
    console.error('Error creating/updating admin user:', err.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Connect to MongoDB
    const connected = await connectToMongo();
    if (!connected) {
      console.error('Failed to connect to MongoDB');
      process.exit(1);
    }
    
    // Create or update admin user
    const success = await createOrUpdateAdminUser();
    if (!success) {
      console.error('Failed to create/update admin user');
      process.exit(1);
    }
    
    console.log('Admin user setup completed successfully');
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

// Execute the main function
main();