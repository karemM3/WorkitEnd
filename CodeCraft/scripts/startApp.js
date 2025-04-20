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

// Start MongoDB server
console.log('Starting MongoDB server...');
const mongod = spawn('node', ['scripts/startMongoDB.js'], {
  stdio: 'inherit'
});

// Give MongoDB time to start up
console.log('Waiting for MongoDB to start...');
setTimeout(() => {
  console.log('Starting application server...');
  
  // Start the application
  const app = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure MongoDB connection variables are set
      MONGODB_URI: `mongodb://localhost:${MONGODB_PORT}/${MONGODB_DB_NAME}`,
      USE_MONGODB: 'true',
      USE_MONGODB_MEMORY_SERVER: 'false',
      USE_MEMORY_DB: 'false',
      USE_POSTGRES: 'false'
    }
  });

  // Handle app process termination
  app.on('close', (code) => {
    console.log(`Application process exited with code ${code}`);
    mongod.kill(); // Kill MongoDB when the app is terminated
    process.exit(code);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down application and MongoDB...');
    app.kill();
    mongod.kill();
    process.exit(0);
  });
}, 5000); // Wait 5 seconds for MongoDB to start

console.log('Press Ctrl+C to stop all servers');