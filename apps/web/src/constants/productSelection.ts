/**
 * Product Selection Page Constants
 * Configuration values for product selection workflow
 */

export const STORAGE_KEY = 'fashion.productSelection.selectedTypes';

export const DEBOUNCE_MS = 500;

export const COLUMN_COUNT = 3;

export const LIST_MAX_HEIGHT = '220px';

export const BREADCRUMBS = {
  HOME: 'Home',
  PRODUCT_SELECTION: 'Product Selection',
} as const;

export const LABELS = {
  PAGE_TITLE: 'Select Product Scope',
  PAGE_SUBTITLE: 'Choose product groups and types for the upcoming product generation.',
  PROJECT_NAME_LABEL: 'Project Name',
  PROJECT_NAME_PLACEHOLDER: 'Enter a descriptive name for this project...',
  FILTER_PLACEHOLDER: 'Filter product types by name...',
  LOADING_TEXT: 'Loading...',
  SELECT_TYPES_TEXT: 'Select types',
  TRANSACTION_ROWS: 'transaction rows',
  UNIQUE_ARTICLES: 'unique articles',
  ITEMS_SELECTED: 'items selected',
  FROM_CATEGORIES: 'from',
  CATEGORIES: 'categories',
  ITEMS: 'items',
} as const;

export const BUTTONS = {
  SORT_AZ: 'Sort A-Z',
  SORT_ZA: 'Sort Z-A',
  EXPAND_ALL: 'Expand All',
  COLLAPSE_ALL: 'Collapse All',
  CLEAR_ALL: 'Clear all',
  CANCEL: 'Cancel',
  PROCEED: 'Proceed to Analysis',
  PROCEED_CREATING: 'Creating Project...',
  RETRY: 'Retry',
} as const;

export const ERROR_MESSAGES = {
  LOAD_TAXONOMY: 'Error loading product taxonomy',
  FETCH_TAXONOMY: 'Failed to fetch taxonomy',
  FETCH_ROW_COUNT: 'Failed to fetch row count',
  FETCH_ARTICLE_COUNT: 'Failed to fetch article count',
  PROJECT_NAME_REQUIRED: 'Please enter a project name',
  SELECT_TYPES_REQUIRED: 'Please select at least one product type',
  PROCEED_FAILED: 'Failed to proceed',
  LOAD_SELECTIONS_FAILED: 'Failed to load saved selections',
} as const;
