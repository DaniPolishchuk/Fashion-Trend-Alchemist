import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShellBar,
  BusyIndicator,
  IllustratedMessage,
  Text,
  Button,
  Title,
  Avatar,
  Icon,
  Breadcrumbs,
  BreadcrumbsItem,
  ObjectStatus,
  ProgressIndicator,
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
}

function ProjectHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // State
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('alchemist');

  // Dummy progress state
  const [imageDescriptionProgress] = useState(85);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError('No project ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const data = await response.json();
        setProject(data);
      } catch (err) {
        console.error('Failed to fetch project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

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
        return <EnhancedTableTab />;
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
      <>
        <ShellBar
          primaryTitle="The Fashion Trend Alchemist"
          showNotifications
          showProductSwitch={false}
        />
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
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <ShellBar
          primaryTitle="The Fashion Trend Alchemist"
          showNotifications
          showProductSwitch={false}
        />
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
      </>
    );
  }

  return (
    <div
      style={{ background: 'var(--sapBackgroundColor)', minHeight: '100vh', paddingBottom: '2rem' }}
    >
      <ShellBar
        primaryTitle="The Fashion Trend Alchemist"
        profile={
          <Avatar icon="employee" size="XS" style={{ background: 'var(--sapAccentColor1)' }} />
        }
      />

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Title level="H2">{project.name}</Title>
            <ObjectStatus
              state={project.status === 'active' ? 'Positive' : 'Information'}
              inverted
            >
              {project.status === 'active' ? 'ACTIVE' : 'DRAFT'}
            </ObjectStatus>
          </div>
          <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
            Created by User • Last modified recently
          </Text>
        </div>

        {/* Right: Progress Indicator */}
        <div
          style={{
            border: '1px solid var(--sapList_BorderColor)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'var(--sapList_Background)',
            minWidth: '200px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Text style={{ fontSize: '0.875rem' }}>Image Description</Text>
            <Text style={{ fontSize: '0.875rem', color: '#0070F2', fontWeight: 600 }}>
              {imageDescriptionProgress}%
            </Text>
          </div>
          <ProgressIndicator
            value={imageDescriptionProgress}
            valueState="Information"
            style={{ width: '100%' }}
          />
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
