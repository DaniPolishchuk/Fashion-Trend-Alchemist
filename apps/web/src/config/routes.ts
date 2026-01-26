/**
 * Route Configuration
 * Central route definitions for the application
 */

export const ROUTES = {
  HOME: '/',
  PRODUCT_SELECTION: '/product-selection',
  PROJECT: '/project/:id',
  CONTEXT_BUILDER: '/context-builder/:id',
  DESIGN_DETAIL: '/design/:id',
} as const;

/**
 * Generate route path with parameters
 */
export const generateRoute = {
  project: (id: string) => `/project/${id}`,
  contextBuilder: (id: string) => `/context-builder/${id}`,
  designDetail: (id: string) => `/design/${id}`,
} as const;
