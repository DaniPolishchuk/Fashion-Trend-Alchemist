/**
 * Environment configuration loader
 * Validates and provides typed access to environment variables
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from current directory
config();

// Also try to load from monorepo root (2 levels up from packages/config)
// This ensures .env is found when running from any workspace package
const rootEnvPath = resolve(process.cwd(), '../../.env');
config({ path: rootEnvPath, override: false });

/**
 * Database configuration
 */
export const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'fashion_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  maxConnections: parseInt(process.env.PGMAX || '10', 10),
} as const;

/**
 * Image storage strategy: 's3' (presigned URLs) or 'filer' (direct HTTP)
 */
export const imageStrategy = (process.env.IMAGE_STRATEGY || 's3') as 's3' | 'filer';

/**
 * S3/SeaweedFS S3 Gateway configuration (when IMAGE_STRATEGY=s3)
 */
export const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:8333',
  region: process.env.S3_REGION || 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY_ID || 'admin',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'admin',
  bucket: process.env.S3_BUCKET || 'images',
  forcePathStyle: true,
} as const;

/**
 * SeaweedFS Filer HTTP configuration (when IMAGE_STRATEGY=filer)
 * For direct URLs via /buckets/images/... path
 */
export const filerConfig = {
  baseUrl: process.env.FILER_BASE_URL || 'http://localhost:8888/buckets',
  bucket: process.env.FILER_BUCKET || 'images',
} as const;

/**
 * Application configuration
 */
export const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPort: parseInt(process.env.API_PORT || '3000', 10),
  apiHost: process.env.API_HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

/**
 * Image presigned URL configuration
 */
export const imageConfig = {
  urlExpirationSeconds: parseInt(process.env.IMAGE_URL_EXPIRATION || '3600', 10),
} as const;