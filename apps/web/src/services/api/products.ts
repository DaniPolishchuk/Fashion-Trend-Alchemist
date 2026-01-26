/**
 * Products API Service
 * API methods for products operations
 */

import { fetchAPI } from './client';
import type { ProductsResponse } from '../../types/api';

export const productsApi = {
  /**
   * Get paginated product list with filters
   */
  list: (params: URLSearchParams) => fetchAPI<ProductsResponse>(`/api/products?${params}`),
};
