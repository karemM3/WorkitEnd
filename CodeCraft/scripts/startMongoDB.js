const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Get MongoDB data path from environment or use default
const MONGODB_DATA_PATH = process.env.MONGODB_DATA_PATH || './mongodb-data';
const MONGODB_PORT = process.env.MONGODB_PORT || 27017;
const MONGODB_DB_NAME = 'workit';

// Make sure the data directory exists
if (!fs.existsSync(MONGODB_DATA_PATH)) {
  console.log(`Creating MongoDB data directory: ${MONGODB_DATA_PATH}`);
  fs.mkdirSync(MONGODB_DATA_PATH, { recursive: true });
}

// Function to start MongoDB
function startMongoDB() {
  const absoluteDataPath = path.resolve(process.cwd(), MONGODB_DATA_PATH);
  console.log(`Starting MongoDB with data path: ${absoluteDataPath}`);

  // Start MongoDB with the specified data path
  const mongod = spawn('mongod', [
    '--dbpath', absoluteDataPath,
    '--port', MONGODB_PORT,
    '--logpath', path.join(process.cwd(), 'mongodb.log'),
    '--logappend',
  ]);

  // Log stdout and stderr
  mongod.stdout.on('data', (data) => {
    console.log(`MongoDB: ${data}`);
  });

  mongod.stderr.on('data', (data) => {
    console.error(`MongoDB error: ${data}`);
  });

  // Handle process exit
  mongod.on('close', (code) => {
    if (code !== 0) {
      console.error(`MongoDB process exited with code ${code}`);
      
      // Attempt to restart MongoDB if it crashes
      console.log('Attempting to restart MongoDB...');
      setTimeout(startMongoDB, 5000);
    }
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down MongoDB...');
    mongod.kill('SIGINT');
    process.exit(0);
  });

  return mongod;
}

// Start MongoDB
const mongod = startMongoDB();

// Print connection information
console.log(`MongoDB server started on port ${MONGODB_PORT}`);
console.log(`Connection string: mongodb://localhost:${MONGODB_PORT}/${MONGODB_DB_NAME}`);
console.log('Press Ctrl+C to stop the server');