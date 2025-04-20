import mongoose from 'mongoose';
import { log } from '../vite';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Create a cached connection variable 
interface MongoConnection {
  conn: typeof mongoose | null;
  mongoMemoryServer?: MongoMemoryServer;
  isConnecting: boolean;
  connectionURI?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

// Define mongoose connection states
const MONGOOSE_CONNECTION_STATES = {
  disconnected: 0,
  connected: 1,
  connecting: 2,
  disconnecting: 3,
}

let cachedConnection: MongoConnection = { 
  conn: null,
  isConnecting: false,
  connectionURI: undefined,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5
};

// Add connection error handler
mongoose.connection.on('error', (error) => {
  log(`MongoDB connection error: ${error}`, 'mongodb');
  if (cachedConnection.reconnectAttempts < cachedConnection.maxReconnectAttempts) {
    cachedConnection.reconnectAttempts++;
    setTimeout(() => connectToMongoDB(), 1000 * cachedConnection.reconnectAttempts);
  }
});

mongoose.connection.on('connected', () => {
  cachedConnection.reconnectAttempts = 0;
  log('MongoDB connection established', 'mongodb');
});

/**
 * Connect to MongoDB
 * @returns Connection instance
 */
export async function connectToMongoDB() {
  try {
    // If we already have a connection, return it
    if (cachedConnection.conn?.connection?.readyState === MONGOOSE_CONNECTION_STATES.connected) {
      return cachedConnection.conn;
    }

    // If we're already connecting, wait for it
    if (cachedConnection.isConnecting) {
      log('Connection in progress, waiting...', 'mongodb');
      await new Promise(resolve => setTimeout(resolve, 100));
      return connectToMongoDB();
    }

    cachedConnection.isConnecting = true;

    // Determine the MongoDB URI
    let MONGODB_URI = process.env.MONGODB_URI;

    if (process.env.USE_MONGODB_MEMORY_SERVER === 'true') {
      if (!cachedConnection.mongoMemoryServer) {
        // Create a persistent MongoDB Memory Server that doesn't clear between restarts
        const mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'workit', // Set a consistent database name
            storageEngine: 'wiredTiger',
          },
          binary: {
            version: '7.0.14', // Use a specific version for consistency
          }
        });
        MONGODB_URI = mongoMemoryServer.getUri();
        cachedConnection.mongoMemoryServer = mongoMemoryServer;
        // Store the URI for future use
        cachedConnection.connectionURI = MONGODB_URI;
        log('Created new MongoDB Memory Server: ' + MONGODB_URI, 'mongodb');
      } else {
        // Reuse the existing Memory Server
        MONGODB_URI = cachedConnection.mongoMemoryServer.getUri();
        log('Reusing existing MongoDB Memory Server: ' + MONGODB_URI, 'mongodb');
      }
    } else if (!MONGODB_URI) {
      MONGODB_URI = 'mongodb://localhost:27017/workit';
      log(`No MONGODB_URI provided, using default: ${MONGODB_URI}`, 'mongodb');
    }

    if (!MONGODB_URI) {
      throw new Error('Failed to determine MongoDB URI');
    }

    // Connect to MongoDB
    log(`Attempting to connect to MongoDB at URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`, 'mongodb');

    cachedConnection.conn = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false
    });

    log('Successfully connected to MongoDB', 'mongodb');

    // Log connection details
    try {
      if (mongoose.connection.db) {
        const info = await mongoose.connection.db.admin().serverInfo();
        log(`MongoDB version: ${info.version}`, 'mongodb');
        
        const stats = await mongoose.connection.db.stats();
        log(`Database: ${mongoose.connection.name}, Collections: ${stats.collections}`, 'mongodb');
      }
    } catch (error) {
      log(`Error getting MongoDB details: ${(error as Error).message}`, 'mongodb');
    }

    cachedConnection.isConnecting = false;
    return cachedConnection.conn;

  } catch (error) {
    cachedConnection.isConnecting = false;
    log(`Error connecting to MongoDB: ${(error as Error).message}`, 'mongodb');
    throw error;
  }
}

/**
 * Get the MongoDB connection
 * @returns Connection instance or null if not connected
 */
export function getMongoDBConnection() {
  return cachedConnection.conn;
}