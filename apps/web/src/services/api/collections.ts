/**
 * Collections API Service
 * API methods for collection operations
 */

import { fetchAPI } from './client';
import type { CollectionFromAPI, CollectionDetailsFromAPI } from '../../types/api';

export const collectionsApi = {
  /**
   * Get all collections for the current user
   */
  list: () => fetchAPI<CollectionFromAPI[]>('/api/collections'),

  /**
   * Get collection details with all designs
   */
  getById: (id: string) => fetchAPI<CollectionDetailsFromAPI>(`/api/collections/${id}`),

  /**
   * Create a new collection
   */
  create: (name: string) =>
    fetchAPI<{ id: string; name: string; createdAt: string }>('/api/collections', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  /**
   * Rename a collection
   */
  rename: (id: string, name: string) =>
    fetchAPI<{ id: string; name: string; createdAt: string }>(`/api/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  /**
   * Delete a collection
   */
  delete: (id: string) =>
    fetchAPI<{ message: string; deletedCollection: { id: string; name: string } }>(
      `/api/collections/${id}`,
      { method: 'DELETE' }
    ),

  /**
   * Add a design to a collection
   */
  addDesign: (collectionId: string, generatedDesignId: string) =>
    fetchAPI<{ message: string }>(`/api/collections/${collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ generatedDesignId }),
    }),

  /**
   * Remove a design from a collection
   */
  removeDesign: (collectionId: string, designId: string) =>
    fetchAPI<{ message: string }>(`/api/collections/${collectionId}/items/${designId}`, {
      method: 'DELETE',
    }),
};
