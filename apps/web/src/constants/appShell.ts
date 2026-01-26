/**
 * AppShell Constants
 * Centralized configuration for the main application shell/navigation
 */

// ==================== BRANDING ====================
export const BRANDING = {
  PRIMARY_TITLE: 'Fashion Trend Alchemist',
  SECONDARY_TITLE: 'Powered by SAP-RPT-1',
  LOGO_ALT: 'Fashion Trend Alchemist Logo',
  LOGO_HEIGHT: '32px',
} as const;

// ==================== USER ====================
export const MOCK_USER = {
  NAME: 'John Doe',
  EMAIL: 'john.doe@company.com',
  INITIALS: 'JD',
  AVATAR_COLOR: 'Accent6',
} as const;

// ==================== SEARCH ====================
export const SEARCH = {
  PLACEHOLDER: 'Search...',
  WIDTH: '300px',
} as const;

// ==================== MENU ITEMS ====================
export const MENU_ITEMS = {
  PROFILE: {
    icon: 'employee',
    text: 'My Profile',
  },
  SETTINGS: {
    icon: 'user-settings',
    text: 'Settings',
  },
  HELP: {
    icon: 'sys-help',
    text: 'Help',
  },
  SIGN_OUT: {
    icon: 'log',
    text: 'Sign Out',
  },
} as const;

// ==================== THEME ====================
export const THEME = {
  STORAGE_KEY: 'theme',
  LIGHT: {
    value: 'light',
    theme: 'sap_horizon',
    icon: 'dark-mode', // moon icon
    label: 'Dark Theme',
  },
  DARK: {
    value: 'dark',
    theme: 'sap_horizon_dark',
    icon: 'light-mode', // sun icon
    label: 'Light Theme',
  },
} as const;

// ==================== NOTIFICATIONS ====================
export const NOTIFICATIONS = {
  TITLE: 'Notifications',
  COUNT: '3',
  MOCK_ITEMS: [
    {
      id: '1',
      text: 'Enrichment completed for Project A',
      description: '2 hours ago',
      additionalText: 'New',
    },
    {
      id: '2',
      text: '3 new designs generated',
      description: 'Yesterday',
      additionalText: undefined,
    },
    {
      id: '3',
      text: 'Welcome to Fashion Trend Alchemist!',
      description: '2 days ago',
      additionalText: undefined,
    },
  ],
} as const;

// ==================== POPOVER ====================
export const POPOVER = {
  PLACEMENT: 'Bottom',
  HORIZONTAL_ALIGN: 'End',
  MIN_WIDTH: '300px',
} as const;

// ==================== AVATAR ====================
export const AVATAR = {
  SIZE_SMALL: 'XS',
  SIZE_MEDIUM: 'M',
} as const;
