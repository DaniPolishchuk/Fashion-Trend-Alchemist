/**
 * Collections API Routes
 * Handles collections listing for home page display
 */

import { FastifyInstance } from 'fastify';
import {
  db,
  collections,
  collectionItems,
  generatedDesigns,
  eq,
  sql,
  desc,
  and,
} from '@fashion/db';

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
            createdAt: collection.createdAt,
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

  /**
   * POST /api/collections
   * Create a new collection
   */
  fastify.post('/collections', async (request, reply) => {
    try {
      const { name } = request.body as { name: string };

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return reply.status(400).send({ error: 'Collection name is required' });
      }

      const [newCollection] = await db
        .insert(collections)
        .values({
          userId: HARDCODED_USER_ID,
          name: name.trim(),
        })
        .returning();

      return reply.status(201).send(newCollection);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to create collection');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/collections/:id
   * Get collection details with all designs
   */
  fastify.get('/collections/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Get collection metadata
      const [collection] = await db
        .select({
          id: collections.id,
          name: collections.name,
          createdAt: collections.createdAt,
        })
        .from(collections)
        .where(and(eq(collections.id, id), eq(collections.userId, HARDCODED_USER_ID)));

      if (!collection) {
        return reply.status(404).send({ error: 'Collection not found' });
      }

      // Get all designs in the collection
      const designs = await db
        .select({
          id: generatedDesigns.id,
          name: generatedDesigns.name,
          projectId: generatedDesigns.projectId,
          generatedImageUrl: generatedDesigns.generatedImageUrl,
          generatedImages: generatedDesigns.generatedImages,
          predictedAttributes: generatedDesigns.predictedAttributes,
          inputConstraints: generatedDesigns.inputConstraints,
          createdAt: generatedDesigns.createdAt,
        })
        .from(collectionItems)
        .innerJoin(generatedDesigns, eq(generatedDesigns.id, collectionItems.generatedDesignId))
        .where(eq(collectionItems.collectionId, id))
        .orderBy(desc(generatedDesigns.createdAt));

      return reply.status(200).send({
        ...collection,
        itemCount: designs.length,
        designs,
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to fetch collection details');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * PATCH /api/collections/:id
   * Rename a collection
   */
  fastify.patch('/collections/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { name } = request.body as { name: string };

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return reply.status(400).send({ error: 'Collection name is required' });
      }

      // Check if collection exists and belongs to user
      const [existingCollection] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(and(eq(collections.id, id), eq(collections.userId, HARDCODED_USER_ID)));

      if (!existingCollection) {
        return reply.status(404).send({ error: 'Collection not found' });
      }

      // Update the collection name
      const [updatedCollection] = await db
        .update(collections)
        .set({ name: name.trim() })
        .where(eq(collections.id, id))
        .returning();

      return reply.status(200).send(updatedCollection);
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to update collection');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * DELETE /api/collections/:id
   * Delete a collection (keeps the designs, only removes collection metadata)
   */
  fastify.delete('/collections/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Check if collection exists and belongs to user
      const [existingCollection] = await db
        .select({ id: collections.id, name: collections.name })
        .from(collections)
        .where(and(eq(collections.id, id), eq(collections.userId, HARDCODED_USER_ID)));

      if (!existingCollection) {
        return reply.status(404).send({ error: 'Collection not found' });
      }

      // Delete collection (cascade will automatically remove collection_items)
      await db.delete(collections).where(eq(collections.id, id));

      return reply.status(200).send({
        message: 'Collection deleted successfully',
        deletedCollection: existingCollection,
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to delete collection');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * DELETE /api/collections/:id/items/:designId
   * Remove a design from a collection
   */
  fastify.delete('/collections/:id/items/:designId', async (request, reply) => {
    try {
      const { id, designId } = request.params as { id: string; designId: string };

      // Check if collection exists and belongs to user
      const [collection] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(and(eq(collections.id, id), eq(collections.userId, HARDCODED_USER_ID)));

      if (!collection) {
        return reply.status(404).send({ error: 'Collection not found' });
      }

      // Remove the design from collection
      await db
        .delete(collectionItems)
        .where(
          and(eq(collectionItems.collectionId, id), eq(collectionItems.generatedDesignId, designId))
        );

      return reply.status(200).send({ message: 'Design removed from collection successfully' });
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to remove design from collection');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/collections/:id/items
   * Add a design to a collection
   */
  fastify.post('/collections/:id/items', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { generatedDesignId } = request.body as { generatedDesignId: string };

      if (!generatedDesignId) {
        return reply.status(400).send({ error: 'generatedDesignId is required' });
      }

      // Check if collection exists and belongs to user
      const [collection] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(and(eq(collections.id, id), eq(collections.userId, HARDCODED_USER_ID)));

      if (!collection) {
        return reply.status(404).send({ error: 'Collection not found' });
      }

      // Check if design exists
      const [design] = await db
        .select({ id: generatedDesigns.id })
        .from(generatedDesigns)
        .where(eq(generatedDesigns.id, generatedDesignId));

      if (!design) {
        return reply.status(404).send({ error: 'Design not found' });
      }

      // Try to add the design to collection
      try {
        await db.insert(collectionItems).values({
          collectionId: id,
          generatedDesignId,
        });

        return reply.status(201).send({ message: 'Design added to collection successfully' });
      } catch (dbError: any) {
        // Check if it's a duplicate key error (design already in collection)
        if (dbError.code === '23505') {
          // PostgreSQL unique constraint violation
          return reply.status(409).send({ error: 'Design is already in this collection' });
        }
        throw dbError;
      }
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to add design to collection');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
