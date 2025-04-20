/**
 * Custom schema migration script
 * This script is run after drizzle-kit push to apply any custom migrations that drizzle-kit can't handle
 */

import { db } from "../server/db";
import { 
  userRoleEnum, jobStatusEnum, applicationStatusEnum, 
  paymentMethodEnum, serviceStatusEnum
} from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting custom schema migration...");

    // Ensure all enum types exist
    await ensureEnumTypes();

    console.log("Custom schema migration completed successfully!");
  } catch (error) {
    console.error("Error during custom schema migration:", error);
    process.exit(1);
  }
}

async function ensureEnumTypes() {
  console.log("Ensuring enum types exist...");
  
  // Create all enum types if they don't exist
  // Note: These usually get created by drizzle-kit push, but we're adding extra safety
  
  // User role enum
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('freelancer', 'employer');
      END IF;
    END $$;
  `);
  
  // Job status enum
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('open', 'closed');
      END IF;
    END $$;
  `);
  
  // Application status enum
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
      END IF;
    END $$;
  `);
  
  // Payment method enum
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer');
      END IF;
    END $$;
  `);
  
  // Service status enum
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
        CREATE TYPE service_status AS ENUM ('active', 'inactive');
      END IF;
    END $$;
  `);
  
  console.log("All enum types verified.");
}

// Run the migration
main().catch(console.error);