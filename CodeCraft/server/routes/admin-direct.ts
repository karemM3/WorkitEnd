/**
 * Direct API endpoints for admin user creation (development only)
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import bcrypt from 'bcrypt';
import { log } from '../vite';
import mongoose from 'mongoose';
import UserModel from '../db/models/user.model';
import { connectToMongoDB } from '../db/mongodb';

const router = Router();

/**
 * Direct endpoint to create admin user without authentication
 * POST /api/admin-direct/create
 * 
 * This is a development-only endpoint that should be removed in production
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    log('Direct admin creation endpoint called', 'admin-direct');
    
    // Use fixed admin credentials
    const adminUsername = 'oussama';
    const adminPassword = 'oussama123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    log(`Generated hash for admin password (length: ${hashedPassword.length})`, 'admin-direct');
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    
    // Very detailed logging for debugging
    log(`Current storage type: ${typeof storage}`, 'admin-direct');
    log(`Admin lookup result: ${existingAdmin ? 'Found' : 'Not Found'}`, 'admin-direct');
    
    if (existingAdmin) {
      log(`Admin user '${adminUsername}' already exists, updating role and password`, 'admin-direct');
      
      // Log the existing admin details for debugging
      log(`Existing admin ID: ${existingAdmin.id}, type: ${typeof existingAdmin.id}`, 'admin-direct');
      log(`Existing admin password present: ${!!existingAdmin.password}`, 'admin-direct');
      
      // Update the admin user with new password and ensure role is admin
      const updatedAdmin = await storage.updateUser(existingAdmin.id, {
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      
      res.status(200).json({
        message: 'Admin user updated successfully',
        user: {
          id: updatedAdmin?.id || existingAdmin.id,
          username: adminUsername,
          role: 'admin'
        },
        // Include credentials in development mode only
        credentials: {
          username: adminUsername,
          password: adminPassword
        }
      });
    } else {
      log(`Admin user '${adminUsername}' does not exist, creating new admin user`, 'admin-direct');
      
      // Create new admin user with all required fields
      const newAdmin = await storage.createUser({
        username: adminUsername,
        password: hashedPassword,
        email: 'oussama@workit.com',
        fullName: 'Oussama Admin',
        role: 'admin',
        bio: 'System administrator',
        profilePicture: '',
        confirmPassword: adminPassword // Include if needed by schema
      });
      
      log(`New admin created with ID: ${newAdmin.id}, password length: ${newAdmin.password ? newAdmin.password.length : 'N/A'}`, 'admin-direct');
      
      res.status(201).json({
        message: 'Admin user created successfully',
        user: {
          id: newAdmin.id,
          username: adminUsername,
          role: 'admin'
        },
        // Include credentials in development mode only
        credentials: {
          username: adminUsername,
          password: adminPassword
        }
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error creating admin user: ${errorMessage}`, 'admin-direct');
    
    // Additional error details for debugging
    if (error instanceof Error && error.stack) {
      log(`Error stack: ${error.stack}`, 'admin-direct');
    }
    
    res.status(500).json({
      message: 'Error creating admin user',
      error: errorMessage
    });
  }
});

/**
 * Test endpoint to verify storage is working
 * GET /api/admin-direct/test
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    // Get storage stats
    const userCount = await storage.getUserCount();
    
    res.status(200).json({
      message: 'Storage test successful',
      stats: {
        userCount
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Storage test error: ${errorMessage}`, 'admin-direct');
    
    res.status(500).json({
      message: 'Storage test failed',
      error: errorMessage
    });
  }
});

/**
 * Direct endpoint to create admin user by manipulating MongoDB directly
 * POST /api/admin-direct/create-direct
 * 
 * This is a development-only endpoint that should be removed in production
 */
router.post('/create-direct', async (req: Request, res: Response) => {
  try {
    log('Direct MongoDB admin creation endpoint called', 'admin-direct');
    
    // Use fixed admin credentials
    const adminUsername = 'oussama';
    const adminPassword = 'oussama123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    log(`Generated hash for admin password (length: ${hashedPassword.length})`, 'admin-direct');
    
    // Connect to MongoDB directly
    await connectToMongoDB();
    
    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ username: adminUsername.toLowerCase() });
    
    if (existingAdmin) {
      log(`Admin user '${adminUsername}' already exists in MongoDB, updating...`, 'admin-direct');
      
      // Update existing admin user
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.status = 'active';
      
      await existingAdmin.save();
      
      log(`Admin user updated successfully in MongoDB`, 'admin-direct');
      
      res.status(200).json({
        message: 'Admin user updated successfully',
        user: {
          id: existingAdmin._id.toString(),
          username: adminUsername,
          role: 'admin'
        },
        credentials: {
          username: adminUsername,
          password: adminPassword
        }
      });
    } else {
      log(`Admin user '${adminUsername}' does not exist in MongoDB, creating...`, 'admin-direct');
      
      // Create new admin user directly with Mongoose
      const newAdmin = new UserModel({
        username: adminUsername.toLowerCase(),
        password: hashedPassword,
        _rawPassword: hashedPassword, // Store in both fields to ensure it's preserved
        email: 'oussama@workit.com',
        fullName: 'Oussama Admin',
        role: 'admin',
        bio: 'System administrator',
        profilePicture: '',
        status: 'active',
        createdAt: new Date()
      });
      
      await newAdmin.save();
      
      log(`Admin user created successfully in MongoDB, ID: ${newAdmin._id}`, 'admin-direct');
      log(`Admin password stored (length: ${newAdmin.password ? newAdmin.password.length : 'N/A'})`, 'admin-direct');
      
      // Verify the user is properly stored and retrievable
      const verifyUser = await UserModel.findById(newAdmin._id);
      log(`Verification lookup result: ${verifyUser ? 'Found' : 'Not Found'}`, 'admin-direct');
      if (verifyUser) {
        log(`Verified admin has password: ${!!verifyUser.password}`, 'admin-direct');
      }
      
      res.status(201).json({
        message: 'Admin user created successfully',
        user: {
          id: newAdmin._id.toString(),
          username: adminUsername,
          role: 'admin'
        },
        credentials: {
          username: adminUsername,
          password: adminPassword
        }
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error creating admin user directly in MongoDB: ${errorMessage}`, 'admin-direct');
    
    // Additional error details for debugging
    if (error instanceof Error && error.stack) {
      log(`Error stack: ${error.stack}`, 'admin-direct');
    }
    
    res.status(500).json({
      message: 'Error creating admin user',
      error: errorMessage
    });
  }
});

/**
 * One-click admin login endpoint
 * GET /api/admin-direct/login
 * 
 * This creates the admin user and immediately logs them in with a single request
 * Very useful for development when using in-memory databases that reset on restart
 */
router.get('/login', async (req: Request, res: Response) => {
  try {
    log('One-click admin login requested', 'admin-direct');
    
    // Use fixed admin credentials
    const adminUsername = 'oussama';
    const adminPassword = 'oussama123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Connect to MongoDB directly
    await connectToMongoDB();
    
    // Check if admin already exists
    let adminUser = await UserModel.findOne({ username: adminUsername.toLowerCase() });
    
    if (!adminUser) {
      log(`Admin user '${adminUsername}' does not exist in MongoDB, creating...`, 'admin-direct');
      
      // Create new admin user directly with Mongoose
      adminUser = new UserModel({
        username: adminUsername.toLowerCase(),
        password: hashedPassword,
        _rawPassword: hashedPassword,
        email: 'oussama@workit.com',
        fullName: 'Oussama Admin',
        role: 'admin',
        bio: 'System administrator',
        profilePicture: '',
        status: 'active',
        createdAt: new Date()
      });
      
      await adminUser.save();
      log(`Admin user created successfully with ID: ${adminUser._id}`, 'admin-direct');
    } else {
      log(`Admin user already exists with ID: ${adminUser._id}`, 'admin-direct');
      
      // Update admin password to ensure login works
      adminUser.password = hashedPassword;
      adminUser._rawPassword = hashedPassword; 
      adminUser.role = 'admin';
      adminUser.status = 'active';
      await adminUser.save();
      log(`Admin user updated successfully`, 'admin-direct');
    }
    
    // Log the user in by creating a session
    req.login(adminUser, (err) => {
      if (err) {
        log(`Error logging in admin: ${err.message}`, 'admin-direct');
        return res.status(500).json({ message: 'Error creating login session', error: err.message });
      }
      
      log(`Admin user logged in successfully`, 'admin-direct');
      
      // For browser-based access, redirect to admin dashboard
      if (req.headers.accept?.includes('text/html')) {
        return res.redirect('/admin/dashboard');
      }
      
      // For API access, return user data
      const { password, _rawPassword, ...safeUser } = adminUser.toObject();
      
      res.status(200).json({
        message: 'Admin user created and logged in successfully',
        user: safeUser,
        // Include credentials for development only
        credentials: {
          username: adminUsername,
          password: adminPassword
        }
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error in one-click admin login: ${errorMessage}`, 'admin-direct');
    
    // Additional error details for debugging
    if (error instanceof Error && error.stack) {
      log(`Error stack: ${error.stack}`, 'admin-direct');
    }
    
    res.status(500).json({
      message: 'Error logging in admin user',
      error: errorMessage
    });
  }
});

export default router;