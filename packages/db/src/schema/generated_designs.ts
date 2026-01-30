/**
 * Generated Designs table schema
 * Stores AI-generated design results and predictions
 */

import { pgTable, uuid, jsonb, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

/**
 * Type for individual image view status
 */
export type ImageViewStatus = 'pending' | 'generating' | 'completed' | 'failed';

/**
 * Type for sales text generation status
 */
export type SalesTextStatus = 'pending' | 'generating' | 'completed' | 'failed';

/**
 * Type for multi-image generation (front/back/model views)
 */
export interface GeneratedImages {
  front: { url: string | null; status: ImageViewStatus };
  back: { url: string | null; status: ImageViewStatus };
  model: { url: string | null; status: ImageViewStatus };
}

/**
 * Generated Designs table - stores AI-generated design outputs
 */
export const generatedDesigns = pgTable('generated_designs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  name: varchar('name', { length: 300 }).notNull().default('Unnamed Design'),
  inputConstraints: jsonb('input_constraints'),
  predictedAttributes: jsonb('predicted_attributes'),
  // Legacy single image field (kept for backward compatibility)
  generatedImageUrl: text('generated_image_url'),
  // Legacy status field (kept for backward compatibility)
  imageGenerationStatus: varchar('image_generation_status', { length: 20 }).default('pending'),
  // Multi-image support: stores front/back/model views with per-view status
  generatedImages: jsonb('generated_images').$type<GeneratedImages>(),
  // Sales text generation
  salesText: text('sales_text'),
  salesTextGenerationStatus: varchar('sales_text_generation_status', { length: 20 })
    .default('pending')
    .$type<SalesTextStatus>(),
  // Creation timestamp
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type GeneratedDesign = typeof generatedDesigns.$inferSelect;
export type NewGeneratedDesign = typeof generatedDesigns.$inferInsert;
