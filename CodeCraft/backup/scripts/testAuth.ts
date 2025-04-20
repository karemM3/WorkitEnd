import mongoose from 'mongoose';
import UserModel from '../server/db/models/user.model';
import { log } from '../server/vite';
import bcrypt from 'bcrypt';

async function testMongoAuth() {
  try {
    log('Starting MongoDB authentication test', 'test');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/workit';
    log(`Connecting to MongoDB at: ${uri}`, 'test');
    
    await mongoose.connect(uri);
    log('Connected to MongoDB successfully', 'test');

    // Check if admin user exists
    const adminUser = await UserModel.findOne({ username: 'admin' });
    log(`Admin user exists: ${!!adminUser}`, 'test');
    
    if (adminUser) {
      log(`Admin user ID: ${adminUser._id}`, 'test');
      log(`Admin user username: ${adminUser.username}`, 'test');
      log(`Admin user password (first 10 chars): ${adminUser.password.substring(0, 10)}...`, 'test');
      
      // Test password verification
      const testPassword = 'admin123';
      
      if (adminUser.password.startsWith('$2b$') || adminUser.password.startsWith('$2a$')) {
        const isValidBcrypt = await bcrypt.compare(testPassword, adminUser.password);
        log(`Bcrypt password verification result: ${isValidBcrypt}`, 'test');
      } else {
        const isValidPlain = adminUser.password === testPassword;
        log(`Plain password verification result: ${isValidPlain}`, 'test');
      }
    }
    
    // Test looking up by case-insensitive username
    const testUser = await UserModel.findOne({ 
      $or: [
        { username: 'admin' },
        { username: 'Admin' },
        { username: 'ADMIN' }
      ]
    });
    
    log(`Case-insensitive lookup result: ${!!testUser}`, 'test');
    
    // Test creating a test user
    const testUserCount = await UserModel.countDocuments({ username: 'authtest' });
    
    if (testUserCount === 0) {
      const plainPassword = 'test456';
      log(`Creating test user with plain password: ${plainPassword}`, 'test');
      
      const newUser = new UserModel({
        username: 'authtest',
        email: 'authtest@example.com',
        password: plainPassword,
        fullName: 'Auth Test User',
        role: 'freelancer'
      });
      
      await newUser.save();
      log('Test user created successfully', 'test');
    } else {
      log('Test user already exists, skipping creation', 'test');
    }
    
    log('Authentication test completed successfully', 'test');
  } catch (error) {
    log(`Error during authentication test: ${error instanceof Error ? error.message : 'Unknown error'}`, 'test');
    console.error(error);
  } finally {
    // Close the MongoDB connection
    try {
      await mongoose.disconnect();
      log('MongoDB connection closed', 'test');
    } catch (error) {
      log(`Error closing MongoDB connection: ${error instanceof Error ? error.message : 'Unknown error'}`, 'test');
    }
  }
}

// Execute the test
testMongoAuth().catch(console.error);