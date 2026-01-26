/**
 * Taxonomy API Service
 * API methods for product taxonomy operations
 */

import { fetchAPI } from './client';
import type { Taxonomy } from '../../types/api';

export const taxonomyApi = {
  /**
   * Get product taxonomy (groups and types)
   */
  get: () => fetchAPI<Taxonomy>('/api/taxonomy'),
};
