/**
 * API Constants
 * Centralized configuration values for the API
 */

/**
 * Context Configuration
 * Settings for context item selection in project creation
 */
export const CONTEXT_CONFIG = {
  /** Minimum number of context items required */
  MIN_ITEMS: 3,

  /** Maximum number of context items allowed (technical limit) */
  MAX_ITEMS: 2000,

  /** Default number of context items when not specified */
  DEFAULT_ITEMS: 50,

  /** Default percentage of top performers (0-100) */
  DEFAULT_TOP_PERCENTAGE: 80,

  /** Default percentage of worst performers (0-100) */
  DEFAULT_WORST_PERCENTAGE: 20,

  /** Optimal minimum for high quality predictions */
  OPTIMAL_MIN: 100,

  /** Optimal maximum for high quality predictions */
  OPTIMAL_MAX: 2000,
} as const;

/**
 * API Limits and Constraints
 */
export const API_LIMITS = {
  /** Maximum AI variables allowed in RPT-1 prediction (RPT-1 Large limit) */
  MAX_AI_VARIABLES: 10,

  /** @deprecated Use CONTEXT_CONFIG.DEFAULT_ITEMS instead - kept for backward compatibility */
  MAX_PREVIEW_RESULTS: 50,

  /** @deprecated Use CONTEXT_CONFIG instead - kept for backward compatibility */
  PREVIEW_TOP_COUNT: 25,

  /** @deprecated Use CONTEXT_CONFIG instead - kept for backward compatibility */
  PREVIEW_WORST_COUNT: 25,

  /** Maximum number of projects that can be pinned per user */
  MAX_PINNED_PROJECTS: 3,

  /** Minimum context rows required for RPT-1 prediction */
  MIN_RPT1_CONTEXT_ROWS: 2,
} as const;

/**
 * Cache TTL Configuration
 */
export const CACHE_TTL_MS = {
  /** Cache OAuth tokens and deployment URLs for 11 hours */
  TOKEN_AND_DEPLOYMENT: 11 * 60 * 60 * 1000, // 11 hours in milliseconds
} as const;
