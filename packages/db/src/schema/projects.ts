/**
 * Projects table schema
 * Defines the structure of user projects for trend analysis
 */

import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

/**
 * Project status enum - represents the lifecycle state
 */
export const projectStatusEnum = pgEnum('project_status', ['draft', 'active']);

/**
 * Enrichment status enum - represents the Vision LLM enrichment state
 */
export const enrichmentStatusEnum = pgEnum('enrichment_status', [
  'idle', // Not started or completed
  'running', // Currently processing
  'completed', // All items processed
  'failed', // Stopped due to error
]);

/**
 * Projects table - contains project metadata and configuration
 */
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().default('00000000-0000-0000-0000-000000000000'),
  name: varchar('name', { length: 255 }).notNull(),
  status: projectStatusEnum('status').notNull().default('draft'),
  seasonConfig: jsonb('season_config'),
  scopeConfig: jsonb('scope_config'),
  ontologySchema: jsonb('ontology_schema'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  // Enrichment tracking columns
  enrichmentStatus: enrichmentStatusEnum('enrichment_status').notNull().default('idle'),
  enrichmentProcessed: integer('enrichment_processed').notNull().default(0),
  enrichmentTotal: integer('enrichment_total').notNull().default(0),
  enrichmentCurrentArticleId: varchar('enrichment_current_article_id', { length: 50 }),
  enrichmentStartedAt: timestamp('enrichment_started_at'),
  enrichmentCompletedAt: timestamp('enrichment_completed_at'),
  // Pinning columns
  isPinned: boolean('is_pinned').notNull().default(false),
  pinnedAt: timestamp('pinned_at'),
  // Mismatch review columns
  mismatchReviewCompleted: boolean('mismatch_review_completed').notNull().default(false),
  velocityScoresStale: boolean('velocity_scores_stale').notNull().default(false),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
