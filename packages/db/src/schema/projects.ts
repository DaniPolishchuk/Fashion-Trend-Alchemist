/**
 * Projects table schema
 * Defines the structure of user projects for trend analysis
 */

import { pgTable, uuid, varchar, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';

/**
 * Project status enum - represents the lifecycle state
 */
export const projectStatusEnum = pgEnum('project_status', ['draft', 'active']);

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
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
