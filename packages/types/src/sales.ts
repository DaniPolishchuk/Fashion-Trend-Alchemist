/**
 * Sales analytics domain types
 * Defines structures for sales metrics and top/bottom seller analysis
 */

/**
 * Sales metric type for ranking articles
 */
export type SalesMetric = 'units' | 'revenue';

/**
 * Article sales aggregation with performance metrics
 * Includes image reference for display purposes
 */
export interface ArticleSales {
  /** Unique article identifier */
  articleId: number;
  
  /** Product display name */
  prodName: string;
  
  /** Product type category name */
  productTypeName: string;
  
  /** Total units sold across all transactions */
  unitsSold: number;
  
  /** Total revenue generated (sum of transaction prices) */
  revenue: number;
  
  /** S3-compatible image key (folder/filename pattern) */
  imageKey: string;
  
  /** Presigned URL for image access (optional, added by service layer) */
  imageUrl?: string;
}

/**
 * Query parameters for top/bottom sellers analysis
 */
export interface TopBottomQuery {
  /** Filter by product type name (e.g., "Trousers", "Sweater") */
  productTypeName?: string;
  
  /** Filter by product type number (alternative to productTypeName) */
  productTypeNo?: number;
  
  /** Filter transactions from this date (ISO format: YYYY-MM-DD) */
  startDate?: string;
  
  /** Filter transactions until this date (ISO format: YYYY-MM-DD) */
  endDate?: string;
  
  /** Filter by sales channel (1 or 2) */
  salesChannelId?: number;
  
  /** Ranking metric: 'units' (default) or 'revenue' */
  metric?: SalesMetric;
  
  /** Number of top and bottom items to return (default: 500) */
  limit?: number;
  
  /** Include articles with zero sales in bottom list (default: true) */
  includeZero?: boolean;
}

/**
 * Result structure containing top and bottom performing articles
 */
export interface TopBottomResult {
  /** Top N sellers ranked by chosen metric (descending) */
  top: ArticleSales[];
  
  /** Bottom N sellers ranked by chosen metric (ascending) */
  bottom: ArticleSales[];
}