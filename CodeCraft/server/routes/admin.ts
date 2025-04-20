import { Express, Request, Response, NextFunction } from 'express';
import { isAdmin } from '../middleware/isAdmin';
import { IStorage } from '../storage';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { log } from '../vite';

/**
 * Sets up admin routes for the application
 * @param app Express app to add the routes to
 * @param storage Storage implementation for data access
 */
export function setupAdminRoutes(app: Express, storage: IStorage) {
  // Direct admin login endpoint
  app.post('/api/admin/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Admin login request received:', req.body);
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Try to find the user first
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log('Admin user not found:', username);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if the user is an admin
      if (user.role !== 'admin') {
        console.log('User is not an admin:', username);
        return res.status(403).json({ message: "This endpoint is for admin users only" });
      }
      
      // Authenticate using passport
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          console.error('Authentication error:', err);
          return res.status(500).json({ message: "Internal server error" });
        }
        
        if (!user) {
          console.error('Admin login failed:', info?.message || 'Unknown reason');
          return res.status(401).json({ 
            message: "Invalid username or password",
            details: process.env.NODE_ENV === 'development' ? info?.message : undefined
          });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('Session creation error:', loginErr);
            return res.status(500).json({ message: "Error creating login session" });
          }
          
          // Remove sensitive data
          const userObj = user.toObject ? user.toObject() : user;
          const { password, ...safeUser } = userObj;
          
          console.log('Admin user logged in successfully:', safeUser.username);
          
          return res.json({
            ...safeUser,
            message: "Admin login successful"
          });
        });
      })(req, res, next);
    } catch (error: any) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  // Public admin dashboard statistics endpoint (for testing)
  app.get('/api/admin/public-stats', async (req: Request, res: Response) => {
    try {
      // Use the getAdminStatistics method to get all stats in one call
      console.log('Fetching public admin statistics...');
      const stats = await storage.getAdminStatistics();
      console.log('Admin public statistics retrieved:', stats);
      
      // Transform to the expected response format
      res.json({
        counts: {
          users: stats.userCount || 0,
          services: stats.serviceCount || 0,
          jobs: stats.jobCount || 0,
          applications: stats.applicationCount || 0,
          orders: stats.orderCount || 0
        },
        usersByRole: stats.usersByRole || {
          freelancers: 0,
          employers: 0,
          admins: 0
        }
      });
    } catch (error: any) {
      console.error('Error fetching public admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin statistics', error: error.message });
    }
  });

  // Get admin dashboard statistics (protected)
  app.get('/api/admin/stats', isAdmin, async (req: Request, res: Response) => {
    try {
      // Use the getAdminStatistics method to get all stats in one call
      console.log('Fetching admin statistics...');
      const stats = await storage.getAdminStatistics();
      console.log('Admin statistics retrieved:', stats);
      
      // Transform to the expected response format
      res.json({
        counts: {
          users: stats.userCount || 0,
          services: stats.serviceCount || 0,
          jobs: stats.jobCount || 0,
          applications: stats.applicationCount || 0,
          orders: stats.orderCount || 0
        },
        usersByRole: stats.usersByRole || {
          freelancers: 0,
          employers: 0,
          admins: 0
        }
      });
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin statistics', error: error.message });
    }
  });
  
  // Public users endpoint (for testing)
  app.get('/api/admin/public-users', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  });
  
  // Get all users (protected)
  app.get('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  });
  
  // Block a user
  app.put('/api/admin/users/:userId/block', isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: 'A reason for blocking is required' });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Can't block admin users
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin users cannot be blocked' });
      }
      
      // Update user status
      const updatedUser = await storage.updateUser(userId, { 
        status: 'blocked',
        blockedReason: reason
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Error blocking user:', error);
      res.status(500).json({ message: 'Failed to block user', error: error.message });
    }
  });
  
  // Unblock a user
  app.put('/api/admin/users/:userId/unblock', isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user status
      const updatedUser = await storage.updateUser(userId, { 
        status: 'active',
        blockedReason: null
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ message: 'Failed to unblock user', error: error.message });
    }
  });
  
  // Delete a user
  app.delete('/api/admin/users/:userId', isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Can't delete admin users
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin users cannot be deleted' });
      }
      
      // Delete the user
      await storage.deleteUser(userId);
      
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  });

  // API endpoint to create admin user (public for development)
  app.post('/api/admin/seed-admin', async (req: Request, res: Response) => {
    try {
      // In a production environment, you'd want to check a token/secret here
      // For this development environment, we'll keep it simple
      
      const adminPassword = 'oussama123';
      log('Creating admin user with username "oussama"', 'admin-seed');
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      
      // Check if admin user already exists
      let admin = await storage.getUserByUsername('oussama');
      
      if (admin) {
        log('Admin user "oussama" already exists, updating role', 'admin-seed');
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
        log('Creating new admin user "oussama"', 'admin-seed');
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
}