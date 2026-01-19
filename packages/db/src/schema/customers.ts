/**
 * Customers table schema
 * Defines the structure of customer records
 */

import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';

/**
 * Customers table - contains customer profile information
 */
export const customers = pgTable('customers', {
  customerId: varchar('customer_id', { length: 50 }).primaryKey(),
  age: integer('age'),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
