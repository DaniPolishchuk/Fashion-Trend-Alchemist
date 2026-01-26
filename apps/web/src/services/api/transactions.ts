/**
 * Transactions API Service
 * API methods for transaction and article count operations
 */

import { fetchAPI } from './client';
import type { CountResponse } from '../../types/api';

export const transactionsApi = {
  /**
   * Get transaction count for selected product types
   */
  getCount: (productTypes: string[]) => {
    const typesParam = productTypes.join(',');
    return fetchAPI<CountResponse>(
      `/api/transactions/count?types=${encodeURIComponent(typesParam)}`
    );
  },

  /**
   * Get article count for selected product types
   */
  getArticleCount: (productTypes: string[]) => {
    const typesParam = productTypes.join(',');
    return fetchAPI<CountResponse>(`/api/articles/count?types=${encodeURIComponent(typesParam)}`);
  },
};
