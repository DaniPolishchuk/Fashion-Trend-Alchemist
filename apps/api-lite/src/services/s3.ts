/**
 * Image Service
 * Fetches and uploads product images via SeaweedFS Filer HTTP
 */

import { filerConfig } from '@fashion/config';

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
 * Deletes a generated image from SeaweedFS
 * @param designId - The UUID of the generated design
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteGeneratedImage(designId: string): Promise<boolean> {
  const filename = `${designId}.png`;
  const url = `${filerConfig.baseUrl}/${filerConfig.generatedBucket}/${filename}`;

  console.log(`[ImageCleanup] Deleting image from filer: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log(`[ImageCleanup] Image deleted successfully: ${designId}`);
      return true;
    } else if (response.status === 404) {
      console.warn(`[ImageCleanup] Image not found (already deleted?): ${designId}`);
      return true; // Consider 404 as success - image doesn't exist anyway
    } else {
      const errorText = await response.text();
      console.error(`[ImageCleanup] Failed to delete image:`, {
        designId,
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
      });
      return false;
    }
  } catch (error) {
    console.error(`[ImageCleanup] Error deleting image:`, {
      designId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Deletes a generated image with retry logic
 * @param designId - The UUID of the generated design
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns True if deletion was successful, false if all attempts failed
 */
export async function deleteGeneratedImageWithRetry(
  designId: string,
  maxRetries: number = 2
): Promise<boolean> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[ImageCleanup] Delete retry attempt ${attempt}/${maxRetries} for ${designId}`);
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }

      const success = await deleteGeneratedImage(designId);
      if (success) {
        return true;
      }
    } catch (error) {
      console.error(
        `[ImageCleanup] Delete attempt ${attempt + 1} failed:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.error(`[ImageCleanup] All delete attempts failed for ${designId}`);
  return false;
}
