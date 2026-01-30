/**
 * Sales Text Generation Service
 * Handles AI-powered sales copy generation for fashion designs
 * Uses GPT-4o for text generation with optional image context
 */

import OpenAI from 'openai';
import { visionLlmConfig } from '@fashion/config';

// Initialize OpenAI client with LiteLLM proxy
const openai = new OpenAI({
  baseURL: visionLlmConfig.proxyUrl,
  apiKey: visionLlmConfig.apiKey,
});

// Structure for sales text output from LLM
interface SalesTextStructure {
  headline: string;
  description: string;
  keyFeatures: string[];
  stylingTips?: string;
}

/**
 * Generate sales text for a fashion design
 * @param productType - Type of product (e.g., "coat", "dress")
 * @param lockedAttributes - User-defined/locked design attributes
 * @param predictedAttributes - AI-predicted design attributes
 * @param targetSuccessScore - Target success score (0-100)
 * @param imageBase64 - Optional base64 image for visual context
 * @returns Formatted sales text string
 */
export async function generateSalesText(
  productType: string,
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  targetSuccessScore: number,
  imageBase64?: string
): Promise<string> {
  // Combine all attributes, filtering out internal keys
  const allAttributes = { ...lockedAttributes, ...predictedAttributes };
  const filteredAttributes = Object.entries(allAttributes).filter(([key]) => !key.startsWith('_'));

  // Build the prompt
  const prompt = buildSalesTextPrompt(
    productType,
    filteredAttributes,
    targetSuccessScore,
    !!imageBase64
  );

  // Prepare messages for ChatCompletion
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are an expert fashion copywriter specializing in trend-forward, aspirational product descriptions that convert browsers into buyers.',
    },
  ];

  // Add user message with optional image
  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
        },
      ],
    });
  } else {
    messages.push({
      role: 'user',
      content: prompt,
    });
  }

  // Call GPT-4o
  const response = await openai.chat.completions.create({
    model: visionLlmConfig.model,
    messages,
    response_format: { type: 'json_object' },
    max_tokens: 800,
    temperature: 0.7, // Slightly creative for engaging marketing copy
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No sales text generated from LLM');
  }

  try {
    const parsed: SalesTextStructure = JSON.parse(content);
    return formatSalesText(parsed);
  } catch (parseError) {
    throw new Error(`Failed to parse LLM sales text response: ${content.slice(0, 200)}...`);
  }
}

/**
 * Build the prompt for sales text generation
 */
function buildSalesTextPrompt(
  productType: string,
  attributes: Array<[string, string]>,
  targetScore: number,
  hasImage: boolean
): string {
  // Format attributes for the prompt
  const attrList = attributes
    .map(([key, value]) => {
      // Clean up attribute key for readability
      const cleanKey = key
        .replace(/^(article_|ontology_\w+_)/, '') // Remove prefixes
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces before capitals
        .toLowerCase();
      return `- ${cleanKey}: ${value}`;
    })
    .join('\n');

  // Determine trend messaging based on score
  const trendLevel =
    targetScore >= 80 ? 'high-trend' : targetScore >= 60 ? 'moderate-trend' : 'classic';

  return `Create compelling sales copy for a ${productType} predicted to be a best-seller.

PRODUCT TYPE: ${productType}

DESIGN ATTRIBUTES:
${attrList}

TREND SCORE: ${targetScore}/100 (This indicates ${trendLevel} appeal)

${hasImage ? 'IMAGE CONTEXT: Use the provided product image to describe specific visual details, fit, styling, and overall aesthetic appeal.' : ''}

Generate a JSON object with exactly this structure:
{
  "headline": "Catchy 5-10 word headline emphasizing key appeal and desirability",
  "description": "2-3 compelling sentences describing the product, its design story, and why customers will love it",
  "keyFeatures": ["Specific feature 1", "Specific feature 2", "Specific feature 3", "Specific feature 4"],
  "stylingTips": "1-2 sentences on how to wear and style this piece for maximum impact"
}

STYLE GUIDELINES:
- Use aspirational yet authentic tone
- Emphasize quality, craftsmanship, and trend alignment
- Include specific details from the attributes (colors, fabrics, cuts)
- Avoid generic phrases like "perfect for any occasion"
- Make it feel exclusive and desirable
${targetScore >= 80 ? '- Highlight that this is a trending, high-demand design that fashion-forward customers are seeking' : ''}
${targetScore < 60 ? '- Position as a timeless, versatile piece with enduring style' : ''}

Focus on benefits and emotional appeal, not just features.`;
}

/**
 * Format the structured response into markdown sales text
 */
function formatSalesText(data: SalesTextStructure): string {
  const sections: string[] = [];

  // Headline as H2 markdown
  sections.push(`## ${data.headline}`);

  // Description
  sections.push('');
  sections.push(data.description);

  // Key features as markdown list
  if (data.keyFeatures && data.keyFeatures.length > 0) {
    sections.push('');
    sections.push('**KEY FEATURES:**');
    data.keyFeatures.forEach((feature) => {
      sections.push(`- ${feature}`);
    });
  }

  // Styling tips in italic
  if (data.stylingTips) {
    sections.push('');
    sections.push(`*STYLING: ${data.stylingTips}*`);
  }

  return sections.join('\n');
}

/**
 * Generate sales text with retry logic
 * @param maxRetries - Maximum number of retry attempts (default: 1)
 * @returns Generated sales text, or null if all attempts fail
 */
export async function generateSalesTextWithRetry(
  productType: string,
  lockedAttributes: Record<string, string>,
  predictedAttributes: Record<string, string>,
  targetSuccessScore: number,
  imageBase64?: string,
  maxRetries: number = 1
): Promise<string | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[SalesText] Retry attempt ${attempt}/${maxRetries}`);
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const salesText = await generateSalesText(
        productType,
        lockedAttributes,
        predictedAttributes,
        targetSuccessScore,
        imageBase64
      );

      return salesText;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[SalesText] Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  console.error('[SalesText] All retry attempts failed:', lastError?.message);
  return null;
}
