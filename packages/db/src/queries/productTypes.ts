/**
 * Product type queries
 * Functions for retrieving product type information
 */

import { pool } from '../client.js';

/**
 * Get all distinct product types from the articles table
 * Used for dropdown/selection lists in UIs and CLI tools
 * 
 * @returns Array of unique product types, sorted alphabetically
 * 
 * @example
 * ```typescript
 * const types = await getDistinctProductTypes();
 * console.log(types); // ['Dress', 'Sweater', 'Trousers', ...]
 * ```
 */
export async function getDistinctProductTypes(): Promise<string[]> {
  const query = `
    SELECT DISTINCT product_type
    FROM articles
    WHERE product_type IS NOT NULL
    ORDER BY product_type ASC
  `;

  const result = await pool.query<{ product_type: string }>(query);
  return result.rows.map(row => row.product_type);
}
