/**
 * Collection Preview Dialog Constants
 * Centralized text and configuration for the collection preview dialog
 */

export const TEXT = {
  DIALOG_TITLE_SUFFIX: 'items',
  DIALOG_TITLE_DEFAULT: 'Collection Details',
  BUTTON_CLOSE: 'Close',
  BUTTON_TRY_AGAIN: 'Try Again',
  ERROR_TITLE: 'Error Loading Collection',
  EMPTY_TITLE: 'No Designs Yet',
  EMPTY_SUBTITLE: 'This collection is empty. Add some designs to get started!',
  CREATED_ON: 'Created on',
  UNKNOWN_DATE: 'Unknown date',
  REMOVE_TOOLTIP: 'Remove from collection',
} as const;

export const DIALOG = {
  WIDTH: '90vw',
  MAX_WIDTH: '1200px',
  HEIGHT: '80vh',
} as const;

export const GRID = {
  MIN_CARD_WIDTH: '200px',
  GAP: '1.5rem',
} as const;
