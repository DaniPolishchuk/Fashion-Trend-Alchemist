/**
 * Skeleton Loader Constants
 * Configuration for attribute skeleton loading states
 */

// ==================== VARIANTS ====================
export const VARIANTS = {
  LOCKED: 'locked',
  AI: 'ai',
  NOT_INCLUDED: 'notIncluded',
} as const;

export type SkeletonVariant = (typeof VARIANTS)[keyof typeof VARIANTS];

// ==================== COLORS ====================
export const COLORS = {
  AI_BORDER: '#E9730C',
  AI_BACKGROUND: 'rgba(233, 115, 12, 0.05)',
} as const;

// ==================== SPACING ====================
export const SPACING = {
  LOCKED_GAP: '1rem',
  DEFAULT_GAP: '0.75rem',
} as const;

// ==================== ANIMATION ====================
export const ANIMATION = {
  DURATION: '1.8s',
  TIMING: 'ease-in-out',
} as const;

// ==================== DEFAULTS ====================
export const DEFAULTS = {
  COUNT: 5,
} as const;

// ==================== ICONS ====================
export const ICONS = {
  LOCKED: {
    DELETE: 'decline',
    ARROW: 'arrow-right',
  },
  AI: {
    ICON: 'ai',
    ARROW_LEFT: 'arrow-left',
    DELETE: 'decline',
  },
  NOT_INCLUDED: {
    ADD: 'add',
  },
} as const;
