/**
 * React Query hook for fetching products with caching and automatic refetching
 */
import { useQuery } from '@tanstack/react-query';
import type { ProductsResponse } from '@fashion/types';

interface UseProductsParams {
  types: string[];
  season?: string | null;
  mdFrom?: string;
  mdTo?: string;
  filters?: {
    productGroup?: string[];
    productFamily?: string[];
    styleConcept?: string[];
    colorFamily?: string[];
    customerSegment?: string[];
    patternStyle?: string[];
    specificColor?: string[];
    colorIntensity?: string[];
    fabricTypeBase?: string[];
  };
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDir?: string;
  enabled?: boolean;
}

async function fetchProducts(params: UseProductsParams): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams({
    types: params.types.join(','),
    limit: String(params.limit || 10),
    offset: String(params.offset || 0),
  });

  if (params.season) {
    searchParams.append('season', params.season);
  }

  if (params.mdFrom && params.mdTo) {
    searchParams.append('mdFrom', params.mdFrom);
    searchParams.append('mdTo', params.mdTo);
  }

  if (params.sortBy) {
    searchParams.append('sortBy', params.sortBy);
  }

  if (params.sortDir) {
    searchParams.append('sortDir', params.sortDir);
  }

  // Add filter parameters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        searchParams.append(`filter_${key}`, values.join(','));
      }
    });
  }

  const response = await fetch(`/api/products?${searchParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export function useProducts(params: UseProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    enabled: params.enabled !== false && params.types.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for products (less than global default)
  });
}
