import { useState, useEffect } from 'react';
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
  ObjectStatus,
  ProgressIndicator,
  Card,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/ai.js';
import '@ui5/webcomponents-icons/dist/table-chart.js';
import '@ui5/webcomponents-icons/dist/grid.js';
import '@ui5/webcomponents-icons/dist/business-objects-experience.js';
import '@ui5/webcomponents-icons/dist/play.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/error.js';

// Tab components
import TheAlchemistTab from './tabs/TheAlchemistTab';
import ResultOverviewTab from './tabs/ResultOverviewTab';
import EnhancedTableTab from './tabs/EnhancedTableTab';
import DataAnalysisTab from './tabs/DataAnalysisTab';

type TabType = 'alchemist' | 'enhanced-table' | 'result-overview' | 'data-analysis';

interface ProjectData {
  id: string;
  userId: string;
  name: string;
  status: 'draft' | 'active';
  seasonConfig: Record<string, unknown> | null;
  scopeConfig: Record<string, unknown> | null;
  ontologySchema: Record<string, Record<string, string[]>> | null;
  createdAt: string;
  deletedAt: string | null;
  enrichmentStatus?: 'idle' | 'running' | 'completed' | 'failed';
  enrichmentProcessed?: number;
  enrichmentTotal?: number;
  enrichmentCompletedAt?: string | null;
}

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

  // State
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('alchemist');

  // Enrichment state
  const [enrichmentStatus, setEnrichmentStatus] = useState<
    'idle' | 'running' | 'completed' | 'failed'
  >('idle');
  const [enrichmentProgress, setEnrichmentProgress] = useState({ processed: 0, total: 0 });
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);

  // Fetch project data and enrichment status
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
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/enrichment-status`),
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

  // SSE connection for real-time enrichment progress
  useEffect(() => {
    if (enrichmentStatus !== 'running' || !projectId) return;

    const eventSource = new EventSource(`/api/projects/${projectId}/enrichment-progress`);

    eventSource.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      setEnrichmentProgress({ processed: data.processed, total: data.total });
      setCurrentArticleId(data.currentArticleId || null);
    });

    eventSource.addEventListener('completed', () => {
      setEnrichmentStatus('completed');
      setCurrentArticleId(null);
      eventSource.close();
    });

    eventSource.addEventListener('error', () => {
      setEnrichmentStatus('failed');
      setCurrentArticleId(null);
      eventSource.close();
    });

    return () => eventSource.close();
  }, [projectId, enrichmentStatus]);

  // Handle start enrichment
  const handleStartEnrichment = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/start-enrichment`, {
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

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'alchemist', label: 'The Alchemist', icon: 'ai' },
    { id: 'enhanced-table', label: 'Enhanced Table', icon: 'table-chart' },
    { id: 'result-overview', label: 'Result Overview', icon: 'grid' },
    { id: 'data-analysis', label: 'Data Analysis', icon: 'business-objects-experience' },
  ];

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

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 44px)',
        }}
      >
        <BusyIndicator active size="L" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ padding: '2rem' }}>
        <IllustratedMessage
          name="NoData"
          titleText="Error Loading Project"
          subtitleText={error || 'Project not found'}
        >
          <Button design="Emphasized" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </IllustratedMessage>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--sapBackgroundColor)',
        minHeight: 'calc(100vh - 44px)',
        paddingBottom: '2rem',
      }}
    >
      {/* Breadcrumbs */}
      <div style={{ padding: '12px 2rem 0' }}>
        <Breadcrumbs
          onItemClick={(e: any) => {
            const text = e.detail.item.textContent?.trim();
            if (text === 'Home') {
              navigate('/');
            }
          }}
        >
          <BreadcrumbsItem>Home</BreadcrumbsItem>
          <BreadcrumbsItem>{project.name}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* Header Section */}
      <div
        style={{
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {/* Left: Project Name and Status */}
        <div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}
          >
            <Title level="H2">{project.name}</Title>
            <ObjectStatus state={project.status === 'active' ? 'Positive' : 'Information'} inverted>
              {project.status === 'active' ? 'ACTIVE' : 'DRAFT'}
            </ObjectStatus>
          </div>
          <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
            Created on {formatCreationDate(project.createdAt)}
          </Text>
        </div>

        {/* Right: Progress Indicator with Start Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* Conditional rendering based on enrichment state */}
          {enrichmentStatus === 'completed' || project.enrichmentCompletedAt ? (
            /* Stage 3: Completion State - Clean success card */
            <div
              style={{
                minWidth: '280px',
                border: '1px solid #107E3E',
                borderRadius: '0.5rem',
                padding: '1rem',
                background:
                  'linear-gradient(135deg, rgba(16, 126, 62, 0.08) 0%, rgba(16, 126, 62, 0.03) 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <Icon
                name="accept"
                style={{
                  fontSize: '1.5rem',
                  color: '#107E3E',
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Text
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#107E3E',
                    }}
                  >
                    Image Enrichment
                  </Text>
                  <div
                    style={{
                      background: '#107E3E',
                      color: 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    COMPLETED
                  </div>
                </div>
                <Text
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--sapContent_LabelColor)',
                  }}
                >
                  {enrichmentProgress.total > 0
                    ? `${enrichmentProgress.total} items enriched`
                    : 'All items processed'}
                  {project.enrichmentCompletedAt &&
                    ` • ${formatCreationDate(project.enrichmentCompletedAt)}`}
                </Text>
              </div>
            </div>
          ) : enrichmentStatus === 'failed' ? (
            /* Stage 4: Failed State - Red error card with retry option */
            <>
              <Button
                icon="play"
                design="Transparent"
                onClick={handleStartEnrichment}
                disabled={project.status !== 'active'}
                tooltip="Retry Image Enrichment"
              >
                Retry
              </Button>
              <div
                style={{
                  minWidth: '280px',
                  border: '1px solid #BB0000',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  background:
                    'linear-gradient(135deg, rgba(187, 0, 0, 0.08) 0%, rgba(187, 0, 0, 0.03) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <Icon
                  name="error"
                  style={{
                    fontSize: '1.5rem',
                    color: '#BB0000',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#BB0000',
                      }}
                    >
                      Image Enrichment
                    </Text>
                    <div
                      style={{
                        background: '#BB0000',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      FAILED
                    </div>
                  </div>
                  <Text
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--sapContent_LabelColor)',
                    }}
                  >
                    Processing stopped at {enrichmentProgress.processed}/{enrichmentProgress.total}
                  </Text>
                </div>
              </div>
            </>
          ) : enrichmentStatus === 'running' ? (
            /* Stage 2: Running State - Blue progress bar */
            <>
              <Button icon="play" design="Transparent" disabled tooltip="Enrichment in Progress" />
              <div
                style={{
                  minWidth: '280px',
                  border: '1px solid #0070F2',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  background:
                    'linear-gradient(135deg, rgba(0, 112, 242, 0.08) 0%, rgba(0, 112, 242, 0.03) 100%)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Text
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0070F2',
                    }}
                  >
                    Image Enrichment
                  </Text>
                  <div
                    style={{
                      background: '#0070F2',
                      color: 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    RUNNING
                  </div>
                </div>
                <Text
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--sapContent_LabelColor)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Processing {enrichmentProgress.processed} of {enrichmentProgress.total} items
                </Text>
                <ProgressIndicator
                  value={
                    enrichmentProgress.total > 0
                      ? (enrichmentProgress.processed / enrichmentProgress.total) * 100
                      : 0
                  }
                  valueState="Information"
                  style={{ width: '100%' }}
                />
              </div>
            </>
          ) : (
            /* Stage 1: Idle/Ready State - SAP Blue ready to start */
            <>
              <Button
                icon="play"
                design="Transparent"
                onClick={handleStartEnrichment}
                disabled={project.status !== 'active'}
                tooltip="Start Image Enrichment"
              />
              <div
                style={{
                  minWidth: '280px',
                  border: '1px solid #0070F2',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  background:
                    'linear-gradient(135deg, rgba(0, 112, 242, 0.08) 0%, rgba(0, 112, 242, 0.03) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <Icon
                  name="play"
                  style={{
                    fontSize: '1.5rem',
                    color: '#0070F2',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#0070F2',
                      }}
                    >
                      Image Enrichment
                    </Text>
                    <div
                      style={{
                        background: '#0070F2',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      READY
                    </div>
                  </div>
                  <Text
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--sapContent_LabelColor)',
                    }}
                  >
                    {project.status === 'active'
                      ? 'Ready to analyze product images with AI'
                      : 'Activate project to start enrichment'}
                  </Text>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          padding: '0 2rem',
          borderBottom: '1px solid var(--sapList_BorderColor)',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: activeTab === tab.id ? '#0070F2' : 'var(--sapContent_LabelColor)',
              fontWeight: activeTab === tab.id ? 600 : 400,
              borderBottom: activeTab === tab.id ? '2px solid #0070F2' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.2s',
            }}
          >
            <Icon
              name={tab.icon}
              style={{
                color: activeTab === tab.id ? '#0070F2' : 'var(--sapContent_LabelColor)',
              }}
            />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1.5rem 2rem' }}>{renderTabContent()}</div>
    </div>
  );
}

export default ProjectHub;
