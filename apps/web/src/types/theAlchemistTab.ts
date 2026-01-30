/**
 * The Alchemist Tab Types
 * Type definitions for RPT-1 transmutation
 */

import { AttributeCategory } from '../constants/theAlchemistTab';

export interface ProjectData {
  id: string;
  name: string;
  ontologySchema: Record<string, Record<string, string[]>> | null;
  scopeConfig: {
    productTypes?: string[];
    [key: string]: unknown;
  } | null;
}

export interface AttributeConfig {
  key: string;
  displayName: string;
  variants: string[];
  category: AttributeCategory;
  selectedValue: string | null;
  isArticleLevel: boolean;
}

export interface PreviewData {
  contextRowCount: number;
  totalContextItems: number;
  missingEnrichmentCount: number;
  lockedAttributes: { key: string; displayName: string; value: string }[];
  aiVariables: { key: string; displayName: string }[];
  samplePayload: object;
}

export interface TheAlchemistTabProps {
  project: ProjectData;
  velocityScoresStale?: boolean;
  attributes: AttributeConfig[] | null;
  onAttributesChange: (attributes: AttributeConfig[]) => void;
  externalLoading?: boolean;
}

/**
 * Persisted attribute state for sessionStorage
 * Only stores user-modifiable fields, not derived data like variants/displayName
 */
export interface PersistedAttribute {
  key: string;
  category: AttributeCategory;
  selectedValue: string | null;
}

export interface PersistedAlchemistState {
  attributes: PersistedAttribute[];
  projectId: string;
}

/**
 * Generated design structure (from API)
 */
export interface GeneratedDesign {
  id: string;
  name: string;
  inputConstraints: Record<string, string> | null;
  predictedAttributes: Record<string, string> | null;
}
