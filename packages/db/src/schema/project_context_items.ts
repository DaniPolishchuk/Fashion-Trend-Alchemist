/**
 * Project Context Items table schema
 * Links projects to selected articles with calculated velocity scores
 */

import { pgTable, uuid, varchar, numeric, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';
import { articles } from './articles.js';

/**
 * Project Context Items table - many-to-many relationship between projects and articles
 * Uses composite primary key to prevent duplicates
 */
export const projectContextItems = pgTable(
  'project_context_items',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    articleId: varchar('article_id')
      .notNull()
      .references(() => articles.articleId),
    velocityScore: numeric('velocity_score', { precision: 10, scale: 2 }).notNull(),
    enrichedAttributes: jsonb('enriched_attributes'),
  },
  (table) => ({
    // Composite primary key to ensure no duplicate articles per project
    pk: primaryKey({ columns: [table.projectId, table.articleId] }),
  })
);

export type ProjectContextItem = typeof projectContextItems.$inferSelect;
export type NewProjectContextItem = typeof projectContextItems.$inferInsert;
