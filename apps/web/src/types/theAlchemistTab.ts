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
}
