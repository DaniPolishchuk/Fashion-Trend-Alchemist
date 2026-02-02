/**
 * useEnrichmentPolling Hook
 * Polls enrichment status for real-time progress updates
 * More reliable than SSE through proxies and firewalls
 */

import { useEffect, useRef } from 'react';
import { API_ENDPOINTS, type EnrichmentStatus } from '../constants/projectHub';
import { fetchAPI } from '../services/api/client';

interface UseEnrichmentPollingProps {
  projectId: string | undefined;
  enrichmentStatus: EnrichmentStatus;
  onProgress: (
    progress: { processed: number; total: number },
    currentArticleId: string | null
  ) => void;
  onCompleted: () => void;
  onError: () => void;
}

interface EnrichmentStatusResponse {
  status: EnrichmentStatus;
  progress: {
    processed: number;
    total: number;
  };
  currentArticleId: string | null;
}

const POLLING_INTERVAL_MS = 1000; // Poll every second

export function useEnrichmentPolling({
  projectId,
  enrichmentStatus,
  onProgress,
  onCompleted,
  onError,
}: UseEnrichmentPollingProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<EnrichmentStatus>(enrichmentStatus);

  useEffect(() => {
    // Only poll when enrichment is running
    if (enrichmentStatus !== 'running' || !projectId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const pollStatus = async () => {
      try {
        const result = await fetchAPI<EnrichmentStatusResponse>(
          API_ENDPOINTS.ENRICHMENT_STATUS(projectId)
        );

        if (result.error) {
          console.error('Polling error:', result.error);
          return;
        }

        const data = result.data!;

        // Update progress
        onProgress(data.progress, data.currentArticleId);

        // Check if status changed to completed
        if (lastStatusRef.current === 'running' && data.status === 'completed') {
          onCompleted();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }

        // Check if status changed to failed
        if (lastStatusRef.current === 'running' && data.status === 'failed') {
          onError();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }

        lastStatusRef.current = data.status;
      } catch (error) {
        console.error('Failed to poll enrichment status:', error);
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll at interval
    intervalRef.current = setInterval(pollStatus, POLLING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [projectId, enrichmentStatus, onProgress, onCompleted, onError]);
}
