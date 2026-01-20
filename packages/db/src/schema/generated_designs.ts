/**
 * Generated Designs table schema
 * Stores AI-generated design results and predictions
 */

import { pgTable, uuid, jsonb, text } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

/**
 * Generated Designs table - stores AI-generated design outputs
 */
export const generatedDesigns = pgTable('generated_designs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  inputConstraints: jsonb('input_constraints'),
  predictedAttributes: jsonb('predicted_attributes'),
  generatedImageUrl: text('generated_image_url'),
});

export type GeneratedDesign = typeof generatedDesigns.$inferSelect;
export type NewGeneratedDesign = typeof generatedDesigns.$inferInsert;
