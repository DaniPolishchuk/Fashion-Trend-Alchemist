/**
 * Taxonomy query functions
 * Provides product group and type hierarchies from articles table
 */

import { pool } from '../client.js';
import type { ProductGroupTaxonomy } from '@fashion/types';

/**
 * Fetch complete product taxonomy grouped by product_group
 * 
 * Returns all product groups with their associated product types,
 * filtering out NULL values and sorting alphabetically.
 * 
 * @returns Array of product groups with their types
 * 
 * @example
 * ```typescript
 * const taxonomy = await fetchProductTaxonomy();
 * // [
 * //   { productGroup: 'Accessories', typeCount: 5, productTypes: ['Bags', 'Hats', ...] },
 * //   { productGroup: 'Garment Upper', typeCount: 8, productTypes: [...] }
 * // ]
 * ```
 */
export async function fetchProductTaxonomy(): Promise<ProductGroupTaxonomy[]> {
  const query = `
    SELECT
      product_group,
      COUNT(DISTINCT product_type) AS type_count,
      ARRAY_AGG(DISTINCT product_type ORDER BY product_type) AS product_types
    FROM articles
    WHERE product_group IS NOT NULL 
      AND product_type IS NOT NULL
    GROUP BY product_group
    ORDER BY product_group ASC
  `;

  const result = await pool.query<{
    product_group: string;
    type_count: string;
    product_types: string[];
  }>(query);

  return result.rows.map(row => ({
    productGroup: row.product_group,
    typeCount: Number(row.type_count),
    productTypes: row.product_types,
  }));
}
