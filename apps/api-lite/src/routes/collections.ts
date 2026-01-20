/**
 * Collections API Routes
 * Handles collections listing for home page display
 */

import { FastifyInstance } from 'fastify';
import { db, collections, collectionItems, generatedDesigns, eq, sql, desc } from '@fashion/db';

const HARDCODED_USER_ID = '00000000-0000-0000-0000-000000000000';

export default async function collectionRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/collections
   * List all collections for the hardcoded user with item count and preview images
   */
  fastify.get('/collections', async (_request, reply) => {
    try {
      // Get collections with item count
      const userCollections = await db
        .select({
          id: collections.id,
          name: collections.name,
          createdAt: collections.createdAt,
          itemCount: sql<number>`COUNT(${collectionItems.generatedDesignId})::int`,
        })
        .from(collections)
        .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
        .where(eq(collections.userId, HARDCODED_USER_ID))
        .groupBy(collections.id, collections.name, collections.createdAt)
        .orderBy(desc(collections.createdAt));

      // For each collection, fetch up to 4 image URLs
      const collectionsWithImages = await Promise.all(
        userCollections.map(async (collection) => {
          const items = await db
            .select({
              imageUrl: generatedDesigns.generatedImageUrl,
            })
            .from(collectionItems)
            .innerJoin(generatedDesigns, eq(generatedDesigns.id, collectionItems.generatedDesignId))
            .where(eq(collectionItems.collectionId, collection.id))
            .limit(4);

          return {
            id: collection.id,
            name: collection.name,
            itemCount: collection.itemCount,
            imageUrls: items
              .map((item) => item.imageUrl)
              .filter((url): url is string => url !== null && url !== ''),
          };
        })
      );

      return reply.status(200).send(collectionsWithImages);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to fetch collections');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
