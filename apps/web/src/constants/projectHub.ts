/**
 * Project Hub Constants
 * Configuration for project detail page and enrichment status
 */

// ==================== ENRICHMENT STATUS ====================
export const ENRICHMENT_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type EnrichmentStatus = (typeof ENRICHMENT_STATUS)[keyof typeof ENRICHMENT_STATUS];

// ==================== STATUS CONFIGURATIONS ====================
export const STATUS_CONFIGS = {
  [ENRICHMENT_STATUS.IDLE]: {
    color: '#0070F2',
    label: 'READY',
    state: 'Information' as const,
    icon: 'play',
    title: 'Data Enrichment',
    showButton: true,
    buttonText: 'Start',
    buttonTooltip: 'Start Data Enrichment',
    showProgress: false,
  },
  [ENRICHMENT_STATUS.RUNNING]: {
    color: '#0070F2',
    label: 'RUNNING',
    state: 'Information' as const,
    icon: null,
    title: 'Data Enrichment',
    showButton: false,
    showProgress: true,
  },
  [ENRICHMENT_STATUS.COMPLETED]: {
    color: '#107E3E',
    label: 'COMPLETED',
    state: 'Positive' as const,
    icon: 'accept',
    title: 'Data Enrichment',
    showButton: false,
    showProgress: false,
  },
  [ENRICHMENT_STATUS.FAILED]: {
    color: '#BB0000',
    label: 'FAILED',
    state: 'Negative' as const,
    icon: 'play',
    title: 'Data Enrichment',
    showButton: true,
    buttonText: 'Retry',
    buttonTooltip: 'Retry Data Enrichment',
    showProgress: false,
  },
} as const;

// ==================== TAB CONFIGURATIONS ====================
export const TABS = [
  { id: 'enhanced-table', label: 'Context Items', icon: 'table-chart' },
  { id: 'alchemist', label: 'The Alchemist', icon: 'ai' },
  { id: 'result-overview', label: 'Generated Products', icon: 'grid' },
  { id: 'data-analysis', label: 'Data Analysis', icon: 'business-objects-experience' },
] as const;

export type TabType = (typeof TABS)[number]['id'];

// ==================== TEXT CONSTANTS ====================
export const TEXT = {
  ERROR_TITLE: 'Error Loading Project',
  ERROR_NOT_FOUND: 'Project not found',
  BUTTON_BACK_HOME: 'Back to Home',
  BREADCRUMB_HOME: 'Home',
  CREATED_ON: 'Created on',
  STATUS_MESSAGE: {
    IDLE_ACTIVE: 'Ready to enrich article context',
    IDLE_INACTIVE: 'Activate project to start enrichment',
    RUNNING: (processed: number, total: number) => `Processing ${processed} of ${total} items`,
    COMPLETED: (total: number) => (total > 0 ? `${total} items enriched` : 'All items processed'),
    FAILED: (processed: number, total: number) => `Processing stopped at ${processed}/${total}`,
  },
} as const;

// ==================== ICONS ====================
export const ICONS = {
  AI: 'ai',
  TABLE: 'table-chart',
  GRID: 'grid',
  BUSINESS: 'business-objects-experience',
  PLAY: 'play',
  ACCEPT: 'accept',
  ERROR: 'error',
} as const;

// ==================== API ENDPOINTS ====================
export const API_ENDPOINTS = {
  PROJECT: (id: string) => `/api/projects/${id}`,
  ENRICHMENT_STATUS: (id: string) => `/api/projects/${id}/enrichment-status`,
  ENRICHMENT_PROGRESS: (id: string) => `/api/projects/${id}/enrichment-progress`,
  START_ENRICHMENT: (id: string) => `/api/projects/${id}/start-enrichment`,
  MISMATCH_REVIEW: (id: string) => `/api/projects/${id}/mismatch-review`,
  RECALCULATE_VELOCITY: (id: string) => `/api/projects/${id}/recalculate-velocity`,
} as const;

// ==================== MISMATCH REVIEW STATUS ====================
export const MISMATCH_REVIEW_STATUS = {
  NEEDS_REVIEW: 'needs_review',
  REVIEWED: 'reviewed',
} as const;

export type MismatchReviewStatus =
  (typeof MISMATCH_REVIEW_STATUS)[keyof typeof MISMATCH_REVIEW_STATUS];

// ==================== MISMATCH CONFIGURATIONS ====================
export const MISMATCH_CONFIGS = {
  [MISMATCH_REVIEW_STATUS.NEEDS_REVIEW]: {
    color: '#bb0000',
    borderColor: '#bb0000',
    icon: 'alert',
    title: 'mismatch',
    subtitle: 'Click to review',
  },
  [MISMATCH_REVIEW_STATUS.REVIEWED]: {
    color: '#107e3e',
    borderColor: '#107e3e',
    icon: 'accept',
    title: 'mismatch',
    subtitle: 'Click to review again',
  },
} as const;

// ==================== CONFIDENCE LABELS ====================
export const CONFIDENCE_LABELS = {
  VERY_LIKELY_MISMATCH: { min: 90, max: 100, label: 'Very likely mismatch', color: '#bb0000' },
  LIKELY_MISMATCH: { min: 80, max: 89, label: 'Likely mismatch', color: '#e9730c' },
  POSSIBLE_MISMATCH: { min: 60, max: 79, label: 'Possible mismatch', color: '#df9e00' },
  LIKELY_MATCH: { min: 0, max: 59, label: 'Likely match', color: '#107e3e' },
} as const;

export function getConfidenceLabel(confidence: number | null): {
  label: string;
  color: string;
} {
  if (confidence === null) return { label: '-', color: '#6a6d70' };

  if (confidence >= CONFIDENCE_LABELS.VERY_LIKELY_MISMATCH.min) {
    return CONFIDENCE_LABELS.VERY_LIKELY_MISMATCH;
  }
  if (confidence >= CONFIDENCE_LABELS.LIKELY_MISMATCH.min) {
    return CONFIDENCE_LABELS.LIKELY_MISMATCH;
  }
  if (confidence >= CONFIDENCE_LABELS.POSSIBLE_MISMATCH.min) {
    return CONFIDENCE_LABELS.POSSIBLE_MISMATCH;
  }
  return CONFIDENCE_LABELS.LIKELY_MATCH;
}

// ==================== STYLES ====================
export const CARD_MIN_WIDTH = '308px';
