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
  Card,
  Dialog,
  Select,
  Option,
  Input,
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

interface GeneratedDesign {
  id: string;
  name: string;
  predictedAttributes: Record<string, string> | null;
  inputConstraints: Record<string, string> | null;
  generatedImageUrl: string | null;
}

interface Collection {
  id: string;
  name: string;
}

function DesignDetail() {
  const { projectId, designId } = useParams<{ projectId: string; designId: string }>();
  const navigate = useNavigate();

  // State
  const [design, setDesign] = useState<GeneratedDesign | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // For now, we'll show a single image; in future could support multiple variations
  const imageVariations = design?.generatedImageUrl ? [design.generatedImageUrl] : [];
  const totalVariations = imageVariations.length || 1;

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
      } catch (err) {
        console.error('Failed to fetch design:', err);
        setError(err instanceof Error ? err.message : 'Failed to load design');
      } finally {
        setLoading(false);
      }
    };

    fetchDesign();
  }, [projectId, designId]);

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

  // Image navigation (for variations)
  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < totalVariations - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

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
      // Could show a success toast here
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

      // Update local state
      setDesign((prev) => (prev ? { ...prev, name: editedName.trim() } : prev));
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setSavingName(false);
    }
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

  if (error || !design) {
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
            titleText="Error Loading Design"
            subtitleText={error || 'Design not found'}
          >
            <Button design="Emphasized" onClick={() => navigate(`/project/${projectId}`)}>
              Back to Project
            </Button>
          </IllustratedMessage>
        </div>
      </>
    );
  }

  // Extract predicted attributes
  const predictedAttributes = design.predictedAttributes || {};
  const inputConstraints = design.inputConstraints || {};

  return (
    <div style={{ background: 'var(--sapBackgroundColor)', minHeight: '100vh' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isEditingName ? (
              <>
                <Input
                  value={editedName}
                  onInput={(e: any) => setEditedName(e.target.value)}
                  style={{ width: '250px' }}
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
                <Text style={{ fontSize: '1rem', fontWeight: 500 }}>{design.name}</Text>
                <Button
                  icon="edit"
                  design="Transparent"
                  tooltip="Edit name"
                  onClick={handleStartEditName}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          padding: '0 2rem',
        }}
      >
        {/* Left Column - Attributes (Two Sub-columns) */}
        <div
          style={{
            height: '50%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          {/* Predicted Attributes */}
          <div
            style={{
              height: '100%',
              background: 'var(--sapTile_Background)',
              borderRadius: '0.5rem',
              boxShadow: 'var(--sapContent_Shadow0)',
              border: '1px solid var(--sapTile_BorderColor)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header with sparkle icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                borderBottom: '1px solid var(--sapList_BorderColor)',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>✨</span>
              <Text style={{ fontWeight: 600, fontSize: '1rem' }}>Predicted Attributes</Text>
            </div>

            {/* Attribute Cards - Scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {Object.keys(predictedAttributes).length > 0 ? (
                Object.entries(predictedAttributes).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      border: '1px solid var(--sapList_BorderColor)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--sapList_Background)',
                      flexShrink: 0,
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
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Icon
                        name={getAttributeIcon(key)}
                        style={{ color: 'var(--sapContent_IconColor)', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Text
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#0070F2',
                        }}
                      >
                        {String(value)}
                      </Text>
                    </div>
                  </div>
                ))
              ) : (
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                  No predicted attributes
                </Text>
              )}
            </div>
          </div>

          {/* Given Attributes (Input Constraints) */}
          <div
            style={{
              height: '100%',
              background: 'var(--sapTile_Background)',
              borderRadius: '0.5rem',
              boxShadow: 'var(--sapContent_Shadow0)',
              border: '1px solid var(--sapTile_BorderColor)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header with lock icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                borderBottom: '1px solid var(--sapList_BorderColor)',
                flexShrink: 0,
              }}
            >
              <Icon name="locked" style={{ color: 'var(--sapContent_IconColor)' }} />
              <Text style={{ fontWeight: 600, fontSize: '1rem' }}>Given Attributes</Text>
            </div>

            {/* Attribute Cards - Scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {Object.keys(inputConstraints).length > 0 ? (
                Object.entries(inputConstraints).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      border: '1px solid var(--sapList_BorderColor)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--sapList_Background)',
                      flexShrink: 0,
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
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Icon
                        name={getAttributeIcon(key)}
                        style={{ color: 'var(--sapContent_IconColor)', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Text
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: 'var(--sapTextColor)',
                        }}
                      >
                        {String(value)}
                      </Text>
                    </div>
                  </div>
                ))
              ) : (
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                  No given attributes
                </Text>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Image Gallery */}
        <div style={{ position: 'relative', height: '50%' }}>
          {/* Variation Badge */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              zIndex: 10,
              background: '#107c10',
              color: 'white',
              padding: '0.375rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            VARIATION {currentImageIndex + 1} OF {totalVariations}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <Button
              icon="zoom-in"
              design="Default"
              style={{
                borderRadius: '0.5rem',
                width: '40px',
                height: '40px',
              }}
              tooltip="Zoom in"
            />
            <Button
              icon="download"
              design="Default"
              style={{
                borderRadius: '0.5rem',
                width: '40px',
                height: '40px',
              }}
              tooltip="Download image"
            />
          </div>

          {/* Image Container */}
          <Card
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Navigation Arrows */}
            {totalVariations > 1 && (
              <>
                <Button
                  icon="navigation-left-arrow"
                  design="Transparent"
                  disabled={currentImageIndex === 0}
                  onClick={handlePreviousImage}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 5,
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '50%',
                  }}
                />
                <Button
                  icon="navigation-right-arrow"
                  design="Transparent"
                  disabled={currentImageIndex === totalVariations - 1}
                  onClick={handleNextImage}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 5,
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '50%',
                  }}
                />
              </>
            )}

            {/* Image or Placeholder */}
            {design.generatedImageUrl ? (
              <img
                src={design.generatedImageUrl}
                alt={design.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
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

            {/* Pagination Dots */}
            {totalVariations > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                {Array.from({ length: totalVariations }).map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: idx === currentImageIndex ? '#0070F2' : '#C4C6C8',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
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
            Select a variation to refine further or save to your collection.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button icon="settings" design="Default">
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
    </div>
  );
}

export default DesignDetail;
