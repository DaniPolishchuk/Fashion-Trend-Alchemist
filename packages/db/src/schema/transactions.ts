/**
 * Transactions table schema
 * Defines the structure of purchase transaction records
 */

import { date, integer, pgTable, varchar, numeric, index } from 'drizzle-orm/pg-core';
import { articles } from './articles.js';
import { customers } from './customers.js';

/**
 * Transactions training table - contains historical purchase data
 */
export const transactionsTrain = pgTable('transactions_train', {
  tDat: date('t_dat', { mode: 'string' }).notNull(),
  customerId: varchar('customer_id', { length: 50 })
    .notNull()
    .references(() => customers.customerId),
  articleId: integer('article_id')
    .notNull()
    .references(() => articles.articleId),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  salesChannelId: integer('sales_channel_id').notNull(),
}, (table) => ({
  // Indexes for efficient querying
  articleIdIdx: index('idx_transactions_article_id').on(table.articleId),
  tDatIdx: index('idx_transactions_t_dat').on(table.tDat),
  salesChannelIdx: index('idx_transactions_sales_channel').on(table.salesChannelId),
  customerIdIdx: index('idx_transactions_customer_id').on(table.customerId),
}));

export type Transaction = typeof transactionsTrain.$inferSelect;
export type NewTransaction = typeof transactionsTrain.$inferInsert;