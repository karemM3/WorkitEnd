// MongoDB initialization script
import { MongoClient } from 'mongodb';
import { exit } from 'process';

async function initializeDatabase() {
  console.log('Initializing MongoDB database...');
  
  // Read connection string from environment
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/workit';
  
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    // Connect to MongoDB
    const client = new MongoClient(mongoUri);
    await client.connect();
    
    // Get reference to the database
    const db = client.db();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`Connected to database: ${db.databaseName}`);
    console.log(`Collections: ${collections.map(c => c.name).join(', ') || 'none'}`);
    
    // Create necessary collections if they don't exist
    const requiredCollections = [
      'users',
      'services',
      'jobs',
      'applications',
      'orders',
      'reviews'
    ];
    
    for (const collName of requiredCollections) {
      if (!collections.find(c => c.name === collName)) {
        console.log(`Creating collection: ${collName}`);
        await db.createCollection(collName);
      }
    }
    
    // Close connection
    await client.close();
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    exit(1);
  }
}

// Run the initialization
initializeDatabase();