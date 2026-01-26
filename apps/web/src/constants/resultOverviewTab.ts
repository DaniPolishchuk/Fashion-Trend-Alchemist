/**
 * Result Overview Tab Constants
 * Configuration for generated designs overview
 */

// ==================== PAGINATION ====================

export const ITEMS_PER_PAGE = 5;

// ==================== DISPLAY LIMITS ====================

export const MAX_ATTRIBUTES_DISPLAY = 2;

// ==================== ICONS ====================

export const ICONS = {
  SEARCH: 'search',
  NAV_RIGHT: 'navigation-right-arrow',
  NAV_LEFT: 'navigation-left-arrow',
  ARROW_RIGHT: 'slim-arrow-right',
  ACCEPT: 'accept',
  DELETE: 'delete',
} as const;

// ==================== TEXT CONSTANTS ====================

export const TEXT = {
  // Search
  SEARCH_PLACEHOLDER: 'Search generated variants...',

  // Header
  TITLE: 'Generated Products',
  VARIANTS_COUNT: (count: number) => `${count} variants generated`,

  // Labels
  LABEL_GIVEN: 'Given:',
  LABEL_PREDICTED: 'Predicted:',
  NO_ATTRIBUTES: 'No attributes',

  // Empty States
  NO_RESULTS: 'No results match your search.',
  NO_DESIGNS: 'No generated designs yet.',

  // Pagination
  SHOWING_TEMPLATE: (start: number, end: number, total: number) =>
    `Showing ${start}-${end} of ${total}`,
  PAGE_TEMPLATE: (current: number, total: number) => `Page ${current} of ${total}`,

  // Delete Dialog
  DELETE_DIALOG_TITLE: 'Delete Generated Product?',
  DELETE_CONFIRMATION: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  DELETE_BUTTON: 'Delete',
  DELETING_BUTTON: 'Deleting...',
  CANCEL_BUTTON: 'Cancel',

  // Tooltips
  DELETE_TOOLTIP: 'Delete generated product',

  // Error
  ERROR_PREFIX: 'Error:',
} as const;

// ==================== API ENDPOINTS ====================

export const API_ENDPOINTS = {
  GENERATED_DESIGNS: (projectId: string) => `/api/projects/${projectId}/generated-designs`,
  DELETE_DESIGN: (projectId: string, designId: string) =>
    `/api/projects/${projectId}/generated-designs/${designId}`,
} as const;

// ==================== ROUTES ====================

export const ROUTES = {
  DESIGN_DETAIL: (projectId: string, designId: string) =>
    `/project/${projectId}/design/${designId}`,
} as const;
