import mongoose from 'mongoose';
import { IStorage } from '../storage';
import { 
  User, InsertUser, 
  Service, InsertService, 
  Job, InsertJob, 
  Application, InsertApplication, 
  Order, InsertOrder, 
  Review, InsertReview 
} from '@shared/schema';
import UserModel from './models/user.model';
import ServiceModel from './models/service.model';
import JobModel from './models/job.model';
import ApplicationModel from './models/application.model';
import OrderModel from './models/order.model';
import ReviewModel from './models/review.model';
import { connectToMongoDB } from './mongodb';
import { log } from '../vite';

// Admin interface completion
interface AdminStatistics {
  userCount: number;
  serviceCount: number;
  jobCount: number;
  applicationCount: number;
  orderCount: number;
  usersByRole: {
    freelancers: number;
    employers: number;
    admins: number;
  };
}

/**
 * Helper to convert MongoDB document to a plain object 
 * @param doc The MongoDB document to convert
 * @param includePassword Whether to include the password field (for auth only)
 */
function convertDocument<T>(doc: mongoose.Document | null, includePassword = false): T | undefined {
  if (!doc) return undefined;
  
  // Convert to object
  const obj = doc.toObject();
  
  // For authentication purposes, we need to copy the password back
  if (includePassword && 'password' in doc) {
    // Get password directly from the document (bypassing toObject transformation)
    const rawData = (doc as any)._doc;
    if (rawData && rawData.password) {
      obj.password = rawData.password;
    }
  }
  
  return obj as T;
}

/**
 * Helper to convert array of MongoDB documents to plain objects
 * @param docs Array of MongoDB documents
 * @param includePassword Whether to include password fields (for auth only)
 */
function convertDocuments<T>(docs: mongoose.Document[], includePassword = false): T[] {
  return docs.map(doc => convertDocument<T>(doc, includePassword)!);
}

/**
 * MongoDB implementation of the IStorage interface
 */
export class MongoStorage implements IStorage {
  constructor() {
    // Initialize MongoDB connection - connection is handled on-demand
    // Don't force a connection here to avoid multiple connection attempts
    // Each method will ensure the connection before performing operations
  }

  // Helper method to ensure connection before running DB operations
  private async ensureConnection() {
    try {
      return await connectToMongoDB();
    } catch (err) {
      log(`MongoDB connection error: ${(err as Error).message}`, 'storage');
      throw new Error(`MongoDB connection failed: ${(err as Error).message}`);
    }
  }

  async getUser(id: any): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      let user = null;

      // Handle numeric IDs (from the in-memory storage or imported data)
      if (typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id)))) {
        const numericId = typeof id === 'number' ? id : parseInt(id);
        user = await UserModel.findOne({ id: numericId });

        if (user) {
          return convertDocument<User>(user);
        }
      }

      // If not found by numeric id or id is a string that looks like MongoDB ObjectId, try direct _id lookup
      try {
        // For MongoDB ObjectId strings or when passing the _id directly
        user = await UserModel.findById(id);
        if (user) {
          return convertDocument<User>(user);
        }
      } catch (err) {
        // Ignore this error, it's just a fallback attempt
      }

      // If we got this far, we couldn't find the user
      log(`User not found with id ${id} (type: ${typeof id})`, 'storage');
      return undefined;
    } catch (error) {
      log(`Error getting user: ${(error as Error).message}`, 'storage');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      
      // Sanitize and normalize username
      const normalizedUsername = username.trim().toLowerCase();
      
      log(`Looking for user with normalized username: ${normalizedUsername}`, 'storage');
      
      const user = await UserModel.findOne({ 
        $or: [
          { username: normalizedUsername },
          { username: username.trim() } // Also try exact match
        ]
      });

      if (!user) {
        log(`User not found with username: ${normalizedUsername}`, 'storage');
        return undefined;
      }
      
      // Get raw document data including password (bypassing mongoose transforms)
      const rawUserData = (user as any)._doc || {};
      
      // Create user object with password preserved from raw data
      const userObj = {
        ...user.toObject(),
        // Try to get password from various sources to ensure we have it for authentication
        password: rawUserData.password || rawUserData._rawPassword || user.get('password')
      };
      
      log(`Found user: ${userObj.username} (ID: ${userObj._id || userObj.id})`, 'storage');

      // Ensure consistent ID handling
      const userId = userObj._id ? userObj._id.toString() : 
                    userObj.id ? userObj.id.toString() : 
                    undefined;
                    
      if (!userId) {
        log('User found but has no valid ID', 'storage');
        return undefined;
      }

      // Create safe user object with proper type conversion and validation
      // Importantly, preserve the password for authentication
      const safeUser: User = {
        id: userId,
        username: userObj.username,
        email: userObj.email,
        fullName: userObj.fullName || '',
        role: userObj.role || 'freelancer',
        password: userObj.password, // Important: include password for auth
        status: userObj.status || 'active', // Default to active if not set
        blockedReason: userObj.blockedReason || null,
        profilePicture: userObj.profilePicture || '',
        bio: userObj.bio || '',
        skills: Array.isArray(userObj.skills) ? userObj.skills : [],
        location: userObj.location || '',
        createdAt: userObj.createdAt || new Date()
      };

      // Log whether password was successfully preserved
      if (safeUser.password) {
        log(`Password preserved for user ${safeUser.username} (length: ${safeUser.password.length})`, 'storage');
      } else {
        log(`WARNING: No password preserved for user ${safeUser.username}`, 'storage');
      }

      return safeUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`Error getting user by username: ${errorMessage}`, 'storage');
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      const user = await UserModel.findOne({ email });
      return convertDocument<User>(user);
    } catch (error) {
      log(`Error getting user by email: ${(error as Error).message}`, 'storage');
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      await this.ensureConnection();
      
      // Normalize the username for consistent authentication
      const normalizedUser = {
        ...user,
        username: user.username.toLowerCase().trim(),
        _rawPassword: user.password // Store password in both fields
      };
      
      // Log the normalization
      log(`Creating user with normalized username: ${normalizedUser.username}`, 'storage');
      
      // Create and save the user with both password fields
      const newUser = new UserModel(normalizedUser);
      await newUser.save();
      
      // Create profile in the appropriate collection based on user role
      try {
        if (user.role === 'freelancer') {
          // Import FreelancerModel
          const { FreelancerModel } = await import('./models');
          
          // Create freelancer profile
          const freelancerProfile = new FreelancerModel({
            userId: newUser._id,
            // Any additional freelancer-specific fields 
            // that might have been passed in the registration
            education: user.education || '',
            hourlyRate: user.hourlyRate || 0,
            yearsExperience: user.yearsExperience || 0,
            categories: user.categories || []
          });
          
          await freelancerProfile.save();
          log(`Freelancer profile created successfully for user: ${newUser._id}`, 'storage');
        } 
        else if (user.role === 'employer') {
          // Import EmployerModel
          const { EmployerModel } = await import('./models');
          
          // Create employer profile
          const employerProfile = new EmployerModel({
            userId: newUser._id,
            // Any additional employer-specific fields
            // that might have been passed in the registration
            company: user.company || '',
            industry: user.industry || '',
            website: user.website || ''
          });
          
          await employerProfile.save();
          log(`Employer profile created successfully for user: ${newUser._id}`, 'storage');
        }
      } catch (profileError) {
        // Log profile creation error but don't fail the user creation
        log(`Error creating profile for user: ${(profileError as Error).message}`, 'storage');
      }
      
      // Get the raw document that includes the password
      const rawData = (newUser as any)._doc || {};
      log(`User created - Raw password available: ${!!rawData.password}`, 'storage');
      
      // Create user object with password preserved
      const userObj = {
        ...newUser.toObject(),
        password: rawData.password // Explicitly preserve the password field
      };
      
      // Ensure ID is properly available
      const userId = userObj._id ? userObj._id.toString() : userObj.id;
      
      // Create the complete user object with all required fields
      const completeUser: User = {
        id: userId,
        username: userObj.username,
        email: userObj.email,
        fullName: userObj.fullName || '',
        role: userObj.role || 'freelancer',
        password: userObj.password, // Important: include password
        status: userObj.status || 'active', // Default to active
        blockedReason: userObj.blockedReason || null,
        profilePicture: userObj.profilePicture || '',
        bio: userObj.bio || '',
        skills: Array.isArray(userObj.skills) ? userObj.skills : [],
        location: userObj.location || '',
        createdAt: userObj.createdAt || new Date()
      };
      
      // Log whether password was successfully preserved
      if (completeUser.password) {
        log(`Password saved for new user ${completeUser.username} (length: ${completeUser.password.length})`, 'storage');
      } else {
        log(`WARNING: No password saved for new user ${completeUser.username}`, 'storage');
      }
      
      return completeUser;
    } catch (error) {
      log(`Error creating user: ${(error as Error).message}`, 'storage');
      throw error;
    }
  }

  async updateUser(id: any, userData: Partial<User>): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      let updatedUser;

      // Handle MongoDB ObjectId strings
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        log(`Attempting to update user with MongoDB ObjectId: ${id}`, 'storage');
        updatedUser = await UserModel.findByIdAndUpdate(
          id,
          { $set: userData },
          { new: true }
        );
      } else {
        // Handle numeric IDs
        try {
          // Try by MongoDB's _id first
          updatedUser = await UserModel.findByIdAndUpdate(
            id,
            { $set: userData },
            { new: true }
          );

          // If not found, try by numeric id field
          if (!updatedUser) {
            const numId = parseInt(String(id), 10);
            if (!isNaN(numId)) {
              log(`User not found with _id ${id}, trying numeric id ${numId}`, 'storage');
              updatedUser = await UserModel.findOneAndUpdate(
                { id: numId },
                { $set: userData },
                { new: true }
              );
            }
          }
        } catch (err) {
          // Try one more approach with numeric id
          const numId = parseInt(String(id), 10);
          if (!isNaN(numId)) {
            log(`Error with _id update, trying numeric id ${numId}`, 'storage');
            updatedUser = await UserModel.findOneAndUpdate(
              { id: numId },
              { $set: userData },
              { new: true }
            );
          }
        }
      }

      if (!updatedUser) {
        log(`Could not find user with id ${id} to update`, 'storage');
        return undefined;
      }

      // Update the associated profile collection based on user role
      try {
        if (updatedUser.role === 'freelancer') {
          // Import FreelancerModel
          const { FreelancerModel } = await import('./models');
          
          // Extract freelancer-specific fields
          const freelancerData = {
            education: userData.education,
            hourlyRate: userData.hourlyRate,
            yearsExperience: userData.yearsExperience,
            categories: userData.categories
          };
          
          // Filter out undefined values
          const filteredData = Object.fromEntries(
            Object.entries(freelancerData).filter(([_, v]) => v !== undefined)
          );
          
          // Only update if there are freelancer-specific fields
          if (Object.keys(filteredData).length > 0) {
            // Find or create freelancer profile
            const profile = await FreelancerModel.findOne({ userId: updatedUser._id });
            
            if (profile) {
              // Update existing profile
              await FreelancerModel.updateOne(
                { userId: updatedUser._id },
                { $set: filteredData }
              );
              log(`Updated freelancer profile for user: ${updatedUser._id}`, 'storage');
            } else {
              // Create new profile if it doesn't exist
              const newProfile = new FreelancerModel({
                userId: updatedUser._id,
                ...filteredData
              });
              await newProfile.save();
              log(`Created new freelancer profile for user: ${updatedUser._id}`, 'storage');
            }
          }
        } 
        else if (updatedUser.role === 'employer') {
          // Import EmployerModel
          const { EmployerModel } = await import('./models');
          
          // Extract employer-specific fields
          const employerData = {
            company: userData.company,
            industry: userData.industry,
            website: userData.website
          };
          
          // Filter out undefined values
          const filteredData = Object.fromEntries(
            Object.entries(employerData).filter(([_, v]) => v !== undefined)
          );
          
          // Only update if there are employer-specific fields
          if (Object.keys(filteredData).length > 0) {
            // Find or create employer profile
            const profile = await EmployerModel.findOne({ userId: updatedUser._id });
            
            if (profile) {
              // Update existing profile
              await EmployerModel.updateOne(
                { userId: updatedUser._id },
                { $set: filteredData }
              );
              log(`Updated employer profile for user: ${updatedUser._id}`, 'storage');
            } else {
              // Create new profile if it doesn't exist
              const newProfile = new EmployerModel({
                userId: updatedUser._id,
                ...filteredData
              });
              await newProfile.save();
              log(`Created new employer profile for user: ${updatedUser._id}`, 'storage');
            }
          }
        }
      } catch (profileError) {
        // Log profile update error but don't fail the user update
        log(`Error updating profile for user: ${(profileError as Error).message}`, 'storage');
      }

      return convertDocument<User>(updatedUser);
    } catch (error) {
      log(`Error updating user: ${(error as Error).message}`, 'storage');
      return undefined;
    }
  }

  async getService(id: any): Promise<Service | undefined> {
    try {
      await this.ensureConnection();
      let service = null;

      // Try to find by MongoDB's _id directly
      try {
        service = await ServiceModel.findById(id);
        if (service) {
          return convertDocument<Service>(service);
        }
      } catch (err) {
        // If this fails, it might be a numeric ID
      }

      // If not found or error occurred, try by numeric id
      if (typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id)))) {
        const numericId = typeof id === 'number' ? id : parseInt(id);
        service = await ServiceModel.findOne({ id: numericId });
        if (service) {
          return convertDocument<Service>(service);
        }
      }

      log(`Service not found with id ${id}`, 'storage');
      return undefined;
    } catch (error) {
      log(`Error getting service: ${(error as Error).message}`, 'storage');
      return undefined;
    }
  }

  async getServices(filters?: Partial<Service>): Promise<Service[]> {
    try {
      await this.ensureConnection();
      const services = await ServiceModel.find(filters || {});
      return convertDocuments<Service>(services);
    } catch (error) {
      log(`Error getting services: ${(error as Error).message}`, 'storage');
      return [];
    }
  }

  async getUserServices(userId: any): Promise<Service[]> {
    try {
      await this.ensureConnection();
      const userIdStr = userId.toString();
      
      console.log(`Looking for services with user id ${userIdStr}`);
      
      // HACK: Try to find all services and then filter by user ID - will be more reliable
      const allServices = await ServiceModel.find({}).sort({ createdAt: -1 });
      console.log(`DEBUG: Found ${allServices.length} total services in the system`);
      
      // Log all services for debugging
      console.log('All service user IDs:');
      allServices.forEach(service => {
        console.log(`Service ID: ${service._id}, User: ${service.userId}`);
      });
      
      // Filter manually
      const filteredServices = allServices.filter(service => {
        const serviceUserId = service.userId ? service.userId.toString() : null;
        return serviceUserId === userIdStr;
      });
      
      console.log(`Found ${filteredServices.length} filtered services for user ${userIdStr}`);
      
      // Convert MongoDB documents to plain objects
      return convertDocuments<Service>(filteredServices);
    } catch (error) {
      log(`Error getting user services: ${(error as Error).message}`, 'storage');
      return [];
    }
  }

  async createService(userId: number, service: InsertService): Promise<Service> {
    try {
      await this.ensureConnection();
      const newService = new ServiceModel({ ...service, userId });
      await newService.save();
      return convertDocument<Service>(newService)!;
    } catch (error) {
      log(`Error creating service: ${(error as Error).message}`, 'storage');
      throw error;
    }
  }

  async updateService(id: any, serviceData: Partial<Service>): Promise<Service | undefined> {
    try {
      await this.ensureConnection();
      let updatedService;

      // Try to update by MongoDB's _id directly
      try {
        updatedService = await ServiceModel.findByIdAndUpdate(
          id,
          { $set: serviceData },
          { new: true }
        );

        if (updatedService) {
          return convertDocument<Service>(updatedService);
        }
      } catch (err) {
        // If this fails, it might be a numeric ID
      }

      // If not found or error occurred, try by numeric id
      if (typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id)))) {
        const numericId = typeof id === 'number' ? id : parseInt(id);
        updatedService = await ServiceModel.findOneAndUpdate(
          { id: numericId },
          { $set: serviceData },
          { new: true }
        );

        if (updatedService) {
          return convertDocument<Service>(updatedService);
        }
      }

      log(`Service not found with id ${id} to update`, 'storage');
      return undefined;
    } catch (error) {
      log(`Error updating service: ${(error as Error).message}`, 'storage');
      return undefined;
    }
  }

  async getJob(id: any): Promise<Job | undefined> {
    try {
      await this.ensureConnection();
      let job = null;

      // Try to find by MongoDB's _id directly
      try {
        job = await JobModel.findById(id);
        if (job) {
          return convertDocument<Job>(job);
        }
      } catch (err) {
        // If this fails, it might be a numeric ID
      }

      // If not found or error occurred, try by numeric id
      if (typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id)))) {
        const numericId = typeof id === 'number' ? id : parseInt(id);
        job = await JobModel.findOne({ id: numericId });
        if (job) {
          return convertDocument<Job>(job);
        }
      }

      log(`Job not found with id ${id}`, 'storage');
      return undefined;
    } catch (error) {
      log(`Error getting job: ${(error as Error).message}`, 'storage');
      return undefined;
    }
  }

  async getJobs(filters?: Partial<Job>): Promise<Job[]> {
    try {
      await this.ensureConnection();
      const jobs = await JobModel.find(filters || {});
      return convertDocuments<Job>(jobs);
    } catch (error) {
      log(`Error getting jobs: ${(error as Error).message}`, 'storage');
      return [];
    }
  }

  async getUserJobs(userId: any): Promise<Job[]> {
    try {
      await this.ensureConnection();
      const userIdStr = userId.toString();
      
      console.log(`Looking for jobs with user id ${userIdStr}`);
      
      // HACK: Try to find all jobs and then filter by user ID - will be more reliable
      const allJobs = await JobModel.find({}).sort({ createdAt: -1 });
      console.log(`DEBUG: Found ${allJobs.length} total jobs in the system`);
      
      // Log all jobs for debugging
      console.log('All job user IDs:');
      allJobs.forEach(job => {
        console.log(`Job ID: ${job._id}, User: ${job.userId}`);
      });
      
      // Filter manually
      const filteredJobs = allJobs.filter(job => {
        const jobUserId = job.userId ? job.userId.toString() : null;
        return jobUserId === userIdStr;
      });
      
      console.log(`Found ${filteredJobs.length} filtered jobs for user ${userIdStr}`);
      
      // Convert MongoDB documents to plain objects
      return convertDocuments<Job>(filteredJobs);
    } catch (error) {
      log(`Error getting user jobs: ${(error as Error).message}`, 'storage');
      return [];
    }
  }

  async createJob(userId: number, job: InsertJob): Promise<Job> {
    try {
      await this.ensureConnection();
      const newJob = new JobModel({ ...job, userId });
      await newJob.save();
      return convertDocument<Job>(newJob)!;
    } catch (error) {
      log(`Error creating job: ${(error as Error).message}`, 'storage');
      throw error;
    }
  }

  async updateJob(id: any, jobData: Partial<Job>): Promise<Job | undefined> {
    try {
      await this.ensureConnection();
      let updatedJob;

      // Try to update by MongoDB's _id directly
      try {
        updatedJob = await JobModel.findByIdAndUpdate(
          id,
          { $set: jobData },
          { new: true }
        );

        if (updatedJob) {
          return convertDocument<Job>(updatedJob);
        }
      } catch (err) {
        // If this fails, it might be a numeric ID
      }

      // If not found or error occurred, try by numeric id
      if (typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id)))) {
        const numericId = typeof id === 'number' ? id : parseInt(id);
        updatedJob = await JobModel.findOneAndUpdate(
          { id: numericId },
          { $set: jobData },
          { new: true }
        );

        if (updatedJob) {
          return convertDocument<Job>(updatedJob);
        }
      }

      log(`Job not found with id ${id} to update`, 'storage');
      return undefined;
    } catch (error) {
      log(`Error updating job: ${(error as Error).message}`, 'storage');
      return undefined;
    }
  }

  async getApplication(id: any): Promise<Application | undefined> {
    try {
      await this.ensureConnection();
      const idStr = id.toString();
      
      let application;
      
      // For MongoDB ObjectIds (string format)
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        application = await ApplicationModel.findById(id);
      } 
      // For numeric IDs
      else {
        application = await ApplicationModel.findOne({ 
          $or: [
            { id: idStr },
            { id: typeof id === 'number' ? id : parseInt(idStr) }
          ]
        });
      }
      
      // Convert MongoDB document to plain object
      return convertDocument<Application>(application);
    } catch (error) {
      console.error('Error retrieving application:', error);
      return undefined;
    }
  }

  async getApplicationsForJob(jobId: any): Promise<Application[]> {
    try {
      await this.ensureConnection();
      const jobIdStr = jobId.toString();
      
      // Find applications for this job with either string or ObjectId comparison
      let query;
      
      // For MongoDB ObjectIds (string format) or special case of all applications
      if ((typeof jobId === 'string' && jobId.match(/^[0-9a-fA-F]{24}$/)) || jobId === 0) {
        query = jobId === 0 ? {} : { 
          $or: [
            { jobId: jobIdStr },
            { jobId: jobId }
          ]
        };
      } 
      // For numeric IDs
      else {
        query = { 
          $or: [
            { jobId: jobIdStr },
            { jobId: typeof jobId === 'number' ? jobId : parseInt(jobId) }
          ]
        };
      }
      
      const applications = await ApplicationModel.find(query).sort({ createdAt: -1 });
      console.log(`Found ${applications.length} applications for job ${jobIdStr}`);
      
      // Convert MongoDB documents to plain objects
      const convertedApplications = convertDocuments<Application>(applications);
      
      // Add user information to each application
      for (const application of convertedApplications) {
        try {
          const applicationUser = await this.getUser(application.userId);
          if (applicationUser) {
            // Remove password from user info
            const { password, ...safeUser } = applicationUser;
            (application as any).user = safeUser;
          }
        } catch (err) {
          console.error(`Error fetching user for application ${application.id}:`, err);
        }
      }
      
      return convertedApplications;
    } catch (error) {
      log(`Error getting applications for job: ${(error as Error).message}`, 'storage');
      console.error('Error getting applications for job:', error);
      return [];
    }
  }
  
  // Alias for getApplicationsForJob
  async getJobApplications(jobId: any): Promise<Application[]> {
    return this.getApplicationsForJob(jobId);
  }

  async getUserApplications(userId: any): Promise<Application[]> {
    try {
      await this.ensureConnection();
      const userIdStr = userId.toString();
      
      console.log(`Looking for applications with user id ${userIdStr}`);
      
      // HACK: Try to find all applications and then filter by user ID - will be more reliable
      const allApplications = await ApplicationModel.find({}).sort({ createdAt: -1 });
      console.log(`DEBUG: Found ${allApplications.length} total applications in the system`);
      
      // Log all applications for debugging
      console.log('All application user IDs:');
      allApplications.forEach(app => {
        console.log(`Application ID: ${app._id}, User: ${app.userId}, Job: ${app.jobId}`);
      });
      
      // Filter manually
      const filteredApplications = allApplications.filter(app => {
        const appUserId = app.userId ? app.userId.toString() : null;
        return appUserId === userIdStr;
      });
      
      console.log(`Found ${filteredApplications.length} filtered applications for user ${userIdStr}`);
      
      // Convert MongoDB documents to plain objects
      const convertedApplications = convertDocuments<Application>(filteredApplications);
      
      // Fetch job details for each application
      for (const application of convertedApplications) {
        try {
          const job = await this.getJob(application.jobId);
          if (job) {
            (application as any).job = job;
            
            // Also get the job owner's info
            if (job.userId) {
              const jobOwner = await this.getUser(job.userId);
              if (jobOwner) {
                const { password, ...safeUser } = jobOwner;
                (application as any).job.user = safeUser;
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching job for application ${application.id}:`, err);
        }
      }
      
      return convertedApplications;
    } catch (error) {
      log(`Error getting user applications: ${(error as Error).message}`, 'storage');
      console.error('Error getting user applications:', error);
      return [];
    }
  }

  async createApplication(userId: number, application: InsertApplication): Promise<Application> {
    try {
      await this.ensureConnection();
      const newApplication = new ApplicationModel({ ...application, userId });
      await newApplication.save();
      return convertDocument<Application>(newApplication)!;
    } catch (error) {
      log(`Error creating application: ${(error as Error).message}`, 'storage');
      throw error;
    }
  }

  async updateApplicationStatus(
    id: any,
    status: "pending" | "approved" | "rejected"
  ): Promise<Application | undefined> {
    try {
      await this.ensureConnection();
      let updatedApplication;

      // Try to update by MongoDB's _id directly
      try {
        updatedApplication = await ApplicationModel.findByIdAndUpdate(
          id,
          { $set: { status } },
          { new: true }
        );

        if (updatedApplication) {
          return convertDocument<Application>(updatedApplication);
        }
      } catch (err) {
        // If this fails, it might be a numeric ID
      }

      // If not found or error occurred, try by numeric id
      if (typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id)))) {
        const numericId = typeof id === 'number' ? id : parseInt(id);
        updatedApplication = await ApplicationModel.findOneAndUpdate(
          { id: numericId },
          { $set: { status } },
          { new: true }
        );

        if (updatedApplication) {
          return convertDocument<Application>(updatedApplication);
        }
      }

      log(`Application not found with id ${id} to update status`, 'storage');
      return undefined;
    } catch (error) {
      log(`Error updating application status: ${(error as Error).message}`, 'storage');
      return undefined;
    }
  }

  async getOrdersForService(serviceId: number): Promise<Order[]> {
    try {
      await this.ensureConnection();
      const orders = await OrderModel.find({ serviceId });
      return convertDocuments<Order>(orders);
    } catch (error) {
      log(`Error getting orders for service: ${(error as Error).message}`, 'storage');
      return [];
    }
  }

  async getUserOrders(userId: any): Promise<Order[]> {
    try {
      await this.ensureConnection();
      const userIdStr = userId.toString();
      
      console.log(`Looking for orders with user id ${userIdStr}`);
      
      // HACK: Try to find all orders and then filter by user ID - will be slow but more reliable
      const allOrders = await OrderModel.find({}).sort({ createdAt: -1 });
      console.log(`DEBUG: Found ${allOrders.length} total orders in the system`);
      
      // Log all orders for debugging
      console.log('All order buyer and seller IDs:');
      allOrders.forEach(order => {
        console.log(`Order ID: ${order._id}, Buyer: ${order.buyerId}, Seller: ${order.sellerId}`);
      });
      
      // Filter manually
      const filteredOrders = allOrders.filter(order => {
        const orderBuyerId = order.buyerId ? order.buyerId.toString() : null;
        const orderSellerId = order.sellerId ? order.sellerId.toString() : null;
        
        return (
          orderBuyerId === userIdStr || 
          orderSellerId === userIdStr
        );
      });
      
      console.log(`Found ${filteredOrders.length} filtered orders for user ${userIdStr}`);
      
      // Convert MongoDB documents to plain objects
      const convertedOrders = convertDocuments<Order>(filteredOrders);
      
      // Fetch service details for each order
      for (const order of convertedOrders) {
        try {
          const service = await this.getService(order.serviceId);
          if (service) {
            (order as any).service = service;
          }
        } catch (err) {
          console.error(`Error fetching service for order ${order.id}:`, err);
        }
      }
      
      return convertedOrders;
    } catch (error) {
      log(`Error getting user orders: ${(error as Error).message}`, 'storage');
      console.error('Error getting user orders:', error);
      return [];
    }
  }

  async createOrder(order: InsertOrder & { sellerId: number, status?: string, paymentDetails?: any }): Promise<Order> {
    try {
      await this.ensureConnection();
      
      // Log the order data being saved
      log(`Creating order with data: ${JSON.stringify(order)}`, 'storage');
      
      const newOrder = new OrderModel(order);
      await newOrder.save();
      
      // If payment details are provided, save them separately
      if (order.paymentDetails) {
        try {
          // Import PaymentModel
          const { PaymentModel } = await import('./models');
          
          // Create payment record
          const paymentData = {
            orderId: newOrder._id,
            cardName: order.paymentDetails.cardName,
            cardNumberLast4: order.paymentDetails.cardNumberLast4,
            expiryDate: order.paymentDetails.expiryDate,
            paymentMethod: order.paymentMethod || 'card',
            amount: order.totalPrice,
            currency: 'DNT', // Default to Tunisian Dinar (DNT)
            status: 'completed'
          };
          
          log(`Creating payment record: ${JSON.stringify(paymentData)}`, 'storage');
          
          const newPayment = new PaymentModel(paymentData);
          await newPayment.save();
          
          log(`Payment record created successfully with ID: ${newPayment._id}`, 'storage');
        } catch (paymentError) {
          // Log payment error but don't fail the order creation
          log(`Error creating payment record: ${(paymentError as Error).message}`, 'storage');
        }
      }
      
      // After creating the order, update user stats for both buyer and seller
      // We don't need to wait for these operations
      this.updateUserStats(order.buyerId).catch(err => 
        log(`Error updating buyer stats: ${err.message}`, 'storage'));
      
      this.updateUserStats(order.sellerId).catch(err => 
        log(`Error updating seller stats: ${err.message}`, 'storage'));
      
      return convertDocument<Order>(newOrder)!;
    } catch (error) {
      log(`Error creating order: ${(error as Error).message}`, 'storage');
      throw error;
    }
  }
  
  // Helper method to update user stats (not part of the IStorage interface)
  private async updateUserStats(userId: any): Promise<void> {
    try {
      await this.ensureConnection();
      
      const userIdStr = userId.toString();
      log(`Calculating stats for user ${userIdStr}`, 'storage');
      
      // Get user to determine role
      const user = await UserModel.findById(userIdStr);
      if (!user) {
        log(`User not found with ID ${userIdStr}, cannot update stats`, 'storage');
        return;
      }
      
      // Import required models
      const { ServiceModel, JobModel, ApplicationModel, OrderModel } = await import('./models');
      
      // Calculate stats based on user role
      if (user.role === 'freelancer') {
        // For freelancers we need to calculate:
        // 1. Active service count
        // 2. Applications sent
        // 3. Orders received (services sold)
        
        // Count active services
        const activeServices = await ServiceModel.countDocuments({
          userId: userIdStr,
          status: 'active'
        });
        
        // Count job applications submitted
        const applications = await ApplicationModel.countDocuments({
          userId: userIdStr
        });
        
        // Count orders received as a seller
        const ordersReceived = await OrderModel.countDocuments({
          sellerId: userIdStr
        });
        
        // Get approved application count
        const approvedApplications = await ApplicationModel.countDocuments({
          userId: userIdStr,
          status: 'approved'
        });
        
        // Update the user document with stats
        await UserModel.updateOne(
          { _id: userIdStr },
          { 
            $set: { 
              activeServiceCount: activeServices,
              applicationCount: applications,
              approvedApplicationCount: approvedApplications,
              ordersReceivedCount: ordersReceived
            } 
          }
        );
        
        // Also update the freelancer profile if it exists
        try {
          const { FreelancerModel } = await import('./models');
          await FreelancerModel.updateOne(
            { userId: userIdStr },
            { 
              $set: { 
                activeServiceCount: activeServices,
                applicationCount: applications,
                approvedApplicationCount: approvedApplications,
                ordersReceivedCount: ordersReceived
              } 
            },
            { upsert: true } // Create if doesn't exist
          );
        } catch (profileError) {
          log(`Error updating freelancer profile stats: ${(profileError as Error).message}`, 'storage');
        }
        
        log(`Updated freelancer stats for user ${userIdStr}: ${activeServices} services, ${applications} applications, ${ordersReceived} orders received`, 'storage');
      } 
      else if (user.role === 'employer') {
        // For employers we need to calculate:
        // 1. Active job count
        // 2. Applications received
        // 3. Orders placed (services purchased)
        
        // Count active jobs
        const activeJobs = await JobModel.countDocuments({
          userId: userIdStr,
          status: 'open'
        });
        
        // Count orders placed as a buyer
        const ordersPlaced = await OrderModel.countDocuments({
          buyerId: userIdStr
        });
        
        // Find all employer's jobs to count applications
        const jobIds = await JobModel.find({ userId: userIdStr }).distinct('_id');
        const applicationsReceived = await ApplicationModel.countDocuments({
          jobId: { $in: jobIds }
        });
        
        // Update the user document with stats
        await UserModel.updateOne(
          { _id: userIdStr },
          { 
            $set: { 
              activeJobCount: activeJobs,
              applicationsReceivedCount: applicationsReceived,
              ordersPlacedCount: ordersPlaced
            } 
          }
        );
        
        // Also update the employer profile if it exists
        try {
          const { EmployerModel } = await import('./models');
          await EmployerModel.updateOne(
            { userId: userIdStr },
            { 
              $set: { 
                activeJobCount: activeJobs,
                applicationsReceivedCount: applicationsReceived,
                ordersPlacedCount: ordersPlaced
              } 
            },
            { upsert: true } // Create if doesn't exist
          );
        } catch (profileError) {
          log(`Error updating employer profile stats: ${(profileError as Error).message}`, 'storage');
        }
        
        log(`Updated employer stats for user ${userIdStr}: ${activeJobs} jobs, ${applicationsReceived} applications received, ${ordersPlaced} orders placed`, 'storage');
      }
    } catch (error) {
      log(`Error updating user stats: ${(error as Error).message}`, 'storage');
    }
  }

  async getReviewsForService(serviceId: number): Promise<Review[]> {
    try {
      await this.ensureConnection();
      const reviews = await ReviewModel.find({ serviceId });
      return convertDocuments<Review>(reviews);
    } catch (error) {
      log(`Error getting reviews for service: ${(error as Error).message}`, 'storage');
      return [];
    }
  }

  async createReview(review: InsertReview): Promise<Review> {
    try {
      await this.ensureConnection();
      const newReview = new ReviewModel(review);
      await newReview.save();
      return convertDocument<Review>(newReview)!;
    } catch (error) {
      log(`Error creating review: ${(error as Error).message}`, 'storage');
      throw error;
    }
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    try {
      await this.ensureConnection();
      const users = await UserModel.find({});
      return convertDocuments<User>(users);
    } catch (error) {
      log(`Error getting all users: ${(error as Error).message}`, 'storage');
      return [];
    }
  }

  async getUserCount(): Promise<number> {
    try {
      await this.ensureConnection();
      return await UserModel.countDocuments({});
    } catch (error) {
      log(`Error getting user count: ${(error as Error).message}`, 'storage');
      return 0;
    }
  }

  async getServiceCount(): Promise<number> {
    try {
      await this.ensureConnection();
      return await ServiceModel.countDocuments({});
    } catch (error) {
      log(`Error getting service count: ${(error as Error).message}`, 'storage');
      return 0;
    }
  }

  async getJobCount(): Promise<number> {
    try {
      await this.ensureConnection();
      return await JobModel.countDocuments({});
    } catch (error) {
      log(`Error getting job count: ${(error as Error).message}`, 'storage');
      return 0;
    }
  }

  async getApplicationCount(): Promise<number> {
    try {
      await this.ensureConnection();
      return await ApplicationModel.countDocuments({});
    } catch (error) {
      log(`Error getting application count: ${(error as Error).message}`, 'storage');
      return 0;
    }
  }

  async getOrderCount(): Promise<number> {
    try {
      await this.ensureConnection();
      return await OrderModel.countDocuments({});
    } catch (error) {
      log(`Error getting order count: ${(error as Error).message}`, 'storage');
      return 0;
    }
  }

  async getUserCountByRole(role: string): Promise<number> {
    try {
      await this.ensureConnection();
      return await UserModel.countDocuments({ role });
    } catch (error) {
      log(`Error getting user count by role: ${(error as Error).message}`, 'storage');
      return 0;
    }
  }
  
  async getAdminStatistics(): Promise<AdminStatistics> {
    await this.ensureConnection();
    
    try {
      // Run all count queries in parallel for better performance
      const [
        userCount,
        serviceCount,
        jobCount,
        applicationCount,
        orderCount,
        freelancerCount,
        employerCount,
        adminCount
      ] = await Promise.all([
        UserModel.countDocuments({}),
        ServiceModel.countDocuments({}),
        JobModel.countDocuments({}),
        ApplicationModel.countDocuments({}),
        OrderModel.countDocuments({}),
        UserModel.countDocuments({ role: 'freelancer' }),
        UserModel.countDocuments({ role: 'employer' }),
        UserModel.countDocuments({ role: 'admin' })
      ]);
      
      return {
        userCount,
        serviceCount,
        jobCount,
        applicationCount,
        orderCount,
        usersByRole: {
          freelancers: freelancerCount,
          employers: employerCount,
          admins: adminCount
        }
      };
    } catch (error) {
      log(`Error getting admin statistics: ${(error as Error).message}`, 'storage');
      // Return zeros as fallback
      return {
        userCount: 0,
        serviceCount: 0,
        jobCount: 0,
        applicationCount: 0,
        orderCount: 0,
        usersByRole: {
          freelancers: 0,
          employers: 0,
          admins: 0
        }
      };
    }
  }

  async updateUserStatus(id: any, status: 'active' | 'blocked', blockedReason: string | null = null): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      
      // Find the user first to check if they exist
      let user;
      
      // Handle MongoDB ObjectId strings
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        user = await UserModel.findById(id);
      } else {
        // Handle numeric IDs
        const numId = parseInt(String(id), 10);
        if (!isNaN(numId)) {
          user = await UserModel.findOne({ id: numId });
        }
      }
      
      if (!user) {
        log(`User not found with id ${id} for status update`, 'storage');
        return undefined;
      }
      
      // Prepare update data
      const updateData: any = { status };
      if (status === 'blocked' && blockedReason) {
        updateData.blockedReason = blockedReason;
      } else if (status === 'active') {
        updateData.blockedReason = null;
      }
      
      // Update user status
      const updatedUser = await UserModel.findByIdAndUpdate(
        user._id,
        { $set: updateData },
        { new: true }
      );
      
      if (!updatedUser) {
        log(`Failed to update user status for ID: ${id}`, 'storage');
        return undefined;
      }
      
      log(`Updated user status to ${status} for ID: ${id}`, 'storage');
      return convertDocument<User>(updatedUser);
    } catch (error) {
      log(`Error updating user status: ${(error as Error).message}`, 'storage');
      throw error;
    }
  }

  async deleteUser(id: any): Promise<void> {
    try {
      await this.ensureConnection();
      
      // Find the user first to check if they exist
      let user;
      
      // Handle MongoDB ObjectId strings
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        user = await UserModel.findById(id);
      } else {
        // Handle numeric IDs
        const numId = parseInt(String(id), 10);
        if (!isNaN(numId)) {
          user = await UserModel.findOne({ id: numId });
        }
      }
      
      if (!user) {
        log(`User not found with id ${id} for deletion`, 'storage');
        return;
      }
      
      // Get the user's role to delete the associated profile
      const userRole = user.role;
      const userId = user._id;
      
      // Delete the user
      await UserModel.deleteOne({ _id: userId });
      
      // Delete associated profile
      try {
        if (userRole === 'freelancer') {
          const { FreelancerModel } = await import('./models');
          await FreelancerModel.deleteOne({ userId });
          log(`Deleted freelancer profile for user: ${userId}`, 'storage');
        } 
        else if (userRole === 'employer') {
          const { EmployerModel } = await import('./models');
          await EmployerModel.deleteOne({ userId });
          log(`Deleted employer profile for user: ${userId}`, 'storage');
        }
      } catch (profileError) {
        // Log profile deletion error but don't fail the user deletion
        log(`Error deleting profile for user: ${(profileError as Error).message}`, 'storage');
      }
      
      log(`Deleted user with ID: ${userId}`, 'storage');
    } catch (error) {
      log(`Error deleting user: ${(error as Error).message}`, 'storage');
      throw error;
    }
  }
}