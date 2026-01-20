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
