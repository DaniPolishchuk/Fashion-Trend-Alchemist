/**
 * Transactions table schema
 * Defines the structure of purchase transaction records
 */

import { date, pgTable, varchar, numeric, index } from 'drizzle-orm/pg-core';
import { articles } from './articles.js';
import { customers } from './customers.js';

/**
 * Transactions training table - contains historical purchase data
 */
export const transactionsTrain = pgTable('transactions_train', {
  tDate: date('t_date', { mode: 'date' }).notNull(),
  customerId: varchar('customer_id', { length: 50 })
    .notNull()
    .references(() => customers.customerId),
  articleId: varchar('article_id')
    .notNull()
    .references(() => articles.articleId),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  // Indexes for efficient querying
  articleIdIdx: index('idx_transactions_article_id').on(table.articleId),
  tDateIdx: index('idx_transactions_t_date').on(table.tDate),
  customerIdIdx: index('idx_transactions_customer_id').on(table.customerId),
}));

export type Transaction = typeof transactionsTrain.$inferSelect;
export type NewTransaction = typeof transactionsTrain.$inferInsert;
