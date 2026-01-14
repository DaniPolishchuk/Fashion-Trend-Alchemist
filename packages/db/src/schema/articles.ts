/**
 * Articles table schema
 * Defines the structure of product articles in the catalog
 */

import { integer, pgTable, varchar, text } from 'drizzle-orm/pg-core';

/**
 * Articles table - contains product catalog information
 */
export const articles = pgTable('articles', {
  articleId: integer('article_id').primaryKey(),
  productCode: integer('product_code').notNull(),
  prodName: varchar('prod_name', { length: 255 }).notNull(),
  productTypeNo: integer('product_type_no').notNull(),
  productTypeName: varchar('product_type_name', { length: 100 }).notNull(),
  productGroupName: varchar('product_group_name', { length: 100 }),
  graphicalAppearanceNo: integer('graphical_appearance_no'),
  graphicalAppearanceName: varchar('graphical_appearance_name', { length: 100 }),
  colourGroupCode: integer('colour_group_code'),
  colourGroupName: varchar('colour_group_name', { length: 100 }),
  perceivedColourValueId: integer('perceived_colour_value_id'),
  perceivedColourValueName: varchar('perceived_colour_value_name', { length: 100 }),
  perceivedColourMasterId: integer('perceived_colour_master_id'),
  perceivedColourMasterName: varchar('perceived_colour_master_name', { length: 100 }),
  departmentNo: integer('department_no'),
  departmentName: varchar('department_name', { length: 100 }),
  indexCode: varchar('index_code', { length: 10 }),
  indexName: varchar('index_name', { length: 100 }),
  indexGroupNo: integer('index_group_no'),
  indexGroupName: varchar('index_group_name', { length: 100 }),
  sectionNo: integer('section_no'),
  sectionName: varchar('section_name', { length: 100 }),
  garmentGroupNo: integer('garment_group_no'),
  garmentGroupName: varchar('garment_group_name', { length: 100 }),
  detailDesc: text('detail_desc'),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;