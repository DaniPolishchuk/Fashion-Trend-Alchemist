/**
 * Product type queries
 * Functions for retrieving product type information
 */

import { pool } from '../client.js';

/**
 * Get all distinct product type names from the articles table
 * Used for dropdown/selection lists in UIs and CLI tools
 * 
 * @returns Array of unique product type names, sorted alphabetically
 * 
 * @example
 * ```typescript
 * const types = await getDistinctProductTypeNames();
 * console.log(types); // ['Dress', 'Sweater', 'Trousers', ...]
 * ```
 */
export async function getDistinctProductTypeNames(): Promise<string[]> {
  const query = `
    SELECT DISTINCT product_type_name
    FROM articles
    WHERE product_type_name IS NOT NULL
    ORDER BY product_type_name ASC
  `;

  const result = await pool.query<{ product_type_name: string }>(query);
  return result.rows.map(row => row.product_type_name);
}