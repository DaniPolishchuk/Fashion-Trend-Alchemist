/**
 * User Routes
 * Extracts user information from XSUAA JWT token
 */

import type { FastifyInstance } from 'fastify';

/**
 * Decode JWT token (without verification - approuter already verified it)
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export default async function userRoutes(fastify: FastifyInstance) {
  /**
   * GET /user/info
   * Returns the current user's information from JWT token
   * In deployed environments, extracts from XSUAA JWT token forwarded by AppRouter
   * In local development, returns null (frontend uses mock data)
   */
  fastify.get('/user/info', async (request, reply) => {
    // Try to get user from headers first (if available)
    let userName = request.headers['x-approuter-user'] as string;
    let userEmail = request.headers['x-approuter-user-email'] as string;
    let userId = request.headers['x-approuter-user-id'] as string;

    // If headers not available, extract from JWT token
    if (!userName || !userEmail) {
      const authHeader = request.headers.authorization as string;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = decodeJWT(token);

        if (decoded) {
          // XSUAA token structure - try multiple field names
          userName =
            decoded.given_name && decoded.family_name
              ? `${decoded.given_name} ${decoded.family_name}`
              : decoded.user_name || decoded.name || decoded.email;
          userEmail = decoded.email || decoded.user_name;
          userId = decoded.user_id || decoded.user_uuid || decoded.sub;

          console.log('✅ Extracted user from JWT:', { userName, userEmail, userId });
        } else {
          console.log('❌ Failed to decode JWT token');
        }
      } else {
        console.log('ℹ️ No Authorization header found');
      }
    } else {
      console.log('✅ User info from headers:', { userName, userEmail, userId });
    }

    // If still no user data, return unauthenticated
    if (!userName && !userEmail) {
      console.log('⚠️ No user data available - returning unauthenticated');
      return reply.send({
        authenticated: false,
        user: null,
      });
    }

    // Return user information
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
