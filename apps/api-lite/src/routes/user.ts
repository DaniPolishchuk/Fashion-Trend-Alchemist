/**
 * User Routes
 * Provides user information from XSUAA authentication in deployed environments
 */

import type { FastifyInstance } from 'fastify';

export default async function userRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/user/info
   * Returns the current user's information
   * In deployed environments with XSUAA, this extracts user data from authentication headers
   * In local development, returns mock data
   */
  fastify.get('/api/user/info', async (request, reply) => {
    // XSUAA user information is typically provided by the AppRouter in these headers
    // Different SAP environments may use slightly different header names
    const userName =
      (request.headers['x-approuter-user'] as string) ||
      (request.headers['x-user-name'] as string) ||
      (request.headers['x-approuter-user-name'] as string);

    const userEmail =
      (request.headers['x-approuter-user-email'] as string) ||
      (request.headers['x-user-email'] as string);

    const userId =
      (request.headers['x-approuter-user-id'] as string) ||
      (request.headers['x-user-id'] as string);

    // If no XSUAA headers are present (local development), return null
    // Frontend will fall back to mock data
    if (!userName && !userEmail) {
      return reply.send({
        authenticated: false,
        user: null,
      });
    }

    // Return user information from XSUAA
    return reply.send({
      authenticated: true,
      user: {
        name: userName || 'Unknown User',
        email: userEmail || 'unknown@example.com',
        id: userId || 'unknown-id',
      },
    });
  });
}
