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
import { TEXT } from '../constants/collectionPreviewDialog';
import styles from '../styles/components/CollectionPreviewDialog.module.css';

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
  onCollectionUpdated?: () => void;
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

  useEffect(() => {
    if (open && collectionId) {
      fetchCollectionDetails();
    } else {
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
    onClose();
    navigate(`/project/${design.projectId}/design/${design.id}`);
  };

  const getDesignImageUrl = (design: Design): string | null => {
    if (design.generatedImages) {
      const frontImage = design.generatedImages.front;
      if (frontImage.status === 'completed' && frontImage.url) {
        return frontImage.url;
      }
    }
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

      setCollection((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          designs: prev.designs.filter((d) => d.id !== designId),
          itemCount: prev.itemCount - 1,
        };
      });

      if (onCollectionUpdated) {
        onCollectionUpdated();
      }
    } catch (err) {
      console.error('Failed to remove design from collection:', err);
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove design');
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
      return TEXT.UNKNOWN_DATE;
    }
  };

  return (
    <Dialog
      open={open}
      headerText={
        collection
          ? `${collection.name} (${collection.itemCount} ${TEXT.DIALOG_TITLE_SUFFIX})`
          : TEXT.DIALOG_TITLE_DEFAULT
      }
      onClose={onClose}
      className={styles.dialog}
      footer={
        <div className={styles.footer}>
          <Button design="Emphasized" onClick={onClose}>
            {TEXT.BUTTON_CLOSE}
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        {removeError && (
          <div className={styles.errorContainer}>
            <MessageStrip design="Negative" hideCloseButton>
              {removeError}
            </MessageStrip>
          </div>
        )}

        {loading && (
          <div className={styles.loadingContainer}>
            <BusyIndicator active size="L" />
          </div>
        )}

        {error && (
          <div className={styles.errorDisplay}>
            <IllustratedMessage name="NoData" titleText={TEXT.ERROR_TITLE} subtitleText={error}>
              <Button design="Emphasized" onClick={fetchCollectionDetails}>
                {TEXT.BUTTON_TRY_AGAIN}
              </Button>
            </IllustratedMessage>
          </div>
        )}

        {collection && !loading && !error && (
          <>
            <div className={styles.metadata}>
              <Text className={styles.metadataText}>
                {TEXT.CREATED_ON} {formatDate(collection.createdAt)}
              </Text>
            </div>

            {collection.designs.length === 0 ? (
              <div className={styles.emptyState}>
                <IllustratedMessage
                  name="NoData"
                  titleText={TEXT.EMPTY_TITLE}
                  subtitleText={TEXT.EMPTY_SUBTITLE}
                />
              </div>
            ) : (
              <div className={styles.designGrid}>
                {collection.designs.map((design) => {
                  const imageUrl = getDesignImageUrl(design);
                  return (
                    <div key={design.id} className={styles.designCard}>
                      <Button
                        icon="decline"
                        design="Transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDesign(design.id);
                        }}
                        tooltip={TEXT.REMOVE_TOOLTIP}
                        disabled={removingDesignId === design.id}
                        className={styles.removeButton}
                      />

                      <div
                        onClick={() => handleDesignClick(design)}
                        className={styles.designClickable}
                      >
                        <div className={styles.designImageContainer}>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={design.name}
                              className={styles.designImage}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const placeholder = document.createElement('div');
                                  placeholder.innerHTML =
                                    '<ui5-icon name="product" class="' +
                                    styles.designImagePlaceholder +
                                    '"></ui5-icon>';
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
                            <Icon name="product" className={styles.designImagePlaceholder} />
                          )}
                        </div>

                        <div className={styles.designInfo}>
                          <Title level="H6" className={styles.designTitle}>
                            {design.name}
                          </Title>
                          <Text className={styles.designDate}>{formatDate(design.createdAt)}</Text>
                        </div>
                      </div>

                      {removingDesignId === design.id && (
                        <div className={styles.loadingOverlay}>
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
