/**
 * useProjectData Hook
 * Manages project data fetching and state
 */

import { useState, useEffect } from 'react';
import { API_ENDPOINTS, type EnrichmentStatus } from '../constants/projectHub';

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
        const [projectResponse, statusResponse] = await Promise.all([
          fetch(API_ENDPOINTS.PROJECT(projectId)),
          fetch(API_ENDPOINTS.ENRICHMENT_STATUS(projectId)),
        ]);

        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project');
        }
        const data = await projectResponse.json();
        setProject(data);

        // Set enrichment status if available
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setEnrichmentStatus(statusData.status || 'idle');
          setEnrichmentProgress(statusData.progress || { processed: 0, total: 0 });
          setCurrentArticleId(statusData.currentArticleId || null);
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
