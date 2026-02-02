/**
 * Save to Collection Popover Constants
 * Centralized text and configuration for the save to collection popover
 */

export const TEXT = {
  TITLE: 'Save to Collection',
  SEARCH_PLACEHOLDER: 'Search collections...',
  CREATE_NEW_TITLE: 'Create New Collection',
  CREATE_INPUT_PLACEHOLDER: 'Enter collection name...',
  CREATE_BUTTON: 'Create',
  CREATE_BUTTON_LOADING: 'Creating...',
  CREATE_NEW_BUTTON: 'Create New Collection',
  NO_COLLECTIONS_SEARCH: 'No collections found matching',
  NO_COLLECTIONS_EMPTY: 'No collections yet',
  NO_COLLECTIONS_HINT: 'Create your first collection above',
  ITEMS_SUFFIX: 'items',
} as const;

export const POPOVER = {
  WIDTH: '320px',
  MAX_HEIGHT: '400px',
  CONTENT_MIN_HEIGHT: '120px',
  CONTENT_MAX_HEIGHT: '240px',
} as const;
