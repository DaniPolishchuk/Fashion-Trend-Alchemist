/**
 * Enhanced Table Tab Constants
 * Configuration for context items table
 */

// ==================== PAGINATION ====================

export const ITEMS_PER_PAGE = 25;
export const POLL_INTERVAL = 5000; // 5 seconds

// ==================== FILTER TYPES ====================

export const FILTER_TYPES = {
  ALL: 'all',
  SUCCESSFUL: 'successful',
  PENDING: 'pending',
  FAILED: 'failed',
} as const;

export type FilterType = (typeof FILTER_TYPES)[keyof typeof FILTER_TYPES];

// ==================== CONFIDENCE FILTER TYPES ====================

export const CONFIDENCE_FILTER_TYPES = {
  ALL: 'all',
  LIKELY_MATCH: 'likely_match',
  POSSIBLE_MISMATCH: 'possible_mismatch',
  LIKELY_MISMATCH: 'likely_mismatch',
  VERY_LIKELY_MISMATCH: 'very_likely_mismatch',
} as const;

export type ConfidenceFilterType = (typeof CONFIDENCE_FILTER_TYPES)[keyof typeof CONFIDENCE_FILTER_TYPES];

// ==================== SORT FIELDS ====================

export const SORT_FIELDS = {
  VELOCITY_SCORE: 'velocityScore',
  ARTICLE_ID: 'articleId',
  PRODUCT_TYPE: 'productType',
} as const;

export type SortField = (typeof SORT_FIELDS)[keyof typeof SORT_FIELDS];

// ==================== ICONS ====================

export const ICONS = {
  SEARCH: 'search',
  DOWNLOAD: 'download',
  NAV_RIGHT: 'navigation-right-arrow',
  NAV_LEFT: 'navigation-left-arrow',
  PRODUCT: 'product',
  REFRESH: 'refresh',
  ACCEPT: 'accept',
  ALERT: 'alert',
  PENDING: 'pending',
  ARROW_DOWN: 'slim-arrow-down',
  ARROW_UP: 'slim-arrow-up',
  ARROW_RIGHT: 'slim-arrow-right',
  ZOOM_IN: 'zoom-in',
  DECLINE: 'decline',
  SORT_DESC: 'sort-descending',
  SORT_ASC: 'sort-ascending',
} as const;

// ==================== STATUS CONFIGURATIONS ====================

export const STATUS = {
  SUCCESS: {
    icon: ICONS.ACCEPT,
    state: 'Positive' as const,
    label: 'Success',
  },
  FAILED: {
    icon: ICONS.ALERT,
    state: 'Negative' as const,
    label: 'Failed',
  },
  PENDING: {
    icon: ICONS.PENDING,
    state: 'Information' as const,
    label: 'Pending',
  },
} as const;

// ==================== VELOCITY SCORE COLORS ====================

export const VELOCITY_COLORS = {
  EXCELLENT: { threshold: 90, color: '#1D7044' }, // Deep Green
  STRONG: { threshold: 70, color: '#4CAF50' }, // Light Green
  AVERAGE: { threshold: 50, color: '#FFC107' }, // Yellow
  BELOW_AVERAGE: { threshold: 30, color: '#FF9800' }, // Orange
  POOR: { threshold: 0, color: '#D32F2F' }, // Red
} as const;

// ==================== TEXT CONSTANTS ====================

export const TEXT = {
  // Control Panel
  PANEL_TITLE: 'Enrichment Status',
  PANEL_SUBTITLE_RUNNING: 'Processing...',
  PANEL_SUBTITLE_TEMPLATE: (successful: number, total: number) =>
    `${successful} of ${total} items enriched`,
  PROCESSING_LABEL: 'Processing:',
  RETRY_ALL_BUTTON: (count: number) => `Retry All Failed (${count})`,
  RETRYING: 'Retrying...',

  // Filter Labels
  FILTER_ALL: 'All',
  FILTER_SUCCESSFUL: 'Successful',
  FILTER_PENDING: 'Pending',
  FILTER_FAILED: 'Failed',

  // Confidence Filter Labels
  CONFIDENCE_FILTER_ALL: 'All',
  CONFIDENCE_FILTER_LIKELY_MATCH: 'Likely Match',
  CONFIDENCE_FILTER_POSSIBLE_MISMATCH: 'Possible',
  CONFIDENCE_FILTER_LIKELY_MISMATCH: 'Likely Mismatch',
  CONFIDENCE_FILTER_VERY_LIKELY_MISMATCH: 'Very Likely',

  // Sort Labels
  SORT_VELOCITY: 'Velocity Score',
  SORT_ARTICLE: 'Article ID',
  SORT_PRODUCT: 'Product Type',
  SORT_DESC: 'Descending',
  SORT_ASC: 'Ascending',

  // Table
  RESULTS_TITLE: 'Context Items',
  NO_MATCH: 'No items match your search.',
  NO_ITEMS: 'No context items found.',
  SHOWING_TEMPLATE: (start: number, end: number, total: number) =>
    `Showing ${start}-${end} of ${total}`,
  PAGE_TEMPLATE: (current: number, total: number) => `Page ${current} of ${total}`,

  // Detail View
  DETAILS_TITLE: 'Article Details',
  ENRICHED_TITLE: 'Enriched Attributes',
  ERROR_TITLE: 'Enrichment Error',

  // Columns
  COL_IMAGE: 'Image',
  COL_ARTICLE_ID: 'Article ID',
  COL_PRODUCT_TYPE: 'Product Type',
  COL_VELOCITY: 'Velocity Score',
  COL_PATTERN: 'Pattern Style',
  COL_COLOR_FAMILY: 'Color Family',
  COL_SPECIFIC_COLOR: 'Specific Color',
  COL_COLOR_INTENSITY: 'Color Intensity',
  COL_PRODUCT_FAMILY: 'Product Family',
  COL_CUSTOMER_SEGMENT: 'Customer Segment',
  COL_STYLE_CONCEPT: 'Style Concept',
  COL_FABRIC_TYPE: 'Fabric Type',
  COL_STATUS: 'Status',
  COL_INCLUDE: 'Include',
  COL_MATCH_CONFIDENCE: 'Match Confidence',

  // Detail Labels
  LABEL_PRODUCT_GROUP: 'Product Group',
  LABEL_DESCRIPTION: 'Description',

  // Actions
  SEARCH_PLACEHOLDER: 'Search...',
  EXPORT_TOOLTIP: 'Export CSV',
  RETRY_TOOLTIP: (error: string) => `Retry: ${error}`,

  // Modal
  MODAL_TITLE: 'Product Image',

  // CSV Export
  CSV_FILENAME: (projectId: string) => `context-items-${projectId.slice(0, 8)}.csv`,
  CSV_STATUS_SUCCESS: 'Success',
  CSV_STATUS_FAILED: 'Failed',
  CSV_STATUS_PENDING: 'Pending',

  // Misc
  EMPTY_VALUE: '-',
} as const;

// ==================== CSV HEADERS ====================

export const CSV_BASE_HEADERS = [
  'Article ID',
  'Product Type',
  'Product Group',
  'Color Family',
  'Pattern Style',
  'Specific Color',
  'Color Intensity',
  'Product Family',
  'Customer Segment',
  'Style Concept',
  'Fabric Type',
  'Velocity Score',
  'Status',
] as const;

// ==================== API ENDPOINTS ====================

export const API_ENDPOINTS = {
  CONTEXT_ITEMS: (projectId: string) => `/api/projects/${projectId}/context-items`,
  RETRY_ENRICHMENT: (projectId: string) => `/api/projects/${projectId}/retry-enrichment`,
  EXCLUDE_ITEM: (projectId: string, articleId: string) =>
    `/api/projects/${projectId}/context-items/${articleId}/exclude`,
} as const;

// ==================== IMAGE SIZES ====================

export const IMAGE_SIZES = {
  THUMBNAIL: { width: 50, height: 50 },
  DETAIL: { width: 150, height: 150 },
} as const;
