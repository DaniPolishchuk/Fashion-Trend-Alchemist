/**
 * The Alchemist Tab Constants
 * Configuration for RPT-1 transmutation parameters
 */

// ==================== ATTRIBUTE CONFIGURATIONS ====================

// Article-level attribute keys (from database schema)
export const ARTICLE_ATTRIBUTES = [
  'product_type',
  'product_group',
  'product_family',
  'pattern_style',
  'specific_color',
  'color_intensity',
  'color_family',
  'customer_segment',
  'style_concept',
  'fabric_type_base',
] as const;

// Attributes that start in "Locked" by default
export const DEFAULT_LOCKED = ['product_family', 'pattern_style', 'specific_color'] as const;

// Attributes that start in "Not Included" by default
export const DEFAULT_NOT_INCLUDED = ['product_group', 'product_type'] as const;

// Maximum AI Variables allowed (RPT-1 Large limit)
export const MAX_AI_VARIABLES = 10;

// ==================== ATTRIBUTE CATEGORIES ====================

export const ATTRIBUTE_CATEGORIES = {
  LOCKED: 'locked',
  AI: 'ai',
  NOT_INCLUDED: 'notIncluded',
} as const;

export type AttributeCategory = (typeof ATTRIBUTE_CATEGORIES)[keyof typeof ATTRIBUTE_CATEGORIES];

// ==================== COLUMN DEFINITIONS ====================

export const COLUMNS = {
  LOCKED: {
    id: 'locked',
    title: 'Locked Attributes',
    icon: 'locked',
    color: 'var(--sapContent_LabelColor)',
    description: 'Fix values for these attributes',
  },
  AI: {
    id: 'ai',
    title: 'AI Variables',
    icon: 'ai',
    color: '#E9730C',
    description: 'RPT-1 will predict these',
  },
  NOT_INCLUDED: {
    id: 'notIncluded',
    title: 'Not Included',
    icon: 'hint',
    color: 'var(--sapNeutralTextColor)',
    description: 'Excluded from analysis',
  },
} as const;

// ==================== COLORS ====================

export const COLORS = {
  PRIMARY: '#0070F2',
  SUCCESS: '#107E3E',
  WARNING: '#E9730C',
  ERROR: '#BB0000',
  NEUTRAL: 'var(--sapNeutralTextColor)',
  LABEL: 'var(--sapContent_LabelColor)',
} as const;

// ==================== ICONS ====================

export const ICONS = {
  AI: 'ai',
  LOCKED: 'locked',
  HINT: 'hint',
  ARROW_RIGHT: 'arrow-right',
  ARROW_LEFT: 'arrow-left',
  DECLINE: 'decline',
  ADD: 'add',
  TARGET_GROUP: 'target-group',
  ACTIVATE: 'activate',
  INSPECTION: 'inspection',
} as const;

// ==================== SUCCESS SCORE ====================

export const SUCCESS_SCORE_CONFIG = {
  MIN: 0,
  MAX: 100,
  STEP: 5,
  DEFAULT: 100,
  LABEL_INTERVAL: 4,
} as const;

export const SUCCESS_SCORE_LABELS = [
  { min: 90, label: 'Top Performer' },
  { min: 70, label: 'Above Average' },
  { min: 50, label: 'Average' },
  { min: 0, label: 'Below Average' },
] as const;

export const getSuccessScoreLabel = (score: number): string => {
  const config = SUCCESS_SCORE_LABELS.find((config) => score >= config.min);
  return config?.label || 'Below Average';
};

// ==================== TEXT CONSTANTS ====================

export const TEXT = {
  CARD_TITLE: 'Transmutation Parameters',
  CARD_SUBTITLE: 'Configure locked attributes and AI targets for RPT-1 prediction',
  SUCCESS_PANEL_TITLE: 'Target Success',
  SUCCESS_PANEL_DESCRIPTION:
    'Set the desired performance level for the generated design. Higher values target top-performing attribute combinations.',
  TRANSMUTE_BUTTON: 'Transmute (Run RPT-1)',
  TRANSMUTING: 'Transmuting...',
  TRANSMUTING_MESSAGE: 'Let the SAP-RPT-1 cook...',
  SUCCESS_TITLE: 'Design Created Successfully!',
  ERROR_TITLE: 'Generation Failed',
  NO_ATTRIBUTES: 'No attributes available for this project.',
  LOADING_ATTRIBUTES: 'Loading attributes...',
  EMPTY_LOCKED: 'No locked attributes. Move attributes here to fix their values.',
  EMPTY_AI: 'No AI variables. Move attributes here to have RPT-1 predict them.',
  EMPTY_NOT_INCLUDED: 'No excluded attributes. Use the X button to move attributes here.',
  PREVIEW_DIALOG_TITLE: 'RPT-1 Request Preview',
  CONTEXT_SUMMARY_TITLE: 'Context Summary',
  QUERY_STRUCTURE_TITLE: 'Query Structure',
  VIEW_RAW_JSON: 'View Raw JSON Payload',
  CONTEXT_ROWS: 'Context Rows:',
  ARTICLES: 'articles',
  OF: 'of',
  TYPE_LOCKED: 'Locked',
  TYPE_AI: 'AI Variable',
  PREDICT_VALUE: '[PREDICT]',
  ARTICLE_BADGE: '(Article)',
  SLIDER_LOW: 'Low',
  SLIDER_HIGH: 'High',
  BUTTON_CANCEL: 'Cancel',
  BUTTON_CLOSE: 'Close',
  LOADING_PREVIEW: 'Loading preview data...',
  WARNING_TOO_MANY: (max: number) =>
    `Too many AI Variables. Maximum is ${max}. Move some to "Not Included".`,
  WARNING_MISSING_ENRICHMENT: (count: number) =>
    `${count} articles missing enriched attributes (will be excluded)`,
  WARNING_NO_CONTEXT: 'No context rows available. Run image enrichment first.',
} as const;

// ==================== API ENDPOINTS ====================

export const API_ENDPOINTS = {
  ATTRIBUTES: (types: string) => `/api/filters/attributes?types=${encodeURIComponent(types)}`,
  RPT1_PREVIEW: (projectId: string) => `/api/projects/${projectId}/rpt1-preview`,
  RPT1_PREDICT: (projectId: string) => `/api/projects/${projectId}/rpt1-predict`,
} as const;

// ==================== ERROR MESSAGES ====================

export const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request - Invalid data format or validation error',
  401: 'Unauthorized - Invalid or missing API token',
  429: 'Too Many Requests - Rate limit exceeded',
  503: 'Service Unavailable - Server is under high load',
  500: 'Internal Server Error - Contact support',
} as const;

export const getErrorMessage = (statusCode: number, details?: string): string => {
  const message = ERROR_MESSAGES[statusCode] || 'Unknown error occurred';
  return `Error ${statusCode}: ${message}${details ? ` - ${details}` : ''}`;
};

// ==================== LAYOUT ====================

export const LAYOUT = {
  MAX_COLUMN_HEIGHT: 'calc(5 * 4.25rem)', // ~5 items height
  SUCCESS_PANEL_WIDTH: '280px',
} as const;
