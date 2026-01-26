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
    title: 'Image Enrichment',
    showButton: true,
    buttonText: 'Start',
    buttonTooltip: 'Start Image Enrichment',
    showProgress: false,
  },
  [ENRICHMENT_STATUS.RUNNING]: {
    color: '#0070F2',
    label: 'RUNNING',
    state: 'Information' as const,
    icon: null,
    title: 'Image Enrichment',
    showButton: false,
    showProgress: true,
  },
  [ENRICHMENT_STATUS.COMPLETED]: {
    color: '#107E3E',
    label: 'COMPLETED',
    state: 'Positive' as const,
    icon: 'accept',
    title: 'Image Enrichment',
    showButton: false,
    showProgress: false,
  },
  [ENRICHMENT_STATUS.FAILED]: {
    color: '#BB0000',
    label: 'FAILED',
    state: 'Negative' as const,
    icon: 'play',
    title: 'Image Enrichment',
    showButton: true,
    buttonText: 'Retry',
    buttonTooltip: 'Retry Image Enrichment',
    showProgress: false,
  },
} as const;

// ==================== TAB CONFIGURATIONS ====================
export const TABS = [
  { id: 'alchemist', label: 'The Alchemist', icon: 'ai' },
  { id: 'enhanced-table', label: 'Enhanced Table', icon: 'table-chart' },
  { id: 'result-overview', label: 'Result Overview', icon: 'grid' },
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
} as const;

// ==================== STYLES ====================
export const CARD_MIN_WIDTH = '308px';
