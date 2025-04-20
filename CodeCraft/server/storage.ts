import {
  users,
  services,
  jobs,
  applications,
  orders,
  reviews,
  type User,
  type InsertUser,
  type Service,
  type InsertService,
  type Job,
  type InsertJob,
  type Application,
  type InsertApplication,
  type Order,
  type InsertOrder,
  type Review,
  type InsertReview,
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User related methods
  getUser(id: any): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: any, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: any): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  // Admin-specific methods
  getUserCount(): Promise<number>;
  getServiceCount(): Promise<number>;
  getJobCount(): Promise<number>;
  getApplicationCount(): Promise<number>;
  getOrderCount(): Promise<number>;
  getUserCountByRole(role: string): Promise<number>;
  getAdminStatistics(): Promise<any>; // Returns platform statistics
  updateUserStatus(id: any, status: 'active' | 'blocked', blockedReason?: string | null): Promise<User | undefined>;
  
  // Service related methods
  getService(id: any): Promise<Service | undefined>;
  getServices(filters?: Partial<Service>): Promise<Service[]>;
  getUserServices(userId: any): Promise<Service[]>;
  createService(userId: any, service: InsertService): Promise<Service>;
  updateService(id: any, serviceData: Partial<Service>): Promise<Service | undefined>;
  
  // Job related methods
  getJob(id: any): Promise<Job | undefined>;
  getJobs(filters?: Partial<Job>): Promise<Job[]>;
  getUserJobs(userId: any): Promise<Job[]>;
  createJob(userId: any, job: InsertJob): Promise<Job>;
  updateJob(id: any, jobData: Partial<Job>): Promise<Job | undefined>;
  
  // Application related methods
  getApplication(id: any): Promise<Application | undefined>;
  getApplicationsForJob(jobId: any): Promise<Application[]>;
  getJobApplications(jobId: any): Promise<Application[]>; // Alias for getApplicationsForJob
  getUserApplications(userId: any): Promise<Application[]>;
  createApplication(userId: any, application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: any, status: "pending" | "approved" | "rejected"): Promise<Application | undefined>;
  
  // Order related methods
  getOrdersForService(serviceId: any): Promise<Order[]>;
  getUserOrders(userId: any): Promise<Order[]>;
  createOrder(order: InsertOrder & { sellerId: any, status?: string, paymentDetails?: any }): Promise<Order>;
  
  // Review related methods
  getReviewsForService(serviceId: any): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private orders: Map<number, Order>;
  private reviews: Map<number, Review>;
  
  private currentUserId: number;
  private currentServiceId: number;
  private currentJobId: number;
  private currentApplicationId: number;
  private currentOrderId: number;
  private currentReviewId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.orders = new Map();
    this.reviews = new Map();
    
    this.currentUserId = 1;
    this.currentServiceId = 1;
    this.currentJobId = 1;
    this.currentApplicationId = 1;
    this.currentOrderId = 1;
    this.currentReviewId = 1;
  }

  // User methods
  async getUser(id: any): Promise<User | undefined> {
    // If id is a number or can be parsed as a number, use it directly
    if (typeof id === 'number') {
      return this.users.get(id);
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      return this.users.get(parseInt(id));
    }
    
    // For MongoDB's ObjectId strings or other non-numeric IDs,
    // we just return undefined since in-memory storage only uses numeric IDs
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    
    // Ensure required fields are set with defaults
    const user: User = {
      ...insertUser,
      id,
      createdAt,
      role: insertUser.role || "freelancer", 
      status: "active", // Default to active
      blockedReason: null,
      bio: insertUser.bio || null,
      profilePicture: insertUser.profilePicture || null
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: any, userData: Partial<User>): Promise<User | undefined> {
    let numericId: number | undefined;
    
    // Convert id to numeric if possible
    if (typeof id === 'number') {
      numericId = id;
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      numericId = parseInt(id);
    }
    
    // If we couldn't get a valid numeric ID, return undefined
    if (numericId === undefined) {
      return undefined;
    }
    
    const existingUser = this.users.get(numericId);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(numericId, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: any): Promise<void> {
    let numericId: number | undefined;
    
    // Convert id to numeric if possible
    if (typeof id === 'number') {
      numericId = id;
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      numericId = parseInt(id);
    }
    
    // If we couldn't get a valid numeric ID, just return
    if (numericId === undefined) {
      return;
    }
    
    // Delete the user
    this.users.delete(numericId);
    
    // Also delete all user's services, jobs, applications
    const userServices = Array.from(this.services.values())
      .filter(service => service.userId === numericId)
      .map(service => service.id);
      
    const userJobs = Array.from(this.jobs.values())
      .filter(job => job.userId === numericId)
      .map(job => job.id);
    
    const userApplications = Array.from(this.applications.values())
      .filter(app => app.userId === numericId)
      .map(app => app.id);
    
    // Delete all related records
    userServices.forEach(id => this.services.delete(id));
    userJobs.forEach(id => this.jobs.delete(id));
    userApplications.forEach(id => this.applications.delete(id));
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Admin methods for statistics
  async getUserCount(): Promise<number> {
    return this.users.size;
  }
  
  async getServiceCount(): Promise<number> {
    return this.services.size;
  }
  
  async getJobCount(): Promise<number> {
    return this.jobs.size;
  }
  
  async getApplicationCount(): Promise<number> {
    return this.applications.size;
  }
  
  async getOrderCount(): Promise<number> {
    return this.orders.size;
  }
  
  async getUserCountByRole(role: string): Promise<number> {
    return Array.from(this.users.values()).filter(
      user => user.role === role
    ).length;
  }
  
  async getAdminStatistics(): Promise<any> {
    const userCount = await this.getUserCount();
    const serviceCount = await this.getServiceCount();
    const jobCount = await this.getJobCount();
    const applicationCount = await this.getApplicationCount();
    const orderCount = await this.getOrderCount();
    const freelancerCount = await this.getUserCountByRole('freelancer');
    const employerCount = await this.getUserCountByRole('employer');
    const adminCount = await this.getUserCountByRole('admin');
    
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
  }
  
  async updateUserStatus(id: any, status: 'active' | 'blocked', blockedReason: string | null = null): Promise<User | undefined> {
    let numericId: number | undefined;
    
    // Convert id to numeric if possible
    if (typeof id === 'number') {
      numericId = id;
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      numericId = parseInt(id);
    }
    
    // If we couldn't get a valid numeric ID, return undefined
    if (numericId === undefined) {
      return undefined;
    }
    
    const existingUser = this.users.get(numericId);
    if (!existingUser) {
      return undefined;
    }
    
    // Prepare update data
    const updateData: Partial<User> = { status };
    if (status === 'blocked' && blockedReason) {
      updateData.blockedReason = blockedReason;
    } else if (status === 'active') {
      updateData.blockedReason = null;
    }
    
    // Update user status
    const updatedUser = { ...existingUser, ...updateData };
    this.users.set(numericId, updatedUser);
    return updatedUser;
  }

  // Service methods
  async getService(id: any): Promise<Service | undefined> {
    // If id is a number or can be parsed as a number, use it directly
    if (typeof id === 'number') {
      return this.services.get(id);
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      return this.services.get(parseInt(id));
    }
    
    // For MongoDB's ObjectId strings or other non-numeric IDs,
    // we just return undefined since in-memory storage only uses numeric IDs
    return undefined;
  }
  
  async getServices(filters?: Partial<Service>): Promise<Service[]> {
    let services = Array.from(this.services.values());
    
    if (filters) {
      services = services.filter(service => {
        return Object.entries(filters).every(([key, value]) => {
          return service[key as keyof Service] === value;
        });
      });
    }
    
    return services;
  }
  
  async getUserServices(userId: any): Promise<Service[]> {
    // Convert userId to number if it's a string number
    const numericUserId = typeof userId === 'number' ? 
      userId : 
      (typeof userId === 'string' && !isNaN(parseInt(userId))) ? 
        parseInt(userId) : 
        userId;
        
    return Array.from(this.services.values()).filter(
      (service) => service.userId === numericUserId,
    );
  }
  
  async createService(userId: any, service: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const createdAt = new Date();
    
    // Convert userId to number if it's a string number
    const numericUserId = typeof userId === 'number' ? 
      userId : 
      (typeof userId === 'string' && !isNaN(parseInt(userId))) ? 
        parseInt(userId) : 
        userId;
    
    const newService: Service = { 
      ...service, 
      id, 
      userId: numericUserId, 
      createdAt,
      status: service.status || "active",
      image: service.image || null,
      deliveryTime: service.deliveryTime || null
    };
    this.services.set(id, newService);
    return newService;
  }
  
  async updateService(id: any, serviceData: Partial<Service>): Promise<Service | undefined> {
    let numericId: number | undefined;
    
    // Convert id to numeric if possible
    if (typeof id === 'number') {
      numericId = id;
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      numericId = parseInt(id);
    }
    
    // If we couldn't get a valid numeric ID, return undefined
    if (numericId === undefined) {
      return undefined;
    }
    
    const existingService = this.services.get(numericId);
    if (!existingService) {
      return undefined;
    }
    
    const updatedService = { ...existingService, ...serviceData };
    this.services.set(numericId, updatedService);
    return updatedService;
  }

  // Job methods
  async getJob(id: any): Promise<Job | undefined> {
    // If id is a number or can be parsed as a number, use it directly
    if (typeof id === 'number') {
      return this.jobs.get(id);
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      return this.jobs.get(parseInt(id));
    }
    
    // For MongoDB's ObjectId strings or other non-numeric IDs,
    // we just return undefined since in-memory storage only uses numeric IDs
    return undefined;
  }
  
  async getJobs(filters?: Partial<Job>): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values());
    
    if (filters) {
      jobs = jobs.filter(job => {
        return Object.entries(filters).every(([key, value]) => {
          return job[key as keyof Job] === value;
        });
      });
    }
    
    return jobs;
  }
  
  async getUserJobs(userId: any): Promise<Job[]> {
    // Convert userId to number if it's a string number
    const numericUserId = typeof userId === 'number' ? 
      userId : 
      (typeof userId === 'string' && !isNaN(parseInt(userId))) ? 
        parseInt(userId) : 
        userId;
        
    return Array.from(this.jobs.values()).filter(
      (job) => job.userId === numericUserId,
    );
  }
  
  async createJob(userId: any, job: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const createdAt = new Date();
    
    // Convert userId to number if it's a string number
    const numericUserId = typeof userId === 'number' ? 
      userId : 
      (typeof userId === 'string' && !isNaN(parseInt(userId))) ? 
        parseInt(userId) : 
        userId;
    
    const newJob: Job = { 
      ...job, 
      id, 
      userId: numericUserId, 
      createdAt,
      status: job.status || "open",
      image: job.image || null,
      location: job.location || null
    };
    this.jobs.set(id, newJob);
    return newJob;
  }
  
  async updateJob(id: any, jobData: Partial<Job>): Promise<Job | undefined> {
    let numericId: number | undefined;
    
    // Convert id to numeric if possible
    if (typeof id === 'number') {
      numericId = id;
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      numericId = parseInt(id);
    }
    
    // If we couldn't get a valid numeric ID, return undefined
    if (numericId === undefined) {
      return undefined;
    }
    
    const existingJob = this.jobs.get(numericId);
    if (!existingJob) {
      return undefined;
    }
    
    const updatedJob = { ...existingJob, ...jobData };
    this.jobs.set(numericId, updatedJob);
    return updatedJob;
  }

  // Application methods
  async getApplication(id: any): Promise<Application | undefined> {
    // If id is a number or can be parsed as a number, use it directly
    if (typeof id === 'number') {
      return this.applications.get(id);
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      return this.applications.get(parseInt(id));
    }
    
    // For MongoDB's ObjectId strings or other non-numeric IDs,
    // we just return undefined since in-memory storage only uses numeric IDs
    return undefined;
  }

  async getApplicationsForJob(jobId: any): Promise<Application[]> {
    // If jobId is 0, return all applications (special case for route)
    if (jobId === 0) {
      return Array.from(this.applications.values());
    }
    
    // Convert jobId to number if it's a string
    const numericJobId = typeof jobId === 'number' ? 
      jobId : 
      (typeof jobId === 'string' && !isNaN(parseInt(jobId))) ? 
        parseInt(jobId) : 
        jobId;
        
    return Array.from(this.applications.values()).filter(
      (application) => application.jobId === numericJobId,
    );
  }
  
  // Alias for getApplicationsForJob
  async getJobApplications(jobId: any): Promise<Application[]> {
    return this.getApplicationsForJob(jobId);
  }
  
  async getUserApplications(userId: any): Promise<Application[]> {
    // Convert userId to number if it's a string number
    const numericUserId = typeof userId === 'number' ? 
      userId : 
      (typeof userId === 'string' && !isNaN(parseInt(userId))) ? 
        parseInt(userId) : 
        userId;
        
    return Array.from(this.applications.values()).filter(
      (application) => application.userId === numericUserId,
    );
  }
  
  async createApplication(userId: any, application: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const createdAt = new Date();
    
    // Convert userId to number if it's a string number
    const numericUserId = typeof userId === 'number' ? 
      userId : 
      (typeof userId === 'string' && !isNaN(parseInt(userId))) ? 
        parseInt(userId) : 
        userId;
        
    const newApplication: Application = { 
      ...application, 
      id, 
      userId: numericUserId, 
      createdAt,
      status: "pending",
      resumeFile: application.resumeFile || null
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }
  
  async updateApplicationStatus(
    id: any, 
    status: "pending" | "approved" | "rejected"
  ): Promise<Application | undefined> {
    let numericId: number | undefined;
    
    // Convert id to numeric if possible
    if (typeof id === 'number') {
      numericId = id;
    } else if (typeof id === 'string' && !isNaN(parseInt(id))) {
      numericId = parseInt(id);
    }
    
    // If we couldn't get a valid numeric ID, return undefined
    if (numericId === undefined) {
      return undefined;
    }
    
    const existingApplication = this.applications.get(numericId);
    if (!existingApplication) {
      return undefined;
    }
    
    const updatedApplication = { ...existingApplication, status };
    this.applications.set(numericId, updatedApplication);
    return updatedApplication;
  }

  // Order methods
  async getOrdersForService(serviceId: any): Promise<Order[]> {
    // Convert serviceId to number if it's a string number
    const numericServiceId = typeof serviceId === 'number' ? 
      serviceId : 
      (typeof serviceId === 'string' && !isNaN(parseInt(serviceId))) ? 
        parseInt(serviceId) : 
        serviceId;
        
    return Array.from(this.orders.values()).filter(
      (order) => order.serviceId === numericServiceId,
    );
  }
  
  async getUserOrders(userId: any): Promise<Order[]> {
    // Convert userId to number if it's a string number
    const numericUserId = typeof userId === 'number' ? 
      userId : 
      (typeof userId === 'string' && !isNaN(parseInt(userId))) ? 
        parseInt(userId) : 
        userId;
        
    return Array.from(this.orders.values()).filter(
      (order) => order.buyerId === numericUserId || order.sellerId === numericUserId,
    );
  }
  
  async createOrder(order: InsertOrder & { sellerId: any, status?: string, paymentDetails?: any }): Promise<Order> {
    const id = this.currentOrderId++;
    const createdAt = new Date();
    
    // Convert buyer and seller IDs to numbers if they're string numbers
    const buyerId = typeof order.buyerId === 'number' ? 
      order.buyerId : 
      (typeof order.buyerId === 'string' && !isNaN(parseInt(order.buyerId))) ? 
        parseInt(order.buyerId) : 
        order.buyerId;
    
    const sellerId = typeof order.sellerId === 'number' ? 
      order.sellerId : 
      (typeof order.sellerId === 'string' && !isNaN(parseInt(order.sellerId))) ? 
        parseInt(order.sellerId) : 
        order.sellerId;
    
    const newOrder: Order = { 
      ...order, 
      id, 
      createdAt,
      status: order.status || "pending", // Allow status to be passed in
      buyerId,
      sellerId
    };
    
    this.orders.set(id, newOrder);
    return newOrder;
  }

  // Review methods
  async getReviewsForService(serviceId: any): Promise<Review[]> {
    // Convert serviceId to number if it's a string number
    const numericServiceId = typeof serviceId === 'number' ? 
      serviceId : 
      (typeof serviceId === 'string' && !isNaN(parseInt(serviceId))) ? 
        parseInt(serviceId) : 
        serviceId;
        
    return Array.from(this.reviews.values()).filter(
      (review) => review.serviceId === numericServiceId,
    );
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const createdAt = new Date();
    
    // Convert userId and serviceId to numbers if they're string numbers
    const userId = typeof review.userId === 'number' ? 
      review.userId : 
      (typeof review.userId === 'string' && !isNaN(parseInt(review.userId))) ? 
        parseInt(review.userId) : 
        review.userId;
    
    const serviceId = typeof review.serviceId === 'number' ? 
      review.serviceId : 
      (typeof review.serviceId === 'string' && !isNaN(parseInt(review.serviceId))) ? 
        parseInt(review.serviceId) : 
        review.serviceId;
    
    const newReview: Review = { 
      ...review, 
      id, 
      createdAt,
      userId,
      serviceId,
      comment: review.comment || null
    };
    this.reviews.set(id, newReview);
    return newReview;
  }
}

// Export an instance of MemStorage as the default storage implementation
export const storage = new MemStorage();
