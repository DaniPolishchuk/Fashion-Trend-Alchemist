/**
 * useEnrichmentSSE Hook
 * Manages Server-Sent Events connection for real-time enrichment progress
 */

import { useEffect } from 'react';
import { API_ENDPOINTS, type EnrichmentStatus } from '../constants/projectHub';

interface UseEnrichmentSSEProps {
  projectId: string | undefined;
  enrichmentStatus: EnrichmentStatus;
  onProgress: (
    progress: { processed: number; total: number },
    currentArticleId: string | null
  ) => void;
  onCompleted: () => void;
  onError: () => void;
}

export function useEnrichmentSSE({
  projectId,
  enrichmentStatus,
  onProgress,
  onCompleted,
  onError,
}: UseEnrichmentSSEProps) {
  useEffect(() => {
    if (enrichmentStatus !== 'running' || !projectId) return;

    const eventSource = new EventSource(API_ENDPOINTS.ENRICHMENT_PROGRESS(projectId));

    eventSource.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      onProgress({ processed: data.processed, total: data.total }, data.currentArticleId || null);
    });

    eventSource.addEventListener('completed', () => {
      onCompleted();
      eventSource.close();
    });

    eventSource.addEventListener('error', () => {
      onError();
      eventSource.close();
    });

    return () => eventSource.close();
  }, [projectId, enrichmentStatus, onProgress, onCompleted, onError]);
}
