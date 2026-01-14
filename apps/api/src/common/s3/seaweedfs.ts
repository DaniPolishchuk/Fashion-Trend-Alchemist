/**
 * SeaweedFS image storage integration
 * Supports both S3 gateway (presigned URLs) and Filer HTTP (direct URLs)
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Config, filerConfig, imageConfig, imageStrategy, IMAGE_PATTERNS } from '@fashion/config';

/**
 * S3 client singleton
 * Configured for SeaweedFS S3 gateway with path-style addressing
 */
let s3Client: S3Client | null = null;

/**
 * Get or create S3 client instance
 * Lazy initialization pattern for better resource management
 * 
 * @returns Configured S3 client for SeaweedFS
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: s3Config.endpoint,
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      forcePathStyle: s3Config.forcePathStyle,
    });
  }
  return s3Client;
}

/**
 * Build S3 object key for article image
 * 
 * Follows the SeaweedFS folder structure convention:
 * - Folder name: first 2 digits of article_id
 * - File name: article_id.jpg
 * 
 * @param articleId - Article identifier (number or string)
 * @returns S3 object key in format "XX/XXXXXXXX.jpg"
 * 
 * @example
 * ```typescript
 * buildImageKey(108775015) // Returns "10/108775015.jpg"
 * buildImageKey("118458003") // Returns "11/118458003.jpg"
 * ```
 */
export function buildImageKey(articleId: number | string): string {
  const id = String(articleId);
  const folder = id.slice(0, IMAGE_PATTERNS.FOLDER_PREFIX_LENGTH);
  return `${folder}/${id}${IMAGE_PATTERNS.FILE_EXTENSION}`;
}

/**
 * Generate image URL (presigned S3 or direct Filer HTTP)
 * 
 * Strategy 1 (s3): Creates presigned URL via S3 gateway
 * Strategy 2 (filer): Creates direct HTTP URL via Filer at /buckets/images/...
 * 
 * @param articleId - Article identifier
 * @param expiresInSeconds - URL expiration (only used for S3 strategy)
 * @returns Promise resolving to image URL
 * 
 * @example
 * ```typescript
 * // S3 strategy: presigned URL
 * const url = await getImageUrl(108775015);
 * // Returns: "http://localhost:8333/images/10/108775015.jpg?X-Amz-..."
 * 
 * // Filer strategy: direct URL
 * const url = await getImageUrl(108775015);
 * // Returns: "http://localhost:8883/buckets/images/10/108775015.jpg"
 * ```
 */
export async function getImageUrl(
  articleId: number | string,
  expiresInSeconds: number = imageConfig.urlExpirationSeconds
): Promise<string> {
  const key = buildImageKey(articleId);
  
  if (imageStrategy === 'filer') {
    // Direct HTTP URL via Filer
    return `${filerConfig.baseUrl}/${filerConfig.bucket}/${key}`;
  } else {
    // Presigned URL via S3 gateway
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }
}

/**
 * Batch generate presigned URLs for multiple articles
 * 
 * Efficiently creates URLs for multiple images in parallel.
 * Useful for attaching image URLs to large result sets.
 * 
 * @param articleIds - Array of article identifiers
 * @param expiresInSeconds - URL expiration time
 * @returns Promise resolving to array of presigned URLs
 * 
 * @example
 * ```typescript
 * const urls = await getImageUrlsBatch([108775015, 118458003]);
 * // Returns array of URLs in same order as input IDs
 * ```
 */
export async function getImageUrlsBatch(
  articleIds: (number | string)[],
  expiresInSeconds: number = imageConfig.urlExpirationSeconds
): Promise<string[]> {
  return Promise.all(
    articleIds.map(id => getImageUrl(id, expiresInSeconds))
  );
}