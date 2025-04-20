import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { log } from '../vite';
import net from 'net';

// Load environment variables
dotenv.config();

// Get MongoDB configuration from environment
const MONGODB_DATA_PATH = process.env.MONGODB_DATA_PATH || './mongodb-data';
const MONGODB_PORT = parseInt(process.env.MONGODB_PORT || '27017', 10);
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'workit';

// Track MongoDB process
let mongodProcess: ReturnType<typeof spawn> | null = null;

/**
 * Check if MongoDB is already running
 */
function checkMongoDBRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const client = net.createConnection({ port: MONGODB_PORT, host: '127.0.0.1' });
    
    client.on('connect', () => {
      client.end();
      resolve(true);
    });
    
    client.on('error', () => {
      resolve(false);
    });
    
    // Set a timeout in case connection hangs
    setTimeout(() => {
      client.end();
      resolve(false);
    }, 1000);
  });
}

/**
 * Start MongoDB server
 */
export async function startMongoDBServer(): Promise<void> {
  // Check if MongoDB is already running
  try {
    const isRunning = await checkMongoDBRunning();
    if (isRunning) {
      log('MongoDB server is already running', 'mongodb');
      return;
    }
    
    log('MongoDB server check failed: connect ECONNREFUSED 127.0.0.1:27017', 'mongodb');
  } catch (error) {
    log(`Error checking MongoDB status: ${(error as Error).message}`, 'mongodb');
  }
  
  // If MongoDB Memory Server is enabled, don't start a real MongoDB instance
  if (process.env.USE_MONGODB_MEMORY_SERVER === 'true') {
    log('Using MongoDB Memory Server instead of local MongoDB', 'mongodb');
    return;
  }
  
  log('Starting MongoDB server...', 'mongodb');
  
  // Ensure data directory exists
  const absoluteDataPath = path.resolve(process.cwd(), MONGODB_DATA_PATH);
  if (!fs.existsSync(absoluteDataPath)) {
    log(`Creating MongoDB data directory: ${absoluteDataPath}`, 'mongodb');
    fs.mkdirSync(absoluteDataPath, { recursive: true });
  }
  
  try {
    // Start MongoDB server process
    mongodProcess = spawn('mongod', [
      '--dbpath', absoluteDataPath,
      '--port', MONGODB_PORT.toString(),
      '--logpath', path.join(process.cwd(), 'mongodb.log'),
      '--logappend',
    ]);
    
    // Handle process output
    mongodProcess.stdout?.on('data', (data) => {
      log(`MongoDB stdout: ${data}`, 'mongodb');
    });
    
    mongodProcess.stderr?.on('data', (data) => {
      log(`MongoDB stderr: ${data}`, 'mongodb');
    });
    
    // Handle process exit
    mongodProcess.on('close', (code) => {
      if (code !== 0) {
        log(`MongoDB process exited with code ${code}`, 'mongodb');
      }
      mongodProcess = null;
    });
    
    // Set up process exit handler to clean up MongoDB
    process.on('exit', () => {
      if (mongodProcess) {
        log('Shutting down MongoDB server...', 'mongodb');
        mongodProcess.kill('SIGINT');
      }
    });
    
    // Wait for MongoDB to start
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      log(`Checking if MongoDB is up (attempt ${attempts + 1}/${maxAttempts})...`, 'mongodb');
      const isRunning = await checkMongoDBRunning();
      
      if (isRunning) {
        log('MongoDB server started successfully', 'mongodb');
        log(`MongoDB connection string: mongodb://localhost:${MONGODB_PORT}/${MONGODB_DB_NAME}`, 'mongodb');
        return;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    log('Failed to start MongoDB server after multiple attempts', 'mongodb');
  } catch (error) {
    log(`Error starting MongoDB: ${(error as Error).message}`, 'mongodb');
  }
}