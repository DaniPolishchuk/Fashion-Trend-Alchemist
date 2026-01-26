/**
 * Home Page Constants
 * Centralized configuration values for the Home page
 */

export const PAGINATION = {
  /** Number of projects to display per page */
  ITEMS_PER_PAGE: 5,
} as const;

export const COLLECTIONS = {
  /** Maximum number of collections to show in preview */
  MAX_PREVIEW_COUNT: 8,

  /** Number of preview images per collection card */
  PREVIEW_IMAGES_COUNT: 4,
} as const;

export const NOTIFICATION = {
  /** Duration to show notification messages (milliseconds) */
  DURATION_MS: 5000,
} as const;

export const SEARCH = {
  /** Debounce delay for search input (milliseconds) */
  DEBOUNCE_MS: 300,
} as const;
