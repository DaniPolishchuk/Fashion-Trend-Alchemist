/**
 * Context Builder Page Constants
 * Configuration values for context building workflow
 */

export const HIDDEN_COLUMNS = ['product_group', 'transactionCount', 'lastSaleDate', 'articleId'];

export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
  DEBOUNCE_MS: 300,
} as const;

export const SEASONS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter',
} as const;

export type SeasonType = (typeof SEASONS)[keyof typeof SEASONS];

export const SEASON_DATE_RANGES = {
  [SEASONS.SPRING]: { startDay: '01', startMonth: '03', endDay: '31', endMonth: '05' },
  [SEASONS.SUMMER]: { startDay: '01', startMonth: '06', endDay: '31', endMonth: '08' },
  [SEASONS.AUTUMN]: { startDay: '01', startMonth: '09', endDay: '30', endMonth: '11' },
  [SEASONS.WINTER]: { startDay: '01', startMonth: '12', endDay: '28', endMonth: '02' },
} as const;

export const BREADCRUMBS = {
  HOME: 'Home',
  PRODUCT_SELECTION: 'Product Selection',
  CONTEXT_BUILDER: 'Context Builder',
} as const;

export const LABELS = {
  PAGE_TITLE_PREFIX: 'Context Builder:',
  ALL_TIME: 'All time',
  TOTAL_PRODUCTS: 'Total Products',
  ACTIVE_FILTERS: 'Active Filters',
  CONTEXT_LOCKED: 'Context Locked',
  START_LABEL: 'Start:',
  END_LABEL: 'End:',
  LOADING: 'Loading data...',
  NO_DATA: 'No data',
  NO_ITEMS_FOUND: 'No items found',
  ITEMS: 'items',
  ITEMS_FROM: 'Items from',
  TO: 'to',
} as const;

export const BUTTONS = {
  SORT_AZ: 'Sort A-Z',
  SORT_ZA: 'Sort Z-A',
  EXPAND_ALL: 'Expand All',
  COLLAPSE_ALL: 'Collapse All',
  RESET_ALL: 'Reset All',
  CANCEL: 'Cancel',
  APPLY: 'Apply',
  RETRY: 'Retry',
  BACK_TO_SELECTION: 'Back to Selection',
  GO_TO_SELECTION: 'Go to Selection',
  GENERATE_ATTRIBUTES: 'Generate Attributes',
  CONFIRM_CREATE: 'Confirm & create Project',
  CREATING_PROJECT: 'Creating Project...',
  OK: 'OK',
} as const;

export const FILTER_KEYS = {
  CUSTOMER_SEGMENT: 'customerSegment',
  COLOR_FAMILY: 'colorFamily',
  STYLE_CONCEPT: 'styleConcept',
  PRODUCT_FAMILY: 'productFamily',
  PATTERN_STYLE: 'patternStyle',
  SPECIFIC_COLOR: 'specificColor',
  COLOR_INTENSITY: 'colorIntensity',
  FABRIC_TYPE_BASE: 'fabricTypeBase',
} as const;

export const FILTER_TITLES = {
  [FILTER_KEYS.PATTERN_STYLE]: 'Pattern/Style',
  [FILTER_KEYS.SPECIFIC_COLOR]: 'Specific Color',
  [FILTER_KEYS.COLOR_INTENSITY]: 'Color Intensity',
  [FILTER_KEYS.COLOR_FAMILY]: 'Color Family',
  [FILTER_KEYS.PRODUCT_FAMILY]: 'Product Family',
  [FILTER_KEYS.CUSTOMER_SEGMENT]: 'Customer Segment',
  [FILTER_KEYS.STYLE_CONCEPT]: 'Style Concept',
  [FILTER_KEYS.FABRIC_TYPE_BASE]: 'Fabric Type',
} as const;

export const FILTER_ICONS = {
  [FILTER_KEYS.PATTERN_STYLE]: 'display',
  [FILTER_KEYS.SPECIFIC_COLOR]: 'palette',
  [FILTER_KEYS.COLOR_INTENSITY]: 'palette',
  [FILTER_KEYS.COLOR_FAMILY]: 'palette',
  [FILTER_KEYS.PRODUCT_FAMILY]: 'product',
  [FILTER_KEYS.CUSTOMER_SEGMENT]: 'group',
  [FILTER_KEYS.STYLE_CONCEPT]: 'display',
  [FILTER_KEYS.FABRIC_TYPE_BASE]: 'activate',
} as const;

export const ERROR_MESSAGES = {
  NO_PROJECT_DATA: 'No project data provided',
  FETCH_FILTERS_FAILED: 'Failed to fetch filters',
  FETCH_PRODUCTS_FAILED: 'Failed to fetch products',
  CREATE_PROJECT_FAILED: 'Failed to create project',
  LOCK_CONTEXT_FAILED: 'Failed to lock context',
  PREVIEW_CONTEXT_FAILED: 'Failed to get articles for locking',
  GENERATE_ATTRIBUTES_FAILED: 'Failed to generate attributes',
  PROJECT_CREATION_DIALOG_TEXT:
    'The project creation failed. Please check your configuration and try again. If the problem persists, please contact support.',
} as const;

export const MESSAGES = {
  GENERATE_ATTRIBUTES_BEFORE_CONFIRM:
    'Please generate attributes before confirming and saving the project',
} as const;

export const TABLE = {
  MAX_HEIGHT: '600px',
  PRIORITY_COLUMNS: ['article_id', 'product_name', 'product_type'],
  DETAIL_DESC_COLUMN: 'detail_desc',
} as const;
