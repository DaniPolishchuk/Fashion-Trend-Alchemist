/**
 * Filters API Service
 * API methods for filter attributes operations
 */

import { fetchAPI } from './client';
import type { FiltersResponse } from '@fashion/types';

export const filtersApi = {
  /**
   * Get filter attributes for product types with optional date filtering
   */
  getAttributes: (params: { types: string; season?: string; mdFrom?: string; mdTo?: string }) => {
    const searchParams = new URLSearchParams({ types: params.types });
    if (params.season) searchParams.append('season', params.season);
    if (params.mdFrom) searchParams.append('mdFrom', params.mdFrom);
    if (params.mdTo) searchParams.append('mdTo', params.mdTo);

    return fetchAPI<FiltersResponse>(`/api/filters/attributes?${searchParams}`);
  },
};
