import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { IStorage } from "../storage";
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

/**
 * PostgreSQL/Drizzle implementation of the IStorage interface
 */
export class DrizzleStorage implements IStorage {
  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const defaultUser = {
      ...user,
      role: user.role || "freelancer",
      bio: user.bio || null,
      profilePicture: user.profilePicture || null,
    };
    
    const [result] = await db.insert(users).values(defaultUser).returning();
    return result;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [result] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  // Service related methods
  async getService(id: number): Promise<Service | undefined> {
    const result = await db.select().from(services).where(eq(services.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getServices(filters?: Partial<Service>): Promise<Service[]> {
    if (!filters || Object.keys(filters).length === 0) {
      return db.select().from(services);
    }

    // Build conditions for each filter
    const conditions: any[] = [];
    
    if (filters.id !== undefined) conditions.push(eq(services.id, filters.id));
    if (filters.userId !== undefined) conditions.push(eq(services.userId, filters.userId));
    if (filters.title !== undefined) conditions.push(eq(services.title, filters.title));
    if (filters.description !== undefined) conditions.push(eq(services.description, filters.description));
    if (filters.price !== undefined) conditions.push(eq(services.price, filters.price));
    if (filters.category !== undefined) conditions.push(eq(services.category, filters.category));
    if (filters.status !== undefined) conditions.push(eq(services.status, filters.status));
    
    return conditions.length > 0
      ? db.select().from(services).where(and(...conditions))
      : db.select().from(services);
  }

  async getUserServices(userId: number): Promise<Service[]> {
    return db.select().from(services).where(eq(services.userId, userId));
  }

  async createService(userId: number, service: InsertService): Promise<Service> {
    const defaultService = {
      ...service,
      userId,
      status: service.status || "active",
      image: service.image || null,
      deliveryTime: service.deliveryTime || null,
    };
    
    const [result] = await db.insert(services).values(defaultService).returning();
    return result;
  }

  async updateService(id: number, serviceData: Partial<Service>): Promise<Service | undefined> {
    const [result] = await db.update(services)
      .set(serviceData)
      .where(eq(services.id, id))
      .returning();
    return result;
  }

  // Job related methods
  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getJobs(filters?: Partial<Job>): Promise<Job[]> {
    if (!filters || Object.keys(filters).length === 0) {
      return db.select().from(jobs);
    }

    // Build conditions for each filter
    const conditions: any[] = [];
    
    if (filters.id !== undefined) conditions.push(eq(jobs.id, filters.id));
    if (filters.userId !== undefined) conditions.push(eq(jobs.userId, filters.userId));
    if (filters.title !== undefined) conditions.push(eq(jobs.title, filters.title));
    if (filters.description !== undefined) conditions.push(eq(jobs.description, filters.description));
    if (filters.budget !== undefined) conditions.push(eq(jobs.budget, filters.budget));
    if (filters.category !== undefined) conditions.push(eq(jobs.category, filters.category));
    if (filters.status !== undefined) conditions.push(eq(jobs.status, filters.status));
    if (filters.jobType !== undefined) conditions.push(eq(jobs.jobType, filters.jobType));
    
    return conditions.length > 0
      ? db.select().from(jobs).where(and(...conditions))
      : db.select().from(jobs);
  }

  async getUserJobs(userId: number): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.userId, userId));
  }

  async createJob(userId: number, job: InsertJob): Promise<Job> {
    const defaultJob = {
      ...job,
      userId,
      status: job.status || "open",
      image: job.image || null,
      location: job.location || null,
    };
    
    const [result] = await db.insert(jobs).values(defaultJob).returning();
    return result;
  }

  async updateJob(id: number, jobData: Partial<Job>): Promise<Job | undefined> {
    const [result] = await db.update(jobs)
      .set(jobData)
      .where(eq(jobs.id, id))
      .returning();
    return result;
  }

  // Application related methods
  async getApplicationsForJob(jobId: number): Promise<Application[]> {
    return db.select().from(applications).where(eq(applications.jobId, jobId));
  }

  async getUserApplications(userId: number): Promise<Application[]> {
    return db.select().from(applications).where(eq(applications.userId, userId));
  }

  async createApplication(userId: number, application: InsertApplication): Promise<Application> {
    // Create application with correct types for insertion
    const insertData = {
      userId,
      jobId: application.jobId,
      description: application.description,
      resumeFile: application.resumeFile || null,
      // Status is added by the default in the schema
    };
    
    const [result] = await db.insert(applications).values(insertData).returning();
    return result;
  }

  async updateApplicationStatus(
    id: number, 
    status: "pending" | "approved" | "rejected"
  ): Promise<Application | undefined> {
    const [result] = await db.update(applications)
      .set({ status })
      .where(eq(applications.id, id))
      .returning();
    return result;
  }

  // Order related methods
  async getOrdersForService(serviceId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.serviceId, serviceId));
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    const buyerOrders = await db.select().from(orders).where(eq(orders.buyerId, userId));
    const sellerOrders = await db.select().from(orders).where(eq(orders.sellerId, userId));
    return [...buyerOrders, ...sellerOrders];
  }

  async createOrder(order: InsertOrder & { sellerId: number }): Promise<Order> {
    const defaultOrder = {
      ...order,
      status: "pending",
    };
    
    const [result] = await db.insert(orders).values(defaultOrder).returning();
    return result;
  }

  // Review related methods
  async getReviewsForService(serviceId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.serviceId, serviceId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const defaultReview = {
      ...review,
      comment: review.comment || null,
    };
    
    const [result] = await db.insert(reviews).values(defaultReview).returning();
    return result;
  }
}