/**
 * Application constants
 */

/**
 * Default limits for analytics queries
 */
export const ANALYTICS_DEFAULTS = {
  /** Default number of top/bottom items to return */
  LIMIT: 500,
  
  /** Default metric for ranking (units sold) */
  METRIC: 'units' as const,
  
  /** Default behavior for zero-sales articles */
  INCLUDE_ZERO: true,
} as const;

/**
 * Sales channel identifiers
 */
export const SALES_CHANNELS = {
  ONLINE: 1,
  RETAIL: 2,
} as const;

/**
 * Image path pattern constants
 */
export const IMAGE_PATTERNS = {
  /** Number of digits used for folder prefix */
  FOLDER_PREFIX_LENGTH: 2,
  
  /** Image file extension */
  FILE_EXTENSION: '.jpg',
} as const;