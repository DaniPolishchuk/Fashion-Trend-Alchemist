/**
 * Image Service
 * Fetches and uploads product images via SeaweedFS Filer HTTP
 */

import { filerConfig } from '@fashion/config';
import type { ImageView } from './imageGeneration.js';

/**
 * Fetches an image via HTTP Filer and returns it as base64
 */
export async function fetchImageAsBase64(articleId: string): Promise<string> {
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
 * Uploads a generated image via HTTP Filer
 * @param designId - The UUID of the generated design
 * @param imageBuffer - The image data as a Buffer
 * @returns The public URL of the uploaded image
 */
export async function uploadGeneratedImage(designId: string, imageBuffer: Buffer): Promise<string> {
  const filename = `${designId}.png`;
  const url = `${filerConfig.baseUrl}/${filerConfig.generatedBucket}/${filename}`;

  console.log(`[ImageGen] Uploading ${imageBuffer.length} bytes to filer: ${url}`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ImageGen] Upload failed:', {
      status: response.status,
      statusText: response.statusText,
      url,
      errorBody: errorText,
    });
    throw new Error(`Failed to upload image to filer: ${response.status} - ${errorText}`);
  }

  console.log(`[ImageGen] Image uploaded successfully to: ${url}`);

  // Verify upload by checking if file exists
  try {
    const verifyResponse = await fetch(url, { method: 'HEAD' });
    if (!verifyResponse.ok) {
      console.warn('[ImageGen] Upload verification failed - file may not be accessible');
    } else {
      console.log('[ImageGen] Upload verified successfully');
    }
  } catch (verifyError) {
    console.warn('[ImageGen] Could not verify upload:', verifyError);
  }

  return url;
}

/**
 * Uploads a generated image for a specific view (front/back/model)
 * @param designId - The UUID of the generated design
 * @param imageBuffer - The image data as a Buffer
 * @param view - The view type: 'front', 'back', or 'model'
 * @returns The public URL of the uploaded image
 */
export async function uploadGeneratedImageForView(
  designId: string,
  imageBuffer: Buffer,
  view: ImageView
): Promise<string> {
  const filename = `${designId}_${view}.png`;
  const url = `${filerConfig.baseUrl}/${filerConfig.generatedBucket}/${filename}`;

  console.log(`[ImageGen] Uploading ${view} view (${imageBuffer.length} bytes) to filer: ${url}`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ImageGen] Upload failed for ${view} view:`, {
      status: response.status,
      statusText: response.statusText,
      url,
      errorBody: errorText,
    });
    throw new Error(`Failed to upload ${view} image to filer: ${response.status} - ${errorText}`);
  }

  console.log(`[ImageGen] ${view} view uploaded successfully to: ${url}`);

  // Verify upload
  try {
    const verifyResponse = await fetch(url, { method: 'HEAD' });
    if (!verifyResponse.ok) {
      console.warn(`[ImageGen] Upload verification failed for ${view} view`);
    } else {
      console.log(`[ImageGen] ${view} view upload verified successfully`);
    }
  } catch (verifyError) {
    console.warn(`[ImageGen] Could not verify ${view} upload:`, verifyError);
  }

  return url;
}

/**
 * Uploads a generated image with retry logic
 * @param designId - The UUID of the generated design
 * @param imageBuffer - The image data as a Buffer
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns The public URL of the uploaded image
 */
export async function uploadGeneratedImageWithRetry(
  designId: string,
  imageBuffer: Buffer,
  maxRetries: number = 2
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[ImageGen] Upload retry attempt ${attempt}/${maxRetries}`);
        // Exponential backoff: 1s, 2s, 4s, etc.
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }

      return await uploadGeneratedImage(designId, imageBuffer);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[ImageGen] Upload attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  throw lastError || new Error('Upload failed after all retry attempts');
}

/**
 * Uploads a generated image for a specific view with retry logic
 * @param designId - The UUID of the generated design
 * @param imageBuffer - The image data as a Buffer
 * @param view - The view type: 'front', 'back', or 'model'
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns The public URL of the uploaded image
 */
export async function uploadGeneratedImageForViewWithRetry(
  designId: string,
  imageBuffer: Buffer,
  view: ImageView,
  maxRetries: number = 2
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[ImageGen] Upload retry attempt ${attempt}/${maxRetries} for ${view} view`);
        // Exponential backoff: 1s, 2s, 4s, etc.
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }

      return await uploadGeneratedImageForView(designId, imageBuffer, view);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[ImageGen] Upload attempt ${attempt + 1} for ${view} failed:`, lastError.message);
    }
  }

  throw lastError || new Error(`Upload failed for ${view} view after all retry attempts`);
}
