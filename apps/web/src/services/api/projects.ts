/**
 * Projects API Service
 * API methods for project operations
 */

import { fetchAPI } from './client';
import type {
  ProjectFromAPI,
  CreateProjectRequest,
  ProjectCreatedResponse,
  LockContextRequest,
} from '../../types/api';

export const projectsApi = {
  /**
   * Get all projects for the current user
   */
  list: () => fetchAPI<ProjectFromAPI[]>('/api/projects'),

  /**
   * Get a single project by ID
   */
  get: (id: string) => fetchAPI<ProjectFromAPI>(`/api/projects/${id}`),

  /**
   * Create a new project
   */
  create: (request: CreateProjectRequest) =>
    fetchAPI<ProjectCreatedResponse>('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),

  /**
   * Preview context articles for a project
   */
  previewContext: (id: string, params: URLSearchParams) =>
    fetchAPI<any[]>(`/api/projects/${id}/preview-context?${params}`),

  /**
   * Lock context for a project
   */
  lockContext: (id: string, request: LockContextRequest) =>
    fetchAPI<any>(`/api/projects/${id}/lock-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),

  /**
   * Delete a project
   */
  delete: (id: string) =>
    fetchAPI<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Toggle project pin status
   */
  pin: (id: string, isPinned: boolean) =>
    fetchAPI<ProjectFromAPI>(`/api/projects/${id}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ isPinned }),
    }),
};
