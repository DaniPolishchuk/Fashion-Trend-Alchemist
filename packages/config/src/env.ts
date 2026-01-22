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
 * For direct URLs via /images/... path
 */
export const filerConfig = {
  baseUrl: process.env.FILER_BASE_URL || 'http://localhost:8888',
  generatedBucket: process.env.FILER_GENERATED_BUCKET || 'generatedProducts',
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

/**
 * LLM API configuration
 */
export const llmConfig = {
  apiUrl: process.env.LLM_API_URL || 'https://api.openai.com/v1',
  apiKey: process.env.LLM_API_KEY || '',
  model: process.env.LLM_MODEL || 'gpt-4',
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
