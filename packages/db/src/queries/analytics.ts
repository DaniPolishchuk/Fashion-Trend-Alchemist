/**
 * Analytics query functions
 * Provides optimized SQL queries for sales analysis and ranking
 */

import { pool } from '../client.js';
import type { TopBottomQuery } from '@fashion/types';

/**
 * Interface for raw query result row from top/bottom sellers query
 */
interface TopBottomRow {
  kind: 'top' | 'bottom';
  article_id: number;
  prod_name: string;
  product_type_name: string;
  units_sold: string;
  revenue: string;
}

/**
 * Fetch top and bottom sellers by product type
 * 
 * This function executes an optimized SQL query that:
 * 1. Filters articles by product type (name or number)
 * 2. Aggregates transactions to calculate units sold and revenue
 * 3. Ranks articles using window functions (RANK OVER)
 * 4. Returns top N and bottom N performers
 * 5. Includes articles with zero sales when includeZero is true
 * 
 * @param query - Query parameters for filtering and ranking
 * @returns Object containing arrays of top and bottom performing articles
 * 
 * @example
 * ```typescript
 * const result = await fetchTopBottomByProductType({
 *   productTypeName: 'Sweater',
 *   metric: 'units',
 *   limit: 500,
 *   includeZero: true
 * });
 * console.log(`Top seller: ${result.top[0].prodName}`);
 * ```
 */
export async function fetchTopBottomByProductType(query: TopBottomQuery) {
  const {
    productTypeName,
    productTypeNo,
    startDate,
    endDate,
    salesChannelId,
    metric = 'units',
    limit = 500,
    includeZero = true,
  } = query;

  // Build dynamic WHERE clauses for article filtering
  const articleWhereClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 0;

  // Filter by product type name (exact match)
  if (productTypeName) {
    articleWhereClauses.push(`a.product_type_name = $${++paramIndex}`);
    params.push(productTypeName);
  }

  // Filter by product type number (alternative to name)
  if (productTypeNo != null) {
    articleWhereClauses.push(`a.product_type_no = $${++paramIndex}`);
    params.push(productTypeNo);
  }

  // Build dynamic WHERE clauses for transaction filtering
  const transactionWhereClauses: string[] = [];

  // Filter by date range (inclusive start, exclusive end)
  if (startDate) {
    transactionWhereClauses.push(`t.t_dat >= $${++paramIndex}`);
    params.push(startDate);
  }

  if (endDate) {
    transactionWhereClauses.push(`t.t_dat < $${++paramIndex}`);
    params.push(endDate);
  }

  // Filter by sales channel (1 = online, 2 = retail)
  if (salesChannelId != null) {
    transactionWhereClauses.push(`t.sales_channel_id = $${++paramIndex}`);
    params.push(salesChannelId);
  }

  // Construct transaction filter SQL
  const txFilter = transactionWhereClauses.length 
    ? `AND ${transactionWhereClauses.join(' AND ')}` 
    : '';

  // Choose join type based on includeZero parameter
  // LEFT JOIN includes articles with no transactions (zero sales)
  // INNER JOIN excludes articles with no transactions
  const joinType = includeZero ? 'LEFT JOIN' : 'INNER JOIN';

  // Construct article filter SQL
  const articleFilter = articleWhereClauses.length
    ? `WHERE ${articleWhereClauses.join(' AND ')}`
    : '';

  // Determine ranking column based on metric
  const rankColumn = metric === 'units' ? 'units_sold' : 'revenue';

  // Add limit parameter
  params.push(limit);
  const limitParamIndex = paramIndex + 1;

  /**
   * Complex SQL query explanation:
   * 
   * CTE 1 (filtered_articles): 
   *   - Selects articles matching product type criteria
   * 
   * CTE 2 (agg):
   *   - Aggregates transaction data per article
   *   - Counts units sold (number of transaction rows)
   *   - Sums revenue (total of transaction prices)
   *   - Uses LEFT/INNER JOIN based on includeZero setting
   *   - COALESCE ensures zero values for articles without transactions
   * 
   * CTE 3 (ranked):
   *   - Assigns descending rank (rdesc) for top sellers
   *   - Assigns ascending rank (rasc) for bottom sellers
   *   - RANK() handles ties by giving same rank to equal values
   *   - Secondary sort by units_sold/revenue for stability
   * 
   * Final SELECT:
   *   - UNION ALL combines top and bottom results
   *   - Filters using rdesc <= limit for top sellers
   *   - Filters using rasc <= limit for bottom sellers
   *   - Joins back to articles table for display fields
   *   - Orders by kind (bottom first, top second) then metric
   */
  const query_sql = `
    WITH filtered_articles AS (
      SELECT a.article_id, a.prod_name, a.product_type_name
      FROM articles a
      ${articleFilter}
    ),
    agg AS (
      SELECT 
        fa.article_id,
        COUNT(t.article_id) AS units_sold,
        COALESCE(SUM(t.price::numeric), 0) AS revenue
      FROM filtered_articles fa
      ${joinType} transactions_train t
        ON fa.article_id = t.article_id
        ${txFilter}
      GROUP BY fa.article_id
    ),
    ranked AS (
      SELECT 
        a.article_id,
        a.units_sold,
        a.revenue,
        RANK() OVER (
          ORDER BY a.${rankColumn} DESC, a.units_sold DESC
        ) AS rdesc,
        RANK() OVER (
          ORDER BY a.${rankColumn} ASC, a.revenue ASC
        ) AS rasc
      FROM agg a
    )
    SELECT 
      'top' AS kind,
      r.article_id,
      r.units_sold,
      r.revenue,
      ar.prod_name,
      ar.product_type_name
    FROM ranked r
    JOIN articles ar ON ar.article_id = r.article_id
    WHERE r.rdesc <= $${limitParamIndex}
    
    UNION ALL
    
    SELECT 
      'bottom' AS kind,
      r.article_id,
      r.units_sold,
      r.revenue,
      ar.prod_name,
      ar.product_type_name
    FROM ranked r
    JOIN articles ar ON ar.article_id = r.article_id
    WHERE r.rasc <= $${limitParamIndex}
    
    ORDER BY kind ASC, ${rankColumn} DESC
  `;

  // Execute raw SQL query with parameters using pg pool directly
  const result = await pool.query(query_sql, params);
  const rows = result.rows as TopBottomRow[];

  // Partition results into top and bottom arrays
  const top: Array<{
    articleId: number;
    prodName: string;
    productTypeName: string;
    unitsSold: number;
    revenue: number;
    imageKey: string;
  }> = [];

  const bottom: Array<{
    articleId: number;
    prodName: string;
    productTypeName: string;
    unitsSold: number;
    revenue: number;
    imageKey: string;
  }> = [];

  // Transform and partition rows
  for (const row of rows) {
    const articleIdStr = String(row.article_id);
    
    // Build image key following SeaweedFS folder structure
    // Folder = first 2 digits of article_id
    // Filename = article_id.jpg
    const folder = articleIdStr.slice(0, 2);
    const imageKey = `${folder}/${articleIdStr}.jpg`;

    const item = {
      articleId: Number(row.article_id),
      prodName: row.prod_name,
      productTypeName: row.product_type_name,
      unitsSold: Number(row.units_sold),
      revenue: Number(row.revenue),
      imageKey,
    };

    if (row.kind === 'top') {
      top.push(item);
    } else {
      bottom.push(item);
    }
  }

  return { top, bottom };
}
