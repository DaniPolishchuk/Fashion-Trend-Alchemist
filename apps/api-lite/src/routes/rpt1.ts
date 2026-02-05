/**
 * RPT-1 API Routes
 * Handles RPT-1 prediction requests and design generation via SAP AI Core
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  db,
  projects,
  projectContextItems,
  articles,
  generatedDesigns,
  eq,
  and,
  isNotNull,
  sql,
} from '@fashion/db';
import type { GeneratedImages } from '@fashion/db';
import { rpt1Config } from '@fashion/config';
import { generateImageWithRetry, type ImageView } from '../services/imageGeneration.js';
import { uploadGeneratedImageForViewWithRetry } from '../services/s3.js';
import { generateSalesTextWithRetry } from '../services/salesTextGeneration.js';
import { generateImagePromptsWithFallback } from '../services/promptGeneration.js';
import { API_LIMITS, CACHE_TTL_MS } from '../constants.js';

interface PredictRequestBody {
  lockedAttributes: Record<string, string>;
  aiVariables: string[];
  successScore: number; // Target success score (0-100)
  contextAttributes?: Record<string, string>; // Auto-excluded attributes for image generation context
}

interface RPT1Response {
  id: string;
  metadata: {
    num_columns: number;
    num_predictions: number;
    num_query_rows: number;
    num_rows: number;
  };
  predictions: Array<Record<string, Array<{ confidence: number; prediction: string }>>>;
  status: {
    code: number;
    message: string;
  };
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Zod validation schema for RPT-1 prediction request
 */
const PredictRequestSchema = z.object({
  lockedAttributes: z.record(z.string(), z.string()),
  aiVariables: z
    .array(z.string())
    .min(1, 'At least one AI variable required')
    .max(
      API_LIMITS.MAX_AI_VARIABLES,
      `Maximum ${API_LIMITS.MAX_AI_VARIABLES} AI variables allowed`
    ),
  successScore: z.number().min(0).max(100).default(100),
  contextAttributes: z.record(z.string(), z.string()).optional(), // Auto-excluded attributes
});

/**
 * Token cache - stores OAuth token for 11 hours
 */
const tokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

/**
 * Deployment URL cache - stores RPT-1 deployment URL for 11 hours
 */
const deploymentCache = {
  url: null as string | null,
  fetchedAt: 0,
};

/**
 * Get OAuth2 access token from SAP AI Core
 * Uses 11-hour cache to avoid redundant auth requests
 */
async function getAccessToken(fastify: FastifyInstance): Promise<string> {
  // Check cache first
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt) {
    fastify.log.info('✅ Using cached OAuth token');
    return tokenCache.token;
  }

  fastify.log.info('🔄 Fetching new OAuth token...');
  const tokenUrl = `${rpt1Config.authUrl}/oauth/token`;

  // Create Basic Auth header
  const credentials = Buffer.from(`${rpt1Config.clientId}:${rpt1Config.clientSecret}`).toString(
    'base64'
  );

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }

    fastify.log.error(
      {
        url: tokenUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorData,
        clientId: rpt1Config.clientId,
        authUrl: rpt1Config.authUrl,
      },
      'Failed to get OAuth token'
    );
    throw new Error(
      `OAuth authentication failed: ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const tokenData = (await response.json()) as OAuthTokenResponse;

  // Cache token for 11 hours
  tokenCache.token = tokenData.access_token;
  tokenCache.expiresAt = now + CACHE_TTL_MS.TOKEN_AND_DEPLOYMENT;

  fastify.log.info({ expiresIn: '11 hours' }, '✅ OAuth token cached');
  return tokenData.access_token;
}

/**
 * Discover the RPT-1 deployment URL from SAP AI Core
 * Uses 11-hour cache to avoid redundant discovery requests
 */
async function getRpt1DeploymentUrl(
  fastify: FastifyInstance,
  accessToken: string
): Promise<string> {
  // Check cache first
  const now = Date.now();
  if (deploymentCache.url && now - deploymentCache.fetchedAt < CACHE_TTL_MS.TOKEN_AND_DEPLOYMENT) {
    fastify.log.info({ url: deploymentCache.url }, '✅ Using cached deployment URL');
    return deploymentCache.url;
  }

  fastify.log.info('🔄 Discovering RPT-1 deployment...');
  const deploymentsUrl = `${rpt1Config.aiApiUrl}/v2/lm/deployments`;

  const response = await fetch(deploymentsUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'AI-Resource-Group': rpt1Config.resourceGroup,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    fastify.log.error(
      {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      },
      'Failed to fetch deployments'
    );
    throw new Error(`Failed to fetch deployments: ${response.statusText}`);
  }

  const deploymentsData = (await response.json()) as {
    resources: Array<{
      configurationName: string;
      deploymentUrl: string;
      status: string;
    }>;
  };

  // Find RPT-1 deployment (look for "rpt" in configuration name)
  const rpt1Deployment = deploymentsData.resources.find(
    (d) => d.configurationName.toLowerCase().includes('rpt') && d.status === 'RUNNING'
  );

  if (!rpt1Deployment || !rpt1Deployment.deploymentUrl) {
    fastify.log.error(
      { deployments: deploymentsData.resources.map((d) => d.configurationName) },
      'No RPT-1 deployment found'
    );
    throw new Error('No running RPT-1 deployment found in AI Core');
  }

  const url = rpt1Deployment.deploymentUrl;

  // Cache deployment URL for 11 hours
  deploymentCache.url = url;
  deploymentCache.fetchedAt = now;

  fastify.log.info(
    {
      configurationName: rpt1Deployment.configurationName,
      deploymentUrl: url,
      expiresIn: '11 hours',
    },
    '✅ RPT-1 deployment URL cached'
  );

  return url;
}

export default async function rpt1Routes(fastify: FastifyInstance) {
  /**
   * GET /api/projects/:id/rpt1-preview
   * Get preview data for RPT-1 request (context row counts)
   */
  fastify.get<{ Params: { id: string } }>('/projects/:id/rpt1-preview', async (request, reply) => {
    try {
      const { id: projectId } = request.params;

      // Verify project exists
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Count total context items and enriched items
      const countResult = await db
        .select({
          totalCount: sql<number>`COUNT(*)::int`,
          enrichedCount: sql<number>`COUNT(*) FILTER (WHERE ${projectContextItems.enrichedAttributes} IS NOT NULL)::int`,
        })
        .from(projectContextItems)
        .where(eq(projectContextItems.projectId, projectId));

      const { totalCount, enrichedCount } = countResult[0] || { totalCount: 0, enrichedCount: 0 };

      return reply.send({
        totalCount,
        enrichedCount,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch RPT-1 preview');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/projects/:id/rpt1-predict
   * Execute RPT-1 prediction and create a new generated design
   */
  fastify.post<{
    Params: { id: string };
    Body: PredictRequestBody;
  }>('/projects/:id/rpt1-predict', async (request, reply) => {
    try {
      const { id: projectId } = request.params;

      // Validate input with Zod schema
      const validated = PredictRequestSchema.parse(request.body);
      const {
        lockedAttributes,
        aiVariables,
        successScore: targetSuccessScore,
        contextAttributes,
      } = validated;

      // Verify project exists and is active
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Fetch enriched context items with article data AND velocity score
      // Filter out excluded articles
      const contextItems = await db
        .select({
          articleId: projectContextItems.articleId,
          enrichedAttributes: projectContextItems.enrichedAttributes,
          velocityScore: projectContextItems.velocityScore, // Normalized 0-100 score
          // Article-level attributes
          productType: articles.productType,
          productGroup: articles.productGroup,
          productFamily: articles.productFamily,
          patternStyle: articles.patternStyle,
          specificColor: articles.specificColor,
          colorIntensity: articles.colorIntensity,
          colorFamily: articles.colorFamily,
          customerSegment: articles.customerSegment,
          styleConcept: articles.styleConcept,
          fabricTypeBase: articles.fabricTypeBase,
        })
        .from(projectContextItems)
        .innerJoin(articles, eq(articles.articleId, projectContextItems.articleId))
        .where(
          and(
            eq(projectContextItems.projectId, projectId),
            isNotNull(projectContextItems.enrichedAttributes),
            eq(projectContextItems.isExcluded, false) // Filter out excluded articles
          )
        );

      if (contextItems.length === 0) {
        return reply.status(400).send({
          error: 'No enriched context items',
          details: 'Run data enrichment before making predictions',
        });
      }

      // Map attribute keys to their data sources
      const getAttributeValue = (item: (typeof contextItems)[0], key: string): string | null => {
        // Check if it's an article-level attribute
        if (key.startsWith('article_')) {
          const articleKey = key.replace('article_', '');
          const keyMap: Record<string, keyof typeof item> = {
            product_type: 'productType',
            product_group: 'productGroup',
            product_family: 'productFamily',
            pattern_style: 'patternStyle',
            specific_color: 'specificColor',
            color_intensity: 'colorIntensity',
            color_family: 'colorFamily',
            customer_segment: 'customerSegment',
            style_concept: 'styleConcept',
            fabric_type_base: 'fabricTypeBase',
          };
          const mappedKey = keyMap[articleKey];
          if (mappedKey) {
            return item[mappedKey] as string | null;
          }
        }

        // Check if it's an ontology attribute (stored in enrichedAttributes)
        if (key.startsWith('ontology_')) {
          const enriched = item.enrichedAttributes as Record<string, unknown> | null;
          if (enriched) {
            // Key format: ontology_productType_attributeName
            const parts = key.split('_');
            if (parts.length >= 3) {
              const attrName = parts.slice(2).join('_');
              return enriched[attrName] as string | null;
            }
          }
        }

        return null;
      };

      // Build context rows (only include attributes that are in locked + AI variables)
      // success_score is always included as the first column
      const contextRows: Record<string, string | number>[] = contextItems
        .map((item) => {
          const row: Record<string, string | number> = {};
          let hasAllLockedValues = true;

          // Add success_score as the first column (from normalized velocity score)
          const velocityScoreNum = parseFloat(item.velocityScore || '0');
          row['success_score'] = Math.round(velocityScoreNum); // Round to integer for cleaner data

          // Add locked attributes to the row - they don't need to match the query values
          // Context rows provide diverse examples for RPT-1 to learn patterns from
          // Accept ANY value (including empty string) as long as the column exists
          for (const key of Object.keys(lockedAttributes)) {
            const value = getAttributeValue(item, key);
            if (value !== null && value !== undefined) {
              // Convert arrays to comma-separated strings, or use value as-is (including '')
              row[key] = Array.isArray(value) ? value.join(', ') : value;
            } else {
              // Column doesn't exist in this item - skip row
              hasAllLockedValues = false;
              break;
            }
          }

          // If locked attributes are valid, add AI variables (use empty string for NULL)
          if (hasAllLockedValues) {
            for (const key of aiVariables) {
              const value = getAttributeValue(item, key);
              // Explicitly convert any falsy value to empty string
              // Also convert arrays to comma-separated strings
              if (value !== null && value !== undefined && value !== '') {
                row[key] = Array.isArray(value) ? value.join(', ') : value;
              } else {
                row[key] = '';
              }
            }
            return row;
          }

          return null;
        })
        .filter((row): row is Record<string, string | number> => row !== null);

      fastify.log.info(
        {
          totalContextItems: contextItems.length,
          filteredContextRows: contextRows.length,
          lockedAttributes,
        },
        'Context row filtering results'
      );

      if (contextRows.length < 2) {
        return reply.status(400).send({
          error: 'Insufficient context data',
          details: `Only ${contextRows.length} valid context rows found out of ${contextItems.length} total items. RPT-1 requires at least 2 context rows where all locked attributes match exactly.`,
        });
      }

      // Build query row with locked values and [PREDICT] placeholders
      // success_score is set to the target value specified by the user
      const queryRow: Record<string, string | number> = {};
      queryRow['success_score'] = targetSuccessScore; // Target success score as first column
      for (const [key, value] of Object.entries(lockedAttributes)) {
        queryRow[key] = value;
      }
      for (const key of aiVariables) {
        queryRow[key] = '[PREDICT]';
      }

      // Debug: Log sample rows AND check for any nulls in all rows
      const rowsWithNulls = contextRows
        .map((row, idx) => {
          const nullKeys = Object.keys(row).filter((k) => row[k] === null || row[k] === undefined);
          return nullKeys.length > 0 ? { rowIndex: idx, nullKeys } : null;
        })
        .filter((x) => x !== null);

      fastify.log.info(
        {
          contextRowCount: contextRows.length,
          lockedAttributeCount: Object.keys(lockedAttributes).length,
          aiVariableCount: aiVariables.length,
          targetSuccessScore,
          rowsWithNulls: rowsWithNulls.length > 0 ? rowsWithNulls : 'None',
          sampleRow1: contextRows[0],
          sampleRow26: contextRows[26] || 'N/A',
          sampleRow30: contextRows[30] || 'N/A',
        },
        'Preparing RPT-1 prediction request'
      );

      // Step 1: Get OAuth access token
      fastify.log.info('Authenticating with SAP AI Core...');
      const accessToken = await getAccessToken(fastify);

      // Step 2: Discover RPT-1 deployment URL
      fastify.log.info('Discovering RPT-1 deployment...');
      const deploymentUrl = await getRpt1DeploymentUrl(fastify, accessToken);

      // Step 3: Call RPT-1 API
      const rpt1Url = `${deploymentUrl}/predict`;
      fastify.log.info({ url: rpt1Url }, 'Calling RPT-1 API...');

      // Convert rows to the correct format for RPT-1 API
      const rpt1ApiPayload = {
        prediction_config: {
          target_columns: aiVariables.map((variable) => ({
            name: variable,
            prediction_placeholder: '[PREDICT]',
          })),
        },
        rows: contextRows.concat([queryRow]),
      };

      const rpt1Response = await fetch(rpt1Url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'AI-Resource-Group': rpt1Config.resourceGroup,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpt1ApiPayload),
      });

      if (!rpt1Response.ok) {
        const errorText = await rpt1Response.text();
        fastify.log.error(
          {
            status: rpt1Response.status,
            statusText: rpt1Response.statusText,
            body: errorText,
          },
          'RPT-1 API error'
        );

        return reply.status(rpt1Response.status).send({
          error: `RPT-1 API Error: ${rpt1Response.statusText}`,
          details: errorText,
        });
      }

      const rpt1Result = (await rpt1Response.json()) as RPT1Response;

      fastify.log.info(
        {
          predictionId: rpt1Result.id,
          metadata: rpt1Result.metadata,
        },
        'RPT-1 prediction successful'
      );

      // Extract predictions
      const predictions = rpt1Result.predictions[0];
      if (!predictions) {
        return reply.status(500).send({
          error: 'Invalid RPT-1 response',
          details: 'No predictions returned',
        });
      }

      // Build predicted attributes object
      const predictedAttributes: Record<string, string> = {};
      for (const key of aiVariables) {
        const predictionData = predictions[key];
        if (predictionData && predictionData[0]) {
          predictedAttributes[key] = predictionData[0].prediction;
        }
      }

      // Generate sequential name
      const existingDesignsCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(generatedDesigns)
        .where(eq(generatedDesigns.projectId, projectId));

      const sequenceNumber = (existingDesignsCount[0]?.count || 0) + 1;
      const designName = `${project.name}_${String(sequenceNumber).padStart(3, '0')}`;

      // Store the generated design with pending image status and initial generatedImages structure
      const initialGeneratedImages: GeneratedImages = {
        front: { url: null, status: 'pending' },
        back: { url: null, status: 'pending' },
        model: { url: null, status: 'pending' },
      };

      const [newDesign] = await db
        .insert(generatedDesigns)
        .values({
          projectId,
          name: designName,
          inputConstraints: {
            ...lockedAttributes,
            _targetSuccessScore: targetSuccessScore, // Store target success score with underscore prefix to distinguish
          },
          predictedAttributes,
          imageGenerationStatus: 'pending',
          generatedImages: initialGeneratedImages,
          salesTextGenerationStatus: 'pending',
        } as any) // Temporary type assertion until migration is applied
        .returning();

      // Start async image generation (don't await) - generates front, back, model sequentially
      const designId = newDesign.id;
      const asyncImageGeneration = async () => {
        const views: ImageView[] = ['front', 'back', 'model'];
        const generatedImages: GeneratedImages = {
          front: { url: null, status: 'pending' },
          back: { url: null, status: 'pending' },
          model: { url: null, status: 'pending' },
        };

        // Update overall status to generating
        await db
          .update(generatedDesigns)
          .set({ imageGenerationStatus: 'generating' })
          .where(eq(generatedDesigns.id, designId));

        fastify.log.info({ designId }, 'Starting async multi-image generation (front/back/model)');

        // Generate all prompts via LLM (or fallback) BEFORE generating images
        // This ensures consistency across all three views
        fastify.log.info({ designId }, 'Generating image prompts via LLM...');
        const {
          prompts,
          source: promptSource,
          logs: promptLogs,
        } = await generateImagePromptsWithFallback(
          lockedAttributes,
          predictedAttributes,
          contextAttributes
        );
        fastify.log.info({ designId, promptSource }, `Image prompts generated via ${promptSource}`);

        // Store prompt logs in the database for debugging
        await db
          .update(generatedDesigns)
          .set({ promptLogs } as any)
          .where(eq(generatedDesigns.id, designId));

        // Generate images sequentially for each view using the pre-generated prompts
        for (const view of views) {
          try {
            // Update status to generating for this view
            generatedImages[view].status = 'generating';
            await db
              .update(generatedDesigns)
              .set({ generatedImages })
              .where(eq(generatedDesigns.id, designId));

            fastify.log.info({ designId, view }, `Starting ${view} image generation`);

            // Use the LLM-generated prompt for this view
            const prompt = prompts[view];
            fastify.log.info(
              { designId, view, promptLength: prompt.length },
              `Using ${promptSource} prompt for ${view}`
            );

            const imageBuffer = await generateImageWithRetry(prompt, 1);

            if (imageBuffer) {
              // Upload to S3/SeaweedFS with retry logic
              const imageUrl = await uploadGeneratedImageForViewWithRetry(
                designId,
                imageBuffer,
                view,
                2
              );
              generatedImages[view] = { url: imageUrl, status: 'completed' };
              fastify.log.info({ designId, view, imageUrl }, `${view} image completed`);
            } else {
              generatedImages[view].status = 'failed';
              fastify.log.warn({ designId, view }, `${view} image generation failed after retries`);
            }

            // Update DB after each view
            await db
              .update(generatedDesigns)
              .set({ generatedImages })
              .where(eq(generatedDesigns.id, designId));
          } catch (error) {
            fastify.log.error({ designId, view, error }, `Error generating ${view} image`);
            generatedImages[view].status = 'failed';
            await db
              .update(generatedDesigns)
              .set({ generatedImages })
              .where(eq(generatedDesigns.id, designId));
          }
        }

        // Determine overall status based on results
        const allCompleted = views.every((v) => generatedImages[v].status === 'completed');
        const allFailed = views.every((v) => generatedImages[v].status === 'failed');
        const overallStatus = allCompleted ? 'completed' : allFailed ? 'failed' : 'partial';

        // Update final status and also set legacy generatedImageUrl to front image for backward compatibility
        await db
          .update(generatedDesigns)
          .set({
            generatedImages,
            imageGenerationStatus: overallStatus,
            generatedImageUrl: generatedImages.front.url, // Legacy field for backward compatibility
          })
          .where(eq(generatedDesigns.id, designId));

        fastify.log.info(
          {
            designId,
            overallStatus,
            frontStatus: generatedImages.front.status,
            backStatus: generatedImages.back.status,
            modelStatus: generatedImages.model.status,
          },
          'Multi-image generation completed'
        );
      };

      // Start async sales text generation (parallel to image generation)
      const asyncSalesTextGeneration = async () => {
        try {
          // Update status to generating
          await db
            .update(generatedDesigns)
            .set({ salesTextGenerationStatus: 'generating' } as any)
            .where(eq(generatedDesigns.id, designId));

          fastify.log.info({ designId }, 'Starting sales text generation');

          // Determine product type for sales text generation
          const productType =
            lockedAttributes.article_product_type ||
            lockedAttributes.product_type ||
            predictedAttributes.article_product_type ||
            predictedAttributes.product_type ||
            'fashion item';

          // Generate sales text (without images initially)
          const salesText = await generateSalesTextWithRetry(
            productType,
            lockedAttributes,
            predictedAttributes,
            targetSuccessScore,
            undefined, // No image context initially
            1 // Single retry
          );

          if (salesText) {
            await db
              .update(generatedDesigns)
              .set({
                salesText,
                salesTextGenerationStatus: 'completed',
              } as any)
              .where(eq(generatedDesigns.id, designId));

            fastify.log.info({ designId }, 'Sales text generation completed');
          } else {
            await db
              .update(generatedDesigns)
              .set({ salesTextGenerationStatus: 'failed' } as any)
              .where(eq(generatedDesigns.id, designId));

            fastify.log.warn({ designId }, 'Sales text generation failed after retries');
          }
        } catch (error) {
          fastify.log.error({ designId, error }, 'Error generating sales text');
          await db
            .update(generatedDesigns)
            .set({ salesTextGenerationStatus: 'failed' } as any)
            .where(eq(generatedDesigns.id, designId));
        }
      };

      // Fire and forget both processes - don't await
      asyncImageGeneration().catch((err) => {
        fastify.log.error({ designId, err }, 'Unhandled error in async image generation');
      });

      asyncSalesTextGeneration().catch((err) => {
        fastify.log.error({ designId, err }, 'Unhandled error in async sales text generation');
      });

      return reply.status(201).send({
        success: true,
        designId: newDesign.id,
        designName: newDesign.name,
        inputConstraints: lockedAttributes,
        targetSuccessScore,
        predictedAttributes,
        imageGenerationStatus: 'pending',
        velocityScoresStale: project.velocityScoresStale, // Include warning if scores are stale
        rpt1Metadata: {
          predictionId: rpt1Result.id,
          metadata: rpt1Result.metadata,
          contextRowsUsed: contextRows.length,
        },
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to execute RPT-1 prediction');
      return reply.status(500).send({
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
