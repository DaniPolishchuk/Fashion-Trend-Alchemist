import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Input,
  Panel,
  ObjectStatus,
  MessageStrip,
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
import {
  BREADCRUMBS,
  LABELS,
  BUTTONS,
  ICONS,
  ERROR_MESSAGES,
  POLLING,
  IMAGE_VIEW_ORDER,
  OBJECT_STATUS_MAP,
  ATTRIBUTE_PREFIX_REGEX,
  type ImageView,
} from '../constants/designDetail';
import styles from '../styles/pages/DesignDetail.module.css';

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

  // Save notification state
  const [saveNotification, setSaveNotification] = useState<{
    show: boolean;
    success: boolean;
    collectionName: string;
    collectionId: string;
    error?: string;
  } | null>(null);

  // Collapsible panel states
  const [predictedPanelCollapsed, setPredictedPanelCollapsed] = useState(false);
  const [givenPanelCollapsed, setGivenPanelCollapsed] = useState(false);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // Auto-dismiss timer ref
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized computed values
  const filteredPredicted = useMemo(() => {
    const predictedAttributes = design?.predictedAttributes || {};
    return Object.entries(predictedAttributes).filter(([key]) => !key.startsWith('_'));
  }, [design?.predictedAttributes]);

  const filteredConstraints = useMemo(() => {
    const inputConstraints = design?.inputConstraints || {};
    return Object.entries(inputConstraints).filter(([key]) => !key.startsWith('_'));
  }, [design?.inputConstraints]);

  // Format date with useCallback
  const formatDate = useCallback((dateString?: string) => {
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
  }, []);

  // Get current view image
  const currentViewImage = generatedImages?.[selectedView];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target && (event.target as HTMLElement).tagName === 'INPUT') {
        return;
      }

      const currentIndex = IMAGE_VIEW_ORDER.indexOf(selectedView);

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          const prevIndex = currentIndex === 0 ? IMAGE_VIEW_ORDER.length - 1 : currentIndex - 1;
          setSelectedView(IMAGE_VIEW_ORDER[prevIndex]);
          break;
        case 'ArrowRight':
          event.preventDefault();
          const nextIndex = currentIndex === IMAGE_VIEW_ORDER.length - 1 ? 0 : currentIndex + 1;
          setSelectedView(IMAGE_VIEW_ORDER[nextIndex]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedView]);

  // Fetch design data
  useEffect(() => {
    const fetchDesign = async () => {
      if (!projectId || !designId) {
        setError(ERROR_MESSAGES.MISSING_IDS);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [projectResponse, designsResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/generated-designs`),
        ]);

        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setProjectName(projectData.name || 'Project');
        }

        if (!designsResponse.ok) {
          throw new Error(ERROR_MESSAGES.FETCH_FAILED);
        }

        const designs: GeneratedDesign[] = await designsResponse.json();
        const currentDesign = designs.find((d) => d.id === designId);

        if (!currentDesign) {
          throw new Error(ERROR_MESSAGES.DESIGN_NOT_FOUND);
        }

        setDesign(currentDesign);
        setOverallStatus(currentDesign.imageGenerationStatus || 'pending');

        if (currentDesign.generatedImages) {
          setGeneratedImages(currentDesign.generatedImages);
        } else {
          const legacyStatus = currentDesign.imageGenerationStatus;
          const viewStatus: ImageViewStatus =
            legacyStatus === 'partial'
              ? 'completed'
              : ((legacyStatus || 'pending') as ImageViewStatus);

          setGeneratedImages({
            front: { url: currentDesign.generatedImageUrl || null, status: viewStatus },
            back: { url: null, status: 'pending' },
            model: { url: null, status: 'pending' },
          });
        }
      } catch (err) {
        console.error(ERROR_MESSAGES.FETCH_FAILED, err);
        setError(err instanceof Error ? err.message : ERROR_MESSAGES.FETCH_FAILED);
      } finally {
        setLoading(false);
      }
    };

    fetchDesign();
  }, [projectId, designId]);

  // Poll for image status
  useEffect(() => {
    if (!projectId || !designId) return;

    const needsPolling =
      generatedImages &&
      IMAGE_VIEW_ORDER.some((view) => {
        const status = generatedImages[view].status;
        return status === 'pending' || status === 'generating';
      });

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

    pollingRef.current = setInterval(pollImageStatus, POLLING.INTERVAL_MS);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [projectId, designId, generatedImages]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  // Handlers
  const handleSaveSuccess = useCallback((collectionName: string, collectionId: string) => {
    setSaveNotification({ show: true, success: true, collectionName, collectionId });

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => setSaveNotification(null), POLLING.AUTO_DISMISS_MS);
  }, []);

  const handleDismissNotification = useCallback(() => {
    setSaveNotification(null);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  const handleViewCollection = useCallback(() => {
    if (saveNotification?.collectionId) {
      navigate(`/?collection=${saveNotification.collectionId}`);
    }
  }, [saveNotification, navigate]);

  const handleStartEditName = useCallback(() => {
    if (design) {
      setEditedName(design.name);
      setIsEditingName(true);
    }
  }, [design]);

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  const handleSaveName = useCallback(async () => {
    if (!projectId || !designId || !editedName.trim()) return;

    try {
      setSavingName(true);
      const response = await fetch(`/api/projects/${projectId}/generated-designs/${designId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (!response.ok) throw new Error(ERROR_MESSAGES.UPDATE_NAME_FAILED);

      setDesign((prev) => (prev ? { ...prev, name: editedName.trim() } : prev));
      setIsEditingName(false);
    } catch (err) {
      console.error(ERROR_MESSAGES.UPDATE_NAME_FAILED, err);
    } finally {
      setSavingName(false);
    }
  }, [projectId, designId, editedName]);

  const handleGenerateName = useCallback(async () => {
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
      console.error(ERROR_MESSAGES.GENERATE_NAME_FAILED, error);
    } finally {
      setIsGeneratingName(false);
    }
  }, [design]);

  const handleRefineDesign = useCallback(() => {
    if (!design || !projectId) return;
    navigate(`/project/${projectId}?tab=alchemist&refineFrom=${design.id}`);
  }, [design, projectId, navigate]);

  const navigateView = useCallback(
    (direction: 'prev' | 'next') => {
      const currentIndex = IMAGE_VIEW_ORDER.indexOf(selectedView);
      const newIndex =
        direction === 'prev'
          ? currentIndex === 0
            ? IMAGE_VIEW_ORDER.length - 1
            : currentIndex - 1
          : currentIndex === IMAGE_VIEW_ORDER.length - 1
            ? 0
            : currentIndex + 1;
      setSelectedView(IMAGE_VIEW_ORDER[newIndex]);
    },
    [selectedView]
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <BusyIndicator active size="L" />
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className={styles.errorContainer}>
        <IllustratedMessage
          name="NoData"
          titleText={LABELS.ERROR_LOADING}
          subtitleText={error || LABELS.DESIGN_NOT_FOUND}
        >
          <Button design="Emphasized" onClick={() => navigate(`/project/${projectId}`)}>
            {BUTTONS.BACK_TO_PROJECT}
          </Button>
        </IllustratedMessage>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbsContainer}>
        <Breadcrumbs
          onItemClick={(e: any) => {
            const text = e.detail.item.textContent?.trim();
            if (text === BREADCRUMBS.HOME) {
              navigate('/');
            } else if (text === projectName) {
              navigate(`/project/${projectId}`);
            }
          }}
        >
          <BreadcrumbsItem>{BREADCRUMBS.HOME}</BreadcrumbsItem>
          <BreadcrumbsItem>{projectName}</BreadcrumbsItem>
          <BreadcrumbsItem>{design.name}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* Page Header */}
      <div className={styles.headerContainer}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitleRow}>
            {isEditingName ? (
              <>
                <Input
                  value={editedName}
                  onInput={(e: any) => setEditedName(e.target.value)}
                  className={styles.headerTitleInput}
                  disabled={savingName}
                />
                <Button
                  icon={ICONS.ACCEPT}
                  design="Positive"
                  tooltip={BUTTONS.SAVE_NAME}
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                />
                <Button
                  icon={ICONS.DECLINE}
                  design="Negative"
                  tooltip={BUTTONS.CANCEL}
                  onClick={handleCancelEditName}
                  disabled={savingName}
                />
              </>
            ) : (
              <>
                <Title level="H2" className={styles.headerTitle}>
                  {design.name}
                </Title>
                <Button
                  icon={ICONS.EDIT}
                  design="Transparent"
                  tooltip={BUTTONS.EDIT_NAME}
                  onClick={handleStartEditName}
                />
                <Button
                  icon={ICONS.AI}
                  design="Transparent"
                  tooltip={BUTTONS.GENERATE_NAME}
                  onClick={handleGenerateName}
                  disabled={isGeneratingName}
                />
                <div className={styles.statusBadgeContainer}>
                  <ObjectStatus
                    state={
                      OBJECT_STATUS_MAP[overallStatus as keyof typeof OBJECT_STATUS_MAP] ||
                      'Information'
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
            <Text className={styles.headerMetadata}>
              {LABELS.CREATED} {formatDate(design.createdAt)}
            </Text>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column - Attribute Panels */}
        <div className={styles.attributePanelsColumn}>
          {/* Predicted Attributes Panel */}
          <Panel
            header={
              <div className={styles.panelHeader}>
                <Icon name={ICONS.AI} className={styles.panelIconAI} />
                <Text className={styles.panelTitleAI}>
                  {LABELS.PREDICTED_HEADER} ({filteredPredicted.length})
                </Text>
              </div>
            }
            collapsed={predictedPanelCollapsed}
            onToggle={() => setPredictedPanelCollapsed(!predictedPanelCollapsed)}
            className={styles.panelPredicted}
          >
            <div className={styles.panelContent}>
              {filteredPredicted.length > 0 ? (
                filteredPredicted.map(([key, value]) => (
                  <div key={key} className={`${styles.attributeItem} ${styles.attributeItemAI}`}>
                    <Text className={styles.attributeLabel}>
                      {key.replace(ATTRIBUTE_PREFIX_REGEX, '').replace(/_/g, ' ')}
                    </Text>
                    <Text className={styles.attributeValueAI}>{String(value)}</Text>
                  </div>
                ))
              ) : (
                <Text className={styles.emptyAttributesText}>{LABELS.NO_PREDICTED}</Text>
              )}
            </div>
          </Panel>

          {/* Given Attributes Panel */}
          <Panel
            header={
              <div className={styles.panelHeader}>
                <Icon name={ICONS.LOCKED} className={styles.panelIcon} />
                <Text className={styles.panelTitle}>
                  {LABELS.GIVEN_HEADER} ({filteredConstraints.length})
                </Text>
              </div>
            }
            collapsed={givenPanelCollapsed}
            onToggle={() => setGivenPanelCollapsed(!givenPanelCollapsed)}
            className={styles.panelGiven}
          >
            <div className={styles.panelContent}>
              {filteredConstraints.length > 0 ? (
                filteredConstraints.map(([key, value]) => (
                  <div key={key} className={styles.attributeItem}>
                    <Text className={styles.attributeLabel}>
                      {key.replace(ATTRIBUTE_PREFIX_REGEX, '').replace(/_/g, ' ')}
                    </Text>
                    <Text className={styles.attributeValue}>{String(value)}</Text>
                  </div>
                ))
              ) : (
                <Text className={styles.emptyAttributesText}>{LABELS.NO_GIVEN}</Text>
              )}
            </div>
          </Panel>
        </div>

        {/* Right Column - Image Gallery */}
        <div className={styles.galleryColumn}>
          <div className={styles.galleryContainer}>
            {/* Thumbnail List */}
            <div className={styles.thumbnailList}>
              {IMAGE_VIEW_ORDER.map((view) => {
                const img = generatedImages?.[view];
                const isSelected = selectedView === view;

                return (
                  <div
                    key={view}
                    onClick={() => setSelectedView(view)}
                    className={`${styles.thumbnailItem} ${isSelected ? styles.thumbnailItemSelected : ''}`}
                  >
                    <div
                      className={`${styles.thumbnailBox} ${isSelected ? styles.thumbnailBoxSelected : ''}`}
                    >
                      {img?.status === 'completed' && img.url ? (
                        <img src={img.url} alt={view} className={styles.thumbnailImage} />
                      ) : img?.status === 'generating' ? (
                        <div className={styles.thumbnailLoading}>
                          <BusyIndicator active size="S" />
                        </div>
                      ) : img?.status === 'failed' ? (
                        <div className={styles.thumbnailFailed}>
                          <Icon name={ICONS.SYS_CANCEL} className={styles.thumbnailFailedIcon} />
                        </div>
                      ) : (
                        <div className={styles.thumbnailEmpty}>
                          <Icon name={ICONS.CAMERA} className={styles.thumbnailEmptyIcon} />
                        </div>
                      )}
                    </div>
                    <Text
                      className={`${styles.thumbnailLabel} ${isSelected ? styles.thumbnailLabelSelected : ''}`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </Text>
                  </div>
                );
              })}
            </div>

            {/* Main Image Stage */}
            <div className={styles.imageStageContainer}>
              <div className={styles.imageStage}>
                {/* Navigation Arrows */}
                {generatedImages && (
                  <>
                    <Button
                      icon={ICONS.NAV_LEFT}
                      design="Transparent"
                      tooltip={BUTTONS.PREVIOUS_VIEW}
                      onClick={() => navigateView('prev')}
                      className={`${styles.navButton} ${styles.navButtonLeft}`}
                    />
                    <Button
                      icon={ICONS.NAV_RIGHT}
                      design="Transparent"
                      tooltip={BUTTONS.NEXT_VIEW}
                      onClick={() => navigateView('next')}
                      className={`${styles.navButton} ${styles.navButtonRight}`}
                    />
                  </>
                )}

                {/* Image Content */}
                {currentViewImage?.status === 'completed' && currentViewImage.url ? (
                  <img
                    src={currentViewImage.url}
                    alt={`${design.name} - ${selectedView} view`}
                    className={styles.mainImage}
                  />
                ) : currentViewImage?.status === 'pending' ||
                  currentViewImage?.status === 'generating' ? (
                  <div className={styles.imageStatusContainer}>
                    <BusyIndicator active size="L" />
                    <Text className={styles.imageStatusText}>
                      {currentViewImage?.status === 'pending'
                        ? `Waiting to generate ${selectedView} view...`
                        : `Generating ${selectedView} view...`}
                    </Text>
                  </div>
                ) : currentViewImage?.status === 'failed' ? (
                  <div className={styles.imageStatusContainer}>
                    <Icon name={ICONS.SYS_CANCEL} className={styles.imageFailedIcon} />
                    <Text className={styles.imageFailedText}>
                      {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} view generation
                      failed
                    </Text>
                  </div>
                ) : (
                  <div className={styles.imageStatusContainer}>
                    <Text className={styles.imageStatusText}>{LABELS.NO_IMAGE_AVAILABLE}</Text>
                  </div>
                )}
              </div>
              {/* View Badge - Above Image */}
              <div className={styles.viewBadge}>
                <ObjectStatus state="Information" inverted>
                  {selectedView.toUpperCase()} {LABELS.VIEW_BADGE_SUFFIX}
                </ObjectStatus>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {saveNotification?.show && (
        <div className={styles.notification}>
          <MessageStrip
            design={saveNotification.success ? 'Positive' : 'Negative'}
            onClose={handleDismissNotification}
          >
            <div className={styles.notificationContent}>
              <Text className={styles.notificationText}>
                {saveNotification.success
                  ? `Saved to "${saveNotification.collectionName}"`
                  : `Failed to save: ${saveNotification.error}`}
              </Text>
              {saveNotification.success && (
                <Button design="Transparent" onClick={handleViewCollection}>
                  {BUTTONS.VIEW_COLLECTION}
                </Button>
              )}
            </div>
          </MessageStrip>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionBarLeft}>
          <Icon name={ICONS.HINT} className={styles.actionBarIcon} />
          <Text className={styles.actionBarText}>{LABELS.HINT_TEXT}</Text>
        </div>
        <div className={styles.actionBarRight}>
          <Button icon={ICONS.SYNCHRONIZE} design="Default" onClick={handleRefineDesign}>
            {BUTTONS.REFINE_DESIGN}
          </Button>
          <Button
            id="save-to-collection-btn"
            design="Emphasized"
            onClick={() => setSavePopoverOpen(true)}
          >
            {BUTTONS.SAVE_TO_COLLECTION}
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
    </div>
  );
}

export default DesignDetail;
