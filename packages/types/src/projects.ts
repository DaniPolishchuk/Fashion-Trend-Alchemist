/**
 * Project-related Zod schemas and TypeScript types
 * Used for API validation and type safety
 */

import { z } from 'zod';

/**
 * Schema for creating a new project
 */
export const CreateProjectInputSchema = z.object({
  name: z.string().min(1).max(255),
  scopeConfig: z
    .object({
      productTypes: z.array(z.string()).min(1),
      productGroups: z.array(z.string()).min(1),
    })
    .optional(),
});

/**
 * Schema for updating an existing project
 */
export const UpdateProjectInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  seasonConfig: z
    .object({
      season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
      startDate: z.string().optional(), // MM-DD format
      endDate: z.string().optional(), // MM-DD format
    })
    .optional(),
  scopeConfig: z
    .object({
      productTypes: z.array(z.string()).min(1),
      productGroups: z.array(z.string()).min(1),
    })
    .optional(),
  ontologySchema: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema for project response from API
 */
export const ProjectResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  status: z.enum(['draft', 'active']),
  seasonConfig: z.record(z.string(), z.any()).nullable(),
  scopeConfig: z.record(z.string(), z.any()).nullable(),
  ontologySchema: z.record(z.string(), z.any()).nullable(),
  createdAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

/**
 * Schema for preview context query parameters
 */
export const PreviewContextQuerySchema = z.object({
  season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  mdFrom: z.string().optional(), // MM-DD format
  mdTo: z.string().optional(), // MM-DD format
  // Attribute filters
  filter_productGroup: z.string().optional(),
  filter_productFamily: z.string().optional(),
  filter_styleConcept: z.string().optional(),
  filter_patternStyle: z.string().optional(),
  filter_colorFamily: z.string().optional(),
  filter_colorIntensity: z.string().optional(),
  filter_specificColor: z.string().optional(),
  filter_customerSegment: z.string().optional(),
  filter_fabricTypeBase: z.string().optional(),
});

/**
 * Schema for locking project context
 */
export const LockContextInputSchema = z.object({
  articles: z
    .array(
      z.object({
        article_id: z.string(),
        velocity_score: z.number(),
      })
    )
    .length(50), // Enforce exactly 50 articles
  seasonConfig: z
    .object({
      season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
});

/**
 * TypeScript types derived from schemas
 */
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
export type PreviewContextQuery = z.infer<typeof PreviewContextQuerySchema>;
export type LockContextInput = z.infer<typeof LockContextInputSchema>;
