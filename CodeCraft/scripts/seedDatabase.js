import bcrypt from 'bcrypt';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workit';
const SALT_ROUNDS = 10;

// Sample users for seeding
const users = [
  {
    username: 'admin',
    password: 'admin123',
    email: 'admin@workit.com',
    fullName: 'Admin User',
    role: 'admin',
    bio: 'System administrator',
    createdAt: new Date()
  },
  {
    username: 'testuser',
    password: 'test123',
    email: 'test@workit.com',
    fullName: 'Test User',
    role: 'freelancer',
    bio: 'Test freelancer account',
    createdAt: new Date()
  }
];

// Sample services
const services = [
  {
    title: 'Web Development',
    description: 'Professional web development services',
    price: 50,
    userId: 1, // Will be replaced with actual user ID
    category: 'development',
    tags: ['web', 'development', 'frontend', 'backend'],
    imageUrl: '/default-service.jpg',
    status: 'active',
    createdAt: new Date()
  },
  {
    title: 'Logo Design',
    description: 'Creative logo design services',
    price: 30,
    userId: 2, // Will be replaced with actual user ID
    category: 'design',
    tags: ['logo', 'design', 'branding'],
    imageUrl: '/default-service.jpg',
    status: 'active',
    createdAt: new Date()
  }
];

// Sample jobs
const jobs = [
  {
    title: 'Frontend Developer Needed',
    description: 'Looking for a skilled frontend developer',
    budget: 500,
    userId: 1, // Will be replaced with actual user ID
    category: 'development',
    skills: ['React', 'TypeScript', 'CSS'],
    status: 'open',
    location: 'Remote',
    createdAt: new Date()
  },
  {
    title: 'Graphic Designer for Branding Project',
    description: 'Need a graphic designer for company rebranding',
    budget: 300,
    userId: 2, // Will be replaced with actual user ID
    category: 'design',
    skills: ['Photoshop', 'Illustrator', 'Branding'],
    status: 'open',
    location: 'Remote',
    createdAt: new Date()
  }
];

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Check if users already exist
    const existingUsers = await db.collection('users').find({}).toArray();
    
    if (existingUsers.length > 0) {
      console.log('Database already has users, skipping seed');
      return;
    }
    
    // Hash passwords for users
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
        return {
          ...user,
          password: hashedPassword,
          _rawPassword: user.password // Store original password for reference
        };
      })
    );
    
    // Insert users
    const insertedUsers = await db.collection('users').insertMany(usersWithHashedPasswords);
    console.log(`${insertedUsers.insertedCount} users inserted`);
    
    // Get user IDs for services and jobs
    const userIds = Object.values(insertedUsers.insertedIds);
    
    // Insert services with actual user IDs
    const servicesWithUserIds = services.map((service, index) => ({
      ...service,
      userId: userIds[index % userIds.length]
    }));
    
    await db.collection('services').insertMany(servicesWithUserIds);
    console.log(`${servicesWithUserIds.length} services inserted`);
    
    // Insert jobs with actual user IDs
    const jobsWithUserIds = jobs.map((job, index) => ({
      ...job,
      userId: userIds[index % userIds.length]
    }));
    
    await db.collection('jobs').insertMany(jobsWithUserIds);
    console.log(`${jobsWithUserIds.length} jobs inserted`);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
  }
}

// Run the seed function
seedDatabase()
  .then(() => console.log('Seed process completed'))
  .catch((err) => console.error('Seed process failed:', err));