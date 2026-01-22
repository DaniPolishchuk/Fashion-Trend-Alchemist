/**
 * Generated Designs table schema
 * Stores AI-generated design results and predictions
 */

import { pgTable, uuid, jsonb, text, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

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
  generatedImageUrl: text('generated_image_url'),
  imageGenerationStatus: varchar('image_generation_status', { length: 20 }).default('pending'),
});

export type GeneratedDesign = typeof generatedDesigns.$inferSelect;
export type NewGeneratedDesign = typeof generatedDesigns.$inferInsert;
