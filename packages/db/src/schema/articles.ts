/**
 * Articles table schema
 * Defines the structure of product articles in the catalog
 */

import { pgTable, varchar, text } from 'drizzle-orm/pg-core';

/**
 * Articles table - contains product catalog information
 */
export const articles = pgTable('articles', {
  articleId: varchar('article_id').primaryKey(),
  productType: varchar('product_type', { length: 100 }).notNull(),
  productGroup: varchar('product_group', { length: 100 }),
  patternStyle: varchar('pattern_style', { length: 100 }),
  specificColor: varchar('specific_color', { length: 100 }),
  colorIntensity: varchar('color_intensity', { length: 100 }),
  colorFamily: varchar('color_family', { length: 100 }),
  productFamily: varchar('product_family', { length: 100 }),
  customerSegment: varchar('customer_segment', { length: 100 }),
  styleConcept: varchar('style_concept', { length: 100 }),
  fabricTypeBase: varchar('fabric_type_base', { length: 100 }),
  detailDesc: text('detail_desc'),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
