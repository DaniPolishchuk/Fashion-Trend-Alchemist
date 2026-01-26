/**
 * Image Generation Service
 * Handles OAuth2 authentication and image generation API calls
 */

import { imageGenConfig } from '@fashion/config';

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Token cache
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// Cache duration: 11 hours (token valid for 12 hours, refresh 1 hour before expiry)
const TOKEN_CACHE_DURATION_MS = 11 * 60 * 60 * 1000;

// Image view types
export type ImageView = 'front' | 'back' | 'model';

/**
 * Get OAuth2 access token for image generation API
 * Caches token for 11 hours
 */
export async function getImageGenToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  // Create Basic Auth header
  const credentials = Buffer.from(
    `${imageGenConfig.clientId}:${imageGenConfig.clientSecret}`
  ).toString('base64');

  const response = await fetch(imageGenConfig.tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ImageGen] Failed to get OAuth token:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Image generation OAuth failed: ${response.statusText}`);
  }

  const tokenData = (await response.json()) as OAuthTokenResponse;

  // Cache the token
  cachedToken = tokenData.access_token;
  tokenExpiresAt = Date.now() + TOKEN_CACHE_DURATION_MS;

  console.log('[ImageGen] OAuth token obtained and cached');
  return cachedToken;
}

/**
 * Build base description from locked and predicted attributes
 */
function buildBaseDescription(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>
): string {
  const allAttributes = { ...lockedAttributes, ...predictedAttributes };

  // Remove internal keys (prefixed with _)
  const filteredAttributes = Object.entries(allAttributes).filter(([key]) => !key.startsWith('_'));

  // Extract key attribute values
  const getAttrValue = (keys: string[]): string | null => {
    for (const key of keys) {
      const entry = filteredAttributes.find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
      if (entry && entry[1]) return entry[1];
    }
    return null;
  };

  const productType = getAttrValue(['product_type', 'productType', 'type']) || 'clothing item';
  const color = getAttrValue(['color_family', 'colorFamily', 'color', 'specific_color']) || '';
  const pattern = getAttrValue(['pattern_style', 'patternStyle', 'pattern']) || '';
  const style = getAttrValue(['style_concept', 'styleConcept', 'style']) || '';
  const fabric = getAttrValue(['fabric_type', 'fabricType', 'fabric']) || '';

  // Build characteristics list from all attributes
  const characteristics: string[] = [];
  for (const [key, value] of filteredAttributes) {
    if (value && typeof value === 'string' && value.trim()) {
      // Format key: remove prefixes and convert to readable format
      const cleanKey = key
        .replace(/^(article_|ontology_\w+_)/, '')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase();
      characteristics.push(`${cleanKey}: ${value}`);
    }
  }

  return `A ${productType}${color ? ` in ${color}` : ''}${pattern ? ` with ${pattern} pattern` : ''}${style ? `, ${style} style` : ''}${fabric ? `, made of ${fabric}` : ''}.

Detailed characteristics:
${characteristics.map((c) => `- ${c}`).join('\n')}`;
}

/**
 * Build a view-specific prompt for image generation
 * @param lockedAttributes - Attributes with fixed values
 * @param predictedAttributes - AI-predicted attributes
 * @param view - The view to generate: 'front', 'back', or 'model'
 */
export function buildImagePromptForView(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  view: ImageView
): string {
  const baseDescription = buildBaseDescription(lockedAttributes, predictedAttributes);

  switch (view) {
    case 'front':
      return `Please generate the following piece of clothing:
${baseDescription}

View: Front view of the garment, flat lay on neutral background.
The image should show only the clothing item on a clean, neutral background.
DO NOT INCLUDE ANY BODY PARTS OR MANNEQUINS!!`;

    case 'back':
      return `Please generate the following piece of clothing:
${baseDescription}

View: Back view of the same garment, flat lay on neutral background.
Show the back design, any back details like zippers, pockets, or patterns.
The image should show only the clothing item on a clean, neutral background.
DO NOT INCLUDE ANY BODY PARTS OR MANNEQUINS!!`;

    case 'model':
      return `Please generate the following piece of clothing:
${baseDescription}

View: Full body shot of a fashion model wearing this exact garment.
Professional fashion photography style, neutral studio background.
Model should be standing in a natural pose, showing how the garment fits and drapes.`;
  }
}

/**
 * Build a descriptive prompt from locked and predicted attributes (legacy - defaults to front view)
 */
export function buildImagePrompt(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>
): string {
  return buildImagePromptForView(lockedAttributes, predictedAttributes, 'front');
}

/**
 * Generate an image using the image generation API
 * @param prompt - The text prompt describing the image to generate
 * @returns The generated image as a Buffer
 */
export async function generateImage(prompt: string): Promise<Buffer> {
  const token = await getImageGenToken();

  const requestBody = {
    prompt,
    width: imageGenConfig.imageWidth,
    height: imageGenConfig.imageHeight,
  };

  console.log('[ImageGen] Generating image with FULL prompt:');
  console.log('='.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80));

  const response = await fetch(imageGenConfig.apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ImageGen] API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Image generation failed: ${response.statusText}`);
  }

  // The API returns the image directly as binary data
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  console.log('[ImageGen] Image generated successfully, size:', imageBuffer.length, 'bytes');
  return imageBuffer;
}

/**
 * Generate image with retry logic
 * @param prompt - The text prompt describing the image to generate
 * @param maxRetries - Maximum number of retry attempts (default: 1)
 * @returns The generated image as a Buffer, or null if all attempts fail
 */
export async function generateImageWithRetry(
  prompt: string,
  maxRetries: number = 1
): Promise<Buffer | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[ImageGen] Retry attempt ${attempt}/${maxRetries}`);
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const imageBuffer = await generateImage(prompt);
      return imageBuffer;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[ImageGen] Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  console.error('[ImageGen] All retry attempts failed:', lastError?.message);
  return null;
}
