/**
 * Project Hub Page
 * Optimized with constants, CSS modules, custom hooks, and reusable components
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BusyIndicator,
  IllustratedMessage,
  Text,
  Button,
  Title,
  Icon,
  Breadcrumbs,
  BreadcrumbsItem,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/ai.js';
import '@ui5/webcomponents-icons/dist/table-chart.js';
import '@ui5/webcomponents-icons/dist/grid.js';
import '@ui5/webcomponents-icons/dist/business-objects-experience.js';

// Tab components
import TheAlchemistTab from './tabs/TheAlchemistTab';
import ResultOverviewTab from './tabs/ResultOverviewTab';
import EnhancedTableTab from './tabs/EnhancedTableTab';
import DataAnalysisTab from './tabs/DataAnalysisTab';

// Custom components and hooks
import EnrichmentStatusCard from '../components/EnrichmentStatusCard';
import MismatchReviewBadge from '../components/MismatchReviewBadge';
import MismatchReviewDialog from '../components/MismatchReviewDialog';
import VelocityRecalcIndicator from '../components/VelocityRecalcIndicator';
import { useProjectData } from '../hooks/useProjectData';
import { useEnrichmentSSE } from '../hooks/useEnrichmentSSE';

// Constants and styles
import { TABS, TEXT, API_ENDPOINTS, type TabType } from '../constants/projectHub';
import { API_ENDPOINTS as TABLE_ENDPOINTS } from '../constants/enhancedTableTab';
import type { MismatchSummary, ContextItem } from '../types/enhancedTableTab';
import styles from '../styles/pages/ProjectHub.module.css';

// Helper function to format creation date
const formatCreationDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function ProjectHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('enhanced-table');

  // Mismatch review state
  const [mismatchSummary, setMismatchSummary] = useState<MismatchSummary>({
    flaggedCount: 0,
    excludedCount: 0,
    reviewCompleted: false,
  });
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [velocityScoresStale, setVelocityScoresStale] = useState(false);
  const [mismatchDialogOpen, setMismatchDialogOpen] = useState(false);

  // Use custom hook for project data
  const {
    project,
    loading,
    error,
    enrichmentStatus,
    enrichmentProgress,
    currentArticleId,
    setEnrichmentStatus,
    setEnrichmentProgress,
    setCurrentArticleId,
  } = useProjectData(projectId);

  // Fetch mismatch summary and context items
  const fetchMismatchData = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await fetch(TABLE_ENDPOINTS.CONTEXT_ITEMS(projectId));
      if (response.ok) {
        const data = await response.json();
        setMismatchSummary(data.mismatchSummary || {
          flaggedCount: 0,
          excludedCount: 0,
          reviewCompleted: false,
        });
        setContextItems(data.items || []);
        setVelocityScoresStale(data.velocityScoresStale || false);
      }
    } catch (err) {
      console.error('Failed to fetch mismatch data:', err);
    }
  }, [projectId]);

  // Fetch mismatch data on mount and when enrichment completes
  useEffect(() => {
    if (projectId && enrichmentStatus === 'completed') {
      fetchMismatchData();
    }
  }, [projectId, enrichmentStatus, fetchMismatchData]);

  // Initial fetch
  useEffect(() => {
    if (projectId) {
      fetchMismatchData();
    }
  }, [projectId, fetchMismatchData]);

  // Handle SSE updates
  const handleProgress = useCallback(
    (progress: { processed: number; total: number }, articleId: string | null) => {
      setEnrichmentProgress(progress);
      setCurrentArticleId(articleId);
    },
    [setEnrichmentProgress, setCurrentArticleId]
  );

  const handleCompleted = useCallback(() => {
    setEnrichmentStatus('completed');
    setCurrentArticleId(null);
  }, [setEnrichmentStatus, setCurrentArticleId]);

  const handleError = useCallback(() => {
    setEnrichmentStatus('failed');
    setCurrentArticleId(null);
  }, [setEnrichmentStatus, setCurrentArticleId]);

  // Use SSE hook
  useEnrichmentSSE({
    projectId,
    enrichmentStatus,
    onProgress: handleProgress,
    onCompleted: handleCompleted,
    onError: handleError,
  });

  // Handle start enrichment
  const handleStartEnrichment = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(API_ENDPOINTS.START_ENRICHMENT(projectId), {
        method: 'POST',
      });

      if (response.ok) {
        setEnrichmentStatus('running');
      } else {
        const data = await response.json();
        console.error('Failed to start enrichment:', data.error);
      }
    } catch (err) {
      console.error('Failed to start enrichment:', err);
    }
  };

  // Handle mismatch review confirmation
  const handleMismatchReviewConfirm = useCallback(() => {
    fetchMismatchData(); // Refresh data after review
  }, [fetchMismatchData]);

  // Handle velocity recalculation
  const handleVelocityRecalculated = useCallback(() => {
    setVelocityScoresStale(false);
    fetchMismatchData(); // Refresh data after recalculation
  }, [fetchMismatchData]);

  // Render tab content
  const renderTabContent = () => {
    if (!project) return null;

    switch (activeTab) {
      case 'alchemist':
        return <TheAlchemistTab project={project} />;
      case 'enhanced-table':
        return (
          <EnhancedTableTab
            projectId={project.id}
            enrichmentStatus={enrichmentStatus}
            currentArticleId={currentArticleId}
          />
        );
      case 'result-overview':
        return <ResultOverviewTab projectId={project.id} />;
      case 'data-analysis':
        return <DataAnalysisTab />;
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <BusyIndicator active size="L" />
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className={styles.errorContainer}>
        <IllustratedMessage
          name="NoData"
          titleText={TEXT.ERROR_TITLE}
          subtitleText={error || TEXT.ERROR_NOT_FOUND}
        >
          <Button design="Emphasized" onClick={() => navigate('/')}>
            {TEXT.BUTTON_BACK_HOME}
          </Button>
        </IllustratedMessage>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbsContainer}>
        <Breadcrumbs
          onItemClick={(e: any) => {
            const text = e.detail.item.textContent?.trim();
            if (text === TEXT.BREADCRUMB_HOME) {
              navigate('/');
            }
          }}
        >
          <BreadcrumbsItem>{TEXT.BREADCRUMB_HOME}</BreadcrumbsItem>
          <BreadcrumbsItem>{project.name}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitleRow}>
            <Title level="H2" className={styles.headerTitle}>
              {project.name}
            </Title>
          </div>
          <Text className={styles.headerSubtext}>
            {TEXT.CREATED_ON} {formatCreationDate(project.createdAt)}
          </Text>
        </div>

        {/* Enrichment Status Card and Mismatch Review */}
        <div className={styles.headerRight}>
          <VelocityRecalcIndicator
            projectId={projectId!}
            isStale={velocityScoresStale}
            onRecalculated={handleVelocityRecalculated}
          />
          <MismatchReviewBadge
            mismatchSummary={mismatchSummary}
            onClick={() => setMismatchDialogOpen(true)}
          />
          <EnrichmentStatusCard
            status={enrichmentStatus}
            progress={enrichmentProgress}
            projectStatus={project.status}
            completedAt={project.enrichmentCompletedAt}
            onStart={handleStartEnrichment}
          />
        </div>
      </div>

      {/* Mismatch Review Dialog */}
      <MismatchReviewDialog
        open={mismatchDialogOpen}
        projectId={projectId!}
        items={contextItems}
        onClose={() => setMismatchDialogOpen(false)}
        onConfirm={handleMismatchReviewConfirm}
      />

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
          >
            <Icon
              name={tab.icon}
              className={`${styles.tabIcon} ${activeTab === tab.id ? styles.tabIconActive : ''}`}
            />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>{renderTabContent()}</div>
    </div>
  );
}

export default ProjectHub;
