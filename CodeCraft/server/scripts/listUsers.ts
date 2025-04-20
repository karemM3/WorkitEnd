/**
 * Script to list all users in the MongoDB database
 * Run with: npx tsx server/scripts/listUsers.ts
 */
import mongoose from 'mongoose';
import { log } from '../vite';
import * as dotenv from 'dotenv';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

async function listUsers() {
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
    
    // Find all users
    const users = await usersCollection.find({}).toArray();
    
    // Log the users (without showing full password hashes)
    log(`Found ${users.length} users:`, 'script');
    users.forEach(user => {
      const { password, ...safeUser } = user;
      const passwordInfo = password 
        ? `password exists (${typeof password}, length: ${password.toString().length})` 
        : 'no password';
      log(`- ${user.username} (ID: ${user._id}): ${passwordInfo}`, 'script');
      
      // Show more details
      log(`  Details: ${JSON.stringify(safeUser, null, 2)}`, 'script');
    });
    
    // Close connection
    await mongoose.connection.close();
    log('MongoDB connection closed', 'script');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
listUsers();