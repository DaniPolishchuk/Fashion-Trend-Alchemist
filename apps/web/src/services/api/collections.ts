/**
 * Collections API Service
 * API methods for collection operations
 */

import { fetchAPI } from './client';
import type { CollectionFromAPI } from '../../types/api';

export const collectionsApi = {
  /**
   * Get all collections for the current user
   */
  list: () => fetchAPI<CollectionFromAPI[]>('/api/collections'),
};
