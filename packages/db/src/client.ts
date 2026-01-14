/**
 * Database client initialization
 * Provides a configured Drizzle ORM instance with PostgreSQL connection pool
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { dbConfig } from '@fashion/config';
import * as schema from './schema/index.js';

/**
 * PostgreSQL connection pool
 * Reuses connections for efficient database access
 */
export const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  max: dbConfig.maxConnections,
});

/**
 * Drizzle ORM client instance
 * Provides type-safe database queries with the full schema
 */
export const db = drizzle(pool, { schema });

/**
 * Gracefully close database connections
 * Should be called on application shutdown
 */
export async function closeDb(): Promise<void> {
  await pool.end();
}