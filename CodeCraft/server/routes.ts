import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { type IStorage } from "./storage";
import { createStorage, currentStorageType } from "./storageFactory";
import { 
  insertUserSchema, 
  loginSchema, 
  insertServiceSchema, 
  insertJobSchema,
  insertApplicationSchema,
  insertOrderSchema,
  insertReviewSchema 
} from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import fileUpload from "express-fileupload";
import { setupAdminRoutes } from "./routes/admin";
import adminDirectRoutes from "./routes/admin-direct";

// Define custom Request type that includes files from express-fileupload
// Remove the declaration because it conflicts with built-in Express type
// We'll use explicit type assertions when working with files

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create the subdirectories for different upload types
const uploadSubdirs = ['profiles', 'services', 'jobs', 'resumes'];
for (const subdir of uploadSubdirs) {
  const subdirPath = path.join(uploadDir, subdir);
  if (!fs.existsSync(subdirPath)) {
    fs.mkdirSync(subdirPath, { recursive: true });
  }
}

// Helper function to check authentication
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get storage from factory in index.ts
  // Since createStorage is now async, we need to await it
  const storage = await createStorage();
  // Setup session
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  app.use(session({
    secret: process.env.SESSION_SECRET || "workit-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: THIRTY_DAYS,
      httpOnly: true,
      sameSite: 'lax'
    },
    name: 'workit.sid' // Set a specific name for the session cookie
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log('Authenticating user:', username);
      
      // Force username to lowercase for case-insensitive matching
      const normalizedUsername = username.toLowerCase().trim();
      console.log('Normalized username for auth:', normalizedUsername);
      
      const user = await storage.getUserByUsername(normalizedUsername);
      console.log('User found in database:', user ? 'Yes' : 'No', 
                 user ? `ID: ${user.id}, Type: ${typeof user.id}` : '');
      
      if (!user) {
        console.log('User not found:', normalizedUsername);
        return done(null, false, { message: "User not found" });
      }

      if (!user.password) {
        console.log('User has no password:', normalizedUsername);
        return done(null, false, { message: "User has no password" });
      }
      
      console.log('Password from database:', typeof user.password === 'string' ? 
                 (user.password.substr(0, 10) + '...') : 'Invalid password format');
      console.log('Password length:', typeof user.password === 'string' ? user.password.length : 'N/A');
      console.log('Entered password:', password ? `${password.length} chars` : 'Missing');

      let isValidPassword = false;
      
      // Check if password is hashed with bcrypt
      if (typeof user.password === 'string' && 
          (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
        console.log('Using bcrypt to compare passwords');
        try {
          isValidPassword = await bcrypt.compare(password, user.password);
          console.log('Bcrypt password check result:', isValidPassword);
        } catch (error) {
          console.error('Error comparing passwords with bcrypt:', error);
          return done(null, false, { message: "Password verification error" });
        }
      } 
      // Direct comparison for non-hashed passwords
      else {
        console.log('Using direct comparison for plain passwords');
        isValidPassword = user.password === password;
        console.log('Plain password check result:', isValidPassword);
      }

      if (!isValidPassword) {
        console.log('Password validation failed');
        return done(null, false, { message: "Invalid password" });
      }

      console.log('Authentication successful for user:', normalizedUsername);
      return done(null, user);
    } catch (error) {
      console.error('Authentication error:', error);
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    // Use MongoDB ObjectId (_id) if available, otherwise use numeric id
    const userId = (user as any)._id || user.id;
    console.log(`Serializing user: ${user.username}, ID: ${userId}`);
    done(null, userId);
  });

  passport.deserializeUser(async (id: any, done) => {
    try {
      console.log(`Deserializing user with ID: ${id}, type: ${typeof id}`);
      
      // Handle potential string conversion of numeric IDs
      let userId = id;
      if (typeof id === 'string' && !id.match(/^[0-9a-fA-F]{24}$/)) {
        // If it's not a MongoDB ObjectId but a string, try to convert to number
        userId = parseInt(id, 10);
        console.log(`Converted string ID to number: ${userId}`);
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`User not found during deserialization: ${userId}`);
        return done(new Error('User not found'), null);
      }
      
      console.log(`Successfully deserialized user: ${user.username}`);
      done(null, user);
    } catch (error) {
      console.error('Error during deserialization:', error);
      done(error);
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Verify passwords match
      if (userData.password !== userData.confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Check if user exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password with bcrypt
      // Hash password properly and ensure it's saved
      const saltRounds = 10;
      console.log('Hashing password for new user registration');
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      console.log('Password hashed successfully, hash length:', hashedPassword.length);
      
      // Create user with the hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      console.log(`New user created: ${userData.username}, password hash available: ${user.password ? 'Yes' : 'No'}`);
      if (!user.password) {
        console.error('WARNING: Password not saved properly in user object');
      }

      // Remove sensitive data
      const { password, ...safeUser } = user;

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json(safeUser);
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      console.log('Login request received:', req.body);
      
      const { username, password } = loginSchema.parse(req.body);
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      console.log('Attempting login for username:', username);

      passport.authenticate('local', async (err: any, user: any, info: any) => {
        if (err) {
          console.error('Authentication error:', err);
          return res.status(500).json({ message: "Internal server error" });
        }
        
        if (!user) {
          console.error('Login failed:', info?.message || 'Unknown reason');
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
          
          console.log('User logged in successfully:', safeUser.username);
          console.log('User object being returned:', JSON.stringify(safeUser));
          
          return res.json({
            ...safeUser,
            message: "Login successful"
          });
        });
      })(req, res, next);
    } catch (error: any) {
      console.error('Login validation error:', error);
      res.status(400).json({ 
        message: "Login validation failed",
        details: error.message 
      });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json(null);
    }
    // Remove sensitive data including raw password
    const { password, _rawPassword, ...safeUser } = req.user as any;
    res.json(safeUser);
  });

  // User routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      // Don't convert id to integer if it's a MongoDB ObjectID
      let id = req.params.id;

      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        id = parseInt(id) as any;
      }

      console.log('Fetching user with ID:', id, 'type:', typeof id);
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive data
      const { password, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const paramId = req.params.id;
      const currentUser = req.user as any;

      // Handle both MongoDB ObjectId and numeric IDs
      const isCurrentUser = currentUser.id.toString() === paramId.toString() || 
                          (currentUser as any)._id?.toString() === paramId.toString();

      if (!isCurrentUser) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      // Handle file upload using express-fileupload
      const userData: any = { ...req.body };

      // Don't convert paramId to integer if it's a MongoDB ObjectId
      const userId = paramId.match(/^[0-9a-fA-F]{24}$/) ? paramId : parseInt(paramId);
      
      if (req.files && typeof req.files === 'object' && 'profilePicture' in req.files) {
        // Import and use the fileUpload utility
        const { saveFile } = await import('./utils/fileUpload');
        // Use any to bypass type checking since we know the object has the correct structure
        const uploadedFile = (req.files as any).profilePicture;
        
        // Get the user's username to use as a file prefix
        const userToUpdate = await storage.getUser(userId);
        const usernamePrefix = userToUpdate?.username || '';
        
        // Save the file with the username prefix to ensure uniqueness
        const uploadResult = await saveFile(uploadedFile, 'profiles', usernamePrefix);
        userData.profilePicture = uploadResult.fileUrl;
        console.log('Profile picture uploaded for user:', usernamePrefix, 'URL:', uploadResult.fileUrl);
      }

      console.log('Updating user with data:', userData);

      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive data
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(400).json({ message: error.message });
    }
  });
  
  // Change password endpoint
  app.put('/api/users/:id/change-password', isAuthenticated, async (req, res) => {
    try {
      const paramId = req.params.id;
      const currentUser = req.user as any;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Handle both MongoDB ObjectId and numeric IDs
      const isCurrentUser = currentUser.id.toString() === paramId.toString() || 
                          (currentUser as any)._id?.toString() === paramId.toString();

      if (!isCurrentUser) {
        return res.status(403).json({ message: "You can only change your own password" });
      }

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All password fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New passwords do not match" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Get the full user with password
      const userId = paramId.match(/^[0-9a-fA-F]{24}$/) ? paramId : parseInt(paramId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      let isValidPassword = false;
      
      console.log('Password change request for user:', user.username);
      console.log('User password from database:', typeof user.password === 'string' ? 
                (user.password.substr(0, 10) + '...') : 'Invalid password format');
      console.log('User password type:', typeof user.password);
      console.log('Password length:', typeof user.password === 'string' ? user.password.length : 'N/A');
      console.log('Entered current password:', currentPassword ? `${currentPassword.length} chars` : 'Missing');
      
      // Check if we should use _rawPassword field if available (MongoDB special handling)
      const passwordToCheck = (user as any)._rawPassword || user.password;
      console.log('Using password for verification:', passwordToCheck ? 
                (typeof passwordToCheck === 'string' ? passwordToCheck.substr(0, 10) + '...' : 'Non-string') : 'None');
      
      // Check if password is hashed with bcrypt
      if (typeof passwordToCheck === 'string' && 
          (passwordToCheck.startsWith('$2b$') || passwordToCheck.startsWith('$2a$'))) {
        console.log('Using bcrypt to compare passwords for password change');
        try {
          isValidPassword = await bcrypt.compare(currentPassword, passwordToCheck);
          console.log('Bcrypt password check result for password change:', isValidPassword);
        } catch (error) {
          console.error('Error comparing passwords with bcrypt:', error);
          return res.status(500).json({ message: "Password verification error" });
        }
      } 
      // Direct comparison for non-hashed passwords (fallback, should not happen in production)
      else {
        console.log('Using direct comparison for password change');
        isValidPassword = passwordToCheck === currentPassword;
        console.log('Direct comparison result:', isValidPassword);
      }

      if (!isValidPassword) {
        console.log('Password validation failed for password change');
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      console.log('Current password validation successful, proceeding with update');

      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update the user's password
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error('Error changing password:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Service routes
  app.get('/api/services', async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.status) filters.status = req.query.status as string;

      const services = await storage.getServices(filters);

      // Get user data for each service
      const servicesWithUsers = await Promise.all(services.map(async (service) => {
        const user = await storage.getUser(service.userId);
        if (!user) return service;

        const { password, ...safeUser } = user;
        return { ...service, user: safeUser };
      }));

      res.json(servicesWithUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/services/:id', async (req, res) => {
    try {
      // Don't convert id to integer if it's a MongoDB ObjectID
      let id = req.params.id;

      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        id = parseInt(id) as any;
      }

      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get user data
      const user = await storage.getUser(service.userId);
      if (user) {
        const { password, ...safeUser } = user;
        return res.json({ ...service, user: safeUser });
      }

      res.json(service);
    } catch (error: any) {
      console.error('Error fetching service:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/services', isAuthenticated, async (req, res) => {
    try {
      console.log('Service creation request received', { bodyKeys: Object.keys(req.body), hasFiles: !!req.files });

      // Need to handle the price as a number correctly
      if (req.body.price && typeof req.body.price === 'string') {
        req.body.price = parseFloat(req.body.price);
      }

      const serviceData = insertServiceSchema.parse(req.body);
      const userId = (req.user as any).id;

      // Handle file upload using express-fileupload
      if (req.files && typeof req.files === 'object' && 'image' in req.files) {
        // Import and use the fileUpload utility
        const { saveFile } = await import('./utils/fileUpload');
        // Use any to bypass type checking since we know the object has the correct structure
        const uploadedFile = (req.files as any).image;
        
        // Get the current user's username to use as a file prefix
        const currentUser = req.user as any;
        const username = currentUser.username || '';
        
        // Save with username prefix for consistent file management
        const uploadResult = await saveFile(uploadedFile, 'services', username);
        serviceData.image = uploadResult.fileUrl;
        console.log(`Service image uploaded for ${username}:`, uploadResult.fileUrl);
      }

      const service = await storage.createService(userId, serviceData);
      return res.status(201).json(service);
    } catch (error: any) {
      console.error('Error creating service:', error.message);
      if (error.errors) {
        console.error('Validation errors:', JSON.stringify(error.errors));
      }
      res.status(400).json({ 
        message: error.message,
        errors: error.errors || undefined
      });
    }
  });

  app.get('/api/users/:id/services', async (req, res) => {
    try {
      // Don't parse as integer for MongoDB compatibility
      const userId = req.params.id;
      const services = await storage.getUserServices(userId);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Job routes
  app.get('/api/jobs', async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.jobType) filters.jobType = req.query.jobType as string;
      if (req.query.location) filters.location = req.query.location as string;

      const jobs = await storage.getJobs(filters);

      // Get user data for each job
      const jobsWithUsers = await Promise.all(jobs.map(async (job) => {
        const user = await storage.getUser(job.userId);
        if (!user) return job;

        const { password, ...safeUser } = user;
        return { ...job, user: safeUser };
      }));

      res.json(jobsWithUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
    try {
      // Don't convert id to integer if it's a MongoDB ObjectID
      let id = req.params.id;

      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        id = parseInt(id) as any;
      }

      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Get user data
      const user = await storage.getUser(job.userId);
      if (user) {
        const { password, ...safeUser } = user;
        return res.json({ ...job, user: safeUser });
      }

      res.json(job);
    } catch (error: any) {
      console.error('Error fetching job:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/jobs', isAuthenticated, async (req, res) => {
    try {
      console.log('Job creation request received', { bodyKeys: Object.keys(req.body), hasFiles: !!req.files });

      // Need to handle the salary/budget as a number correctly
      if (req.body.budget && typeof req.body.budget === 'string') {
        req.body.budget = parseFloat(req.body.budget);
      }

      const jobData = insertJobSchema.parse(req.body);
      const userId = (req.user as any).id;

      // Handle file upload using express-fileupload
      if (req.files && typeof req.files === 'object' && 'image' in req.files) {
        // Import and use the fileUpload utility
        const { saveFile } = await import('./utils/fileUpload');
        // Use any to bypass type checking since we know the object has the correct structure
        const uploadedFile = (req.files as any).image;
        
        // Get the current user's username to use as a file prefix
        const currentUser = req.user as any;
        const username = currentUser.username || '';
        
        // Save with username prefix for consistent file management
        const uploadResult = await saveFile(uploadedFile, 'jobs', username);
        jobData.image = uploadResult.fileUrl;
        console.log(`Job image uploaded for ${username}:`, uploadResult.fileUrl);
      }

      const job = await storage.createJob(userId, jobData);
      res.status(201).json(job);
    } catch (error: any) {
      console.error('Error creating job:', error.message);
      if (error.errors) {
        console.error('Validation errors:', JSON.stringify(error.errors));
      }
      res.status(400).json({ 
        message: error.message,
        errors: error.errors || undefined
      });
    }
  });

  app.get('/api/users/:id/jobs', async (req, res) => {
    try {
      // Don't parse as integer for MongoDB compatibility
      const userId = req.params.id;
      const jobs = await storage.getUserJobs(userId);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Application routes
  app.get('/api/jobs/:id/applications', isAuthenticated, async (req, res) => {
    try {
      let jobId = req.params.id;
      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
        jobId = parseInt(jobId) as any;
      }
      console.log(`Fetching applications for job ID: ${jobId}, type: ${typeof jobId}`);
      const currentUser = req.user as any;

      // Get the job to check ownership
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Only the job owner can see applications - use string comparison for MongoDB ObjectIDs
      if (String(job.userId) !== String(currentUser.id)) {
        return res.status(403).json({ message: "You are not authorized to view these applications" });
      }

      const applications = await storage.getApplicationsForJob(jobId);

      // Get user data for each application
      const applicationsWithUsers = await Promise.all(applications.map(async (application) => {
        const user = await storage.getUser(application.userId);
        if (!user) return application;

        const { password, ...safeUser } = user;
        return { ...application, user: safeUser };
      }));

      res.json(applicationsWithUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/jobs/:id/applications', isAuthenticated, async (req, res) => {
    try {
      let jobId = req.params.id;

      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
        jobId = parseInt(jobId) as any;
      }

      const userId = (req.user as any).id;

      // Get the job
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Don't allow applying to own job
      if (String(job.userId) === String(userId)) {
        return res.status(400).json({ message: "You cannot apply to your own job" });
      }
      
      // Check if the user has already applied to this job
      try {
        const userApplications = await storage.getUserApplications(userId);
        const existingApplication = userApplications.find(app => 
          String(app.jobId) === String(jobId)
        );
        
        if (existingApplication) {
          return res.status(400).json({ 
            message: "You have already applied to this job",
            code: "DUPLICATE_APPLICATION"  
          });
        }
      } catch (err) {
        console.error('Error checking existing applications:', err);
        // Continue with application creation even if check fails
      }

      // Skip zod validation for job applications in MongoDB mode
      // This is necessary because MongoDB uses string IDs but zod schema expects numbers
      const applicationData = {
        ...req.body,
        jobId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Handle file upload using express-fileupload
      if (req.files && typeof req.files === 'object' && 'resumeFile' in req.files) {
        // Import and use the fileUpload utility
        const { saveFile } = await import('./utils/fileUpload');
        // Use any to bypass type checking since we know the object has the correct structure
        const uploadedFile = (req.files as any).resumeFile;
        
        // Get the current user's username to use as a file prefix
        const currentUser = req.user as any;
        const username = currentUser.username || '';
        
        // Save with username prefix for consistent file management
        const uploadResult = await saveFile(uploadedFile, 'resumes', username);
        applicationData.resumeFile = uploadResult.fileUrl;
        console.log(`Resume file uploaded for ${username}:`, uploadResult.fileUrl);
      }

      const application = await storage.createApplication(userId, applicationData);
      res.status(201).json(application);
    } catch (error: any) {
      console.error('Error creating application:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/applications/:id/status', isAuthenticated, async (req, res) => {
    try {
      let id = req.params.id;
      const { status } = req.body;
      const currentUser = req.user as any;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // When using MongoDB, we need to work with the string ID
      // For SQL DB, parse as integer
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        id = parseInt(id) as any;
      }
      
      // Get the application first
      const application = await storage.getApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get the job to verify ownership
      const job = await storage.getJob(application.jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if current user is the job owner (employer)
      if (String(job.userId) !== String(currentUser.id)) {
        return res.status(403).json({ message: "You don't have permission to update this application" });
      }

      const updatedApplication = await storage.updateApplicationStatus(id, status);
      res.json(updatedApplication);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/users/:id/applications', isAuthenticated, async (req, res) => {
    try {
      // Don't parse as integer for MongoDB compatibility
      const userId = req.params.id;
      const currentUser = req.user as any;

      // Can only view own applications - use string comparison for MongoDB ObjectIDs
      if (userId !== currentUser.id && userId !== currentUser.id.toString()) {
        return res.status(403).json({ message: "You can only view your own applications" });
      }

      const applications = await storage.getUserApplications(userId);

      // Get job data for each application
      const applicationsWithJobs = await Promise.all(applications.map(async (application) => {
        const job = await storage.getJob(application.jobId);
        return { ...application, job };
      }));

      res.json(applicationsWithJobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Order routes
  app.post('/api/services/:id/orders', isAuthenticated, async (req, res) => {
    try {
      // Don't convert id to integer if it's a MongoDB ObjectID
      let serviceId = req.params.id;

      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) {
        serviceId = parseInt(serviceId) as any;
      }
      const buyerId = (req.user as any).id;

      // Get the service
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Don't allow buying own service
      if (service.userId === buyerId) {
        return res.status(400).json({ message: "You cannot order your own service" });
      }

      const orderData = insertOrderSchema.parse({
        ...req.body,
        serviceId,
        buyerId,
        totalPrice: service.price
      });

      const order = await storage.createOrder({
        ...orderData,
        sellerId: service.userId
      });

      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Direct API endpoint for creating orders (used by payment page)
  app.post('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const { 
        serviceId, 
        paymentMethod, 
        totalPrice, 
        status,
        paymentDetails 
      } = req.body;
      
      const buyerId = (req.user as any).id;

      // Don't convert id to integer if it's a MongoDB ObjectID
      let serviceIdFormatted = serviceId;

      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!serviceIdFormatted.match(/^[0-9a-fA-F]{24}$/)) {
        serviceIdFormatted = parseInt(serviceIdFormatted) as any;
      }

      // Get the service
      const service = await storage.getService(serviceIdFormatted);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Don't allow buying own service
      if (service.userId === buyerId) {
        return res.status(400).json({ message: "You cannot order your own service" });
      }

      // For MongoDB, we need to skip zod validation since it expects number IDs
      // But MongoDB uses ObjectID strings
      // Create the order object without status/createdAt first (they're handled by storage)
      const orderData = {
        serviceId: serviceIdFormatted,
        buyerId,
        sellerId: service.userId,
        paymentMethod: paymentMethod || 'card',
        totalPrice: Number(totalPrice) || service.price,
        status: status || 'paid', // Default to 'paid' for this demo
        paymentDetails // Store payment details if provided
      };
      
      console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
      
      // Create the order
      const order = await storage.createOrder(orderData);
      
      // Log success for debugging
      console.log('Order created successfully:', order.id);

      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/users/:id/orders', isAuthenticated, async (req, res) => {
    try {
      // Don't parse as integer for MongoDB compatibility
      const userId = req.params.id;
      const currentUser = req.user as any;

      // Can only view own orders - use string comparison for MongoDB ObjectIDs
      if (userId !== currentUser.id && userId !== currentUser.id.toString()) {
        return res.status(403).json({ message: "You can only view your own orders" });
      }

      const orders = await storage.getUserOrders(userId);

      // Get service data for each order
      const ordersWithServices = await Promise.all(orders.map(async (order) => {
        const service = await storage.getService(order.serviceId);
        return { ...order, service };
      }));

      res.json(ordersWithServices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get user stats (counts)
  app.get('/api/users/:id/stats', async (req, res) => {
    try {
      // Don't parse as integer for MongoDB compatibility
      const userId = req.params.id;
      
      // Get user details to check role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all orders for this user (as buyer or seller)
      const allOrders = await storage.getUserOrders(userId);
      
      // Calculate stats based on user role
      // Use string comparison for cross-database compatibility
      const stats: any = {
        ordersMade: allOrders.filter(o => String(o.buyerId) === String(userId)).length,
        ordersReceived: allOrders.filter(o => String(o.sellerId) === String(userId)).length
      };
      
      // Get reviews (positive and total)
      const services = await storage.getUserServices(userId);
      let positiveReviews = 0;
      let totalReviews = 0;
      
      // Count reviews for all services owned by this user
      for (const service of services || []) {
        const reviews = await storage.getReviewsForService(service.id);
        totalReviews += reviews.length;
        // Count 4-5 star reviews as positive
        positiveReviews += reviews.filter(r => r.rating >= 4).length;
      }
      
      stats.positiveReviews = positiveReviews;
      stats.totalReviews = totalReviews;
      
      // Add role-specific stats
      if (user.role === 'freelancer') {
        // Get active services
        stats.activeServices = services.length;
        
        // Get job applications
        const applications = await storage.getUserApplications(userId);
        stats.jobApplications = applications.length;
      } else if (user.role === 'employer') {
        // Get active jobs
        const jobs = await storage.getUserJobs(userId);
        stats.activeJobs = jobs.length;
        
        // Get applications received
        let applicationsReceived = 0;
        for (const job of jobs || []) {
          const jobApplications = await storage.getJobApplications(job.id);
          applicationsReceived += jobApplications.length;
        }
        stats.applicationsReceived = applicationsReceived;
      }
      
      // Log stats for debugging
      console.log(`Stats for user ${userId}:`, stats);
      
      res.json(stats);
    } catch (error: any) {
      console.error(`Error getting stats for user ${req.params.id}:`, error);
      res.status(500).json({ message: error.message });
    }
  });

  // Review routes
  app.get('/api/services/:id/reviews', async (req, res) => {
    try {
      // Don't convert id to integer if it's a MongoDB ObjectID
      let id = req.params.id;

      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        id = parseInt(id) as any;
      }

      // Convert to appropriate id type for MongoDB compatibility
      const reviews = await storage.getReviewsForService(id as any);

      // Get user data for each review
      const reviewsWithUsers = await Promise.all(reviews.map(async (review) => {
        const user = await storage.getUser(review.userId);
        if (!user) return review;

        const { password, ...safeUser } = user;
        return { ...review, user: safeUser };
      }));

      res.json(reviewsWithUsers);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/services/:id/reviews', isAuthenticated, async (req, res) => {
    try {
      // Don't convert id to integer if it's a MongoDB ObjectID
      let serviceId = req.params.id;

      // Only convert to integer if it's not a MongoDB ObjectID format
      if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) {
        serviceId = parseInt(serviceId) as any;
      }

      const userId = (req.user as any).id;

      // Get the service
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Don't allow reviewing own service
      if (service.userId === userId) {
        return res.status(400).json({ message: "You cannot review your own service" });
      }

      // For MongoDB, we need to modify the data before validating with zod
      // because MongoDB might use ObjectIDs instead of numbers
      const reviewData = {
        ...req.body,
        // Don't include these fields from req.body to prevent injection
        serviceId: undefined,
        userId: undefined
      };

      // Create a new review object manually without zod validation
      // This is necessary because we're mixing MongoDB (which uses ObjectIDs) 
      // with Zod (which expects numbers for IDs based on the Postgres schema)
      const review = await storage.createReview({
        serviceId: serviceId as any, // Use type assertion to handle both number and string IDs
        userId: userId as any, // Use type assertion to handle both number and string IDs
        rating: parseInt(req.body.rating),
        comment: req.body.comment
      });

      res.status(201).json(review);
    } catch (error: any) {
      console.error('Error creating review:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // System information endpoint
  app.get('/api/system/info', (req, res) => {
    const systemInfo = {
      databaseType: currentStorageType,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
    res.json(systemInfo);
  });

  // Setup admin routes
  setupAdminRoutes(app, storage);
  
  // Setup direct admin routes (development only)
  app.use('/api/admin-direct', adminDirectRoutes);
  
  const httpServer = createServer(app);

  return httpServer;
}