/**
 * Prompt Generation Service
 * Generates optimized image prompts for Z-Image Turbo using LLM
 */

import OpenAI from 'openai';
import { visionLlmConfig } from '@fashion/config';

// ==================== TYPES ====================

export interface CleanedProductData {
  productType: string;
  productCategory: ProductCategory;
  customerSegment: string | null;
  attributes: Record<string, string>;
}

export interface GeneratedPrompts {
  front: string;
  back: string;
  model: string;
}

export type ProductCategory =
  | 'Upper Body'
  | 'Lower Body'
  | 'Full Body'
  | 'Footwear'
  | 'Accessory'
  | 'Unknown';

export type ImageView = 'front' | 'back' | 'model';

// ==================== PRODUCT CATEGORY MAPPING ====================

const PRODUCT_CATEGORY_MAP: Record<string, ProductCategory> = {
  // Upper Body
  hoodie: 'Upper Body',
  shirt: 'Upper Body',
  't-shirt': 'Upper Body',
  tshirt: 'Upper Body',
  coat: 'Upper Body',
  jacket: 'Upper Body',
  blazer: 'Upper Body',
  sweater: 'Upper Body',
  cardigan: 'Upper Body',
  blouse: 'Upper Body',
  top: 'Upper Body',
  vest: 'Upper Body',
  polo: 'Upper Body',
  sweatshirt: 'Upper Body',
  pullover: 'Upper Body',
  tank: 'Upper Body',
  'tank-top': 'Upper Body',
  tunic: 'Upper Body',

  // Lower Body
  trousers: 'Lower Body',
  pants: 'Lower Body',
  jeans: 'Lower Body',
  skirt: 'Lower Body',
  shorts: 'Lower Body',
  leggings: 'Lower Body',
  chinos: 'Lower Body',
  culottes: 'Lower Body',

  // Full Body
  dress: 'Full Body',
  jumpsuit: 'Full Body',
  romper: 'Full Body',
  overalls: 'Full Body',
  bodysuit: 'Full Body',
  gown: 'Full Body',
  playsuit: 'Full Body',

  // Footwear
  shoes: 'Footwear',
  sneakers: 'Footwear',
  boots: 'Footwear',
  sandals: 'Footwear',
  heels: 'Footwear',
  loafers: 'Footwear',
  flats: 'Footwear',
  pumps: 'Footwear',
  mules: 'Footwear',
  slippers: 'Footwear',

  // Accessories
  bag: 'Accessory',
  handbag: 'Accessory',
  hat: 'Accessory',
  cap: 'Accessory',
  scarf: 'Accessory',
  belt: 'Accessory',
  gloves: 'Accessory',
  tie: 'Accessory',
  watch: 'Accessory',
  jewelry: 'Accessory',
  sunglasses: 'Accessory',
};

// ==================== LLM SYSTEM PROMPT ====================

const SYSTEM_PROMPT = `You are a fashion e-commerce image prompt specialist for Z-Image Turbo text-to-image AI.

## YOUR TASK
Generate exactly 3 image prompts (front, back, model) for a fashion product. Each prompt must follow the specific rules below.

## CRITICAL RULES

### RULE 1: PROMPT STRUCTURE
The first words must immediately establish the photography type and product. Never start with "Please generate" or similar phrasing.

### RULE 2: VIEW-SPECIFIC FORMATS

**FRONT VIEW:**
- For Upper Body garments: Use "Ghost mannequin fashion photography, front view of a [Color] [Material] [ProductType]"
- For Lower Body (pants/trousers/skirts): Use "Professional flat lay photography, overhead view of [Color] [Material] [ProductType]"
- For Full Body (dresses/jumpsuits): Use "Ghost mannequin fashion photography, front view of a [Color] [Material] [ProductType]"
- For Footwear: Use "Professional product photography, front three-quarter view of [Color] [Material] [ProductType]"
- Include: All front-facing details (buttons, pockets, collar, neckline, etc.)
- End with: "strictly clothing only, no human skin" (for ghost mannequin) or "Neatly arranged, strictly clothing only" (for flat lay)

**BACK VIEW:**
- For Upper Body garments: Use "Ghost mannequin fashion photography, back view of a [Color] [Material] [ProductType]"
- For Lower Body: Use "Professional flat lay photography, overhead back view of [Color] [Material] [ProductType]. The pants are laid flat face down"
- For Full Body: Use "Ghost mannequin fashion photography, back view of a [Color] [Material] [ProductType]"
- For Footwear: Use "Professional product photography, back view of [Color] [Material] [ProductType]"
- Include: Back panel, rear seams, back pockets (if applicable), hem
- MUST EXCLUDE: Front-only features (buttons, lapels, front pockets, fly, collar details, neckline)
- Add: "Strictly the back side, no front [relevant items] visible"

**MODEL VIEW:**
- Start with: "Fashion catalog photography, full body shot of a professional adult [male/female] model"
- Determine gender from customer_segment or style attributes:
  - Contains "Men" / "Male" / "Boys" / "Menswear" → male model
  - Contains "Women" / "Female" / "Girls" / "Ladies" / "Womenswear" → female model
  - Otherwise → make reasonable assumption based on product type
- CRITICAL - Add complementary garments based on product category:
  - Upper Body (hoodie, shirt, coat, jacket, sweater): Add "styled with neutral black trousers and dress shoes" (male) OR "styled with dark tailored trousers and heels" (female)
  - Lower Body (pants, trousers, skirt, shorts): Add "styled with a white dress shirt" (male) OR "styled with a white silk blouse" (female)
  - Full Body (dress, jumpsuit, romper): No additional clothing needed, but add appropriate footwear
  - Footwear: Add "styled with neutral dark jeans and a simple white top"
- Pose: "standing in a confident [casual/office/neutral] pose"

### RULE 3: MANDATORY SUFFIX
EVERY prompt must end with exactly:
"plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."

### RULE 4: ATTRIBUTE TRANSLATION
- Translate attribute keys to natural language (e.g., "pocket_type" → "pocket")
- Group related attributes into flowing sentences
- Use fashion terminology appropriately
- Prioritize visually important attributes (color, material, style, fit)

## OUTPUT FORMAT
Return ONLY valid JSON with this exact structure (no markdown code blocks, no explanation):
{
  "front": "...",
  "back": "...",
  "model": "..."
}

## EXAMPLES

### Example 1: Hoodie (Upper Body, Men)
Input:
- Product Type: Hoodie
- Category: Upper Body
- Customer Segment: Men Project
- Attributes: specific_color=Black, material=Cotton, fit=Regular fit, style=Classic Pullover, neckline=Round Neck, pocket_type=Kangaroo Pocket, hem_style=Ribbed Hem

Output:
{
  "front": "Ghost mannequin fashion photography, front view of a Black Cotton Hoodie. Classic pullover style with round neckline, featuring a kangaroo pocket. Regular fit with ribbed hem. Displayed on an invisible body to show natural drape and volume, strictly clothing only, no human skin. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Ghost mannequin fashion photography, back view of a Black Cotton Hoodie. Displayed on an invisible body, showing the solid rear fabric panel, back seams, and ribbed hem. Strictly the back side, no front pocket visible, smooth cotton texture. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult male model. He is styled with neutral black trousers and dress shoes, wearing a Black Cotton Hoodie which features a classic pullover style with round neckline and kangaroo pocket. Standing in a confident casual pose. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}

### Example 2: Trousers (Lower Body, Women)
Input:
- Product Type: Trousers
- Category: Lower Body
- Customer Segment: Women Casual
- Attributes: specific_color=Charcoal Grey, material=Wool Blend, fit=High-waisted, style=Wide-leg, details=Front pleats, back_pockets=Rear welt pockets

Output:
{
  "front": "Professional flat lay photography, overhead view of Charcoal Grey Wool Blend Trousers. The pants are laid flat on a white surface, smoothed out to show the High-waisted cut and Wide-leg silhouette. Front pleats and waistband details are clearly visible. Neatly arranged, strictly clothing only. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional flat lay photography, overhead back view of Charcoal Grey Wool Blend Trousers. The pants are laid flat face down, showing the rear welt pockets and the clean fabric drape over the seat. Wide-leg silhouette visible. Strictly the back side, no front fly visible, no buttons visible. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model. She is styled with a white silk blouse, wearing Charcoal Grey Wool Blend Trousers. The trousers have a High-waisted fit and wide leg. She is standing in a confident office pose. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}

### Example 3: Coat (Upper Body, Men)
Input:
- Product Type: Coat
- Category: Upper Body
- Customer Segment: Menswear
- Attributes: specific_color=Dark Blue, material=Wool, style=Double-breasted, collar=Notched Collar, sleeve_length=Long sleeves, length=Knee-length, fit=Regular fit

Output:
{
  "front": "Ghost mannequin fashion photography, front view of a Dark Blue Wool Coat. The garment features Double-breasted buttons, a Notched Collar, and Long sleeves. It has a Knee-length cut and Regular fit. Displayed on an invisible body to show natural drape and volume, strictly clothing only, no human skin. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Ghost mannequin fashion photography, back view of a Dark Blue Wool Coat. Displayed on an invisible body, showing the solid rear fabric panel, back seams, and Knee-length hem. Strictly the back side, no buttons visible, no lapels visible, smooth wool texture. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult male model. The model is styled with neutral black trousers and dress shoes, wearing a Dark Blue Wool Coat which features Double-breasted buttons and a Notched Collar. Standing in a confident neutral pose, hands by sides, looking at camera. plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}`;

// ==================== HELPER FUNCTIONS ====================

/**
 * Format product type from key format to display format
 * e.g., "t-shirt" → "T-Shirt", "hoodie" → "Hoodie"
 */
function formatProductType(key: string): string {
  return key
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-');
}

/**
 * Get product category from product type
 * Falls back to 'Unknown' if not in map
 */
function getProductCategory(productType: string): ProductCategory {
  const normalizedType = productType.toLowerCase().replace(/\s+/g, '-');

  // Direct lookup
  if (PRODUCT_CATEGORY_MAP[normalizedType]) {
    return PRODUCT_CATEGORY_MAP[normalizedType];
  }

  // Partial match (e.g., "slim fit jeans" should match "jeans")
  for (const [key, category] of Object.entries(PRODUCT_CATEGORY_MAP)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return category;
    }
  }

  return 'Unknown';
}

/**
 * Extract product type from locked, predicted, and context attributes
 * Priority: 1) article_product_type, 2) ontology keys (most frequent)
 */
function extractProductType(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
): { productType: string; confidence: 'high' | 'medium' | 'low'; allFound: string[] } {
  const allAttributes = {
    ...contextAttributes,
    ...lockedAttributes,
    ...predictedAttributes,
  };

  // Remove internal keys
  delete allAttributes['_targetSuccessScore'];

  // Method 1: Check article_product_type (highest priority - explicit)
  const articleProductType = allAttributes['article_product_type'];
  if (articleProductType) {
    return {
      productType: articleProductType,
      confidence: 'high',
      allFound: [articleProductType],
    };
  }

  // Method 2: Extract from ontology keys and count frequency
  const productTypeCounts: Record<string, number> = {};
  const ontologyKeys = Object.keys(allAttributes).filter((k) => k.startsWith('ontology_'));

  for (const key of ontologyKeys) {
    // Pattern: ontology_{productType}_{attribute}
    // productType can contain hyphens but not underscores
    const match = key.match(/^ontology_([^_]+(?:-[^_]+)*)_/);
    if (match) {
      const pt = match[1];
      productTypeCounts[pt] = (productTypeCounts[pt] || 0) + 1;
    }
  }

  const foundTypes = Object.keys(productTypeCounts);

  if (foundTypes.length === 0) {
    // No ontology keys found
    console.warn('[PromptGen] Could not determine product type, using fallback');
    return { productType: 'Fashion Item', confidence: 'low', allFound: [] };
  }

  if (foundTypes.length === 1) {
    // Single product type - ideal case
    const pt = foundTypes[0];
    return {
      productType: formatProductType(pt),
      confidence: 'high',
      allFound: foundTypes.map(formatProductType),
    };
  }

  // Multiple product types found - take the most frequent
  const sorted = foundTypes.sort((a, b) => productTypeCounts[b] - productTypeCounts[a]);
  const winner = sorted[0];

  console.warn(
    `[PromptGen] Multiple product types found: ${foundTypes.join(', ')}. Using most frequent: ${winner}`
  );

  return {
    productType: formatProductType(winner),
    confidence: 'medium',
    allFound: foundTypes.map(formatProductType),
  };
}

/**
 * Extract customer segment for model gender inference
 */
function extractCustomerSegment(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
): string | null {
  const allAttributes = {
    ...contextAttributes,
    ...lockedAttributes,
    ...predictedAttributes,
  };

  // Check various possible keys
  const segmentKeys = [
    'article_customer_segment',
    'customer_segment',
    'article_style_concept',
    'style_concept',
  ];

  for (const key of segmentKeys) {
    if (allAttributes[key]) {
      return allAttributes[key];
    }
  }

  return null;
}

/**
 * Clean attribute key to human-readable format
 * e.g., "ontology_hoodie_pocket_type" → "pocket_type"
 * e.g., "article_specific_color" → "specific_color"
 */
function cleanAttributeKey(key: string): string {
  // Remove ontology prefix (ontology_productType_)
  if (key.startsWith('ontology_')) {
    const withoutOntology = key.replace(/^ontology_[^_]+(?:-[^_]+)*_/, '');
    return withoutOntology;
  }

  // Remove article prefix
  if (key.startsWith('article_')) {
    return key.replace(/^article_/, '');
  }

  return key;
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Preprocess attributes into a clean structure for LLM prompt generation
 */
export function preprocessAttributes(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
): CleanedProductData {
  // Extract product type
  const { productType } = extractProductType(lockedAttributes, predictedAttributes, contextAttributes);

  // Get product category
  const productCategory = getProductCategory(productType);

  // Extract customer segment
  const customerSegment = extractCustomerSegment(
    lockedAttributes,
    predictedAttributes,
    contextAttributes
  );

  // Merge all attributes and clean keys
  const allAttributes = {
    ...contextAttributes,
    ...lockedAttributes,
    ...predictedAttributes,
  };

  // Clean attributes: remove prefixes and internal keys
  const cleanedAttributes: Record<string, string> = {};

  for (const [key, value] of Object.entries(allAttributes)) {
    // Skip internal keys
    if (key.startsWith('_')) continue;

    // Skip product type (already extracted)
    if (key === 'article_product_type') continue;

    // Skip customer segment (already extracted)
    if (key === 'article_customer_segment' || key === 'article_style_concept') continue;

    // Clean the key and add to attributes
    const cleanKey = cleanAttributeKey(key);
    if (value && value.trim()) {
      cleanedAttributes[cleanKey] = value.trim();
    }
  }

  return {
    productType,
    productCategory,
    customerSegment,
    attributes: cleanedAttributes,
  };
}

/**
 * Generate image prompts using LLM
 */
export async function generateImagePrompts(
  productData: CleanedProductData
): Promise<GeneratedPrompts> {
  // Initialize OpenAI client (using same config as enrichment)
  const openai = new OpenAI({
    apiKey: visionLlmConfig.apiKey,
    baseURL: visionLlmConfig.proxyUrl,
  });

  // Build user prompt with product data
  const attributesList = Object.entries(productData.attributes)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const userPrompt = `Generate image prompts for this product:

Product Type: ${productData.productType}
Product Category: ${productData.productCategory}
${productData.customerSegment ? `Customer Segment: ${productData.customerSegment}` : ''}

Attributes:
${attributesList || '- No specific attributes provided'}

Return ONLY the JSON object with front, back, and model prompts.`;

  console.log('[PromptGen] Calling LLM for prompt generation...');
  console.log('[PromptGen] Product:', productData.productType, '| Category:', productData.productCategory);

  const completion = await openai.chat.completions.create({
    model: visionLlmConfig.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const responseContent = completion.choices[0]?.message?.content || '';

  // Parse JSON from response
  // Try to extract JSON if wrapped in markdown code blocks
  let jsonString = responseContent.trim();

  // Remove markdown code blocks if present
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim();
  }

  const prompts = JSON.parse(jsonString) as GeneratedPrompts;

  // Validate structure
  if (!prompts.front || !prompts.back || !prompts.model) {
    throw new Error('Invalid prompt structure: missing front, back, or model');
  }

  console.log('[PromptGen] LLM prompts generated successfully');

  return prompts;
}

/**
 * Build fallback prompts when LLM fails
 */
function buildFallbackPrompts(productData: CleanedProductData): GeneratedPrompts {
  const { productType, productCategory, customerSegment, attributes } = productData;

  // Extract key visual attributes
  const color =
    attributes.specific_color ||
    attributes.color_family ||
    attributes.color ||
    '';
  const material =
    attributes.material ||
    attributes.fabric_type_base ||
    attributes.fabric ||
    '';

  const productDesc = [color, material, productType].filter(Boolean).join(' ');

  const suffix =
    'plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.';

  // Determine model gender
  const isMale =
    customerSegment?.toLowerCase().includes('men') ||
    customerSegment?.toLowerCase().includes('male') ||
    customerSegment?.toLowerCase().includes('boy');
  const gender = isMale ? 'male' : 'female';
  const pronoun = isMale ? 'He' : 'She';

  // Build view-specific prompts based on category
  let front: string;
  let back: string;
  let model: string;

  switch (productCategory) {
    case 'Lower Body':
      front = `Professional flat lay photography, overhead view of ${productDesc}. The pants are laid flat on a white surface, showing the front details. Neatly arranged, strictly clothing only. ${suffix}`;
      back = `Professional flat lay photography, overhead back view of ${productDesc}. The pants are laid flat face down, showing the back panel. Strictly the back side. ${suffix}`;
      model = `Fashion catalog photography, full body shot of a professional adult ${gender} model. ${pronoun} is styled with a white ${isMale ? 'dress shirt' : 'silk blouse'}, wearing ${productDesc}. Standing in a confident pose. ${suffix}`;
      break;

    case 'Full Body':
      front = `Ghost mannequin fashion photography, front view of a ${productDesc}. Displayed on an invisible body to show natural drape and silhouette, strictly clothing only, no human skin. ${suffix}`;
      back = `Ghost mannequin fashion photography, back view of a ${productDesc}. Displayed on an invisible body, showing the back panel and details. Strictly the back side. ${suffix}`;
      model = `Fashion catalog photography, full body shot of a professional adult ${gender} model wearing ${productDesc}. Standing in an elegant pose. ${suffix}`;
      break;

    case 'Footwear':
      front = `Professional product photography, front three-quarter view of ${productDesc}. Clean presentation showing design details. ${suffix}`;
      back = `Professional product photography, back view of ${productDesc}. Showing heel and back details. ${suffix}`;
      model = `Fashion catalog photography, cropped shot focusing on feet of a model wearing ${productDesc}, styled with neutral dark jeans. ${suffix}`;
      break;

    case 'Upper Body':
    default:
      front = `Ghost mannequin fashion photography, front view of a ${productDesc}. Displayed on an invisible body to show natural drape and volume, strictly clothing only, no human skin. ${suffix}`;
      back = `Ghost mannequin fashion photography, back view of a ${productDesc}. Displayed on an invisible body, showing the rear panel. Strictly the back side, no front details visible. ${suffix}`;
      model = `Fashion catalog photography, full body shot of a professional adult ${gender} model. ${pronoun} is styled with neutral black trousers, wearing ${productDesc}. Standing in a confident pose. ${suffix}`;
      break;
  }

  return { front, back, model };
}

/**
 * Result type for prompt generation with source info
 */
export interface PromptGenerationResult {
  prompts: GeneratedPrompts;
  source: 'llm' | 'fallback';
}

/**
 * Generate image prompts with retry and fallback logic
 * Main entry point for the service
 */
export async function generateImagePromptsWithFallback(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
): Promise<PromptGenerationResult> {
  // Preprocess attributes
  const productData = preprocessAttributes(
    lockedAttributes,
    predictedAttributes,
    contextAttributes
  );

  console.log('[PromptGen] Preprocessed product data:', {
    productType: productData.productType,
    productCategory: productData.productCategory,
    customerSegment: productData.customerSegment,
    attributeCount: Object.keys(productData.attributes).length,
  });

  // Try LLM generation with retry
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const prompts = await generateImagePrompts(productData);
      return { prompts, source: 'llm' };
    } catch (error) {
      console.error(`[PromptGen] LLM attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (attempt < MAX_RETRIES) {
        console.log('[PromptGen] Retrying...');
        // Small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Fallback to static prompts
  console.warn('[PromptGen] LLM failed after retries, using fallback prompts');
  return { prompts: buildFallbackPrompts(productData), source: 'fallback' };
}
