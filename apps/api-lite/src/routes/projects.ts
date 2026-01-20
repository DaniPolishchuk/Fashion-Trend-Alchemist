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

const HARDCODED_USER_ID = '00000000-0000-0000-0000-000000000000';

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
          velocity_score: sql<number>`SUM(${transactionsTrain.price})`,
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
        .orderBy(desc(sql`SUM(${transactionsTrain.price})`));

      const allResults = await allArticlesQuery;

      // If we have more than 50 results, return top 25 and worst 25
      let results;
      if (allResults.length > 50) {
        const top25 = allResults.slice(0, 25);
        const worst25 = allResults.slice(-25);
        results = [...top25, ...worst25];
      } else {
        // If 50 or fewer, return all
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
        // Update project status and season config
        await tx
          .update(projects)
          .set({
            status: 'active',
            seasonConfig: validatedInput.seasonConfig
              ? JSON.stringify(validatedInput.seasonConfig)
              : undefined,
          })
          .where(eq(projects.id, projectId));

        // Bulk insert context items
        const contextItems = validatedInput.articles.map((article) => ({
          projectId,
          articleId: article.article_id,
          velocityScore: article.velocity_score.toString(), // Convert to string for numeric type
          enrichedAttributes: null,
        }));

        await tx.insert(projectContextItems).values(contextItems);

        return { success: true, locked_count: validatedInput.articles.length };
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
   * List all projects for the hardcoded user
   */
  fastify.get('/projects', async (_request, reply) => {
    try {
      const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, HARDCODED_USER_ID),
        orderBy: desc(projects.createdAt),
      });

      return reply.status(200).send(userProjects);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to fetch projects');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
