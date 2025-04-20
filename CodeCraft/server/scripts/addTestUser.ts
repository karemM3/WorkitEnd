/**
 * Script to manually add a test user to the MongoDB database
 * Run with: npx tsx server/scripts/addTestUser.ts
 */
import mongoose from 'mongoose';
import { log } from '../vite';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

async function addTestUser() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/workit';
    log(`Connecting to MongoDB at ${uri}...`, 'script');
    await mongoose.connect(uri);
    log('MongoDB connected', 'script');
    
    // Get the users collection directly to avoid TypeScript error
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const usersCollection = db.collection('users');
    
    // Drop existing collection if it exists
    try {
      await usersCollection.drop();
      log('Dropped existing users collection', 'script');
    } catch (error) {
      log('No users collection to drop or error dropping collection', 'script');
    }
    
    // Create admin user with known password
    const adminPassword = 'admin123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = {
      username: 'admin',
      password: hashedAdminPassword,
      _rawPassword: hashedAdminPassword, // Store in both fields
      email: 'admin@workit.com',
      fullName: 'Admin User',
      role: 'employer',
      bio: 'System administrator',
      profilePicture: '',
      skills: [],
      location: '',
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(adminUser);
    log(`Created admin user with ID: ${result.insertedId}`, 'script');
    
    // Create test user
    const testPassword = 'test123';
    const hashedTestPassword = await bcrypt.hash(testPassword, 10);
    
    const testUser = {
      username: 'testuser',
      password: hashedTestPassword,
      _rawPassword: hashedTestPassword, // Store in both fields
      email: 'test@workit.com',
      fullName: 'Test User',
      role: 'freelancer',
      bio: 'Test freelancer account',
      profilePicture: '',
      skills: [],
      location: '',
      createdAt: new Date()
    };
    
    const testResult = await usersCollection.insertOne(testUser);
    log(`Created test user with ID: ${testResult.insertedId}`, 'script');
    
    // List all users to verify
    const users = await usersCollection.find({}).toArray();
    log(`Found ${users.length} users after insertion:`, 'script');
    users.forEach(user => {
      const { password, _rawPassword, ...safeUser } = user;
      log(`- ${user.username} (ID: ${user._id}): password length: ${password.length}`, 'script');
    });
    
    // Close connection
    await mongoose.connection.close();
    log('MongoDB connection closed', 'script');
    
    log('Test users successfully added to database', 'script');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
addTestUser();