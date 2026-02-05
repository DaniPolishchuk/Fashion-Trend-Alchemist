/**
 * Project Hub Page
 * Optimized with constants, CSS modules, custom hooks, and reusable components
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BusyIndicator,
  IllustratedMessage,
  Text,
  Button,
  Title,
  Icon,
  Breadcrumbs,
  BreadcrumbsItem,
  Input,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/ai.js';
import '@ui5/webcomponents-icons/dist/table-chart.js';
import '@ui5/webcomponents-icons/dist/grid.js';
import '@ui5/webcomponents-icons/dist/business-objects-experience.js';
import '@ui5/webcomponents-icons/dist/edit.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/decline.js';

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
import { useEnrichmentPolling } from '../hooks/useEnrichmentPolling';

// Constants and styles
import { TABS, TEXT, API_ENDPOINTS, type TabType } from '../constants/projectHub';
import { API_ENDPOINTS as TABLE_ENDPOINTS } from '../constants/enhancedTableTab';
import type { MismatchSummary, ContextItem } from '../types/enhancedTableTab';
import type { AttributeConfig, GeneratedDesign } from '../types/theAlchemistTab';
import { fetchAPI } from '../services/api/client';
import {
  saveAttributesToSession,
  loadAttributesFromSession,
  initializeAttributes,
  fetchArticleAttributes,
  validateAndMergeAttributes,
  transformDesignToAttributes,
  clearAttributesFromSession,
} from '../utils/theAlchemistHelpers';
import styles from '../styles/pages/ProjectHub.module.css';

// Debounce delay for sessionStorage writes
const SESSION_STORAGE_DEBOUNCE_MS = 500;

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
  const [searchParams] = useSearchParams();

  // Get tab from URL or default to 'enhanced-table'
  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get('tab');
    const validTabs = TABS.map((t) => t.id);
    return tabParam && validTabs.includes(tabParam as TabType)
      ? (tabParam as TabType)
      : 'enhanced-table';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

  // Update active tab when URL parameter changes
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchParams]);

  // Mismatch review state
  const [mismatchSummary, setMismatchSummary] = useState<MismatchSummary>({
    flaggedCount: 0,
    excludedCount: 0,
    reviewCompleted: false,
  });
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [velocityScoresStale, setVelocityScoresStale] = useState(false);
  const [mismatchDialogOpen, setMismatchDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Project name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // ==================== ALCHEMIST TAB STATE MANAGEMENT ====================

  // Lifted state for TheAlchemistTab - survives tab switches
  const [alchemistAttributes, setAlchemistAttributes] = useState<AttributeConfig[] | null>(null);
  const [refineFromLoading, setRefineFromLoading] = useState(false);
  const [refineFromProcessed, setRefineFromProcessed] = useState(false);

  // Ref for debounced sessionStorage write
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    setProject,
  } = useProjectData(projectId);

  // Handle attribute changes from TheAlchemistTab
  const handleAlchemistAttributesChange = useCallback(
    (attributes: AttributeConfig[]) => {
      setAlchemistAttributes(attributes);

      // Debounced save to sessionStorage
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (projectId) {
          saveAttributesToSession(projectId, attributes);
        }
      }, SESSION_STORAGE_DEBOUNCE_MS);
    },
    [projectId]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle refineFrom URL parameter
  useEffect(() => {
    const refineFrom = searchParams.get('refineFrom');

    // Skip if already processed or no refineFrom
    if (!refineFrom || refineFromProcessed || !projectId || !project) {
      return;
    }

    const processRefineFrom = async () => {
      setRefineFromLoading(true);
      setRefineFromProcessed(true);

      try {
        // Fetch designs to find the one to refine from
        const result = await fetchAPI<GeneratedDesign[]>(
          `/api/projects/${projectId}/generated-designs`
        );

        if (result.error) {
          console.error('Failed to fetch designs for refineFrom:', result.error);
          // Clear refineFrom and fall back to sessionStorage/defaults
          navigate(`/project/${projectId}?tab=alchemist`, { replace: true });
          return;
        }

        const designs = result.data || [];
        const design = designs.find((d) => d.id === refineFrom);

        if (!design) {
          console.warn(`Design ${refineFrom} not found, falling back to defaults`);
          navigate(`/project/${projectId}?tab=alchemist`, { replace: true });
          return;
        }

        // We need the current attributes to transform - fetch them if not available
        const productTypes = (project.scopeConfig as { productTypes?: string[] } | null)
          ?.productTypes;
        const articleOptions = await fetchArticleAttributes(productTypes);

        // Fetch context items to properly determine auto-excluded attributes
        const contextItemsResult = await fetchAPI<{ items: ContextItem[] }>(
          `/api/projects/${projectId}/context-items`
        );
        const contextItemsData = contextItemsResult.data?.items || [];

        const defaultAttributes = initializeAttributes(
          articleOptions,
          project.ontologySchema,
          contextItemsData
        );

        // Transform design to attributes
        const transformedAttributes = transformDesignToAttributes(design, defaultAttributes);

        // Set the attributes and save to session
        setAlchemistAttributes(transformedAttributes);
        saveAttributesToSession(projectId, transformedAttributes);

        // Clear refineFrom from URL
        navigate(`/project/${projectId}?tab=alchemist`, { replace: true });
      } catch (err) {
        console.error('Error processing refineFrom:', err);
        navigate(`/project/${projectId}?tab=alchemist`, { replace: true });
      } finally {
        setRefineFromLoading(false);
      }
    };

    processRefineFrom();
  }, [searchParams, projectId, project, refineFromProcessed, navigate]);

  // Reset refineFromProcessed when projectId changes (new project)
  useEffect(() => {
    setRefineFromProcessed(false);
    setAlchemistAttributes(null);
  }, [projectId]);

  // Load from sessionStorage when project is ready and no refineFrom
  useEffect(() => {
    const refineFrom = searchParams.get('refineFrom');

    // Skip if there's a refineFrom to process, or if we already have attributes
    if (refineFrom || !projectId || !project || alchemistAttributes !== null) {
      return;
    }

    // Try to load from sessionStorage
    const storedState = loadAttributesFromSession(projectId);

    if (storedState && storedState.attributes.length > 0) {
      // We need current attributes to validate against
      const loadAndValidate = async () => {
        const productTypes = (project.scopeConfig as { productTypes?: string[] } | null)
          ?.productTypes;
        const articleOptions = await fetchArticleAttributes(productTypes);

        // Fetch context items to properly determine auto-excluded attributes
        const contextItemsResult = await fetchAPI<{ items: ContextItem[] }>(
          `/api/projects/${projectId}/context-items`
        );
        const contextItemsData = contextItemsResult.data?.items || [];

        const defaultAttributes = initializeAttributes(
          articleOptions,
          project.ontologySchema,
          contextItemsData
        );

        // Validate and merge stored state with current schema
        const mergedAttributes = validateAndMergeAttributes(
          storedState.attributes,
          defaultAttributes
        );

        setAlchemistAttributes(mergedAttributes);
      };

      loadAndValidate();
    }
    // If no stored state, leave alchemistAttributes as null - TheAlchemistTab will initialize
  }, [projectId, project, searchParams, alchemistAttributes]);

  // Fetch mismatch summary and context items
  const fetchMismatchData = useCallback(async () => {
    if (!projectId) return;

    try {
      const result = await fetchAPI<{
        mismatchSummary: MismatchSummary;
        items: ContextItem[];
        velocityScoresStale: boolean;
      }>(TABLE_ENDPOINTS.CONTEXT_ITEMS(projectId));

      if (result.data) {
        setMismatchSummary(
          result.data.mismatchSummary || {
            flaggedCount: 0,
            excludedCount: 0,
            reviewCompleted: false,
          }
        );
        setContextItems(result.data.items || []);
        setVelocityScoresStale(result.data.velocityScoresStale || false);
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

  // Reset Alchemist attributes to force re-analysis with fresh data
  const resetAlchemistAttributes = useCallback(() => {
    if (projectId) {
      clearAttributesFromSession(projectId);
      setAlchemistAttributes(null);
    }
  }, [projectId]);

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
    // Reset attributes to re-analyze with newly enriched data
    resetAlchemistAttributes();
  }, [setEnrichmentStatus, setCurrentArticleId, resetAlchemistAttributes]);

  const handleError = useCallback(() => {
    setEnrichmentStatus('failed');
    setCurrentArticleId(null);
  }, [setEnrichmentStatus, setCurrentArticleId]);

  // Use polling hook for real-time progress updates
  useEnrichmentPolling({
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
      const result = await fetchAPI(API_ENDPOINTS.START_ENRICHMENT(projectId), {
        method: 'POST',
      });

      if (result.error) {
        console.error('Failed to start enrichment:', result.error);
      } else {
        setEnrichmentStatus('running');
      }
    } catch (err) {
      console.error('Failed to start enrichment:', err);
    }
  };

  // Handle mismatch review confirmation
  const handleMismatchReviewConfirm = useCallback(() => {
    fetchMismatchData(); // Refresh data after review
    setVelocityScoresStale(false); // Backend auto-recalculates, so clear warning
    setRefreshTrigger((prev) => prev + 1); // Force table refresh
    // Reset attributes to re-analyze with updated context
    resetAlchemistAttributes();
  }, [fetchMismatchData, resetAlchemistAttributes]);

  // Handle velocity recalculation
  const handleVelocityRecalculated = useCallback(() => {
    setVelocityScoresStale(false);
    // Refresh all data after recalculation to show updated velocity scores
    fetchMismatchData();
    // Increment refresh trigger to force EnhancedTableTab to re-fetch
    setRefreshTrigger((prev) => prev + 1);
    // Reset attributes to re-analyze with updated velocity scores
    resetAlchemistAttributes();
  }, [fetchMismatchData, resetAlchemistAttributes]);

  // Handle project name editing
  const handleStartEditName = useCallback(() => {
    if (project) {
      setEditedName(project.name);
      setIsEditingName(true);
    }
  }, [project]);

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  const handleSaveName = useCallback(async () => {
    if (!projectId || !editedName.trim()) return;

    try {
      setSavingName(true);
      const result = await fetchAPI(`/api/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (result.error) {
        console.error('Failed to update project name:', result.error);
      } else if (result.data) {
        // Update project state immediately with returned data
        setProject(result.data as any);
        setIsEditingName(false);
      }
    } catch (err) {
      console.error('Failed to update project name:', err);
    } finally {
      setSavingName(false);
    }
  }, [projectId, editedName, setProject]);

  // Render tab content
  const renderTabContent = () => {
    if (!project) return null;

    switch (activeTab) {
      case 'alchemist':
        return (
          <TheAlchemistTab
            project={project}
            attributes={alchemistAttributes}
            onAttributesChange={handleAlchemistAttributesChange}
            externalLoading={refineFromLoading}
            velocityScoresStale={velocityScoresStale}
          />
        );
      case 'enhanced-table':
        return (
          <EnhancedTableTab
            projectId={project.id}
            enrichmentStatus={enrichmentStatus}
            currentArticleId={currentArticleId}
            onContextChange={fetchMismatchData}
            refreshTrigger={refreshTrigger}
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
            {isEditingName ? (
              <>
                <Input
                  value={editedName}
                  onInput={(e: any) => setEditedName(e.target.value)}
                  style={{ minWidth: '300px', marginRight: '0.5rem' }}
                  disabled={savingName}
                />
                <Button
                  icon="accept"
                  design="Positive"
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                  tooltip="Save"
                />
                <Button
                  icon="decline"
                  design="Negative"
                  onClick={handleCancelEditName}
                  disabled={savingName}
                  tooltip="Cancel"
                />
              </>
            ) : (
              <>
                <Title level="H2" className={styles.headerTitle}>
                  {project.name}
                </Title>
                <Button
                  icon="edit"
                  design="Transparent"
                  onClick={handleStartEditName}
                  tooltip="Edit project name"
                />
              </>
            )}
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
            onClick={() => {
              setActiveTab(tab.id);
              navigate(`/project/${projectId}?tab=${tab.id}`, { replace: true });
            }}
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
