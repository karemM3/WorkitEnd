import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  doublePrecision,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums
export const userRoleEnum = pgEnum("user_role", ["freelancer", "employer", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "blocked"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "closed"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "card",
  "bank_transfer",
]);
export const serviceStatusEnum = pgEnum("service_status", [
  "active",
  "inactive",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(), // Added fullName field to align with MongoDB model
  role: userRoleEnum("role").notNull().default("freelancer"),
  status: userStatusEnum("status").notNull().default("active"),
  blockedReason: text("blocked_reason"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services table (offered by freelancers)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  status: serviceStatusEnum("status").notNull().default("active"),
  image: text("image"),
  deliveryTime: text("delivery_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Jobs table (posted by employers)
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: doublePrecision("budget").notNull(),
  category: text("category").notNull(),
  location: text("location"),
  jobType: text("job_type").notNull(),
  status: jobStatusEnum("status").notNull().default("open"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job applications
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  description: text("description").notNull(),
  resumeFile: text("resume_file"),
  status: applicationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  buyerId: integer("buyer_id")
    .notNull()
    .references(() => users.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    confirmPassword: z.string().min(6),
  });

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  userId: true,
  createdAt: true,
  status: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  sellerId: true,
  createdAt: true,
  status: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Types
// Define the base User type from Postgres schema
export type User = typeof users.$inferSelect & {
  // Additional fields for MongoDB compatibility
  location?: string;
  skills?: string[];
  // Additional fields for freelancer profiles
  education?: string;
  hourlyRate?: number;
  yearsExperience?: number;
  categories?: string[];
  // Additional fields for employer profiles
  company?: string;
  industry?: string;
  website?: string;
};
export type InsertUser = z.infer<typeof insertUserSchema> & {
  confirmPassword?: string; // Used during registration
  // Additional fields for freelancer profiles
  education?: string;
  hourlyRate?: number;
  yearsExperience?: number;
  categories?: string[];
  // Additional fields for employer profiles
  company?: string;
  industry?: string;
  website?: string;
};
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Login = z.infer<typeof loginSchema>;
