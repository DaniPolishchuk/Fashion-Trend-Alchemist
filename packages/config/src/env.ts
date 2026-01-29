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
 * SeaweedFS Filer HTTP configuration (when IMAGE_STRATEGY=filer)
 * For direct URLs via /images/... path
 */
export const filerConfig = {
  baseUrl: process.env.VITE_FILER_BASE_URL || 'https://seaweedfs.a549aaa.kyma.ondemand.com',
  generatedBucket: process.env.VITE_FILER_GENERATED_BUCKET || 'generatedProducts',
  bucket: process.env.VITE_FILER_BUCKET || 'images',
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
 * Vision LLM configuration (via LiteLLM proxy)
 */
export const visionLlmConfig = {
  proxyUrl: process.env.LITELLM_PROXY_URL || 'https://litellm-apac.a549aaa.kyma.ondemand.com/',
  apiKey: process.env.LITELLM_API_KEY || '',
  model: process.env.VISION_LLM_MODEL || 'sapgenai-gpt-4.1',
} as const;

/**
 * Enrichment processing configuration
 */
export const enrichmentConfig = {
  concurrency: parseInt(process.env.ENRICHMENT_CONCURRENCY || '5', 10),
  progressIntervalMs: parseInt(process.env.ENRICHMENT_PROGRESS_INTERVAL_MS || '500', 10),
} as const;

/**
 * RPT-1 configuration (SAP AI Core)
 */
export const rpt1Config = {
  aiApiUrl: process.env.AI_API_URL || 'https://api.ai.prod.ap-northeast-1.aws.ml.hana.ondemand.com',
  authUrl: process.env.AUTH_URL || '',
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  resourceGroup: process.env.RESOURCE_GROUP || 'default',
} as const;

/**
 * Image Generation API configuration
 */
export const imageGenConfig = {
  tokenUrl:
    process.env.IMAGE_GEN_TOKEN_URL ||
    'https://honhai-visionbay-ai-aws.authentication.jp10.hana.ondemand.com/oauth/token',
  clientId: process.env.IMAGE_GEN_CLIENT_ID || '',
  clientSecret: process.env.IMAGE_GEN_CLIENT_SECRET || '',
  apiUrl: process.env.IMAGE_GEN_API_URL || 'https://image-api.c-84a98a5.kyma.ondemand.com/generate',
  imageWidth: parseInt(process.env.IMAGE_GEN_WIDTH || '1024', 10),
  imageHeight: parseInt(process.env.IMAGE_GEN_HEIGHT || '1024', 10),
} as const;
