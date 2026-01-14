/**
 * Customers table schema
 * Defines the structure of customer records
 */

import { boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core';

/**
 * Customers table - contains customer profile information
 */
export const customers = pgTable('customers', {
  customerId: varchar('customer_id', { length: 50 }).primaryKey(),
  fn: varchar('fn', { length: 255 }),
  active: boolean('active'),
  clubMemberStatus: varchar('club_member_status', { length: 50 }),
  fashionNewsFrequency: varchar('fashion_news_frequency', { length: 50 }),
  age: integer('age'),
  postalCode: varchar('postal_code', { length: 20 }),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;