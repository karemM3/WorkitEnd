import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fileUpload from "express-fileupload";
import path from "path";
import { createStorage } from "./storageFactory";
import * as dotenv from "dotenv";
import { startMongoDBServer } from "./db/mongodb-startup";

// Set to true to disable automatic database seeding on startup
// This is useful when manually adding test users
const DISABLE_AUTO_SEEDING = true;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup file upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Load environment variables from .env file
  try {
    const dotenvResult = dotenv.config();
    
    if (dotenvResult.error) {
      log(`Error loading .env file: ${dotenvResult.error.message}`, "server");
    } else {
      log("Successfully loaded environment variables from .env file", "server");
    }
    
    // Log environment variables after loading
    log("Environment variables after loading:", "server");
    log(`USE_MONGODB = ${process.env.USE_MONGODB}`, "server");
    log(`USE_MONGODB_MEMORY_SERVER = ${process.env.USE_MONGODB_MEMORY_SERVER}`, "server");
    log(`USE_MEMORY_DB = ${process.env.USE_MEMORY_DB}`, "server");
    log(`USE_POSTGRES = ${process.env.USE_POSTGRES}`, "server");
    log(`MONGODB_URI = ${process.env.MONGODB_URI ? '[REDACTED]' : 'undefined'}`, "server");
  } catch (error) {
    log(`Unexpected error loading .env file: ${(error as Error).message}`, "server");
  }

  // If MongoDB is explicitly enabled, we should ignore the DATABASE_URL
  if (process.env.USE_MONGODB === 'true' && process.env.DATABASE_URL) {
    delete process.env.DATABASE_URL;
    log("Removed DATABASE_URL to avoid PostgreSQL activation", "server");
  }
  
  // Start MongoDB if necessary
  if (process.env.USE_MONGODB === 'true' && process.env.USE_MONGODB_MEMORY_SERVER !== 'true') {
    log('Starting MongoDB server...', 'server');
    try {
      await startMongoDBServer();
    } catch (error) {
      log(`Failed to start MongoDB server: ${(error as Error).message}`, 'server');
      log('Falling back to in-memory storage', 'server');
      process.env.USE_MEMORY_DB = 'true';
      process.env.USE_MONGODB = 'false';
    }
  }

  // Initialize storage based on environment
  const storage = await createStorage();
  let storageType = 'in-memory storage';
  if (process.env.USE_MEMORY_DB === 'true') {
    storageType = 'in-memory storage (explicitly configured)';
  } else if (process.env.USE_MONGODB === 'true') {
    if (process.env.USE_MONGODB_MEMORY_SERVER === 'true') {
      storageType = 'MongoDB Memory Server (for development)';
      
      // Seed the MongoDB Memory Server with initial data
      if (!DISABLE_AUTO_SEEDING) {
        try {
          const { seedDatabase } = await import('./utils/seedDatabase');
          await seedDatabase();
        } catch (error) {
          log(`Error during database seeding: ${(error as Error).message}`, "server");
        }
      } else {
        log("Automatic database seeding is disabled", "server");
      }
    } else {
      storageType = 'MongoDB database (persistent)';
      
      // Seed the persistent MongoDB with initial data if needed
      if (!DISABLE_AUTO_SEEDING) {
        try {
          const { seedDatabase } = await import('./utils/seedDatabase');
          await seedDatabase();
        } catch (error) {
          log(`Error during database seeding: ${(error as Error).message}`, "server");
        }
      } else {
        log("Automatic database seeding is disabled", "server");
      }
    }
  }
  log(`Using ${storageType} for data persistence`, "server");
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
