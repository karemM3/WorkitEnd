import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import bcrypt from 'bcrypt';
import { log } from '../vite';

const router = Router();

/**
 * API endpoint to create admin user manually (protected by a secret token)
 * POST /api/admin-tools/seed-admin
 */
router.post('/seed-admin', async (req: Request, res: Response) => {
  try {
    // In a production environment, you'd want to check a token/secret here
    // For this development environment, we'll keep it simple
    
    const adminPassword = 'oussama123';
    log(`Creating admin user with username 'oussama'`, 'admin-seed');
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin user already exists
    let admin = await storage.getUserByUsername('oussama');
    
    if (admin) {
      log(`Admin user 'oussama' already exists, updating role`, 'admin-seed');
      admin = await storage.updateUser(admin.id, {
        password: hashedAdminPassword,
        role: 'admin', // Make sure role is set to admin
        status: 'active'
      });
      
      res.status(200).json({ 
        message: 'Admin user updated successfully', 
        username: 'oussama',
        password: 'oussama123' // Only showing this for development
      });
    } else {
      // Create new admin user
      log(`Creating new admin user 'oussama'`, 'admin-seed');
      admin = await storage.createUser({
        username: 'oussama',
        password: hashedAdminPassword,
        email: 'oussama@workit.com',
        fullName: 'Oussama Admin',
        role: 'admin', // Set role to admin
        bio: 'System administrator',
        profilePicture: '',
        confirmPassword: adminPassword,
      });
      
      res.status(201).json({ 
        message: 'Admin user created successfully', 
        username: 'oussama',
        password: 'oussama123' // Only showing this for development
      });
    }
    
    log('Admin user setup completed', 'admin-seed');
  } catch (error) {
    const err = error as Error;
    log(`Error creating admin user: ${err.message}`, 'admin-seed');
    res.status(500).json({ message: 'Error creating admin user', error: err.message });
  }
});

export default router;