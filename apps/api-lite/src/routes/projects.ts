/**
 * Project API Routes
 * Handles project CRUD operations and context management
 */

import { FastifyInstance } from 'fastify';
import {
  db,
  projects,
  projectContextItems,
  articles,
  transactionsTrain,
  generatedDesigns,
  eq,
  and,
  inArray,
  sql,
  desc,
} from '@fashion/db';
import {
  CreateProjectInputSchema,
  PreviewContextQuerySchema,
  LockContextInputSchema,
  type CreateProjectInput,
  type PreviewContextQuery,
  type LockContextInput,
} from '@fashion/types';
import { API_LIMITS } from '../constants.js';

const HARDCODED_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Re-normalize velocity scores for all included (non-excluded) articles
 * Takes existing raw velocity scores and re-normalizes to 0-100 among included items only
 */
async function recalculateVelocityScores(projectId: string): Promise<void> {
  // Get all context items for the project
  const items = await db
    .select({
      articleId: projectContextItems.articleId,
      velocityScore: projectContextItems.velocityScore,
      isExcluded: projectContextItems.isExcluded,
    })
    .from(projectContextItems)
    .where(eq(projectContextItems.projectId, projectId));

  // Filter to only included items
  const includedItems = items.filter((item) => !item.isExcluded);

  if (includedItems.length === 0) {
    return; // No included items to normalize
  }

  // Get min and max velocity scores among included items
  const velocityScores = includedItems.map((item) => parseFloat(item.velocityScore) || 0);
  const minVelocity = Math.min(...velocityScores);
  const maxVelocity = Math.max(...velocityScores);
  const velocityRange = maxVelocity - minVelocity;

  // Re-normalize all included items
  for (const item of includedItems) {
    const rawVelocity = parseFloat(item.velocityScore) || 0;
    const normalizedVelocity =
      velocityRange === 0
        ? 100
        : ((rawVelocity - minVelocity) / velocityRange) * 100;

    await db
      .update(projectContextItems)
      .set({ velocityScore: normalizedVelocity.toFixed(2) })
      .where(
        and(
          eq(projectContextItems.projectId, projectId),
          eq(projectContextItems.articleId, item.articleId)
        )
      );
  }
}

export default async function projectRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/projects
   * Creates a new project in draft status
   */
  fastify.post<{ Body: CreateProjectInput }>('/projects', async (request, reply) => {
    try {
      // Validate input
      const validatedInput = CreateProjectInputSchema.parse(request.body);

      // Insert new project
      const [newProject] = await db
        .insert(projects)
        .values({
          userId: HARDCODED_USER_ID,
          name: validatedInput.name,
          status: 'draft',
          scopeConfig: validatedInput.scopeConfig
            ? JSON.stringify(validatedInput.scopeConfig)
            : null,
        })
        .returning();

      return reply.status(201).send(newProject);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to create project');
      if (error?.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/projects/:id/preview-context
   * The Velocity Engine - calculates top 25 and worst 25 articles by velocity score
   */
  fastify.get<{
    Params: { id: string };
    Querystring: PreviewContextQuery;
  }>('/projects/:id/preview-context', async (request, reply) => {
    try {
      const { id: projectId } = request.params;
      const queryParams = PreviewContextQuerySchema.parse(request.query);

      // Get project to extract scope configuration
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const scopeConfig = project.scopeConfig as any;
      if (!scopeConfig?.productTypes?.length) {
        return reply.status(400).send({ error: 'Project has no product types configured' });
      }

      // Build dynamic WHERE clauses
      const whereClauses: any[] = [inArray(articles.productType, scopeConfig.productTypes)];

      if (scopeConfig.productGroups?.length) {
        whereClauses.push(inArray(articles.productGroup, scopeConfig.productGroups));
      }

      // Season/Date filtering
      if (queryParams.season) {
        const seasonMonths: Record<string, number[]> = {
          spring: [3, 4, 5],
          summer: [6, 7, 8],
          autumn: [9, 10, 11],
          winter: [12, 1, 2],
        };
        const months = seasonMonths[queryParams.season];
        if (months) {
          // Use type-safe SQL composition instead of array interpolation
          const monthConditions = months.map(
            (month) => sql`EXTRACT(MONTH FROM ${transactionsTrain.tDate}) = ${month}`
          );
          whereClauses.push(sql`(${sql.join(monthConditions, sql` OR `)})`);
        }
      } else if (queryParams.mdFrom && queryParams.mdTo) {
        // Parse MM-DD format
        const [fromMonth, fromDay] = queryParams.mdFrom.split('-').map(Number);
        const [toMonth, toDay] = queryParams.mdTo.split('-').map(Number);

        if (fromMonth <= toMonth) {
          // Same year range
          whereClauses.push(sql`(
            (EXTRACT(MONTH FROM ${transactionsTrain.tDate}) = ${fromMonth} AND EXTRACT(DAY FROM ${transactionsTrain.tDate}) >= ${fromDay})
            OR (EXTRACT(MONTH FROM ${transactionsTrain.tDate}) > ${fromMonth} AND EXTRACT(MONTH FROM ${transactionsTrain.tDate}) < ${toMonth})
            OR (EXTRACT(MONTH FROM ${transactionsTrain.tDate}) = ${toMonth} AND EXTRACT(DAY FROM ${transactionsTrain.tDate}) <= ${toDay})
          )`);
        } else {
          // Wraps around year (e.g., Dec to Jan)
          whereClauses.push(sql`(
            (EXTRACT(MONTH FROM ${transactionsTrain.tDate}) = ${fromMonth} AND EXTRACT(DAY FROM ${transactionsTrain.tDate}) >= ${fromDay})
            OR (EXTRACT(MONTH FROM ${transactionsTrain.tDate}) > ${fromMonth})
            OR (EXTRACT(MONTH FROM ${transactionsTrain.tDate}) < ${toMonth})
            OR (EXTRACT(MONTH FROM ${transactionsTrain.tDate}) = ${toMonth} AND EXTRACT(DAY FROM ${transactionsTrain.tDate}) <= ${toDay})
          )`);
        }
      }

      // Attribute filters
      const filterMap = {
        filter_productGroup: articles.productGroup,
        filter_productFamily: articles.productFamily,
        filter_styleConcept: articles.styleConcept,
        filter_patternStyle: articles.patternStyle,
        filter_colorFamily: articles.colorFamily,
        filter_colorIntensity: articles.colorIntensity,
        filter_specificColor: articles.specificColor,
        filter_customerSegment: articles.customerSegment,
        filter_fabricTypeBase: articles.fabricTypeBase,
      };

      Object.entries(filterMap).forEach(([queryKey, column]) => {
        const filterValue = queryParams[queryKey as keyof PreviewContextQuery];
        if (filterValue) {
          const values = filterValue
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
          if (values.length > 0) {
            whereClauses.push(inArray(column, values));
          }
        }
      });

      // Execute velocity calculation query for all matching articles
      // Velocity = COUNT(transactions) / (last_transaction_date - first_transaction_date + 1)
      // This measures units sold per day of availability (approximated by first/last sale)
      const allArticlesQuery = db
        .select({
          article_id: articles.articleId,
          product_type: articles.productType,
          product_group: articles.productGroup,
          product_family: articles.productFamily,
          style_concept: articles.styleConcept,
          pattern_style: articles.patternStyle,
          specific_color: articles.specificColor,
          color_intensity: articles.colorIntensity,
          color_family: articles.colorFamily,
          customer_segment: articles.customerSegment,
          fabric_type_base: articles.fabricTypeBase,
          detail_desc: articles.detailDesc,
          // Raw velocity: transactions per day of availability
          // Note: DATE - DATE in PostgreSQL returns integer (days), so no EXTRACT needed
          velocity_score: sql<number>`
            CASE
              WHEN MAX(${transactionsTrain.tDate})::date = MIN(${transactionsTrain.tDate})::date THEN COUNT(*)::float
              ELSE COUNT(*)::float / (MAX(${transactionsTrain.tDate})::date - MIN(${transactionsTrain.tDate})::date + 1)::float
            END
          `,
          transaction_count: sql<number>`COUNT(*)`,
          first_sale: sql<string>`MIN(${transactionsTrain.tDate})::text`,
          last_sale: sql<string>`MAX(${transactionsTrain.tDate})::text`,
        })
        .from(transactionsTrain)
        .innerJoin(articles, eq(articles.articleId, transactionsTrain.articleId))
        .where(and(...whereClauses))
        .groupBy(
          articles.articleId,
          articles.productType,
          articles.productGroup,
          articles.productFamily,
          articles.styleConcept,
          articles.patternStyle,
          articles.specificColor,
          articles.colorIntensity,
          articles.colorFamily,
          articles.customerSegment,
          articles.fabricTypeBase,
          articles.detailDesc
        )
        .orderBy(sql`13 DESC`);

      const allResults = await allArticlesQuery;

      // Performance optimization: If we have more than MAX_PREVIEW_RESULTS,
      // return top PREVIEW_TOP_COUNT and worst PREVIEW_WORST_COUNT
      // This maintains the same business logic but uses named constants
      let results;
      if (allResults.length > API_LIMITS.MAX_PREVIEW_RESULTS) {
        const top25 = allResults.slice(0, API_LIMITS.PREVIEW_TOP_COUNT);
        const worst25 = allResults.slice(-API_LIMITS.PREVIEW_WORST_COUNT);
        results = [...top25, ...worst25];
      } else {
        // If MAX_PREVIEW_RESULTS or fewer, return all
        results = allResults;
      }

      return reply.status(200).send(results);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to fetch preview context');
      if (error?.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid query parameters', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/projects/:id/lock-context
   * Locks the project context and saves articles (top 25 + worst 25 if >50 total)
   */
  fastify.post<{
    Params: { id: string };
    Body: LockContextInput;
  }>('/projects/:id/lock-context', async (request, reply) => {
    try {
      const { id: projectId } = request.params;
      const validatedInput = LockContextInputSchema.parse(request.body);

      // Verify project exists and is in draft status
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      if (project.status !== 'draft') {
        return reply.status(400).send({ error: 'Project is not in draft status' });
      }

      // Use transaction for atomicity
      const result = await db.transaction(async (tx) => {
        // Update project status, season config, and ontology schema
        await tx
          .update(projects)
          .set({
            status: 'active',
            seasonConfig: validatedInput.seasonConfig
              ? JSON.stringify(validatedInput.seasonConfig)
              : undefined,
            ontologySchema: validatedInput.ontologySchema
              ? JSON.stringify(validatedInput.ontologySchema)
              : undefined,
          })
          .where(eq(projects.id, projectId));

        // Normalize velocity scores to 0-100
        // Find min and max velocity scores from the input articles
        const velocityScores = validatedInput.articles.map((a) => a.velocity_score);
        const minVelocity = Math.min(...velocityScores);
        const maxVelocity = Math.max(...velocityScores);
        const velocityRange = maxVelocity - minVelocity;

        // Bulk insert context items with normalized velocity scores
        const contextItems = validatedInput.articles.map((article) => {
          // Normalize to 0-100 scale
          // If all articles have the same velocity, assign 100 to all
          const normalizedVelocity =
            velocityRange === 0
              ? 100
              : ((article.velocity_score - minVelocity) / velocityRange) * 100;

          return {
            projectId,
            articleId: article.article_id,
            velocityScore: normalizedVelocity.toFixed(2), // Store normalized 0-100 score
            enrichedAttributes: null,
          };
        });

        await tx.insert(projectContextItems).values(contextItems);

        return {
          success: true,
          locked_count: validatedInput.articles.length,
          velocity_normalization: {
            min_raw: minVelocity,
            max_raw: maxVelocity,
            normalized_range: '0-100',
          },
        };
      });

      return reply.status(200).send(result);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to lock context');
      if (error?.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/projects
   * List all projects for the hardcoded user with generated products count
   * Pinned projects appear first, sorted by pin time, then unpinned by creation time
   */
  fastify.get('/projects', async (_request, reply) => {
    try {
      // Query projects with generated designs count and pin status
      const userProjects = await db
        .select({
          id: projects.id,
          userId: projects.userId,
          name: projects.name,
          status: projects.status,
          seasonConfig: projects.seasonConfig,
          scopeConfig: projects.scopeConfig,
          ontologySchema: projects.ontologySchema,
          createdAt: projects.createdAt,
          deletedAt: projects.deletedAt,
          isPinned: projects.isPinned,
          pinnedAt: projects.pinnedAt,
          generatedProductsCount: sql<number>`COUNT(${generatedDesigns.id})::int`,
        })
        .from(projects)
        .leftJoin(generatedDesigns, eq(generatedDesigns.projectId, projects.id))
        .where(eq(projects.userId, HARDCODED_USER_ID))
        .groupBy(
          projects.id,
          projects.userId,
          projects.name,
          projects.status,
          projects.seasonConfig,
          projects.scopeConfig,
          projects.ontologySchema,
          projects.createdAt,
          projects.deletedAt,
          projects.isPinned,
          projects.pinnedAt
        )
        .orderBy(
          desc(projects.isPinned), // Pinned first
          desc(projects.pinnedAt), // Then by pin time
          desc(projects.createdAt) // Then by creation time
        );

      return reply.status(200).send(userProjects);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to fetch projects');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * DELETE /api/projects/:id
   * Delete a project and all its related data including images from SeaweedFS
   */
  fastify.delete<{ Params: { id: string } }>('/projects/:id', async (request, reply) => {
    try {
      const { id: projectId } = request.params;

      // Verify project exists
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Fetch all generated designs to get their IDs for image cleanup
      const designs = await db
        .select({
          id: generatedDesigns.id,
          generatedImageUrl: generatedDesigns.generatedImageUrl,
        })
        .from(generatedDesigns)
        .where(eq(generatedDesigns.projectId, projectId));

      fastify.log.info(
        { projectId, designCount: designs.length },
        'Deleting project with generated designs'
      );

      // Clean up images from SeaweedFS - wait for completion to avoid orphaned files
      if (designs.length > 0) {
        const { deleteGeneratedImageWithRetry } = await import('../services/s3.js');

        // Delete images in parallel and wait for all to complete
        const imageDeletions = designs
          .filter((design) => design.generatedImageUrl) // Only delete if image exists
          .map(async (design) => {
            try {
              const success = await deleteGeneratedImageWithRetry(design.id);
              if (success) {
                fastify.log.info({ designId: design.id }, 'Image deleted from SeaweedFS');
              } else {
                fastify.log.warn({ designId: design.id }, 'Failed to delete image from SeaweedFS');
              }
              return success;
            } catch (error) {
              fastify.log.error(
                { designId: design.id, error },
                'Error during image deletion from SeaweedFS'
              );
              return false;
            }
          });

        // Wait for all image deletions to complete
        const results = await Promise.allSettled(imageDeletions);
        const successCount = results.filter(
          (r) => r.status === 'fulfilled' && r.value === true
        ).length;
        const failedCount = results.length - successCount;

        fastify.log.info(
          { projectId, totalImages: designs.length, deleted: successCount, failed: failedCount },
          'Image cleanup completed'
        );

        if (failedCount > 0) {
          fastify.log.warn(
            { failedCount },
            'Some images failed to delete - orphaned files may exist in SeaweedFS'
          );
        }
      }

      // Delete in transaction for atomicity (images deleted first)
      await db.transaction(async (tx) => {
        // 1. Delete all generated designs for this project
        await tx.delete(generatedDesigns).where(eq(generatedDesigns.projectId, projectId));

        // 2. Delete all project context items
        await tx.delete(projectContextItems).where(eq(projectContextItems.projectId, projectId));

        // 3. Delete the project itself
        await tx.delete(projects).where(eq(projects.id, projectId));
      });

      fastify.log.info({ projectId }, 'Project deleted successfully with all related data');

      return reply.status(204).send();
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to delete project');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * PATCH /api/projects/:id/pin
   * Toggle project pin status (max 3 projects can be pinned)
   */
  fastify.patch<{ Params: { id: string }; Body: { isPinned: boolean } }>(
    '/projects/:id/pin',
    async (request, reply) => {
      try {
        const { id: projectId } = request.params;
        const { isPinned } = request.body;

        // Verify project exists
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, projectId),
        });

        if (!project) {
          return reply.status(404).send({ error: 'Project not found' });
        }

        // If pinning, check current pinned count
        if (isPinned) {
          const pinnedCountResult = await db
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(projects)
            .where(and(eq(projects.isPinned, true), eq(projects.userId, HARDCODED_USER_ID)));

          const pinnedCount = pinnedCountResult[0]?.count || 0;

          if (pinnedCount >= API_LIMITS.MAX_PINNED_PROJECTS) {
            return reply.status(400).send({
              error: `Maximum ${API_LIMITS.MAX_PINNED_PROJECTS} projects can be pinned`,
              code: 'MAX_PINS_REACHED',
            });
          }
        }

        // Update pin status
        const [updatedProject] = await db
          .update(projects)
          .set({
            isPinned: isPinned,
            pinnedAt: isPinned ? new Date() : null,
          })
          .where(eq(projects.id, projectId))
          .returning();

        fastify.log.info({ projectId, isPinned }, 'Project pin status updated');

        return reply.status(200).send(updatedProject);
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to update pin status');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * GET /api/projects/:id
   * Get a single project by ID
   */
  fastify.get<{ Params: { id: string } }>('/projects/:id', async (request, reply) => {
    try {
      const { id: projectId } = request.params;

      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      return reply.status(200).send(project);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to fetch project');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/projects/:id/generated-designs
   * Get all generated designs for a specific project
   */
  fastify.get<{ Params: { id: string } }>(
    '/projects/:id/generated-designs',
    async (request, reply) => {
      try {
        const { id: projectId } = request.params;

        // Verify project exists
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, projectId),
        });

        if (!project) {
          return reply.status(404).send({ error: 'Project not found' });
        }

        // Fetch all generated designs for the project
        const designs = await db
          .select({
            id: generatedDesigns.id,
            name: generatedDesigns.name,
            predictedAttributes: generatedDesigns.predictedAttributes,
            inputConstraints: generatedDesigns.inputConstraints,
            generatedImageUrl: generatedDesigns.generatedImageUrl,
            imageGenerationStatus: generatedDesigns.imageGenerationStatus,
            generatedImages: generatedDesigns.generatedImages,
            createdAt: generatedDesigns.createdAt,
          })
          .from(generatedDesigns)
          .where(eq(generatedDesigns.projectId, projectId))
          .orderBy(desc(generatedDesigns.createdAt)); // Order by creation (newest first)

        return reply.status(200).send(designs);
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to fetch generated designs');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * DELETE /api/projects/:projectId/generated-designs/:designId
   * Delete a specific generated design and its image from SeaweedFS
   */
  fastify.delete<{ Params: { projectId: string; designId: string } }>(
    '/projects/:projectId/generated-designs/:designId',
    async (request, reply) => {
      try {
        const { projectId, designId } = request.params;

        // Verify the design exists and belongs to the project
        const design = await db.query.generatedDesigns.findFirst({
          where: and(eq(generatedDesigns.id, designId), eq(generatedDesigns.projectId, projectId)),
        });

        if (!design) {
          return reply.status(404).send({ error: 'Generated design not found' });
        }

        // Delete the image from SeaweedFS if it exists
        if (design.generatedImageUrl) {
          fastify.log.info(
            { designId, imageUrl: design.generatedImageUrl },
            'Cleaning up generated image'
          );

          // Import deleteGeneratedImageWithRetry dynamically
          const { deleteGeneratedImageWithRetry } = await import('../services/s3.js');

          // Attempt to delete from SeaweedFS (non-blocking - don't fail DB delete if this fails)
          const deleteSuccess = await deleteGeneratedImageWithRetry(designId);

          if (deleteSuccess) {
            fastify.log.info({ designId }, 'Generated image deleted from SeaweedFS');
          } else {
            fastify.log.warn(
              { designId },
              'Failed to delete image from SeaweedFS, but continuing with DB deletion'
            );
          }
        }

        // Hard delete the design from database
        await db.delete(generatedDesigns).where(eq(generatedDesigns.id, designId));

        fastify.log.info({ designId, projectId }, 'Generated design deleted successfully');

        return reply.status(204).send();
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to delete generated design');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * PATCH /api/projects/:projectId/generated-designs/:designId
   * Update a specific generated design (e.g., rename)
   */
  fastify.patch<{ Params: { projectId: string; designId: string }; Body: { name?: string } }>(
    '/projects/:projectId/generated-designs/:designId',
    async (request, reply) => {
      try {
        const { projectId, designId } = request.params;
        const { name } = request.body;

        // Verify the design exists and belongs to the project
        const design = await db.query.generatedDesigns.findFirst({
          where: and(eq(generatedDesigns.id, designId), eq(generatedDesigns.projectId, projectId)),
        });

        if (!design) {
          return reply.status(404).send({ error: 'Generated design not found' });
        }

        // Build update object
        const updates: { name?: string } = {};
        if (name !== undefined) {
          updates.name = name.trim();
        }

        if (Object.keys(updates).length === 0) {
          return reply.status(400).send({ error: 'No valid fields to update' });
        }

        // Update the design
        await db.update(generatedDesigns).set(updates).where(eq(generatedDesigns.id, designId));

        // Fetch and return the updated design
        const updatedDesign = await db.query.generatedDesigns.findFirst({
          where: eq(generatedDesigns.id, designId),
        });

        return reply.status(200).send(updatedDesign);
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to update generated design');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * GET /api/projects/:projectId/generated-designs/:designId/image-status
   * Get the image generation status for a specific design (supports multi-image)
   */
  fastify.get<{ Params: { projectId: string; designId: string } }>(
    '/projects/:projectId/generated-designs/:designId/image-status',
    async (request, reply) => {
      try {
        const { projectId, designId } = request.params;

        // Fetch the design
        const design = await db.query.generatedDesigns.findFirst({
          where: and(eq(generatedDesigns.id, designId), eq(generatedDesigns.projectId, projectId)),
        });

        if (!design) {
          return reply.status(404).send({ error: 'Generated design not found' });
        }

        // Return both new multi-image format and legacy format for backward compatibility
        return reply.status(200).send({
          status: design.imageGenerationStatus || 'pending',
          // New multi-image structure
          generatedImages: design.generatedImages || {
            front: {
              url: design.generatedImageUrl || null,
              status: design.imageGenerationStatus || 'pending',
            },
            back: { url: null, status: 'pending' },
            model: { url: null, status: 'pending' },
          },
          // Legacy single image URL (for backward compatibility)
          imageUrl: (design.generatedImages as any)?.front?.url || design.generatedImageUrl || null,
        });
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to fetch image status');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * PATCH /api/projects/:id/mismatch-review
   * Update exclusions for multiple articles and mark review as completed
   * Auto-triggers velocity recalculation
   */
  fastify.patch<{
    Params: { id: string };
    Body: { exclusions: Array<{ articleId: string; isExcluded: boolean }> };
  }>('/projects/:id/mismatch-review', async (request, reply) => {
    try {
      const { id: projectId } = request.params;
      const { exclusions } = request.body;

      // Verify project exists
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Update exclusions in transaction
      await db.transaction(async (tx) => {
        // Update each article's exclusion status
        for (const { articleId, isExcluded } of exclusions) {
          await tx
            .update(projectContextItems)
            .set({ isExcluded })
            .where(
              and(
                eq(projectContextItems.projectId, projectId),
                eq(projectContextItems.articleId, articleId)
              )
            );
        }

        // Mark mismatch review as completed
        await tx
          .update(projects)
          .set({
            mismatchReviewCompleted: true,
            velocityScoresStale: false, // Will recalculate below
          })
          .where(eq(projects.id, projectId));
      });

      // Recalculate velocity scores for included items
      await recalculateVelocityScores(projectId);

      fastify.log.info(
        { projectId, exclusionCount: exclusions.length },
        'Mismatch review completed'
      );

      return reply.status(200).send({
        success: true,
        exclusionsUpdated: exclusions.length,
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to update mismatch review');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * PATCH /api/projects/:id/context-items/:articleId/exclude
   * Toggle single article exclusion
   */
  fastify.patch<{
    Params: { id: string; articleId: string };
    Body: { isExcluded: boolean };
  }>('/projects/:id/context-items/:articleId/exclude', async (request, reply) => {
    try {
      const { id: projectId, articleId } = request.params;
      const { isExcluded } = request.body;

      // Verify project exists
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Verify context item exists
      const [contextItem] = await db
        .select()
        .from(projectContextItems)
        .where(
          and(
            eq(projectContextItems.projectId, projectId),
            eq(projectContextItems.articleId, articleId)
          )
        );

      if (!contextItem) {
        return reply.status(404).send({ error: 'Context item not found' });
      }

      // Update exclusion status and mark velocity scores as stale
      await db.transaction(async (tx) => {
        await tx
          .update(projectContextItems)
          .set({ isExcluded })
          .where(
            and(
              eq(projectContextItems.projectId, projectId),
              eq(projectContextItems.articleId, articleId)
            )
          );

        await tx
          .update(projects)
          .set({ velocityScoresStale: true })
          .where(eq(projects.id, projectId));
      });

      fastify.log.info({ projectId, articleId, isExcluded }, 'Article exclusion updated');

      return reply.status(200).send({
        success: true,
        articleId,
        isExcluded,
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to update article exclusion');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/projects/:id/recalculate-velocity
   * Re-normalize velocity scores for all included articles
   * Does NOT re-query transactions, just re-normalizes existing scores
   */
  fastify.post<{ Params: { id: string } }>(
    '/projects/:id/recalculate-velocity',
    async (request, reply) => {
      try {
        const { id: projectId } = request.params;

        // Verify project exists
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, projectId),
        });

        if (!project) {
          return reply.status(404).send({ error: 'Project not found' });
        }

        await recalculateVelocityScores(projectId);

        // Mark velocity scores as no longer stale
        await db
          .update(projects)
          .set({ velocityScoresStale: false })
          .where(eq(projects.id, projectId));

        fastify.log.info({ projectId }, 'Velocity scores recalculated');

        return reply.status(200).send({
          success: true,
          message: 'Velocity scores recalculated successfully',
        });
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to recalculate velocity scores');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );
}
