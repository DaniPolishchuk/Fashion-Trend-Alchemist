import { useState, useEffect, useRef } from 'react';
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
  Dialog,
  Input,
  Panel,
  ObjectStatus,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/download.js';
import '@ui5/webcomponents-icons/dist/zoom-in.js';
import '@ui5/webcomponents-icons/dist/settings.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/edit.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/palette.js';
import '@ui5/webcomponents-icons/dist/hint.js';
import '@ui5/webcomponents-icons/dist/sys-cancel.js';
import '@ui5/webcomponents-icons/dist/synchronize.js';
import '@ui5/webcomponents-icons/dist/customize.js';
import '@ui5/webcomponents-icons/dist/ai.js';
import '@ui5/webcomponents-icons/dist/camera.js';

import SaveToCollectionPopover from '../components/SaveToCollectionPopover';

// Types for multi-image support
type ImageViewStatus = 'pending' | 'generating' | 'completed' | 'failed';
type OverallImageStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'partial';

interface ImageViewData {
  url: string | null;
  status: ImageViewStatus;
}

interface GeneratedImages {
  front: ImageViewData;
  back: ImageViewData;
  model: ImageViewData;
}

interface GeneratedDesign {
  id: string;
  name: string;
  predictedAttributes: Record<string, string> | null;
  inputConstraints: Record<string, string> | null;
  generatedImageUrl: string | null;
  imageGenerationStatus?: OverallImageStatus;
  generatedImages?: GeneratedImages | null;
  createdAt?: string;
}

type ImageView = 'front' | 'back' | 'model';

function DesignDetail() {
  const { projectId, designId } = useParams<{ projectId: string; designId: string }>();
  const navigate = useNavigate();

  // State
  const [design, setDesign] = useState<GeneratedDesign | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<ImageView>('front');
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);
  const [overallStatus, setOverallStatus] = useState<string>('pending');
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Collapsible panel states
  const [predictedPanelCollapsed, setPredictedPanelCollapsed] = useState(false);
  const [givenPanelCollapsed, setGivenPanelCollapsed] = useState(true);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target && (event.target as HTMLElement).tagName === 'INPUT') {
        return; // Don't handle arrow keys when focused on input fields
      }

      const views: ImageView[] = ['front', 'back', 'model'];
      const currentIndex = views.indexOf(selectedView);

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
          setSelectedView(views[prevIndex]);
          break;
        case 'ArrowRight':
          event.preventDefault();
          const nextIndex = currentIndex === views.length - 1 ? 0 : currentIndex + 1;
          setSelectedView(views[nextIndex]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedView]);

  // Fetch design data
  useEffect(() => {
    const fetchDesign = async () => {
      if (!projectId || !designId) {
        setError('Missing project or design ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch project and designs in parallel
        const [projectResponse, designsResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/generated-designs`),
        ]);

        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setProjectName(projectData.name || 'Project');
        }

        if (!designsResponse.ok) {
          throw new Error('Failed to fetch design');
        }

        const designs: GeneratedDesign[] = await designsResponse.json();

        const currentDesign = designs.find((d) => d.id === designId);
        if (!currentDesign) {
          throw new Error('Design not found');
        }

        setDesign(currentDesign);
        setOverallStatus(currentDesign.imageGenerationStatus || 'pending');

        // Initialize generatedImages from design data or create default
        if (currentDesign.generatedImages) {
          setGeneratedImages(currentDesign.generatedImages);
        } else {
          // Legacy: create from single URL
          // Map overall status to individual view status (partial maps to completed for legacy single-image)
          const legacyStatus = currentDesign.imageGenerationStatus;
          const viewStatus: ImageViewStatus =
            legacyStatus === 'partial'
              ? 'completed'
              : ((legacyStatus || 'pending') as ImageViewStatus);

          setGeneratedImages({
            front: {
              url: currentDesign.generatedImageUrl || null,
              status: viewStatus,
            },
            back: { url: null, status: 'pending' },
            model: { url: null, status: 'pending' },
          });
        }
      } catch (err) {
        console.error('Failed to fetch design:', err);
        setError(err instanceof Error ? err.message : 'Failed to load design');
      } finally {
        setLoading(false);
      }
    };

    fetchDesign();
  }, [projectId, designId]);

  // Poll for image status when any view is pending or generating
  useEffect(() => {
    if (!projectId || !designId) return;

    // Check if any view needs polling
    const needsPolling =
      generatedImages &&
      (generatedImages.front.status === 'pending' ||
        generatedImages.front.status === 'generating' ||
        generatedImages.back.status === 'pending' ||
        generatedImages.back.status === 'generating' ||
        generatedImages.model.status === 'pending' ||
        generatedImages.model.status === 'generating');

    if (!needsPolling) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const pollImageStatus = async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/generated-designs/${designId}/image-status`
        );
        if (response.ok) {
          const data = await response.json();
          setOverallStatus(data.status);
          if (data.generatedImages) {
            setGeneratedImages(data.generatedImages);
          }
        }
      } catch (err) {
        console.error('Failed to poll image status:', err);
      }
    };

    // Poll every 3 seconds
    pollingRef.current = setInterval(pollImageStatus, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [projectId, designId, generatedImages]);

  // Handle save success
  const handleSaveSuccess = (collectionName: string) => {
    console.log(`Successfully saved to collection: ${collectionName}`);
    // TODO: Show toast notification
  };

  // Handle name editing
  const handleStartEditName = () => {
    if (design) {
      setEditedName(design.name);
      setIsEditingName(true);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSaveName = async () => {
    if (!projectId || !designId || !editedName.trim()) return;

    try {
      setSavingName(true);
      const response = await fetch(`/api/projects/${projectId}/generated-designs/${designId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update name');
      }

      setDesign((prev) => (prev ? { ...prev, name: editedName.trim() } : prev));
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setSavingName(false);
    }
  };

  // Handle magic name generation
  const handleGenerateName = async () => {
    if (!design) return;
    setIsGeneratingName(true);
    try {
      const response = await fetch('/api/generate-design-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType:
            (design.inputConstraints as any)?.article_product_type ||
            (design.inputConstraints as any)?.product_type ||
            'clothing',
          lockedAttributes: design.inputConstraints || {},
          predictedAttributes: design.predictedAttributes || {},
        }),
      });
      if (response.ok) {
        const { suggestedName } = await response.json();
        setEditedName(suggestedName);
        setIsEditingName(true);
      }
    } catch (error) {
      console.error('Failed to generate name:', error);
    } finally {
      setIsGeneratingName(false);
    }
  };

  // Handle image download
  const handleDownloadImage = async (view: ImageView) => {
    const img = generatedImages?.[view];
    if (!img?.url) return;

    try {
      // Fetch the image
      const response = await fetch(img.url);
      const blob = await response.blob();

      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${design?.name || 'design'}_${view}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  // Handle refine design
  const handleRefineDesign = () => {
    if (!design || !projectId) return;
    navigate(`/project/${projectId}?tab=alchemist&refineFrom=${design.id}`);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Get current view image
  const currentViewImage = generatedImages?.[selectedView];

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

  if (error || !design) {
    return (
      <div style={{ padding: '2rem' }}>
        <IllustratedMessage
          name="NoData"
          titleText="Error Loading Design"
          subtitleText={error || 'Design not found'}
        >
          <Button design="Emphasized" onClick={() => navigate(`/project/${projectId}`)}>
            Back to Project
          </Button>
        </IllustratedMessage>
      </div>
    );
  }

  const predictedAttributes = design.predictedAttributes || {};
  const inputConstraints = design.inputConstraints || {};

  // Filter out internal keys
  const filteredPredicted = Object.entries(predictedAttributes).filter(
    ([key]) => !key.startsWith('_')
  );
  const filteredConstraints = Object.entries(inputConstraints).filter(
    ([key]) => !key.startsWith('_')
  );

  return (
    <div style={{ background: 'var(--sapBackgroundColor)', minHeight: 'calc(100vh - 44px)' }}>
      {/* Breadcrumbs */}
      <div style={{ padding: '12px 2rem 0' }}>
        <Breadcrumbs
          onItemClick={(e: any) => {
            const text = e.detail.item.textContent?.trim();
            if (text === 'Home') {
              navigate('/');
            } else if (text === projectName) {
              navigate(`/project/${projectId}`);
            }
          }}
        >
          <BreadcrumbsItem>Home</BreadcrumbsItem>
          <BreadcrumbsItem>{projectName}</BreadcrumbsItem>
          <BreadcrumbsItem>{design.name}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* Page Header */}
      <div
        style={{
          padding: '1rem 2rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--sapList_BorderColor)',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            {isEditingName ? (
              <>
                <Input
                  value={editedName}
                  onInput={(e: any) => setEditedName(e.target.value)}
                  style={{ width: '300px' }}
                  disabled={savingName}
                />
                <Button
                  icon="accept"
                  design="Positive"
                  tooltip="Save name"
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                />
                <Button
                  icon="decline"
                  design="Negative"
                  tooltip="Cancel"
                  onClick={handleCancelEditName}
                  disabled={savingName}
                />
              </>
            ) : (
              <>
                <Title level="H2" style={{ margin: 0, fontSize: '30px' }}>
                  {design.name}
                </Title>
                <Button
                  icon="edit"
                  design="Transparent"
                  tooltip="Edit name"
                  onClick={handleStartEditName}
                />
                <Button
                  icon="ai"
                  design="Transparent"
                  tooltip="Generate creative name with AI"
                  onClick={handleGenerateName}
                  disabled={isGeneratingName}
                />
                {/* Status Badge */}
                <div style={{ padding: '0.125rem' }}>
                  <ObjectStatus
                    state={
                      overallStatus === 'completed'
                        ? 'Positive'
                        : overallStatus === 'failed'
                          ? 'Negative'
                          : overallStatus === 'partial'
                            ? 'Critical'
                            : 'Information'
                    }
                    inverted
                  >
                    {overallStatus === 'partial' ? 'PARTIAL' : overallStatus.toUpperCase()}
                  </ObjectStatus>
                </div>
              </>
            )}
          </div>
          {design.createdAt && (
            <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.75rem' }}>
              Created {formatDate(design.createdAt)}
            </Text>
          )}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '320px 1fr',
          gap: '1.5rem',
          padding: window.innerWidth < 768 ? '0 1rem 5rem' : '0 2rem 5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column - Collapsible Attribute Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Predicted Attributes Panel - Enhanced with AI styling */}
          <Panel
            header={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0',
                }}
              >
                <Icon
                  name="ai"
                  style={{
                    color: '#E9730C',
                    fontSize: '1.125rem',
                  }}
                />
                <Text
                  style={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.8125rem',
                    letterSpacing: '0.5px',
                    color: '#E9730C',
                  }}
                >
                  Predicted Attributes ({filteredPredicted.length})
                </Text>
              </div>
            }
            collapsed={predictedPanelCollapsed}
            onToggle={() => setPredictedPanelCollapsed(!predictedPanelCollapsed)}
            style={{
              background:
                'linear-gradient(135deg, rgba(233, 115, 12, 0.04) 0%, rgba(233, 115, 12, 0.01) 100%)',
              border: '1px solid rgba(233, 115, 12, 0.3)',
              borderRadius: '0.5rem',
              boxShadow: '0 2px 6px rgba(233, 115, 12, 0.08)',
              transition: 'all 0.2s',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.5rem 1rem' }}>
              {filteredPredicted.length > 0 ? (
                filteredPredicted.map(([key, value], index) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0.75rem',
                      borderBottom:
                        index < filteredPredicted.length - 1
                          ? '1px solid rgba(233, 115, 12, 0.1)'
                          : 'none',
                      borderRadius: '0.25rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(233, 115, 12, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--sapContent_LabelColor)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {key.replace(/^(article_|ontology_\w+_)/, '').replace(/_/g, ' ')}
                    </Text>
                    <Text
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#E9730C',
                      }}
                    >
                      {String(value)}
                    </Text>
                  </div>
                ))
              ) : (
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                  No predicted attributes
                </Text>
              )}
            </div>
          </Panel>

          {/* Given Attributes Panel - Enhanced with subtle styling */}
          <Panel
            header={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0',
                }}
              >
                <Icon
                  name="locked"
                  style={{
                    color: 'var(--sapContent_LabelColor)',
                    fontSize: '1.125rem',
                  }}
                />
                <Text
                  style={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.8125rem',
                    letterSpacing: '0.5px',
                    color: 'var(--sapContent_LabelColor)',
                  }}
                >
                  Given Attributes ({filteredConstraints.length})
                </Text>
              </div>
            }
            collapsed={givenPanelCollapsed}
            onToggle={() => setGivenPanelCollapsed(!givenPanelCollapsed)}
            style={{
              background: 'var(--sapTile_Background)',
              border: '1px solid var(--sapList_BorderColor)',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ padding: '0.5rem 1rem' }}>
              {filteredConstraints.length > 0 ? (
                filteredConstraints.map(([key, value], index) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0.75rem',
                      borderBottom:
                        index < filteredConstraints.length - 1
                          ? '1px solid var(--sapList_BorderColor)'
                          : 'none',
                      borderRadius: '0.25rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--sapList_Hover_Background)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--sapContent_LabelColor)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {key.replace(/^(article_|ontology_\w+_)/, '').replace(/_/g, ' ')}
                    </Text>
                    <Text
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--sapTextColor)',
                      }}
                    >
                      {String(value)}
                    </Text>
                  </div>
                ))
              ) : (
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                  No given attributes
                </Text>
              )}
            </div>
          </Panel>
        </div>

        {/* Right Column - Image Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Image Gallery Container - Horizontal Layout */}
          <div
            style={{
              background: 'var(--sapTile_Background)',
              borderRadius: '0.5rem',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              gap: window.innerWidth < 768 ? '1.5rem' : '1rem',
              alignItems: window.innerWidth < 768 ? 'center' : 'flex-start',
            }}
          >
            {/* Thumbnail Column (Desktop) / Row (Mobile) */}
            <div
              style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'row' : 'column',
                gap: '0.75rem',
                justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start',
                flexShrink: 0,
                order: window.innerWidth < 768 ? 2 : 1,
              }}
            >
              {(['front', 'back', 'model'] as const).map((view) => {
                const img = generatedImages?.[view];
                const isSelected = selectedView === view;
                return (
                  <div
                    key={view}
                    onClick={() => setSelectedView(view)}
                    style={{
                      width: window.innerWidth < 768 ? '80px' : '100px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = isSelected ? 'scale(1.05)' : 'scale(1)';
                    }}
                  >
                    <div
                      style={{
                        width: window.innerWidth < 768 ? '80px' : '100px',
                        height: window.innerWidth < 768 ? '80px' : '100px',
                        borderRadius: '0.375rem',
                        border: `2px solid ${
                          isSelected ? 'var(--sapSelectedColor)' : 'var(--sapList_BorderColor)'
                        }`,
                        boxShadow: isSelected
                          ? '0 0 0 1px var(--sapSelectedColor), 0 2px 8px rgba(0, 0, 0, 0.12)'
                          : '0 1px 3px rgba(0, 0, 0, 0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8f8f8',
                        padding: '0.375rem',
                      }}
                    >
                      {img?.status === 'completed' && img.url ? (
                        <img
                          src={img.url}
                          alt={view}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '0.125rem',
                          }}
                        />
                      ) : img?.status === 'generating' ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <BusyIndicator active size="S" />
                        </div>
                      ) : img?.status === 'failed' ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon
                            name="sys-cancel"
                            style={{ color: 'var(--sapNegativeColor)', fontSize: '1.5rem' }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--sapContent_LabelColor)',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Icon name="camera" style={{ fontSize: '1.25rem' }} />
                        </div>
                      )}
                    </div>
                    <Text
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        marginTop: '0.5rem',
                        fontSize: window.innerWidth < 768 ? '0.6875rem' : '0.75rem',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected
                          ? 'var(--sapSelectedColor)'
                          : 'var(--sapContent_LabelColor)',
                      }}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </Text>
                  </div>
                );
              })}
            </div>

            {/* Main Image Container */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                order: window.innerWidth < 768 ? 1 : 2,
              }}
            >
              {/* Image Stage Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth:
                    window.innerWidth < 768
                      ? '400px'
                      : window.innerWidth < 1024
                        ? '480px'
                        : '520px',
                  aspectRatio: '1/1',
                  background: '#f8f8f8',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--sapList_BorderColor)',
                  padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Navigation Arrows */}
                {generatedImages && (
                  <>
                    <Button
                      icon="navigation-left-arrow"
                      design="Transparent"
                      tooltip="Previous view"
                      onClick={() => {
                        const views: ImageView[] = ['front', 'back', 'model'];
                        const currentIndex = views.indexOf(selectedView);
                        const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
                        setSelectedView(views[prevIndex]);
                      }}
                      style={{
                        position: 'absolute',
                        left: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <Button
                      icon="navigation-right-arrow"
                      design="Transparent"
                      tooltip="Next view"
                      onClick={() => {
                        const views: ImageView[] = ['front', 'back', 'model'];
                        const currentIndex = views.indexOf(selectedView);
                        const nextIndex = currentIndex === views.length - 1 ? 0 : currentIndex + 1;
                        setSelectedView(views[nextIndex]);
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  </>
                )}

                {/* View Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 3,
                    padding: '2px', // Adds breathing room
                  }}
                >
                  <ObjectStatus state="Information" inverted>
                    {selectedView.toUpperCase()} VIEW
                  </ObjectStatus>
                </div>

                {/* Image action toolbar */}
                {currentViewImage?.status === 'completed' && currentViewImage.url && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      zIndex: 3,
                      display: 'flex',
                      gap: '0.375rem',
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '0.375rem',
                      padding: '0.25rem',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Button
                      icon="zoom-in"
                      design="Transparent"
                      tooltip="View full size"
                      onClick={() => setImageModalOpen(true)}
                    />
                    <Button
                      icon="download"
                      design="Transparent"
                      tooltip={`Download ${selectedView} view`}
                      onClick={() => handleDownloadImage(selectedView)}
                    />
                  </div>
                )}

                {/* Image or Status */}
                {currentViewImage?.status === 'completed' && currentViewImage.url ? (
                  <img
                    src={currentViewImage.url}
                    alt={`${design.name} - ${selectedView} view`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : currentViewImage?.status === 'pending' ||
                  currentViewImage?.status === 'generating' ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem',
                    }}
                  >
                    <BusyIndicator active size="L" />
                    <Text style={{ color: 'var(--sapContent_LabelColor)', textAlign: 'center' }}>
                      {currentViewImage?.status === 'pending'
                        ? `Waiting to generate ${selectedView} view...`
                        : `Generating ${selectedView} view...`}
                    </Text>
                  </div>
                ) : currentViewImage?.status === 'failed' ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Icon
                      name="sys-cancel"
                      style={{ color: 'var(--sapNegativeColor)', fontSize: '2rem' }}
                    />
                    <Text style={{ color: 'var(--sapNegativeColor)', textAlign: 'center' }}>
                      {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} view generation
                      failed
                    </Text>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: 'var(--sapContent_LabelColor)' }}>
                      No image available
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--sapPageFooter_Background, var(--sapBackgroundColor))',
          borderTop: '1px solid var(--sapPageFooter_BorderColor, var(--sapList_BorderColor))',
          padding: '0.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.05)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="hint" style={{ color: 'var(--sapContent_IconColor)' }} />
          <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
            Select a view above to preview different angles of your design.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button icon="synchronize" design="Default" onClick={handleRefineDesign}>
            Refine Design
          </Button>
          <Button
            id="save-to-collection-btn"
            design="Emphasized"
            onClick={() => setSavePopoverOpen(true)}
          >
            Save to Collection
          </Button>
        </div>
      </div>

      {/* Save to Collection Popover */}
      {designId && (
        <SaveToCollectionPopover
          open={savePopoverOpen}
          opener="save-to-collection-btn"
          designId={designId}
          onClose={() => setSavePopoverOpen(false)}
          onSaved={handleSaveSuccess}
        />
      )}

      {/* Image Zoom Modal */}
      <Dialog
        open={imageModalOpen}
        headerText={`${design.name} - ${selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} View`}
        onClose={() => setImageModalOpen(false)}
        style={{ width: '90vw', height: '90vh' }}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon="download" onClick={() => handleDownloadImage(selectedView)}>
              Download
            </Button>
            <Button design="Emphasized" onClick={() => setImageModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {currentViewImage?.url && (
          <div
            style={{
              width: '100%',
              height: 'calc(90vh - 120px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8f8f8',
              borderRadius: '0.375rem',
            }}
          >
            <img
              src={currentViewImage.url}
              alt={`${design.name} - ${selectedView} view`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default DesignDetail;
