/**
 * Collections tables schema
 * Defines structure for user collections containing generated designs
 */

import { pgTable, uuid, varchar, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { generatedDesigns } from './generated_designs.js';

/**
 * Collections table - groups generated designs into named collections
 */
export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Collection Items table - junction table linking collections to generated designs
 */
export const collectionItems = pgTable(
  'collection_items',
  {
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id),
    generatedDesignId: uuid('generated_design_id')
      .notNull()
      .references(() => generatedDesigns.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collectionId, table.generatedDesignId] }),
  })
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type NewCollectionItem = typeof collectionItems.$inferInsert;
