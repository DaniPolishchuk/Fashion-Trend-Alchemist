/**
 * Context Items API Routes
 * Provides context items data for the Enhanced Table tab
 */

import { FastifyInstance } from 'fastify';
import { db, projects, projectContextItems, articles, eq } from '@fashion/db';
import { filerConfig } from '@fashion/config';

// Type for ontology schema structure
type OntologySchema = Record<string, Record<string, string[]>>;

/**
 * Generate image URL based on configured strategy
 * For frontend display, we use direct HTTP URLs (filer strategy preferred)
 * Images are stored with path pattern: {first-2-chars}/{articleId}.jpg
 */
function getImageUrl(articleId: string): string {
  const folder = articleId.slice(0, 2);
  return `${filerConfig.baseUrl}/${filerConfig.bucket}/${folder}/${articleId}.jpg`;
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
  fastify.get<{ Params: { id: string } }>('/projects/:id/context-items', async (request, reply) => {
    try {
      const { id: projectId } = request.params;

      // Get project with enrichment status and ontology schema
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

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
          specificColor: articles.specificColor,
          colorIntensity: articles.colorIntensity,
          productFamily: articles.productFamily,
          customerSegment: articles.customerSegment,
          styleConcept: articles.styleConcept,
          fabricTypeBase: articles.fabricTypeBase,
          detailDesc: articles.detailDesc,
          velocityScore: projectContextItems.velocityScore,
          enrichedAttributes: projectContextItems.enrichedAttributes,
          enrichmentError: projectContextItems.enrichmentError,
          mismatchConfidence: projectContextItems.mismatchConfidence,
          isExcluded: projectContextItems.isExcluded,
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
        specificColor: item.specificColor,
        colorIntensity: item.colorIntensity,
        productFamily: item.productFamily,
        customerSegment: item.customerSegment,
        styleConcept: item.styleConcept,
        fabricTypeBase: item.fabricTypeBase,
        detailDesc: item.detailDesc,
        velocityScore: parseFloat(item.velocityScore) || 0,
        enrichedAttributes: item.enrichedAttributes as Record<string, string> | null,
        enrichmentError: item.enrichmentError,
        mismatchConfidence: item.mismatchConfidence,
        isExcluded: item.isExcluded,
        imageUrl: getImageUrl(item.articleId),
      }));

      // Calculate summary counts
      const total = items.length;
      const successful = items.filter((item) => item.enrichedAttributes !== null).length;
      const failed = items.filter((item) => item.enrichmentError !== null).length;
      const pending = total - successful - failed;

      // Calculate mismatch summary (items with confidence >= 80)
      const flaggedItems = items.filter(
        (item) => item.mismatchConfidence !== null && item.mismatchConfidence >= 80
      );
      const flaggedCount = flaggedItems.length;
      const excludedCount = items.filter((item) => item.isExcluded).length;

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
        mismatchSummary: {
          flaggedCount,
          excludedCount,
          reviewCompleted: project.mismatchReviewCompleted,
        },
        velocityScoresStale: project.velocityScoresStale,
        ontologyAttributes,
        enrichmentStatus: project.enrichmentStatus,
        currentArticleId: project.enrichmentCurrentArticleId,
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to fetch context items');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
