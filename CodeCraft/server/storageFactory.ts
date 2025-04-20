import { IStorage } from './storage';
import { MemStorage } from './storage';
import { log } from './vite';

// Exported variable to check the storage type
export let currentStorageType = "Unknown";

// Define a variable to hold the MongoDB storage once initialized
let mongoStorage: IStorage | null = null;

/**
 * Factory function to create the appropriate storage implementation
 * based on environment variables
 * @returns A Promise that resolves to an IStorage implementation
 */
export async function createStorage(): Promise<IStorage> {
  // If DATABASE_URL is present but we want MongoDB, remove it to avoid confusion
  if (process.env.USE_MONGODB === 'true' && process.env.DATABASE_URL) {
    log('Removed DATABASE_URL to avoid PostgreSQL activation', 'server');
    delete process.env.DATABASE_URL;
  }
  
  // Check if memory DB is explicitly required
  const useMemoryDb = process.env.USE_MEMORY_DB === 'true';
  
  if (useMemoryDb) {
    log('Using in-memory storage implementation (explicitly configured)', 'storage');
    currentStorageType = "In-Memory Storage";
    return new MemStorage();
  }
  
  // Check for MongoDB configuration
  const useMongoDb = process.env.USE_MONGODB === 'true';
  const useMongoMemoryServer = process.env.USE_MONGODB_MEMORY_SERVER === 'true';
  
  // Log environment configuration for debugging
  log(`Environment settings - USE_MONGODB: ${useMongoDb}, USE_MONGODB_MEMORY_SERVER: ${useMongoMemoryServer}, USE_MEMORY_DB: ${useMemoryDb}`, 'storage');
  
  if (useMongoDb) {
    log(`Attempting to use MongoDB storage implementation${useMongoMemoryServer ? ' with Memory Server' : ' with real MongoDB'}`, 'storage');
    
    // If we already have a MongoDB storage instance, reuse it
    if (mongoStorage) {
      log('Reusing existing MongoDB storage instance', 'storage');
      return mongoStorage;
    }
    
    try {
      // Dynamically import to avoid requiring MongoDB when not needed
      log('Attempting to import MongoStorage module...', 'storage');
      
      // Using dynamic import with async/await for ESM compatibility
      const mongoModule = await import('./db/mongoStorage');
      
      log('Successfully imported MongoStorage module, initializing...', 'storage');
      
      // Create a new MongoStorage instance but don't connect immediately
      // Connection will be established on-demand when methods are called
      const storage = new mongoModule.MongoStorage();
      mongoStorage = storage; // Cache the storage instance
      
      currentStorageType = useMongoMemoryServer ? "MongoDB Memory Server" : "MongoDB";
      log('Successfully initialized MongoDB storage', 'storage');
      return storage;
    } catch (error) {
      log(`Error initializing MongoDB storage: ${(error as Error).message}`, 'storage');
      
      // Log full error stack for debugging
      if ((error as Error).stack) {
        log(`Error stack: ${(error as Error).stack}`, 'storage');
      }
      
      log('Falling back to in-memory storage due to MongoDB initialization error', 'storage');
      currentStorageType = "In-Memory Storage (MongoDB fallback)";
      return new MemStorage();
    }
  }
  
  // Check for PostgreSQL configuration
  const usePostgres = process.env.USE_POSTGRES === 'true';
  
  if (usePostgres && process.env.DATABASE_URL) {
    log('Attempting to use PostgreSQL/Drizzle storage implementation', 'storage');
    
    try {
      // Dynamically import to avoid requiring Drizzle when not needed
      log('Attempting to import DrizzleStorage module...', 'storage');
      
      // Using dynamic import with async/await for ESM compatibility
      const drizzleModule = await import('./db/drizzleStorage');
      
      log('Successfully imported DrizzleStorage module, initializing...', 'storage');
      
      const storage = new drizzleModule.DrizzleStorage();
      
      currentStorageType = "PostgreSQL";
      log('Successfully initialized PostgreSQL/Drizzle storage', 'storage');
      return storage;
    } catch (error) {
      log(`Error initializing PostgreSQL storage: ${(error as Error).message}`, 'storage');
      
      // Log full error stack for debugging
      if ((error as Error).stack) {
        log(`Error stack: ${(error as Error).stack}`, 'storage');
      }
      
      log('Falling back to in-memory storage due to PostgreSQL initialization error', 'storage');
      currentStorageType = "In-Memory Storage (PostgreSQL fallback)";
      return new MemStorage();
    }
  }
  
  // Default to memory storage if no database is configured
  log('No database configuration found, using in-memory storage implementation', 'storage');
  currentStorageType = "In-Memory Storage (default)";
  return new MemStorage();
}