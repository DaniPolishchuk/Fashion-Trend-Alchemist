/**
 * useProjectData Hook
 * Manages project data fetching and state
 */

import { useState, useEffect } from 'react';
import { API_ENDPOINTS, type EnrichmentStatus } from '../constants/projectHub';
import { fetchAPI } from '../services/api/client';

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  status: 'draft' | 'active';
  seasonConfig: Record<string, unknown> | null;
  scopeConfig: Record<string, unknown> | null;
  ontologySchema: Record<string, Record<string, string[]>> | null;
  createdAt: string;
  deletedAt: string | null;
  enrichmentStatus?: EnrichmentStatus;
  enrichmentProcessed?: number;
  enrichmentTotal?: number;
  enrichmentCompletedAt?: string | null;
}

interface UseProjectDataReturn {
  project: ProjectData | null;
  loading: boolean;
  error: string | null;
  enrichmentStatus: EnrichmentStatus;
  enrichmentProgress: { processed: number; total: number };
  currentArticleId: string | null;
  setEnrichmentStatus: (status: EnrichmentStatus) => void;
  setEnrichmentProgress: (progress: { processed: number; total: number }) => void;
  setCurrentArticleId: (id: string | null) => void;
}

export function useProjectData(projectId: string | undefined): UseProjectDataReturn {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState<EnrichmentStatus>('idle');
  const [enrichmentProgress, setEnrichmentProgress] = useState({ processed: 0, total: 0 });
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError('No project ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch project data and enrichment status in parallel
        const [projectResult, statusResult] = await Promise.all([
          fetchAPI<ProjectData>(API_ENDPOINTS.PROJECT(projectId)),
          fetchAPI<{
            status: EnrichmentStatus;
            progress: { processed: number; total: number };
            currentArticleId: string | null;
          }>(API_ENDPOINTS.ENRICHMENT_STATUS(projectId)).catch(() => ({
            error: 'Failed to fetch status',
          })),
        ]);

        if (projectResult.error) {
          throw new Error(projectResult.error);
        }

        setProject(projectResult.data!);

        // Set enrichment status if available
        if ('data' in statusResult && statusResult.data) {
          setEnrichmentStatus(statusResult.data.status || 'idle');
          setEnrichmentProgress(statusResult.data.progress || { processed: 0, total: 0 });
          setCurrentArticleId(statusResult.data.currentArticleId || null);
        }
      } catch (err) {
        console.error('Failed to fetch project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return {
    project,
    loading,
    error,
    enrichmentStatus,
    enrichmentProgress,
    currentArticleId,
    setEnrichmentStatus,
    setEnrichmentProgress,
    setCurrentArticleId,
  };
}
