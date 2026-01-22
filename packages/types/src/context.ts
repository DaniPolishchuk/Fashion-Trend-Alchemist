/**
 * Context-related Zod schemas and TypeScript types
 * Used for project context items and enrichment
 */

import { z } from 'zod';

/**
 * Schema for a context item with velocity score
 */
export const ContextItemSchema = z.object({
  article_id: z.string(),
  product_type: z.string(),
  product_group: z.string(),
  velocity_score: z.number(),
  // Article attributes
  product_family: z.string().nullable(),
  style_concept: z.string().nullable(),
  pattern_style: z.string().nullable(),
  specific_color: z.string().nullable(),
  color_intensity: z.string().nullable(),
  color_family: z.string().nullable(),
  customer_segment: z.string().nullable(),
  fabric_type_base: z.string().nullable(),
  detail_desc: z.string().nullable(),
});

/**
 * Schema for enriched attributes (AI-generated)
 */
export const EnrichedAttributesSchema = z.record(z.string(), z.any());

/**
 * Schema for project context item (database record)
 */
export const ProjectContextItemSchema = z.object({
  project_id: z.string().uuid(),
  article_id: z.string(),
  velocity_score: z.number(),
  enriched_attributes: EnrichedAttributesSchema.nullable(),
});

/**
 * Schema for preview context response
 */
export const PreviewContextResponseSchema = z.array(ContextItemSchema);

/**
 * TypeScript types derived from schemas
 */
export type ContextItem = z.infer<typeof ContextItemSchema>;
export type EnrichedAttributes = z.infer<typeof EnrichedAttributesSchema>;
export type ProjectContextItem = z.infer<typeof ProjectContextItemSchema>;
export type PreviewContextResponse = z.infer<typeof PreviewContextResponseSchema>;

/**
 * Schema for context item response in Enhanced Table
 */
export const ContextItemResponseSchema = z.object({
  articleId: z.string(),
  productType: z.string(),
  productGroup: z.string().nullable(),
  colorFamily: z.string().nullable(),
  patternStyle: z.string().nullable(),
  detailDesc: z.string().nullable(),
  velocityScore: z.number(),
  enrichedAttributes: z.record(z.string(), z.string()).nullable(),
  enrichmentError: z.string().nullable(),
  imageUrl: z.string(),
});

/**
 * Schema for context items summary
 */
export const ContextItemsSummarySchema = z.object({
  total: z.number(),
  successful: z.number(),
  pending: z.number(),
  failed: z.number(),
});

/**
 * Schema for context items response
 */
export const ContextItemsResponseSchema = z.object({
  items: z.array(ContextItemResponseSchema),
  summary: ContextItemsSummarySchema,
  ontologyAttributes: z.array(z.string()),
  enrichmentStatus: z.enum(['idle', 'running', 'completed', 'failed']),
  currentArticleId: z.string().nullable(),
});

/**
 * TypeScript types for Enhanced Table
 */
export type ContextItemResponse = z.infer<typeof ContextItemResponseSchema>;
export type ContextItemsSummary = z.infer<typeof ContextItemsSummarySchema>;
export type ContextItemsResponse = z.infer<typeof ContextItemsResponseSchema>;
