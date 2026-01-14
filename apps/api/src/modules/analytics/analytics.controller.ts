/**
 * Analytics HTTP controller
 * Handles REST API requests for sales analytics endpoints
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { TopBottomQuery } from '@fashion/types';
import { getTopBottomSellers } from './analytics.service.js';

/**
 * Query string parameters for top/bottom sellers endpoint
 */
interface TopBottomQueryParams {
  productTypeName?: string;
  productTypeNo?: string;
  startDate?: string;
  endDate?: string;
  salesChannelId?: string;
  metric?: 'units' | 'revenue';
  limit?: string;
  includeZero?: string;
}

/**
 * Register analytics routes
 * 
 * Mounts analytics endpoints on the Fastify instance:
 * - GET /analytics/top-bottom: Fetch top and bottom sellers
 * 
 * @param fastify - Fastify application instance
 * 
 * @example
 * ```typescript
 * const app = Fastify();
 * await registerAnalyticsRoutes(app);
 * await app.listen({ port: 3000 });
 * ```
 */
export async function registerAnalyticsRoutes(
  fastify: FastifyInstance
): Promise<void> {
  /**
   * GET /analytics/top-bottom
   * 
   * Retrieve top and bottom performing articles for a product type.
   * 
   * Query Parameters:
   * - productTypeName (string, optional): Filter by product type name (e.g., "Sweater")
   * - productTypeNo (number, optional): Filter by product type number
   * - startDate (string, optional): Filter transactions from date (ISO format: YYYY-MM-DD)
   * - endDate (string, optional): Filter transactions until date (ISO format: YYYY-MM-DD)
   * - salesChannelId (number, optional): Filter by sales channel (1=online, 2=retail)
   * - metric (string, optional): Ranking metric - "units" (default) or "revenue"
   * - limit (number, optional): Number of top/bottom items (default: 500)
   * - includeZero (boolean, optional): Include zero-sales articles (default: true)
   * 
   * Response:
   * ```json
   * {
   *   "top": [
   *     {
   *       "articleId": 108775015,
   *       "prodName": "Product Name",
   *       "productTypeName": "Sweater",
   *       "unitsSold": 1250,
   *       "revenue": 49875.50,
   *       "imageKey": "10/108775015.jpg",
   *       "imageUrl": "https://..."
   *     }
   *   ],
   *   "bottom": [...]
   * }
   * ```
   * 
   * Example requests:
   * ```
   * GET /analytics/top-bottom?productTypeName=Sweater
   * GET /analytics/top-bottom?productTypeNo=253&metric=revenue&limit=100
   * GET /analytics/top-bottom?productTypeName=Trousers&startDate=2023-01-01&endDate=2023-12-31
   * ```
   */
  fastify.get(
    '/analytics/top-bottom',
    async (
      request: FastifyRequest<{ Querystring: TopBottomQueryParams }>,
      reply: FastifyReply
    ) => {
      try {
        const queryParams = request.query;

        // Parse and validate query parameters
        const query: TopBottomQuery = {
          productTypeName: queryParams.productTypeName,
          productTypeNo: queryParams.productTypeNo 
            ? Number(queryParams.productTypeNo) 
            : undefined,
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
          salesChannelId: queryParams.salesChannelId 
            ? Number(queryParams.salesChannelId) 
            : undefined,
          metric: queryParams.metric === 'revenue' ? 'revenue' : 'units',
          limit: queryParams.limit 
            ? Number(queryParams.limit) 
            : undefined,
          includeZero: queryParams.includeZero === 'false' 
            ? false 
            : true, // Default to true
        };

        // Validate required parameters
        if (!query.productTypeName && !query.productTypeNo) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Either productTypeName or productTypeNo must be provided',
          });
        }

        // Validate date format if provided
        if (query.startDate && !isValidDate(query.startDate)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'startDate must be in ISO format (YYYY-MM-DD)',
          });
        }

        if (query.endDate && !isValidDate(query.endDate)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'endDate must be in ISO format (YYYY-MM-DD)',
          });
        }

        // Validate limit range
        if (query.limit && (query.limit < 1 || query.limit > 10000)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'limit must be between 1 and 10000',
          });
        }

        // Execute analytics query
        const result = await getTopBottomSellers(query);

        return reply.status(200).send(result);
      } catch (error) {
        // Log error for debugging
        request.log.error({ error }, 'Analytics query failed');

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch top/bottom sellers',
        });
      }
    }
  );

  /**
   * GET /analytics/health
   * 
   * Health check endpoint for monitoring
   */
  fastify.get('/analytics/health', async (_request, reply) => {
    return reply.status(200).send({ 
      status: 'ok',
      service: 'analytics',
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Validate ISO date string format (YYYY-MM-DD)
 * 
 * @param dateString - Date string to validate
 * @returns True if valid ISO date format
 */
function isValidDate(dateString: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}