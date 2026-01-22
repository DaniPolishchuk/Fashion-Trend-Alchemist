/**
 * React Query hook for fetching filter options with caching
 */
import { useQuery } from '@tanstack/react-query';
import type { FiltersResponse } from '@fashion/types';

interface UseFilterOptionsParams {
  types: string[];
  season?: string | null;
  mdFrom?: string;
  mdTo?: string;
  enabled?: boolean;
}

async function fetchFilterOptions(params: UseFilterOptionsParams): Promise<FiltersResponse> {
  const searchParams = new URLSearchParams({
    types: params.types.join(','),
  });

  if (params.season) {
    searchParams.append('season', params.season);
  }

  if (params.mdFrom && params.mdTo) {
    searchParams.append('mdFrom', params.mdFrom);
    searchParams.append('mdTo', params.mdTo);
  }

  const response = await fetch(`/api/filters/attributes?${searchParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch filter options');
  }

  return response.json();
}

export function useFilterOptions(params: UseFilterOptionsParams) {
  return useQuery({
    queryKey: ['filterOptions', params],
    queryFn: () => fetchFilterOptions(params),
    enabled: params.enabled !== false && params.types.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - filter options change less frequently
  });
}
