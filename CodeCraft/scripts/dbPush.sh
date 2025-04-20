#!/bin/bash
# Script to push schema to the database using drizzle-kit

echo "Running database schema push..."
npx drizzle-kit push
echo "Running custom schema migration..."
npx tsx scripts/pushSchema.ts
echo "Database schema update completed"