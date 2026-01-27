/**
 * Enrichment Service
 * Handles Vision LLM-based attribute extraction from product images
 * Uses parallel processing with configurable concurrency
 */

import OpenAI from 'openai';
import pMap from 'p-map';
import { db, eq, and, projects, projectContextItems, articles, isNull } from '@fashion/db';
import { visionLlmConfig, enrichmentConfig } from '@fashion/config';
import { fetchImageAsBase64 } from './s3.js';

// Initialize OpenAI client with LiteLLM proxy
const openai = new OpenAI({
  baseURL: visionLlmConfig.proxyUrl,
  apiKey: visionLlmConfig.apiKey,
});

// Type for ontology schema structure
type OntologySchema = Record<string, Record<string, string[]>>;

// Type for progress callback
export type ProgressCallback = (data: {
  processed: number;
  total: number;
  currentArticleId: string;
}) => void;

// Type for enrichment item
type EnrichmentItem = {
  articleId: string;
  productType: string;
  detailDesc: string | null;
};

// Type for enrichment result including mismatch confidence
type EnrichmentResult = {
  attributes: Record<string, string>;
  mismatchConfidence: number;
};

/**
 * Builds a JSON Schema from the ontology schema for structured LLM output
 * Includes mismatchConfidence for product type verification
 */
function buildDynamicSchema(ontologySchema: OntologySchema): {
  type: string;
  properties: Record<string, { type: string; enum?: string[]; description: string; minimum?: number; maximum?: number }>;
  required: string[];
} {
  const properties: Record<string, { type: string; enum?: string[]; description: string; minimum?: number; maximum?: number }> = {};

  for (const [productType, attributes] of Object.entries(ontologySchema)) {
    for (const [attrName, variants] of Object.entries(attributes)) {
      properties[attrName] = {
        type: 'string',
        enum: variants,
        description: `The ${attrName} of the ${productType}`,
      };
    }
  }

  // Add mismatchConfidence to detect product type mismatches
  properties['mismatchConfidence'] = {
    type: 'integer',
    minimum: 0,
    maximum: 100,
    description: 'Confidence score (0-100) indicating likelihood that the image does NOT match the expected product type. 0-59: matches expected type, 60-79: questionable, 80-89: likely different, 90-100: clearly different category',
  };

  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
  };
}

/**
 * Sanitizes LLM response to extract pure JSON
 * Handles markdown code blocks and other formatting
 */
function sanitizeJsonResponse(content: string): string {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = content.trim();

  // Match and extract content from code blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  return cleaned;
}

/**
 * Calls the Vision LLM to extract attributes from a product image
 * Also detects potential product type mismatches
 */
async function callVisionLLM(
  base64Image: string,
  schema: ReturnType<typeof buildDynamicSchema>,
  articleData: { productType: string; detailDesc: string | null }
): Promise<EnrichmentResult> {
  // Build schema description excluding mismatchConfidence (handled separately)
  const attributeEntries = Object.entries(schema.properties).filter(([key]) => key !== 'mismatchConfidence');
  const schemaDescription = attributeEntries
    .map(([key, val]) => `- ${key}: one of [${val.enum?.join(', ') || 'any value'}]`)
    .join('\n');

  const prompt = `Analyze this fashion product image and extract attributes according to the schema below.

CONTEXT:
- Expected Product Type: ${articleData.productType}
- Description: ${articleData.detailDesc || 'No description available'}

ATTRIBUTES TO EXTRACT:
${schemaDescription}

MISMATCH DETECTION:
Also assess whether the image matches the expected product type (${articleData.productType}).
Provide a mismatchConfidence score (0-100):
- 0-59: Image clearly shows the expected product type
- 60-79: Questionable - could fit but uncertain
- 80-89: Likely a different product type than expected
- 90-100: Clearly a different product category (e.g., expecting "skirt" but seeing "pants")

Return a JSON object with:
1. All the attributes listed above with appropriate values
2. A "mismatchConfidence" field with your confidence score (integer 0-100)`;

  const response = await openai.chat.completions.create({
    model: visionLlmConfig.model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response content from Vision LLM');
  }

  try {
    const sanitized = sanitizeJsonResponse(content);
    const parsed = JSON.parse(sanitized);

    // Extract mismatchConfidence and separate attributes
    const { mismatchConfidence, ...attributes } = parsed;

    return {
      attributes,
      mismatchConfidence: typeof mismatchConfidence === 'number'
        ? Math.max(0, Math.min(100, Math.round(mismatchConfidence)))
        : 0,
    };
  } catch (parseError) {
    throw new Error(`Failed to parse LLM response as JSON. Content: ${content.slice(0, 200)}...`);
  }
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get unenriched context items for a project
 */
async function getUnenrichedContextItems(projectId: string) {
  return db
    .select({
      articleId: projectContextItems.articleId,
      productType: articles.productType,
      detailDesc: articles.detailDesc,
    })
    .from(projectContextItems)
    .innerJoin(articles, eq(projectContextItems.articleId, articles.articleId))
    .where(
      and(
        eq(projectContextItems.projectId, projectId),
        isNull(projectContextItems.enrichedAttributes),
        isNull(projectContextItems.enrichmentError)
      )
    );
}

/**
 * Update enriched attributes and mismatch confidence for a context item
 */
async function updateEnrichedAttributes(
  projectId: string,
  articleId: string,
  result: EnrichmentResult
) {
  await db
    .update(projectContextItems)
    .set({
      enrichedAttributes: result.attributes,
      mismatchConfidence: result.mismatchConfidence,
    })
    .where(
      and(
        eq(projectContextItems.projectId, projectId),
        eq(projectContextItems.articleId, articleId)
      )
    );
}

/**
 * Mark a context item as failed with error message
 */
async function markItemFailed(projectId: string, articleId: string, errorMessage: string) {
  await db
    .update(projectContextItems)
    .set({ enrichmentError: errorMessage.slice(0, 1000) })
    .where(
      and(
        eq(projectContextItems.projectId, projectId),
        eq(projectContextItems.articleId, articleId)
      )
    );
}

/**
 * Update project enrichment progress
 */
async function updateProjectProgress(
  projectId: string,
  processed: number,
  total: number,
  currentArticleId: string
) {
  await db
    .update(projects)
    .set({
      enrichmentProcessed: processed,
      enrichmentTotal: total,
      enrichmentCurrentArticleId: currentArticleId,
    })
    .where(eq(projects.id, projectId));
}

/**
 * Mark project enrichment as completed
 */
async function markProjectCompleted(projectId: string) {
  await db
    .update(projects)
    .set({
      enrichmentStatus: 'completed',
      enrichmentCompletedAt: new Date(),
      enrichmentCurrentArticleId: null,
    })
    .where(eq(projects.id, projectId));
}

/**
 * Mark project enrichment as failed
 */
async function markProjectFailed(projectId: string) {
  await db
    .update(projects)
    .set({
      enrichmentStatus: 'failed',
      enrichmentCurrentArticleId: null,
    })
    .where(eq(projects.id, projectId));
}

/**
 * Process a single item with retry logic
 * Returns true on success, false on failure (failure is recorded in DB)
 */
async function processItem(
  projectId: string,
  item: EnrichmentItem,
  schema: ReturnType<typeof buildDynamicSchema>
): Promise<boolean> {
  try {
    let result: EnrichmentResult | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const base64Image = await fetchImageAsBase64(item.articleId);
        result = await callVisionLLM(base64Image, schema, {
          productType: item.productType,
          detailDesc: item.detailDesc,
        });
        break;
      } catch (e) {
        if (attempt === 3) throw e;
        await sleep(1000 * attempt); // Exponential backoff
      }
    }

    if (result) {
      await updateEnrichedAttributes(projectId, item.articleId, result);
      return true;
    }
    return false;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    await markItemFailed(projectId, item.articleId, errorMessage);
    return false;
  }
}

/**
 * Main enrichment processing function
 * Processes all unenriched context items for a project using parallel processing
 */
export async function processEnrichment(
  projectId: string,
  emitProgress: ProgressCallback
): Promise<void> {
  try {
    // Get project with ontology schema
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const ontologySchema = project.ontologySchema as OntologySchema | null;
    if (!ontologySchema || Object.keys(ontologySchema).length === 0) {
      throw new Error('Project has no ontology schema defined');
    }

    const schema = buildDynamicSchema(ontologySchema);
    const items = await getUnenrichedContextItems(projectId);

    if (items.length === 0) {
      await markProjectCompleted(projectId);
      emitProgress({ processed: 0, total: 0, currentArticleId: '' });
      return;
    }

    const total = items.length;
    let processed = 0;
    let lastEmittedProcessed = 0;
    let currentArticleIds: string[] = [];

    // Update initial total count
    await updateProjectProgress(projectId, 0, total, items[0].articleId);

    // Set up batched progress reporting
    const progressInterval = setInterval(async () => {
      if (processed !== lastEmittedProcessed) {
        lastEmittedProcessed = processed;
        const currentArticle = currentArticleIds[0] || '';
        await updateProjectProgress(projectId, processed, total, currentArticle);
        emitProgress({ processed, total, currentArticleId: currentArticle });
      }
    }, enrichmentConfig.progressIntervalMs);

    try {
      // Process items in parallel with controlled concurrency
      await pMap(
        items,
        async (item) => {
          // Track currently processing items
          currentArticleIds.push(item.articleId);

          try {
            await processItem(projectId, item, schema);
          } finally {
            // Remove from current and increment processed
            currentArticleIds = currentArticleIds.filter((id) => id !== item.articleId);
            processed++;
          }
        },
        { concurrency: enrichmentConfig.concurrency }
      );
    } finally {
      // Clear progress interval
      clearInterval(progressInterval);
    }

    // Final progress update
    await updateProjectProgress(projectId, processed, total, '');
    emitProgress({ processed, total, currentArticleId: '' });

    await markProjectCompleted(projectId);
  } catch (e) {
    // Mark project as failed for fatal errors (not individual item errors)
    await markProjectFailed(projectId);
    throw e;
  }
}

/**
 * Start enrichment for a project (sets status and initial state)
 */
export async function startEnrichment(projectId: string): Promise<void> {
  await db
    .update(projects)
    .set({
      enrichmentStatus: 'running',
      enrichmentProcessed: 0,
      enrichmentTotal: 0,
      enrichmentCurrentArticleId: null,
      enrichmentStartedAt: new Date(),
      enrichmentCompletedAt: null,
    })
    .where(eq(projects.id, projectId));
}

/**
 * Get current enrichment status for a project
 */
export async function getEnrichmentStatus(projectId: string) {
  const [project] = await db
    .select({
      status: projects.enrichmentStatus,
      processed: projects.enrichmentProcessed,
      total: projects.enrichmentTotal,
      currentArticleId: projects.enrichmentCurrentArticleId,
      startedAt: projects.enrichmentStartedAt,
      completedAt: projects.enrichmentCompletedAt,
    })
    .from(projects)
    .where(eq(projects.id, projectId));

  return project || null;
}
