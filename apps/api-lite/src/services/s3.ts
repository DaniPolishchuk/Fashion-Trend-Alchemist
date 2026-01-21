/**
 * S3 Image Fetching Service
 * Fetches product images from SeaweedFS (S3 gateway or Filer HTTP) and encodes them to base64
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Config, filerConfig, imageStrategy } from '@fashion/config';

// Initialize S3 client (only used when IMAGE_STRATEGY=s3)
const s3Client = new S3Client({
  endpoint: s3Config.endpoint,
  region: s3Config.region,
  credentials: {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
  },
  forcePathStyle: s3Config.forcePathStyle,
});

/**
 * Fetches an image via S3 and returns it as base64
 */
async function fetchImageViaS3(articleId: string): Promise<string> {
  const folder = articleId.slice(0, 2);
  const key = `${folder}/${articleId}.jpg`;

  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const buffer = await response.Body?.transformToByteArray();

  if (!buffer) {
    throw new Error(`Image not found for article ${articleId}`);
  }

  return Buffer.from(buffer).toString('base64');
}

/**
 * Fetches an image via HTTP Filer and returns it as base64
 */
async function fetchImageViaFiler(articleId: string): Promise<string> {
  const folder = articleId.slice(0, 2);
  const url = `${filerConfig.baseUrl}/${filerConfig.bucket}/${folder}/${articleId}.jpg`;

  console.log(`[Enrichment] Fetching image: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Image not found for article ${articleId}: ${response.status} from ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

/**
 * Fetches an image and returns it as a base64 encoded string
 * Uses the configured strategy (s3 or filer)
 * Images are stored with path pattern: {first-2-chars}/{articleId}.jpg
 */
export async function fetchImageAsBase64(articleId: string): Promise<string> {
  if (imageStrategy === 'filer') {
    return fetchImageViaFiler(articleId);
  }
  return fetchImageViaS3(articleId);
}
