import bcrypt from 'bcrypt';
import { log } from '../vite';
import { User, Service, Job, InsertUser, InsertService, InsertJob } from '@shared/schema';
import { storage } from '../storage';

/**
 * Seed the database with initial data for development/testing
 */
export async function seedDatabase() {
  try {
    log('Checking if database needs to be seeded...', 'seed');
    
    // Force a complete database reseed every time
    try {
      // Connect to MongoDB directly to clear collections
      const { default: mongoose } = await import('mongoose');
      
      // Make sure we're connected
      if (mongoose.connection.readyState !== 1) {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/workit';
        await mongoose.connect(uri);
      }
      
      // Get a list of collections
      if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        // Drop the users collection if it exists
        if (collections.some(c => c.name === 'users')) {
          log('Dropping existing users collection for clean seed', 'seed');
          await mongoose.connection.db.collection('users').drop();
        }
      }
    } catch (error) {
      log(`Error clearing database: ${(error as Error).message}`, 'seed');
    }
    
    // Always proceed with seeding regardless of errors
    
    // Create admin user with specific username and password for our project
    const adminPassword = 'oussama123';
    log(`Preparing to create admin user with username 'oussama'`, 'seed');
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    log(`Generated hash for admin password (length: ${hashedAdminPassword.length})`, 'seed');
    
    // Check if admin user already exists
    let admin = await storage.getUserByUsername('oussama');
    
    if (admin) {
      log(`Admin user 'oussama' already exists, updating role and password`, 'seed');
      admin = await storage.updateUser(admin.id, {
        password: hashedAdminPassword,
        role: 'admin', // Make sure role is set to admin
        status: 'active'
      });
    } else {
      // Create new admin user
      log(`Creating new admin user 'oussama'`, 'seed');
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
    }
    
    log('Admin user setup (username: oussama, password: oussama123)', 'seed');
    
    // Create test user
    const testPassword = 'test123';
    log(`Preparing to create test user with username 'testuser'`, 'seed');
    const hashedTestPassword = await bcrypt.hash(testPassword, 10);
    log(`Generated hash for test password (length: ${hashedTestPassword.length})`, 'seed');
    
    // Skip the manual deletion for now as we're having import issues
    log(`Skipping manual test user cleanup and relying on storage implementation`, 'seed');
    
    const testUser = await storage.createUser({
      username: 'testuser', // Will be normalized to lowercase in storage.createUser
      password: hashedTestPassword,
      email: 'test@workit.com',
      fullName: 'Test User',
      role: 'freelancer',
      bio: 'Test freelancer account',
      profilePicture: '',
      confirmPassword: testPassword, // Add required confirmPassword field
    });
    
    log('Created test user (username: testuser, password: test123)', 'seed');
    
    // Create sample services
    if (admin) {
      await storage.createService(admin.id as number, {
        title: 'Web Development',
        description: 'Professional web development services',
        price: 50,
        category: 'development',
        status: 'active',
        image: '/default-service.jpg',
      });
      
      // Create sample jobs
      await storage.createJob(admin.id as number, {
        title: 'Frontend Developer Needed',
        description: 'Looking for a skilled frontend developer',
        budget: 500,
        category: 'development',
        status: 'open',
        location: 'Remote',
        jobType: 'contract',
      });
    }
    
    if (testUser) {
      await storage.createService(testUser.id as number, {
        title: 'Logo Design',
        description: 'Creative logo design services',
        price: 30,
        category: 'design',
        status: 'active',
        image: '/default-service.jpg',
      });
    }
    
    if (testUser) {
      await storage.createJob(testUser.id as number, {
        title: 'Graphic Designer for Branding Project',
        description: 'Need a graphic designer for company rebranding',
        budget: 300,
        category: 'design',
        status: 'open',
        location: 'Remote',
        jobType: 'project',
      });
    }
    
    log('Database seeded successfully', 'seed');
  } catch (error) {
    log(`Error seeding database: ${(error as Error).message}`, 'seed');
  }
}