/**
 * Database package exports
 * Provides centralized access to database client and queries
 */

export { db, pool, closeDb } from './client.js';
export { fetchTopBottomByProductType } from './queries/analytics.js';
export { getDistinctProductTypes } from './queries/productTypes.js';
export { fetchProductTaxonomy } from './queries/taxonomy.js';
export * from './schema/index.js';
export * from './queries/analytics.js';

// Re-export drizzle-orm query functions for API consumers
export { eq, and, inArray, sql, desc } from 'drizzle-orm';
