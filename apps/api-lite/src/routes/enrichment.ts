/**
 * Enrichment API Routes
 * Handles Vision LLM enrichment operations with SSE progress tracking
 */

import { FastifyInstance } from 'fastify';
import { db, projects, projectContextItems, eq, and, isNotNull, inArray } from '@fashion/db';
import {
  processEnrichment,
  startEnrichment,
  getEnrichmentStatus,
  type ProgressCallback,
} from '../services/enrichment.js';

// Store active SSE connections by project ID
const activeConnections = new Map<string, Set<(data: string) => void>>();

export default async function enrichmentRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/projects/:id/start-enrichment
   * Starts the Vision LLM enrichment process for a project
   */
  fastify.post<{ Params: { id: string } }>(
    '/projects/:id/start-enrichment',
    async (request, reply) => {
      try {
        const { id: projectId } = request.params;

        // Verify project exists
        const [project] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, projectId));

        if (!project) {
          return reply.status(404).send({ error: 'Project not found' });
        }

        // Check project is active
        if (project.status !== 'active') {
          return reply
            .status(400)
            .send({ error: 'Project must be active to start enrichment' });
        }

        // Check enrichment not already running
        if (project.enrichmentStatus === 'running') {
          return reply.status(400).send({ error: 'Enrichment is already running' });
        }

        // Set status to running
        await startEnrichment(projectId);

        // Start background processing (non-blocking)
        setImmediate(async () => {
          try {
            const emitProgress: ProgressCallback = (data) => {
              const connections = activeConnections.get(projectId);
              if (connections) {
                const eventData = `event: progress\ndata: ${JSON.stringify(data)}\n\n`;
                connections.forEach((send) => send(eventData));
              }
            };

            await processEnrichment(projectId, emitProgress);

            // Emit completion event
            const connections = activeConnections.get(projectId);
            if (connections) {
              const status = await getEnrichmentStatus(projectId);
              const eventData = `event: completed\ndata: ${JSON.stringify({
                processed: status?.processed || 0,
                total: status?.total || 0,
              })}\n\n`;
              connections.forEach((send) => send(eventData));
            }
          } catch (error) {
            fastify.log.error({ error, projectId }, 'Enrichment processing failed');

            // Emit error event
            const connections = activeConnections.get(projectId);
            if (connections) {
              const eventData = `event: error\ndata: ${JSON.stringify({
                message: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`;
              connections.forEach((send) => send(eventData));
            }
          }
        });

        return reply.status(200).send({ success: true, message: 'Enrichment started' });
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to start enrichment');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * GET /api/projects/:id/enrichment-progress
   * SSE endpoint for real-time enrichment progress updates
   */
  fastify.get<{ Params: { id: string } }>(
    '/projects/:id/enrichment-progress',
    async (request, reply) => {
      const { id: projectId } = request.params;

      // Verify project exists
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Set SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Send initial status
      const status = await getEnrichmentStatus(projectId);
      const initialData = `event: status\ndata: ${JSON.stringify({
        status: status?.status || 'idle',
        processed: status?.processed || 0,
        total: status?.total || 0,
      })}\n\n`;
      reply.raw.write(initialData);

      // Register this connection
      if (!activeConnections.has(projectId)) {
        activeConnections.set(projectId, new Set());
      }

      const send = (data: string) => {
        try {
          reply.raw.write(data);
        } catch {
          // Connection closed
        }
      };

      activeConnections.get(projectId)!.add(send);

      // Keep-alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          reply.raw.write(': ping\n\n');
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Cleanup on close
      request.raw.on('close', () => {
        clearInterval(keepAlive);
        const connections = activeConnections.get(projectId);
        if (connections) {
          connections.delete(send);
          if (connections.size === 0) {
            activeConnections.delete(projectId);
          }
        }
      });

      // Don't end the response - keep it open for SSE
      return reply;
    }
  );

  /**
   * GET /api/projects/:id/enrichment-status
   * Returns current enrichment state for page reload recovery
   */
  fastify.get<{ Params: { id: string } }>(
    '/projects/:id/enrichment-status',
    async (request, reply) => {
      try {
        const { id: projectId } = request.params;

        const status = await getEnrichmentStatus(projectId);

        if (!status) {
          return reply.status(404).send({ error: 'Project not found' });
        }

        return reply.status(200).send({
          status: status.status,
          progress: {
            processed: status.processed,
            total: status.total,
          },
          currentArticleId: status.currentArticleId,
          startedAt: status.startedAt,
          completedAt: status.completedAt,
        });
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to get enrichment status');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * POST /api/projects/:id/retry-enrichment
   * Retries enrichment for failed items
   * If articleIds provided, only retry those; otherwise retry all failed items
   */
  fastify.post<{
    Params: { id: string };
    Body: { articleIds?: string[] };
  }>('/projects/:id/retry-enrichment', async (request, reply) => {
    try {
      const { id: projectId } = request.params;
      const { articleIds } = request.body || {};

      // Verify project exists
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Check project is active
      if (project.status !== 'active') {
        return reply.status(400).send({ error: 'Project must be active to retry enrichment' });
      }

      // Block if enrichment is already running
      if (project.enrichmentStatus === 'running') {
        return reply.status(400).send({ error: 'Enrichment is already running' });
      }

      // Clear enrichment errors for specified items (or all failed items)
      let clearedCount: number;

      if (articleIds && articleIds.length > 0) {
        // Clear specific article IDs
        await db
          .update(projectContextItems)
          .set({ enrichmentError: null })
          .where(
            and(
              eq(projectContextItems.projectId, projectId),
              inArray(projectContextItems.articleId, articleIds),
              isNotNull(projectContextItems.enrichmentError)
            )
          );
        clearedCount = articleIds.length;
      } else {
        // Clear all failed items
        const failedItems = await db
          .select({ articleId: projectContextItems.articleId })
          .from(projectContextItems)
          .where(
            and(
              eq(projectContextItems.projectId, projectId),
              isNotNull(projectContextItems.enrichmentError)
            )
          );
        clearedCount = failedItems.length;

        if (clearedCount > 0) {
          await db
            .update(projectContextItems)
            .set({ enrichmentError: null })
            .where(
              and(
                eq(projectContextItems.projectId, projectId),
                isNotNull(projectContextItems.enrichmentError)
              )
            );
        }
      }

      if (clearedCount === 0) {
        return reply.status(200).send({
          success: true,
          message: 'No failed items to retry',
          queuedCount: 0,
        });
      }

      // Set status to running
      await startEnrichment(projectId);

      // Start background processing (non-blocking)
      setImmediate(async () => {
        try {
          const emitProgress: ProgressCallback = (data) => {
            const connections = activeConnections.get(projectId);
            if (connections) {
              const eventData = `event: progress\ndata: ${JSON.stringify(data)}\n\n`;
              connections.forEach((send) => send(eventData));
            }
          };

          await processEnrichment(projectId, emitProgress);

          // Emit completion event
          const connections = activeConnections.get(projectId);
          if (connections) {
            const status = await getEnrichmentStatus(projectId);
            const eventData = `event: completed\ndata: ${JSON.stringify({
              processed: status?.processed || 0,
              total: status?.total || 0,
            })}\n\n`;
            connections.forEach((send) => send(eventData));
          }
        } catch (error) {
          fastify.log.error({ error, projectId }, 'Retry enrichment processing failed');

          // Emit error event
          const connections = activeConnections.get(projectId);
          if (connections) {
            const eventData = `event: error\ndata: ${JSON.stringify({
              message: error instanceof Error ? error.message : 'Unknown error',
            })}\n\n`;
            connections.forEach((send) => send(eventData));
          }
        }
      });

      return reply.status(200).send({
        success: true,
        message: 'Enrichment retry started',
        queuedCount: clearedCount,
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to retry enrichment');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
