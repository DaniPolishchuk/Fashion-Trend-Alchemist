/**
 * Attributes API Service
 * API methods for attribute generation operations
 */

import { fetchAPI } from './client';
import type { GenerateAttributesRequest, GenerateAttributesResponse } from '../../types/api';

export const attributesApi = {
  /**
   * Generate attributes for product types
   */
  generate: (request: GenerateAttributesRequest) =>
    fetchAPI<GenerateAttributesResponse>('/api/generate-attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),
};
