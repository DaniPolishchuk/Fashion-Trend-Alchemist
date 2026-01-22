/**
 * Context Items API Routes
 * Provides context items data for the Enhanced Table tab
 */

import { FastifyInstance } from 'fastify';
import {
  db,
  projects,
  projectContextItems,
  articles,
  eq,
} from '@fashion/db';
import { imageStrategy, filerConfig } from '@fashion/config';

// Type for ontology schema structure
type OntologySchema = Record<string, Record<string, string[]>>;

/**
 * Generate image URL based on configured strategy
 * For frontend display, we use direct HTTP URLs (filer strategy preferred)
 * Images are stored with path pattern: {first-2-chars}/{articleId}.jpg
 */
function getImageUrl(articleId: string): string {
  const folder = articleId.slice(0, 2);

  if (imageStrategy === 'filer') {
    // Direct HTTP URL through Filer
    return `${filerConfig.baseUrl}/${filerConfig.bucket}/${folder}/${articleId}.jpg`;
  } else {
    // For S3 strategy, we still provide a filer-style URL for frontend
    // The frontend will handle image loading errors gracefully
    return `${filerConfig.baseUrl}/${filerConfig.bucket}/${folder}/${articleId}.jpg`;
  }
}

/**
 * Extract ontology attribute names from project's ontologySchema
 */
function extractOntologyAttributes(ontologySchema: OntologySchema | null): string[] {
  if (!ontologySchema) return [];

  const attributeNames = new Set<string>();

  for (const productType of Object.keys(ontologySchema)) {
    const attrs = ontologySchema[productType];
    if (attrs) {
      for (const attrName of Object.keys(attrs)) {
        attributeNames.add(attrName);
      }
    }
  }

  return Array.from(attributeNames).sort();
}

export default async function contextItemsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/projects/:id/context-items
   * Returns all context items for a project with enrichment status
   */
  fastify.get<{ Params: { id: string } }>(
    '/projects/:id/context-items',
    async (request, reply) => {
      try {
        const { id: projectId } = request.params;

        // Get project with enrichment status and ontology schema
        const [project] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, projectId));

        if (!project) {
          return reply.status(404).send({ error: 'Project not found' });
        }

        // Fetch all context items joined with articles
        const items = await db
          .select({
            articleId: projectContextItems.articleId,
            productType: articles.productType,
            productGroup: articles.productGroup,
            colorFamily: articles.colorFamily,
            patternStyle: articles.patternStyle,
            detailDesc: articles.detailDesc,
            velocityScore: projectContextItems.velocityScore,
            enrichedAttributes: projectContextItems.enrichedAttributes,
            enrichmentError: projectContextItems.enrichmentError,
          })
          .from(projectContextItems)
          .innerJoin(articles, eq(projectContextItems.articleId, articles.articleId))
          .where(eq(projectContextItems.projectId, projectId));

        // Generate image URLs for all items
        const itemsWithImages = items.map((item) => ({
          articleId: item.articleId,
          productType: item.productType,
          productGroup: item.productGroup,
          colorFamily: item.colorFamily,
          patternStyle: item.patternStyle,
          detailDesc: item.detailDesc,
          velocityScore: parseFloat(item.velocityScore) || 0,
          enrichedAttributes: item.enrichedAttributes as Record<string, string> | null,
          enrichmentError: item.enrichmentError,
          imageUrl: getImageUrl(item.articleId),
        }));

        // Calculate summary counts
        const total = items.length;
        const successful = items.filter(
          (item) => item.enrichedAttributes !== null
        ).length;
        const failed = items.filter(
          (item) => item.enrichmentError !== null
        ).length;
        const pending = total - successful - failed;

        // Extract ontology attributes from project schema
        const ontologySchema = project.ontologySchema as OntologySchema | null;
        const ontologyAttributes = extractOntologyAttributes(ontologySchema);

        return reply.status(200).send({
          items: itemsWithImages,
          summary: {
            total,
            successful,
            pending,
            failed,
          },
          ontologyAttributes,
          enrichmentStatus: project.enrichmentStatus,
          currentArticleId: project.enrichmentCurrentArticleId,
        });
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to fetch context items');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );
}
