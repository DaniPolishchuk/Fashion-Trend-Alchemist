/**
 * Design Detail Page Constants
 * Configuration values for design detail view
 */

export const BREADCRUMBS = {
  HOME: 'Home',
} as const;

export const LABELS = {
  ERROR_LOADING: 'Error Loading Design',
  DESIGN_NOT_FOUND: 'Design not found',
  NO_PREDICTED: 'No predicted attributes',
  NO_GIVEN: 'No given attributes',
  NO_IMAGE_AVAILABLE: 'No image available',
  CREATED: 'Created',
  VIEW_BADGE_SUFFIX: 'VIEW',
  PREDICTED_HEADER: 'Predicted Attributes',
  GIVEN_HEADER: 'Given Attributes',
  HINT_TEXT: 'Select a view above to preview different angles of your design.',
} as const;

export const BUTTONS = {
  BACK_TO_PROJECT: 'Back to Project',
  SAVE_NAME: 'Save name',
  CANCEL: 'Cancel',
  EDIT_NAME: 'Edit name',
  GENERATE_NAME: 'Generate creative name with AI',
  DOWNLOAD: 'Download',
  VIEW_FULL_SIZE: 'View full size',
  CLOSE: 'Close',
  REFINE_DESIGN: 'Refine Design',
  SAVE_TO_COLLECTION: 'Save to Collection',
  VIEW_COLLECTION: 'View Collection',
  PREVIOUS_VIEW: 'Previous view',
  NEXT_VIEW: 'Next view',
} as const;

export const ICONS = {
  DOWNLOAD: 'download',
  ZOOM_IN: 'zoom-in',
  EDIT: 'edit',
  ACCEPT: 'accept',
  DECLINE: 'decline',
  AI: 'ai',
  LOCKED: 'locked',
  SYNCHRONIZE: 'synchronize',
  HINT: 'hint',
  NAV_LEFT: 'navigation-left-arrow',
  NAV_RIGHT: 'navigation-right-arrow',
  SYS_CANCEL: 'sys-cancel',
  CAMERA: 'camera',
} as const;

export const ERROR_MESSAGES = {
  MISSING_IDS: 'Missing project or design ID',
  FETCH_FAILED: 'Failed to fetch design',
  DESIGN_NOT_FOUND: 'Design not found',
  UPDATE_NAME_FAILED: 'Failed to update name',
  GENERATE_NAME_FAILED: 'Failed to generate name',
  DOWNLOAD_FAILED: 'Failed to download image',
} as const;

export const MESSAGES = {
  GENERATING_FRONT: 'Generating front view...',
  GENERATING_BACK: 'Generating back view...',
  GENERATING_MODEL: 'Generating model view...',
  WAITING_FRONT: 'Waiting to generate front view...',
  WAITING_BACK: 'Waiting to generate back view...',
  WAITING_MODEL: 'Waiting to generate model view...',
  GENERATION_FAILED_FRONT: 'Front view generation failed',
  GENERATION_FAILED_BACK: 'Back view generation failed',
  GENERATION_FAILED_MODEL: 'Model view generation failed',
  SAVED_SUCCESS: 'Saved to',
  SAVED_FAILURE: 'Failed to save:',
} as const;

export const POLLING = {
  INTERVAL_MS: 3000,
  AUTO_DISMISS_MS: 5000,
} as const;

export const IMAGE_VIEWS = {
  FRONT: 'front',
  BACK: 'back',
  MODEL: 'model',
} as const;

export type ImageView = (typeof IMAGE_VIEWS)[keyof typeof IMAGE_VIEWS];

export const IMAGE_VIEW_ORDER: ImageView[] = [
  IMAGE_VIEWS.FRONT,
  IMAGE_VIEWS.BACK,
  IMAGE_VIEWS.MODEL,
] as const;

export const STATUS_STATES = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const;

export const OBJECT_STATUS_MAP = {
  [STATUS_STATES.COMPLETED]: 'Positive',
  [STATUS_STATES.FAILED]: 'Negative',
  [STATUS_STATES.PARTIAL]: 'Critical',
  [STATUS_STATES.PENDING]: 'Information',
  [STATUS_STATES.GENERATING]: 'Information',
} as const;

export const DIMENSIONS = {
  THUMBNAIL_MOBILE: 80,
  THUMBNAIL_DESKTOP: 100,
  ACTION_BAR_HEIGHT: 64,
  NOTIFICATION_BOTTOM_OFFSET: 64,
} as const;

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

export const COLORS = {
  AI_ACCENT: '#E9730C',
  AI_ACCENT_LIGHT: 'rgba(233, 115, 12, 0.04)',
  AI_ACCENT_LIGHTER: 'rgba(233, 115, 12, 0.01)',
  AI_BORDER: 'rgba(233, 115, 12, 0.3)',
  AI_SHADOW: 'rgba(233, 115, 12, 0.08)',
  AI_HOVER: 'rgba(233, 115, 12, 0.05)',
  AI_BORDER_LIGHT: 'rgba(233, 115, 12, 0.1)',
} as const;

export const ATTRIBUTE_PREFIX_REGEX = /^(article_|ontology_\w+_)/;
