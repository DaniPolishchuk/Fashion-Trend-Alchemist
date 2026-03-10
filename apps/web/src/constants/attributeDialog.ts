/**
 * Attribute Generation Dialog Constants
 * Centralized configuration for the attribute generation interface
 */

// ==================== DIALOG DIMENSIONS ====================
export const DIALOG = {
  MAIN: {
    WIDTH: '90vw',
    HEIGHT: '90vh',
    MAX_WIDTH: '1400px',
    MAX_HEIGHT: '900px',
  },
  OPTIONS: {
    WIDTH: '500px',
    HEIGHT: '450px',
  },
  INFO: {
    WIDTH: '550px',
    MAX_HEIGHT: '600px',
  },
} as const;

// ==================== LAYOUT ====================
export const LAYOUT = {
  LEFT_PANEL_WIDTH: '30%',
  RIGHT_PANEL_FLEX: 1,
} as const;

// ==================== TEXT CONTENT ====================
export const TEXT = {
  // Main Dialog
  TITLE_REFINE: 'Refine Attribute Generation',
  TITLE_GENERATED: 'Generated Attributes',
  BUTTON_PROCEED: 'Save',
  BUTTON_CLOSE: 'Close',
  BUTTON_REGENERATE: 'Regenerate',
  BUTTON_ADD_ATTRIBUTE: 'Add Attribute',
  BUTTON_GOT_IT: 'Got it',
  BUTTON_DOWNLOAD: 'Download',
  BUTTON_UPLOAD: 'Upload',

  // Ontology Upload/Download
  ERROR_INVALID_JSON: 'Invalid JSON format',
  ERROR_INVALID_STRUCTURE: 'Invalid ontology structure',
  ERROR_EMPTY_ONTOLOGY: 'Empty ontology',

  // File Input
  FILE_ACCEPT: '.json,application/json',

  // Configuration Panel
  SECTION_CONFIG_SCOPE: 'Configuration Scope',
  LABEL_PRODUCT_GROUP: 'Product Group',
  LABEL_PRODUCT_TYPES: 'Product Types',
  LABEL_SEASONAL_LENS: 'Seasonal Lens',

  // Placeholders
  PLACEHOLDER_FEEDBACK: 'Provide additional feedback to enhance attribute generation...',
  PLACEHOLDER_ATTRIBUTE_NAME: 'Enter attribute name...',
  PLACEHOLDER_OPTION_VALUE: 'Enter option value...',

  // Messages
  MESSAGE_NO_ATTRIBUTES: 'No attributes generated yet',
  MESSAGE_INFO_BOX: 'Attributes are generated based on the selected product types.',

  // Actions
  ACTION_ADD: 'Add',
  ACTION_SAVE: 'Save',
  ACTION_CANCEL: 'Cancel',
  ACTION_EDIT: 'Edit',
  ACTION_DELETE: 'Delete',
  ACTION_ADD_OPTION: 'Add Option',

  // Seasonal
  SEASONAL_ALL_TIME: 'All time',

  // Info Dialog
  INFO_TITLE: 'Refine Attribute Generation - Help',
  INFO_WHAT_TITLE: 'What is Attribute Refinement?',
  INFO_WHAT_TEXT: `Our system uses AI to automatically suggest the best categories and details (attributes) for your products. You can easily tweak these suggestions until they are perfect. Getting these details right is important because they act as a guide for the next step. Without them, product descriptions can end up sounding too generic. Instead, the AI uses your specific list of attributes to 'look' at each product image and write a detailed, accurate description that fits your brand perfectly.`,

  INFO_HOW_TITLE: 'How to Use Feedback',
  INFO_HOW_TEXT:
    'Provide specific feedback in the text area to improve the generated attributes. For example:',
  INFO_HOW_EXAMPLES: [
    'Add more color-related attributes',
    'Focus on sustainable materials',
    'Include size and fit details',
    'Remove overly technical attributes',
  ],

  INFO_MANAGING_TITLE: 'Managing Attributes',
  INFO_MANAGING_TEXT: 'You can manually manage the generated attributes:',
  INFO_MANAGING_ITEMS: [
    { label: 'Add:', text: 'Create new attributes manually' },
    { label: 'Edit:', text: 'Rename existing attributes' },
    { label: 'Delete:', text: 'Remove unwanted attributes' },
    { label: 'Click:', text: 'View and modify attribute options' },
  ],

  INFO_TIP_LABEL: 'Tip:',
  INFO_TIP_TEXT:
    'The more specific your feedback, the better the AI can refine the attributes to match your needs.',
} as const;

// ==================== ICONS ====================
export const ICONS = {
  PRODUCT: 'product',
  HISTORY: 'history',
  HINT: 'hint',
  QUESTION_MARK: 'question-mark',
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  AI: 'ai',
  DECLINE: 'decline',
  DA: 'da',
  DOWNLOAD: 'download',
  UPLOAD: 'upload',
} as const;

// ==================== SIZES ====================
export const SIZES = {
  FEEDBACK_ROWS: 3,
  HELP_BUTTON: {
    WIDTH: '24px',
    HEIGHT: '24px',
    MIN_WIDTH: '24px',
  },
} as const;
