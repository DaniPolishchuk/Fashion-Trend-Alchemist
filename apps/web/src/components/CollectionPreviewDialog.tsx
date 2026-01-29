import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  Title,
  Text,
  Button,
  BusyIndicator,
  IllustratedMessage,
  Icon,
  MessageStrip,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';

import { api } from '../services/api';
import { fetchAPI } from '../services/api/client';

interface Design {
  id: string;
  name: string;
  projectId: string;
  generatedImageUrl: string | null;
  generatedImages?: {
    front: { url: string | null; status: string };
    back: { url: string | null; status: string };
    model: { url: string | null; status: string };
  } | null;
  predictedAttributes: Record<string, unknown> | null;
  inputConstraints: Record<string, unknown> | null;
  createdAt: string;
}

interface CollectionDetail {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  designs: Design[];
}

interface CollectionPreviewDialogProps {
  open: boolean;
  collectionId: string | null;
  onClose: () => void;
  onCollectionUpdated?: () => void; // Callback to refresh parent collection list
}

function CollectionPreviewDialog({
  open,
  collectionId,
  onClose,
  onCollectionUpdated,
}: CollectionPreviewDialogProps) {
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingDesignId, setRemovingDesignId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Fetch collection details when dialog opens
  useEffect(() => {
    if (open && collectionId) {
      fetchCollectionDetails();
    } else {
      // Reset state when dialog closes
      setCollection(null);
      setError(null);
    }
  }, [open, collectionId]);

  const fetchCollectionDetails = async () => {
    if (!collectionId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await fetchAPI<CollectionDetail>(`/api/collections/${collectionId}`);

      if (result.error) {
        if (result.error.includes('404')) {
          throw new Error('Collection not found');
        }
        throw new Error(result.error);
      }

      setCollection(result.data!);
    } catch (err) {
      console.error('Failed to fetch collection details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleDesignClick = (design: Design) => {
    // Close dialog first, then navigate
    onClose();
    // Navigate to design detail page with proper project and design IDs
    navigate(`/project/${design.projectId}/design/${design.id}`);
  };

  const getDesignImageUrl = (design: Design): string | null => {
    // Try new multi-image format first
    if (design.generatedImages) {
      const frontImage = design.generatedImages.front;
      if (frontImage.status === 'completed' && frontImage.url) {
        return frontImage.url;
      }
    }
    // Fall back to legacy single image
    return design.generatedImageUrl;
  };

  const handleRemoveDesign = async (designId: string) => {
    if (!collectionId || removingDesignId) return;

    try {
      setRemovingDesignId(designId);
      setRemoveError(null);

      const result = await api.collections.removeDesign(collectionId, designId);

      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state - remove the design from the collection
      setCollection((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          designs: prev.designs.filter((d) => d.id !== designId),
          itemCount: prev.itemCount - 1,
        };
      });

      // Notify parent to refresh collection list
      if (onCollectionUpdated) {
        onCollectionUpdated();
      }
    } catch (err) {
      console.error('Failed to remove design from collection:', err);
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove design');
      // Clear error after 5 seconds
      setTimeout(() => setRemoveError(null), 5000);
    } finally {
      setRemovingDesignId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <Dialog
      open={open}
      headerText={
        collection ? `${collection.name} (${collection.itemCount} items)` : 'Collection Details'
      }
      onClose={onClose}
      style={{
        width: '90vw',
        maxWidth: '1200px',
        height: '80vh',
      }}
      footer={
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Button design="Emphasized" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div style={{ padding: '1rem', height: 'calc(80vh - 120px)', overflow: 'auto' }}>
        {/* Remove error message */}
        {removeError && (
          <div style={{ marginBottom: '1rem' }}>
            <MessageStrip design="Negative" hideCloseButton>
              {removeError}
            </MessageStrip>
          </div>
        )}
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <BusyIndicator active size="L" />
          </div>
        )}

        {error && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IllustratedMessage
              name="NoData"
              titleText="Error Loading Collection"
              subtitleText={error}
            >
              <Button design="Emphasized" onClick={fetchCollectionDetails}>
                Try Again
              </Button>
            </IllustratedMessage>
          </div>
        )}

        {collection && !loading && !error && (
          <>
            {/* Collection metadata */}
            <div
              style={{
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--sapList_BorderColor)',
              }}
            >
              <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                Created on {formatDate(collection.createdAt)}
              </Text>
            </div>

            {/* Designs grid */}
            {collection.designs.length === 0 ? (
              <div
                style={{
                  height: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IllustratedMessage
                  name="NoData"
                  titleText="No Designs Yet"
                  subtitleText="This collection is empty. Add some designs to get started!"
                />
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {collection.designs.map((design) => {
                  const imageUrl = getDesignImageUrl(design);
                  return (
                    <div
                      key={design.id}
                      style={{
                        position: 'relative',
                        border: '1px solid var(--sapList_BorderColor)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        backgroundColor: 'var(--sapTile_Background)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Remove button */}
                      <Button
                        icon="decline"
                        design="Transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDesign(design.id);
                        }}
                        tooltip="Remove from collection"
                        disabled={removingDesignId === design.id}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          zIndex: 2,
                          background: 'rgba(255, 255, 255, 0.95)',
                          color: 'var(--sapNegativeColor)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          opacity: 0.8,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e: any) => {
                          e.target.style.opacity = '1';
                        }}
                        onMouseLeave={(e: any) => {
                          e.target.style.opacity = '0.8';
                        }}
                      />

                      {/* Design image - clickable area */}
                      <div onClick={() => handleDesignClick(design)} style={{ cursor: 'pointer' }}>
                        {/* Design image */}
                        <div
                          style={{
                            aspectRatio: '1',
                            backgroundColor: '#f8f8f8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={design.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const placeholder = document.createElement('div');
                                  placeholder.innerHTML =
                                    '<ui5-icon name="product" style="font-size: 2rem; color: var(--sapContent_IconColor);"></ui5-icon>';
                                  placeholder.style.display = 'flex';
                                  placeholder.style.alignItems = 'center';
                                  placeholder.style.justifyContent = 'center';
                                  placeholder.style.width = '100%';
                                  placeholder.style.height = '100%';
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          ) : (
                            <Icon
                              name="product"
                              style={{ color: 'var(--sapContent_IconColor)', fontSize: '2rem' }}
                            />
                          )}
                        </div>

                        {/* Design info */}
                        <div style={{ padding: '0.75rem' }}>
                          <Title
                            level="H6"
                            style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}
                          >
                            {design.name}
                          </Title>
                          <Text
                            style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}
                          >
                            {formatDate(design.createdAt)}
                          </Text>
                        </div>
                      </div>

                      {/* Loading overlay when removing */}
                      {removingDesignId === design.id && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(255, 255, 255, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3,
                          }}
                        >
                          <BusyIndicator active size="M" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}

export default CollectionPreviewDialog;
