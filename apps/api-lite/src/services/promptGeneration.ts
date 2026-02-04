/**
 * Prompt Generation Service
 * Generates optimized image prompts for Z-Image Turbo using LLM
 *
 * This service uses a structured component-based approach where the LLM generates
 * separate components that are assembled with a shared product description to
 * ensure visual consistency across front, back, and model views.
 */

import OpenAI from 'openai';
import { visionLlmConfig } from '@fashion/config';
import {
  type PhotographyCategory,
  type ModelProfile,
  getPhotographyCategory,
  getModelProfile,
  buildSystemPrompt,
  QUALITY_SUFFIX,
} from './promptConfig/index.js';

// Re-export types for consumers
export type { PhotographyCategory, ModelProfile };

// ==================== TYPES ====================

/**
 * Structured components returned by the LLM
 */
export interface PromptComponents {
  productDescription: string;
  frontPrefix: string;
  backPrefix: string;
  modelPrefix: string;
  frontDetails: string;
  backDetails: string;
  modelDetails: string;
}

/**
 * Final assembled prompts for image generation
 */
export interface GeneratedPrompts {
  front: string;
  back: string;
  model: string;
}

/**
 * Preprocessed product data for prompt generation
 */
export interface ProductData {
  productGroup: string | null;
  productType: string;
  customerSegment: string | null;
  photographyCategory: PhotographyCategory;
  modelProfile: ModelProfile;
  attributes: Record<string, string>;
}

/**
 * Result type for prompt generation with source info
 */
export interface PromptGenerationResult {
  prompts: GeneratedPrompts;
  source: 'llm' | 'fallback';
}

export type ImageView = 'front' | 'back' | 'model';

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
 * Extract product group from attributes
 */
function extractProductGroup(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
): string | null {
  const allAttributes = {
    ...contextAttributes,
    ...lockedAttributes,
    ...predictedAttributes,
  };

  // Check for product group in attributes
  const groupKeys = ['article_product_group', 'product_group'];
  for (const key of groupKeys) {
    if (allAttributes[key]) {
      return allAttributes[key];
    }
  }

  return null;
}

/**
 * Extract product type from locked, predicted, and context attributes
 * Priority: 1) article_product_type, 2) ontology keys (most frequent)
 */
function extractProductType(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
): string {
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
    return articleProductType;
  }

  // Method 2: Extract from ontology keys and count frequency
  const productTypeCounts: Record<string, number> = {};
  const ontologyKeys = Object.keys(allAttributes).filter((k) => k.startsWith('ontology_'));

  for (const key of ontologyKeys) {
    // Pattern: ontology_{productType}_{attribute}
    const match = key.match(/^ontology_([^_]+(?:-[^_]+)*)_/);
    if (match) {
      const pt = match[1];
      productTypeCounts[pt] = (productTypeCounts[pt] || 0) + 1;
    }
  }

  const foundTypes = Object.keys(productTypeCounts);

  if (foundTypes.length === 0) {
    console.warn('[PromptGen] Could not determine product type, using fallback');
    return 'Fashion Item';
  }

  if (foundTypes.length === 1) {
    return formatProductType(foundTypes[0]);
  }

  // Multiple product types found - take the most frequent
  const sorted = foundTypes.sort((a, b) => productTypeCounts[b] - productTypeCounts[a]);
  console.warn(
    `[PromptGen] Multiple product types found: ${foundTypes.join(', ')}. Using most frequent: ${sorted[0]}`
  );

  return formatProductType(sorted[0]);
}

/**
 * Extract customer segment for model profile
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

  const segmentKeys = [
    'article_customer_segment',
    'customer_segment',
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

/**
 * Clean all attributes and remove internal/metadata keys
 */
function cleanAttributes(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
): Record<string, string> {
  const allAttributes = {
    ...contextAttributes,
    ...lockedAttributes,
    ...predictedAttributes,
  };

  const cleanedAttributes: Record<string, string> = {};

  for (const [key, value] of Object.entries(allAttributes)) {
    // Skip internal keys
    if (key.startsWith('_')) continue;

    // Skip product type/group/segment (handled separately)
    if (key === 'article_product_type') continue;
    if (key === 'article_product_group') continue;
    if (key === 'article_customer_segment') continue;

    // Clean the key and add to attributes
    const cleanKey = cleanAttributeKey(key);
    if (value && value.trim()) {
      cleanedAttributes[cleanKey] = value.trim();
    }
  }

  return cleanedAttributes;
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Preprocess attributes into a structured ProductData object
 */
export function preprocessProductData(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
): ProductData {
  const productGroup = extractProductGroup(lockedAttributes, predictedAttributes, contextAttributes);
  const productType = extractProductType(lockedAttributes, predictedAttributes, contextAttributes);
  const customerSegment = extractCustomerSegment(lockedAttributes, predictedAttributes, contextAttributes);

  const photographyCategory = getPhotographyCategory(productGroup, productType);
  const modelProfile = getModelProfile(customerSegment);

  const attributes = cleanAttributes(lockedAttributes, predictedAttributes, contextAttributes);

  return {
    productGroup,
    productType,
    customerSegment,
    photographyCategory,
    modelProfile,
    attributes,
  };
}

/**
 * Assemble final prompts from components
 */
export function assemblePrompts(components: PromptComponents): GeneratedPrompts {
  return {
    front: `${components.frontPrefix} ${components.productDescription}. ${components.frontDetails}. ${QUALITY_SUFFIX}`,
    back: `${components.backPrefix} ${components.productDescription}. ${components.backDetails}. ${QUALITY_SUFFIX}`,
    model: `${components.modelPrefix} ${components.productDescription}. ${components.modelDetails}. ${QUALITY_SUFFIX}`,
  };
}

/**
 * Generate prompt components using LLM
 */
async function generatePromptComponents(productData: ProductData): Promise<PromptComponents> {
  const openai = new OpenAI({
    apiKey: visionLlmConfig.apiKey,
    baseURL: visionLlmConfig.proxyUrl,
  });

  // Build system prompt with category-specific rules
  const systemPrompt = buildSystemPrompt(
    productData.photographyCategory,
    productData.modelProfile.descriptor
  );

  // Build user prompt with product data
  const attributesList = Object.entries(productData.attributes)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const userPrompt = `Generate prompt components for this product:

Product Group: ${productData.productGroup || 'Unknown'}
Product Type: ${productData.productType}
Customer Segment: ${productData.customerSegment || 'Unknown'}
Photography Category: ${productData.photographyCategory}

All Attributes (include ALL in productDescription):
${attributesList || '- No specific attributes provided'}

Return ONLY the JSON object with the structured components.`;

  console.log('[PromptGen] Calling LLM for prompt generation...');
  console.log('[PromptGen] Product:', productData.productType);
  console.log('[PromptGen] Category:', productData.photographyCategory);
  console.log('[PromptGen] Model Profile:', productData.modelProfile.descriptor);

  const completion = await openai.chat.completions.create({
    model: visionLlmConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const responseContent = completion.choices[0]?.message?.content || '';

  // Parse JSON from response
  let jsonString = responseContent.trim();

  // Remove markdown code blocks if present
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim();
  }

  const components = JSON.parse(jsonString) as PromptComponents;

  // Validate structure
  const requiredFields: (keyof PromptComponents)[] = [
    'productDescription',
    'frontPrefix',
    'backPrefix',
    'modelPrefix',
    'frontDetails',
    'backDetails',
    'modelDetails',
  ];

  for (const field of requiredFields) {
    if (!components[field]) {
      throw new Error(`Invalid component structure: missing ${field}`);
    }
  }

  console.log('[PromptGen] LLM components generated successfully');
  const truncatedDesc = components.productDescription.length > 100
    ? components.productDescription.substring(0, 100) + '...'
    : components.productDescription;
  console.log('[PromptGen] Product description:', truncatedDesc);

  return components;
}

/**
 * Build fallback prompt components when LLM fails
 */
function buildFallbackComponents(productData: ProductData): PromptComponents {
  const { productType, photographyCategory, modelProfile, attributes } = productData;

  // Extract key visual attributes
  const color = attributes.specific_color || attributes.color_family || attributes.color || '';
  const material = attributes.material || attributes.fabric_type_base || attributes.fabric || '';
  const fit = attributes.fit || '';
  const style = attributes.style || '';

  // Build product description from attributes
  const descParts = [color, material, fit, style, productType].filter(Boolean);
  const productDescription = descParts.join(' ');

  // Build remaining attribute details
  const otherAttrs = Object.entries(attributes)
    .filter(([key]) => !['specific_color', 'color_family', 'color', 'material', 'fabric_type_base', 'fabric', 'fit', 'style'].includes(key))
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
    .join(', ');

  const productDescWithDetails = otherAttrs
    ? `${productDescription} with ${otherAttrs}`
    : productDescription;

  // Category-specific prefixes and details
  switch (photographyCategory) {
    case 'footwear':
      return {
        productDescription: productDescWithDetails,
        frontPrefix: 'Professional footwear photography, front three-quarter view of',
        backPrefix: 'Professional footwear photography, back view of',
        modelPrefix: `Fashion photography, cropped shot from mid-thigh down of ${modelProfile.descriptor} wearing`,
        frontDetails: 'Displayed as a pair with one shoe slightly forward',
        backDetails: 'Pair shown from behind highlighting heel and sole profile',
        modelDetails: 'Styled with dark jeans, standing in a natural pose',
      };

    case 'accessories':
      return {
        productDescription: productDescWithDetails,
        frontPrefix: 'Professional product photography, front three-quarter view of',
        backPrefix: 'Professional product photography, back view of',
        modelPrefix: `Fashion photography, shot of ${modelProfile.descriptor} styled with`,
        frontDetails: 'Showing main design details and construction',
        backDetails: 'Showing rear panel and construction details',
        modelDetails: 'Accessory as focal point, clean minimal styling',
      };

    case 'non_wearable':
      return {
        productDescription: productDescWithDetails,
        frontPrefix: 'Professional product photography, front view of',
        backPrefix: 'Professional product photography, alternate angle of',
        modelPrefix: 'Lifestyle photography featuring',
        frontDetails: 'Clean product shot showing main features',
        backDetails: 'Showing back panel and secondary details',
        modelDetails: 'Product styled in appropriate context, warm natural lighting',
      };

    case 'wearable':
    default: {
      // Check if it's pants/trousers for flat lay
      const isLowerBody = productType.toLowerCase().match(/trouser|pant|jean|short|skirt|legging/);

      if (isLowerBody) {
        return {
          productDescription: productDescWithDetails,
          frontPrefix: 'Professional flat lay photography, overhead view of',
          backPrefix: 'Professional flat lay photography, overhead back view of',
          modelPrefix: `Fashion photography, full body shot of ${modelProfile.descriptor} wearing`,
          frontDetails: 'Laid flat on white surface, neatly pressed, strictly product only',
          backDetails: 'Laid flat face down on white surface, strictly the back side',
          modelDetails: 'Styled with a neutral top, standing in a natural pose',
        };
      }

      return {
        productDescription: productDescWithDetails,
        frontPrefix: 'Ghost mannequin fashion photography, front view of',
        backPrefix: 'Ghost mannequin fashion photography, back view of',
        modelPrefix: `Fashion photography, full body shot of ${modelProfile.descriptor} wearing`,
        frontDetails: 'Displayed on invisible form, strictly product only, no human skin visible',
        backDetails: 'Displayed on invisible form showing rear panel, strictly the back side',
        modelDetails: 'Styled with neutral complementary garments, standing in a natural pose',
      };
    }
  }
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
  // Preprocess product data
  const productData = preprocessProductData(
    lockedAttributes,
    predictedAttributes,
    contextAttributes
  );

  console.log('[PromptGen] Preprocessed product data:', {
    productGroup: productData.productGroup,
    productType: productData.productType,
    customerSegment: productData.customerSegment,
    photographyCategory: productData.photographyCategory,
    modelDescriptor: productData.modelProfile.descriptor,
    attributeCount: Object.keys(productData.attributes).length,
  });

  // Try LLM generation with retry
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const components = await generatePromptComponents(productData);
      const prompts = assemblePrompts(components);
      return { prompts, source: 'llm' };
    } catch (error) {
      console.error(`[PromptGen] LLM attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (attempt < MAX_RETRIES) {
        console.log('[PromptGen] Retrying...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Fallback to template-based prompts
  console.warn('[PromptGen] LLM failed after retries, using fallback prompts');
  const fallbackComponents = buildFallbackComponents(productData);
  const prompts = assemblePrompts(fallbackComponents);
  return { prompts, source: 'fallback' };
}

// ==================== LEGACY EXPORTS (for backward compatibility) ====================

/**
 * @deprecated Use preprocessProductData instead
 */
export function preprocessAttributes(
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  contextAttributes?: Record<string, string>
) {
  const productData = preprocessProductData(lockedAttributes, predictedAttributes, contextAttributes);

  // Map to legacy format
  type LegacyCategory = 'Upper Body' | 'Lower Body' | 'Full Body' | 'Footwear' | 'Accessory' | 'Unknown';
  const categoryMap: Record<PhotographyCategory, LegacyCategory> = {
    wearable: 'Upper Body',
    footwear: 'Footwear',
    accessories: 'Accessory',
    non_wearable: 'Unknown',
  };

  return {
    productType: productData.productType,
    productCategory: categoryMap[productData.photographyCategory],
    customerSegment: productData.customerSegment,
    attributes: productData.attributes,
  };
}
