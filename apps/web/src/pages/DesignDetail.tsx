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
  Card,
  Dialog,
  Select,
  Option,
  Input,
  Panel,
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

interface Collection {
  id: string;
  name: string;
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
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [saving, setSaving] = useState(false);
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
            legacyStatus === 'partial' ? 'completed' : (legacyStatus || 'pending') as ImageViewStatus;

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

  // Fetch collections for save dialog
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections');
        if (response.ok) {
          const data = await response.json();
          setCollections(data);
        }
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      }
    };

    fetchCollections();
  }, []);

  // Handle save to collection
  const handleSaveToCollection = async () => {
    if (!selectedCollectionId || !designId) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/collections/${selectedCollectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedDesignId: designId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save to collection');
      }

      setSaveDialogOpen(false);
    } catch (err) {
      console.error('Failed to save to collection:', err);
    } finally {
      setSaving(false);
    }
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

  // Get attribute icon
  const getAttributeIcon = (key: string): string => {
    const iconMap: Record<string, string> = {
      fabric: 'hint',
      color: 'palette',
      style: 'settings',
      pattern: 'hint',
      fit: 'hint',
    };
    const lowerKey = key.toLowerCase();
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (lowerKey.includes(keyword)) return icon;
    }
    return 'hint';
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
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <Title level="H2" style={{ marginBottom: '0.5rem' }}>
            Predicted Successful Design
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
                <Text style={{ fontSize: '1.125rem', fontWeight: 500 }}>{design.name}</Text>
                <Button
                  icon="edit"
                  design="Transparent"
                  tooltip="Edit name"
                  onClick={handleStartEditName}
                />
                <Button
                  design="Transparent"
                  tooltip="Generate creative name with AI"
                  onClick={handleGenerateName}
                  disabled={isGeneratingName}
                >
                  {isGeneratingName ? (
                    <BusyIndicator active size="S" />
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '1rem' }}>✨</span>
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
          {design.createdAt && (
            <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.8125rem' }}>
              Created: {formatDate(design.createdAt)}
            </Text>
          )}
        </div>
        {/* Status Badge */}
        <div
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            background:
              overallStatus === 'completed'
                ? 'rgba(16, 126, 62, 0.1)'
                : overallStatus === 'failed'
                  ? 'rgba(187, 0, 0, 0.1)'
                  : overallStatus === 'partial'
                    ? 'rgba(233, 115, 12, 0.1)'
                    : 'rgba(0, 112, 242, 0.1)',
            color:
              overallStatus === 'completed'
                ? '#107E3E'
                : overallStatus === 'failed'
                  ? '#BB0000'
                  : overallStatus === 'partial'
                    ? '#E9730C'
                    : '#0070F2',
          }}
        >
          {overallStatus === 'partial' ? 'Partially Generated' : overallStatus}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: '1.5rem',
          padding: '0 2rem',
          paddingBottom: '5rem',
        }}
      >
        {/* Left Column - Collapsible Attribute Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Predicted Attributes Panel */}
          <Panel
            headerText={`✨ Predicted Attributes (${filteredPredicted.length})`}
            collapsed={predictedPanelCollapsed}
            onToggle={() => setPredictedPanelCollapsed(!predictedPanelCollapsed)}
            style={{ background: 'var(--sapTile_Background)' }}
          >
            <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredPredicted.length > 0 ? (
                filteredPredicted.map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      border: '1px solid var(--sapList_BorderColor)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--sapList_Background)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--sapContent_LabelColor)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {key.replace(/^(article_|ontology_\w+_)/, '').replace(/_/g, ' ')}
                      </Text>
                      <Icon
                        name={getAttributeIcon(key)}
                        style={{ color: 'var(--sapContent_IconColor)', fontSize: '0.875rem' }}
                      />
                    </div>
                    <Text style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0070F2' }}>
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

          {/* Given Attributes Panel */}
          <Panel
            headerText={`🔒 Given Attributes (${filteredConstraints.length})`}
            collapsed={givenPanelCollapsed}
            onToggle={() => setGivenPanelCollapsed(!givenPanelCollapsed)}
            style={{ background: 'var(--sapTile_Background)' }}
          >
            <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredConstraints.length > 0 ? (
                filteredConstraints.map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      border: '1px solid var(--sapList_BorderColor)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--sapList_Background)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--sapContent_LabelColor)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {key.replace(/^(article_|ontology_\w+_)/, '').replace(/_/g, ' ')}
                      </Text>
                      <Icon
                        name={getAttributeIcon(key)}
                        style={{ color: 'var(--sapContent_IconColor)', fontSize: '0.875rem' }}
                      />
                    </div>
                    <Text style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{String(value)}</Text>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Image Display */}
          <Card
            style={{
              height: '450px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Download button in top-right */}
            {currentViewImage?.status === 'completed' && currentViewImage.url && (
              <Button
                icon="download"
                design="Transparent"
                tooltip={`Download ${selectedView} view`}
                onClick={() => handleDownloadImage(selectedView)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  zIndex: 5,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                }}
              />
            )}

            {/* Zoom button */}
            {currentViewImage?.status === 'completed' && currentViewImage.url && (
              <Button
                icon="zoom-in"
                design="Transparent"
                tooltip="View full size"
                onClick={() => setImageModalOpen(true)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '3rem',
                  zIndex: 5,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                }}
              />
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
            ) : currentViewImage?.status === 'pending' || currentViewImage?.status === 'generating' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                  gap: '1rem',
                }}
              >
                <BusyIndicator active size="L" />
                <Text style={{ color: 'var(--sapContent_LabelColor)' }}>
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
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                  gap: '0.5rem',
                }}
              >
                <Icon name="sys-cancel" style={{ color: 'var(--sapNegativeColor)', fontSize: '2rem' }} />
                <Text style={{ color: 'var(--sapNegativeColor)' }}>
                  {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} view generation failed
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
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                }}
              >
                <Text style={{ color: 'var(--sapContent_LabelColor)' }}>No image available</Text>
              </div>
            )}
          </Card>

          {/* Thumbnail Strip */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {(['front', 'back', 'model'] as const).map((view) => {
              const img = generatedImages?.[view];
              const isSelected = selectedView === view;
              return (
                <div
                  key={view}
                  onClick={() => setSelectedView(view)}
                  style={{
                    width: '100px',
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0.7,
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '0.5rem',
                      border: `2px solid ${isSelected ? '#0070F2' : 'var(--sapList_BorderColor)'}`,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--sapBackgroundColor)',
                    }}
                  >
                    {img?.status === 'completed' && img.url ? (
                      <img
                        src={img.url}
                        alt={view}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : img?.status === 'generating' ? (
                      <BusyIndicator active size="S" />
                    ) : img?.status === 'failed' ? (
                      <Icon name="sys-cancel" style={{ color: 'var(--sapNegativeColor)' }} />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                        }}
                      />
                    )}
                  </div>
                  <Text
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      marginTop: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#0070F2' : 'var(--sapContent_LabelColor)',
                    }}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </Text>
                </div>
              );
            })}
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
          background: 'var(--sapBackgroundColor)',
          borderTop: '1px solid var(--sapList_BorderColor)',
          padding: '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
          <Button design="Emphasized" onClick={() => setSaveDialogOpen(true)}>
            Save to Collection
          </Button>
        </div>
      </div>

      {/* Save to Collection Dialog */}
      <Dialog
        open={saveDialogOpen}
        headerText="Save to Collection"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={() => setSaveDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              design="Emphasized"
              onClick={handleSaveToCollection}
              disabled={!selectedCollectionId || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '1rem 0' }}>
          <Text style={{ display: 'block', marginBottom: '0.5rem' }}>Select a collection:</Text>
          <Select
            style={{ width: '100%' }}
            onChange={(e: any) =>
              setSelectedCollectionId(e.detail.selectedOption?.dataset?.id || '')
            }
          >
            <Option>Select a collection...</Option>
            {collections.map((collection) => (
              <Option key={collection.id} data-id={collection.id}>
                {collection.name}
              </Option>
            ))}
          </Select>
        </div>
      </Dialog>

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
              background: '#f5f5f5',
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
