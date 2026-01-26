/**
 * Enhanced Table Tab Types
 * Type definitions for context items table
 */

export interface ContextItem {
  articleId: string;
  productType: string;
  productGroup: string | null;
  colorFamily: string | null;
  patternStyle: string | null;
  specificColor: string | null;
  colorIntensity: string | null;
  productFamily: string | null;
  customerSegment: string | null;
  styleConcept: string | null;
  fabricTypeBase: string | null;
  detailDesc: string | null;
  velocityScore: number;
  enrichedAttributes: Record<string, string> | null;
  enrichmentError: string | null;
  imageUrl: string;
}

export interface Summary {
  total: number;
  successful: number;
  pending: number;
  failed: number;
}

export interface EnhancedTableTabProps {
  projectId: string;
  enrichmentStatus: 'idle' | 'running' | 'completed' | 'failed';
  currentArticleId: string | null;
}

export interface StatusDisplay {
  icon: string;
  state: 'Positive' | 'Negative' | 'Information';
  label: string;
}
