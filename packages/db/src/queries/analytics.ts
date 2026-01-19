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
  article_id: string;
  virality_score: number;
  units_sold: string;
  revenue: string;
  detail_desc: string | null;
  product_type: string;
  product_group: string | null;
  pattern_style: string | null;
  specific_color: string | null;
  color_intensity: string | null;
  color_family: string | null;
  product_family: string | null;
  customer_segment: string | null;
  style_concept: string | null;
  fabric_type_base: string | null;
}

/**
 * Fetch top and bottom sellers by product type
 * 
 * This function executes an optimized SQL query that:
 * 1. Filters articles by product type
 * 2. Aggregates transactions to calculate units sold and revenue
 * 3. Ranks articles using window functions (ROW_NUMBER OVER)
 * 4. Returns top N and bottom N performers
 * 5. Includes articles with zero sales when includeZero is true
 * 
 * @param query - Query parameters for filtering and ranking
 * @returns Object containing arrays of top and bottom performing articles
 * 
 * @example
 * ```typescript
 * const result = await fetchTopBottomByProductType({
 *   productType: 'Sweater',
 *   metric: 'units',
 *   limit: 500,
 *   includeZero: true
 * });
 * console.log(`Top seller: ${result.top[0].detailDesc}`);
 * ```
 */
export async function fetchTopBottomByProductType(query: TopBottomQuery) {
  const {
    productType,
    startDate,
    endDate,
    metric = 'units',
    limit = 500,
    includeZero = true,
  } = query;

  // Build dynamic WHERE clauses for article filtering
  const articleWhereClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 0;

  // Filter by product type (exact match)
  if (productType) {
    articleWhereClauses.push(`a.product_type = $${++paramIndex}`);
    params.push(productType);
  }

  // Build dynamic WHERE clauses for transaction filtering
  const transactionWhereClauses: string[] = [];

  // Filter by date range (inclusive start, exclusive end)
  if (startDate) {
    transactionWhereClauses.push(`t.t_date >= $${++paramIndex}::date`);
    params.push(startDate);
  }

  if (endDate) {
    transactionWhereClauses.push(`t.t_date < $${++paramIndex}::date`);
    params.push(endDate);
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
   * CTE 3 (stats):
   *   - Calculates min and max values of the ranking metric
   *   - Used for virality_score normalization (0-100 scale)
   * 
   * CTE 4 (ranked):
   *   - Assigns descending rank (rn_desc) for top sellers
   *   - Assigns ascending rank (rn_asc) for bottom sellers
   *   - ROW_NUMBER() for stable ordering without ties
   *   - Secondary sort by units_sold/revenue for stability
   * 
   * Final SELECT:
   *   - UNION ALL combines top and bottom results
   *   - Filters using rn_desc <= limit for top sellers
   *   - Filters using rn_asc <= limit for bottom sellers
   *   - Joins back to articles table for display fields
   *   - Calculates virality_score (0-100) using min-max normalization
   *   - Orders by kind (bottom first, top second) then metric
   */
  const query_sql = `
    WITH filtered_articles AS (
      SELECT a.article_id, a.detail_desc, a.product_type
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
    stats AS (
      SELECT 
        MIN(a.${rankColumn}) AS min_metric,
        MAX(a.${rankColumn}) AS max_metric
      FROM agg a
    ),
    ranked AS (
      SELECT 
        a.article_id,
        a.units_sold,
        a.revenue,
        ROW_NUMBER() OVER (
          ORDER BY a.${rankColumn} DESC, a.units_sold DESC, a.revenue DESC, a.article_id ASC
        ) AS rn_desc,
        ROW_NUMBER() OVER (
          ORDER BY a.${rankColumn} ASC, a.revenue ASC, a.units_sold ASC, a.article_id ASC
        ) AS rn_asc
      FROM agg a
    )
    SELECT 
      'top' AS kind,
      r.article_id,
      CASE
        WHEN s.max_metric = s.min_metric THEN 100.0
        ELSE LEAST(100.0, GREATEST(0.0,
          100.0 * (r.${rankColumn}::numeric - s.min_metric::numeric) 
                / NULLIF(s.max_metric::numeric - s.min_metric::numeric, 0)
        ))
      END AS virality_score,
      r.units_sold,
      r.revenue,
      COALESCE(ar.detail_desc, 'Unknown') AS detail_desc,
      ar.product_type,
      ar.product_group,
      ar.pattern_style,
      ar.specific_color,
      ar.color_intensity,
      ar.color_family,
      ar.product_family,
      ar.customer_segment,
      ar.style_concept,
      ar.fabric_type_base
    FROM ranked r
    CROSS JOIN stats s
    JOIN articles ar ON ar.article_id = r.article_id
    WHERE r.rn_desc <= $${limitParamIndex}
    
    UNION ALL
    
    SELECT 
      'bottom' AS kind,
      r.article_id,
      CASE
        WHEN s.max_metric = s.min_metric THEN 100.0
        ELSE LEAST(100.0, GREATEST(0.0,
          100.0 * (r.${rankColumn}::numeric - s.min_metric::numeric) 
                / NULLIF(s.max_metric::numeric - s.min_metric::numeric, 0)
        ))
      END AS virality_score,
      r.units_sold,
      r.revenue,
      COALESCE(ar.detail_desc, 'Unknown') AS detail_desc,
      ar.product_type,
      ar.product_group,
      ar.pattern_style,
      ar.specific_color,
      ar.color_intensity,
      ar.color_family,
      ar.product_family,
      ar.customer_segment,
      ar.style_concept,
      ar.fabric_type_base
    FROM ranked r
    CROSS JOIN stats s
    JOIN articles ar ON ar.article_id = r.article_id
    WHERE r.rn_asc <= $${limitParamIndex}
    
    ORDER BY kind ASC, ${rankColumn} DESC
  `;

  // Execute raw SQL query with parameters using pg pool directly
  const result = await pool.query(query_sql, params);
  const rows = result.rows as TopBottomRow[];

  // Partition results into top and bottom arrays
  const top: Array<{
    articleId: string;
    viralityScore: number;
    unitsSold: number;
    revenue: number;
    imageKey: string;
    detailDesc: string | null;
    productType: string;
    productGroup: string | null;
    patternStyle: string | null;
    specificColor: string | null;
    colorIntensity: string | null;
    colorFamily: string | null;
    productFamily: string | null;
    customerSegment: string | null;
    styleConcept: string | null;
    fabricTypeBase: string | null;
  }> = [];

  const bottom: Array<{
    articleId: string;
    viralityScore: number;
    unitsSold: number;
    revenue: number;
    imageKey: string;
    detailDesc: string | null;
    productType: string;
    productGroup: string | null;
    patternStyle: string | null;
    specificColor: string | null;
    colorIntensity: string | null;
    colorFamily: string | null;
    productFamily: string | null;
    customerSegment: string | null;
    styleConcept: string | null;
    fabricTypeBase: string | null;
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
      articleId: row.article_id,
      viralityScore: row.virality_score,
      unitsSold: Number(row.units_sold),
      revenue: Number(row.revenue),
      imageKey,
      detailDesc: row.detail_desc,
      productType: row.product_type,
      productGroup: row.product_group,
      patternStyle: row.pattern_style,
      specificColor: row.specific_color,
      colorIntensity: row.color_intensity,
      colorFamily: row.color_family,
      productFamily: row.product_family,
      customerSegment: row.customer_segment,
      styleConcept: row.style_concept,
      fabricTypeBase: row.fabric_type_base,
    };

    if (row.kind === 'top') {
      top.push(item);
    } else {
      bottom.push(item);
    }
  }

  return { top, bottom };
}
