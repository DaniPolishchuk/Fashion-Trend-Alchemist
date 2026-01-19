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
 * Includes image reference for display purposes and all article attributes
 */
export interface ArticleSales {
  /** Unique article identifier */
  articleId: string;
  
  /** Virality score (0-100 float) based on min-max normalization */
  viralityScore: number;
  
  /** Total units sold across all transactions */
  unitsSold: number;
  
  /** Total revenue generated (sum of transaction prices) */
  revenue: number;
  
  /** S3-compatible image key (folder/filename pattern) */
  imageKey: string;
  
  /** Product detail description */
  detailDesc: string | null;
  
  /** Product type category */
  productType: string;
  
  /** Product group */
  productGroup: string | null;
  
  /** Pattern style */
  patternStyle: string | null;
  
  /** Specific color */
  specificColor: string | null;
  
  /** Color intensity */
  colorIntensity: string | null;
  
  /** Color family */
  colorFamily: string | null;
  
  /** Product family */
  productFamily: string | null;
  
  /** Customer segment */
  customerSegment: string | null;
  
  /** Style concept */
  styleConcept: string | null;
  
  /** Fabric type base */
  fabricTypeBase: string | null;
  
  /** Presigned URL for image access (optional, added by service layer) */
  imageUrl?: string;
}

/**
 * Query parameters for top/bottom sellers analysis
 */
export interface TopBottomQuery {
  /** Filter by product type (e.g., "Trousers", "Sweater") */
  productType?: string;
  
  /** Filter transactions from this date (ISO format: YYYY-MM-DD) */
  startDate?: string;
  
  /** Filter transactions until this date (ISO format: YYYY-MM-DD) */
  endDate?: string;
  
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
