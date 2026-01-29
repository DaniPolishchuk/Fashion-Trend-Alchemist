/**
 * API Client Base
 * Core HTTP client with error handling
 * Authentication is handled by SAP Approuter via session cookies
 */

import type { ApiResponse } from '../../types/api';

// API base URL - defaults to empty string (same origin)
const API_BASE = '';

/**
 * Generic fetch wrapper with error handling
 */
export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    // Build headers
    const headers: HeadersInit = {
      ...options?.headers,
    };

    // Add Content-Type only if there's a body
    if (options?.body) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include', // Important: send session cookies to approuter
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return { error: errorData.error || `HTTP ${response.status}: ${response.statusText}` };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: undefined as T };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}
