/**
 * API Services Barrel Export
 * Central export point for all API services
 */

import { projectsApi } from './projects';
import { collectionsApi } from './collections';
import { taxonomyApi } from './taxonomy';
import { transactionsApi } from './transactions';
import { filtersApi } from './filters';
import { attributesApi } from './attributes';
import { productsApi } from './products';

export { fetchAPI } from './client';
export { projectsApi } from './projects';
export { collectionsApi } from './collections';
export { taxonomyApi } from './taxonomy';
export { transactionsApi } from './transactions';
export { filtersApi } from './filters';
export { attributesApi } from './attributes';
export { productsApi } from './products';

/**
 * Unified API object for convenience
 */
export const api = {
  projects: projectsApi,
  collections: collectionsApi,
  taxonomy: taxonomyApi,
  transactions: transactionsApi,
  filters: filtersApi,
  attributes: attributesApi,
  products: productsApi,
};
