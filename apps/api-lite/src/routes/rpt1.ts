/**
 * RPT-1 API Routes
 * Handles RPT-1 prediction requests and design generation via SAP AI Core
 */

import { FastifyInstance } from 'fastify';
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
import { rpt1Config } from '@fashion/config';
import { buildImagePrompt, generateImageWithRetry } from '../services/imageGeneration.js';
import { uploadGeneratedImageWithRetry } from '../services/s3.js';

interface PredictRequestBody {
  lockedAttributes: Record<string, string>;
  aiVariables: string[];
  successScore: number; // Target success score (0-100)
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
 * Get OAuth2 access token from SAP AI Core
 */
async function getAccessToken(fastify: FastifyInstance): Promise<string> {
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
  return tokenData.access_token;
}

/**
 * Discover the RPT-1 deployment URL from SAP AI Core
 */
async function getRpt1DeploymentUrl(
  fastify: FastifyInstance,
  accessToken: string
): Promise<string> {
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

  fastify.log.info(
    {
      configurationName: rpt1Deployment.configurationName,
      deploymentUrl: rpt1Deployment.deploymentUrl,
    },
    'Found RPT-1 deployment'
  );

  return rpt1Deployment.deploymentUrl;
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
      const { lockedAttributes, aiVariables, successScore } = request.body;

      // Validate input
      if (!aiVariables || aiVariables.length === 0) {
        return reply.status(400).send({
          error: 'At least one AI variable is required',
          details: 'aiVariables array cannot be empty',
        });
      }

      if (aiVariables.length > 10) {
        return reply.status(400).send({
          error: 'Too many AI variables',
          details: 'Maximum 10 AI variables allowed for RPT-1 Large',
        });
      }

      // Validate success score
      const targetSuccessScore =
        typeof successScore === 'number' ? Math.max(0, Math.min(100, successScore)) : 100;

      // Verify project exists and is active
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Fetch enriched context items with article data AND velocity score
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
            isNotNull(projectContextItems.enrichedAttributes)
          )
        );

      if (contextItems.length === 0) {
        return reply.status(400).send({
          error: 'No enriched context items',
          details: 'Run image enrichment before making predictions',
        });
      }

      // Build RPT-1 request payload
      const allColumnKeys = [...Object.keys(lockedAttributes), ...aiVariables];

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
          let hasAllValues = true;

          // Add success_score as the first column (from normalized velocity score)
          const velocityScoreNum = parseFloat(item.velocityScore || '0');
          row['success_score'] = Math.round(velocityScoreNum); // Round to integer for cleaner data

          for (const key of allColumnKeys) {
            const value = getAttributeValue(item, key);
            if (value !== null && value !== undefined && value !== '') {
              row[key] = value;
            } else {
              // If any required attribute is missing, skip this row
              hasAllValues = false;
              break;
            }
          }

          return hasAllValues ? row : null;
        })
        .filter((row): row is Record<string, string | number> => row !== null);

      if (contextRows.length < 2) {
        return reply.status(400).send({
          error: 'Insufficient context data',
          details: `Only ${contextRows.length} valid context rows found. RPT-1 requires at least 2 context rows.`,
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

      fastify.log.info(
        {
          contextRowCount: contextRows.length,
          lockedAttributeCount: Object.keys(lockedAttributes).length,
          aiVariableCount: aiVariables.length,
          targetSuccessScore,
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

      // Store the generated design with pending image status
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
        })
        .returning();

      // Start async image generation (don't await)
      const designId = newDesign.id;
      const asyncImageGeneration = async () => {
        try {
          // Update status to generating
          await db
            .update(generatedDesigns)
            .set({ imageGenerationStatus: 'generating' })
            .where(eq(generatedDesigns.id, designId));

          fastify.log.info({ designId }, 'Starting async image generation');

          // Build prompt from all attributes
          const prompt = buildImagePrompt(lockedAttributes, predictedAttributes);

          // Generate image with retry
          const imageBuffer = await generateImageWithRetry(prompt, 1);

          if (imageBuffer) {
            // Upload to S3/SeaweedFS with retry logic
            const imageUrl = await uploadGeneratedImageWithRetry(designId, imageBuffer, 2);

            // Update design with image URL and completed status
            await db
              .update(generatedDesigns)
              .set({
                generatedImageUrl: imageUrl,
                imageGenerationStatus: 'completed',
              })
              .where(eq(generatedDesigns.id, designId));

            fastify.log.info({ designId, imageUrl }, 'Image generation completed');
          } else {
            // Image generation failed after retries
            await db
              .update(generatedDesigns)
              .set({ imageGenerationStatus: 'failed' })
              .where(eq(generatedDesigns.id, designId));

            fastify.log.warn({ designId }, 'Image generation failed after retries');
          }
        } catch (error) {
          fastify.log.error({ designId, error }, 'Async image generation error');

          // Update status to failed
          await db
            .update(generatedDesigns)
            .set({ imageGenerationStatus: 'failed' })
            .where(eq(generatedDesigns.id, designId));
        }
      };

      // Fire and forget - don't await
      asyncImageGeneration().catch((err) => {
        fastify.log.error({ designId, err }, 'Unhandled error in async image generation');
      });

      return reply.status(201).send({
        success: true,
        designId: newDesign.id,
        designName: newDesign.name,
        inputConstraints: lockedAttributes,
        targetSuccessScore,
        predictedAttributes,
        imageGenerationStatus: 'pending',
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
