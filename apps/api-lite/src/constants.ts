/**
 * API Constants
 * Centralized configuration values for the API
 */

/**
 * API Limits and Constraints
 */
export const API_LIMITS = {
  /** Maximum AI variables allowed in RPT-1 prediction (RPT-1 Large limit) */
  MAX_AI_VARIABLES: 10,

  /** Maximum results to return in preview-context (top 25 + worst 25) */
  MAX_PREVIEW_RESULTS: 50,

  /** Number of top-performing articles to include in preview */
  PREVIEW_TOP_COUNT: 25,

  /** Number of worst-performing articles to include in preview */
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
