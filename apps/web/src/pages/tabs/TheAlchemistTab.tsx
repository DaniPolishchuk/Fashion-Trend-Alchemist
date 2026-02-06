/**
 * The Alchemist Tab
 * Controlled component - receives attributes from parent (ProjectHub)
 * Optimized with constants, CSS modules, types, and helper functions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Title,
  Text,
  Button,
  Icon,
  Select,
  Option,
  Dialog,
  Bar,
  MessageStrip,
  Slider,
} from '@ui5/webcomponents-react';
import AttributeSkeletonLoader from '../../components/AttributeSkeletonLoader';
import '@ui5/webcomponents-icons/dist/arrow-right.js';
import '@ui5/webcomponents-icons/dist/arrow-left.js';
import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/ai.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/hint.js';
import '@ui5/webcomponents-icons/dist/target-group.js';
import '@ui5/webcomponents-icons/dist/lab.js';

// Constants, types, and utilities
import {
  ATTRIBUTE_CATEGORIES,
  COLUMNS,
  ICONS,
  TEXT,
  SUCCESS_SCORE_CONFIG,
  getSuccessScoreLabel,
  MAX_AI_VARIABLES,
  API_ENDPOINTS,
} from '../../constants/theAlchemistTab';
import { fetchAPI } from '../../services/api/client';
import type { TheAlchemistTabProps } from '../../types/theAlchemistTab';
import {
  fetchArticleAttributes,
  initializeAttributes,
  buildLockedAttributes,
  buildAIVariables,
  buildContextAttributes,
} from '../../utils/theAlchemistHelpers';
import styles from '../../styles/pages/TheAlchemistTab.module.css';

function TheAlchemistTab({
  project,
  attributes,
  onAttributesChange,
  externalLoading = false,
  velocityScoresStale = false,
}: TheAlchemistTabProps) {
  const navigate = useNavigate();

  // Local state for fetched data (not user-modifiable state)
  const [articleAttributeOptions, setArticleAttributeOptions] = useState<Record<
    string,
    string[]
  > | null>(null);
  const [contextItems, setContextItems] = useState<any[] | null>(null);
  const [internalInitialized, setInternalInitialized] = useState(false);

  // UI state (local to this component)
  const [transmuting, setTransmuting] = useState(false);
  const [transmutingDialogOpen, setTransmutingDialogOpen] = useState(false);
  const [designName, setDesignName] = useState<string>('');
  const [designId, setDesignId] = useState<string>('');
  const [transmutingError, setTransmutingError] = useState<string | null>(null);
  const [successScore, setSuccessScore] = useState(SUCCESS_SCORE_CONFIG.DEFAULT);
  const [staleWarningDialogOpen, setStaleWarningDialogOpen] = useState(false);

  // Memoize stable keys to prevent unnecessary refetches
  const productTypesKey = useMemo(
    () => (project.scopeConfig?.productTypes ?? []).slice().sort().join(','),
    [project.scopeConfig?.productTypes]
  );

  // Fetch article attributes (needed for initialization and variant options)
  useEffect(() => {
    let isCancelled = false;

    const loadArticleAttributes = async () => {
      const options = await fetchArticleAttributes(project.scopeConfig?.productTypes);
      if (!isCancelled) setArticleAttributeOptions(options);
    };

    loadArticleAttributes();
    return () => {
      isCancelled = true;
    };
  }, [productTypesKey, project.scopeConfig?.productTypes]);

  // Fetch context items (needed for auto-exclusion of non-varying attributes)
  useEffect(() => {
    let isCancelled = false;

    const loadContextItems = async () => {
      try {
        const result = await fetchAPI<{ items: any[] }>(
          `/api/projects/${project.id}/context-items`
        );
        if (!isCancelled && result.data) {
          setContextItems(result.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch context items:', error);
        if (!isCancelled) setContextItems([]);
      }
    };

    loadContextItems();
    return () => {
      isCancelled = true;
    };
  }, [project.id]);

  // Initialize attributes if not provided by parent (null means initialize with defaults)
  useEffect(() => {
    if (articleAttributeOptions === null || contextItems === null) return;

    // If parent provided attributes, don't initialize
    if (attributes !== null) {
      setInternalInitialized(true);
      return;
    }

    // Parent didn't provide attributes - initialize with defaults and auto-exclude non-varying
    if (!internalInitialized) {
      const initialized = initializeAttributes(
        articleAttributeOptions,
        project.ontologySchema,
        contextItems
      );
      onAttributesChange(initialized);
      setInternalInitialized(true);
    }
  }, [
    articleAttributeOptions,
    contextItems,
    attributes,
    internalInitialized,
    project.ontologySchema,
    onAttributesChange,
  ]);

  // Reset internal initialized flag when project changes
  useEffect(() => {
    setInternalInitialized(false);
  }, [project.id]);

  // Detect when attributes are reset to null (e.g., after data changes) and allow re-initialization
  useEffect(() => {
    if (attributes === null && internalInitialized) {
      // Attributes were reset by parent - trigger re-initialization
      setInternalInitialized(false);
    }
  }, [attributes, internalInitialized]);

  // Use attributes from props, or empty array while loading
  const currentAttributes = attributes ?? [];

  // Attribute movement handlers - update parent state
  const handleMoveToLocked = useCallback(
    (key: string) => {
      const updated = currentAttributes.map((attr) =>
        attr.key === key
          ? {
              ...attr,
              category: ATTRIBUTE_CATEGORIES.LOCKED,
              selectedValue: attr.variants[0] || null,
            }
          : attr
      );
      onAttributesChange(updated);
    },
    [currentAttributes, onAttributesChange]
  );

  const handleMoveToAIVariable = useCallback(
    (key: string) => {
      const updated = currentAttributes.map((attr) =>
        attr.key === key
          ? { ...attr, category: ATTRIBUTE_CATEGORIES.AI, selectedValue: null }
          : attr
      );
      onAttributesChange(updated);
    },
    [currentAttributes, onAttributesChange]
  );

  const handleMoveToNotIncluded = useCallback(
    (key: string) => {
      const updated = currentAttributes.map((attr) =>
        attr.key === key
          ? { ...attr, category: ATTRIBUTE_CATEGORIES.NOT_INCLUDED, selectedValue: null }
          : attr
      );
      onAttributesChange(updated);
    },
    [currentAttributes, onAttributesChange]
  );

  const handleValueChange = useCallback(
    (key: string, value: string) => {
      const updated = currentAttributes.map((attr) =>
        attr.key === key ? { ...attr, selectedValue: value } : attr
      );
      onAttributesChange(updated);
    },
    [currentAttributes, onAttributesChange]
  );

  // Handle transmutation request (may show stale warning first)
  const handleTransmuteRequest = () => {
    if (velocityScoresStale) {
      setStaleWarningDialogOpen(true);
    } else {
      handleTransmute();
    }
  };

  // Handle transmutation
  const handleTransmute = async () => {
    setStaleWarningDialogOpen(false);
    setTransmuting(true);
    setTransmutingDialogOpen(true);
    setDesignName('');
    setDesignId('');
    setTransmutingError(null);

    try {
      const result = await fetchAPI<{ designName: string; designId: string; details?: string }>(
        API_ENDPOINTS.RPT1_PREDICT(project.id),
        {
          method: 'POST',
          body: JSON.stringify({
            lockedAttributes: buildLockedAttributes(currentAttributes),
            aiVariables: buildAIVariables(currentAttributes),
            successScore,
            contextAttributes: buildContextAttributes(currentAttributes), // Auto-excluded attributes for image generation
          }),
        }
      );

      if (result.error) {
        setTransmutingError(result.error);
        setTransmuting(false);
      } else {
        setDesignName(result.data!.designName);
        setDesignId(result.data!.designId);
        setTransmuting(false);
      }
    } catch (error) {
      console.error('Transmutation failed:', error);
      setTransmutingError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setTransmuting(false);
    }
  };

  // Filter attributes by category
  const lockedAttributes = useMemo(
    () => currentAttributes.filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.LOCKED),
    [currentAttributes]
  );
  const aiVariables = useMemo(
    () => currentAttributes.filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.AI),
    [currentAttributes]
  );
  const notIncludedAttributes = useMemo(
    () =>
      currentAttributes.filter(
        (attr) => attr.category === ATTRIBUTE_CATEGORIES.NOT_INCLUDED && !attr.autoExcluded
      ),
    [currentAttributes]
  );

  const aiVariableCount = aiVariables.length;
  const isOverLimit = aiVariableCount > MAX_AI_VARIABLES;
  const canTransmute = aiVariableCount > 0 && aiVariableCount <= MAX_AI_VARIABLES && !transmuting;

  // Loading state - show while fetching article options OR if parent is loading refineFrom
  const isLoading =
    externalLoading ||
    articleAttributeOptions === null ||
    (attributes === null && !internalInitialized);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.mainLayout}>
        <Card className={styles.parametersCard}>
          <div className={styles.loadingCardHeader}>
            <div className={styles.cardHeaderLeft}>
              <Icon name={ICONS.AI} className={styles.cardHeaderIcon} />
              <div>
                <Title level="H4" className={styles.cardTitle}>
                  {TEXT.CARD_TITLE}
                </Title>
                <Text className={styles.cardSubtitle}>{TEXT.CARD_SUBTITLE}</Text>
              </div>
            </div>
          </div>

          <div
            className={styles.loadingColumnsContainer}
            role="status"
            aria-busy="true"
            aria-label="Loading attributes"
          >
            <div className={`${styles.loadingColumn} ${styles.loadingColumnLeft}`}>
              <div className={styles.loadingColumnHeader}>
                <Icon name={COLUMNS.LOCKED.icon} />
                <Text className={styles.columnTitle}>{COLUMNS.LOCKED.title} (Loading...)</Text>
              </div>
              <div className={styles.loadingColumnContent}>
                <AttributeSkeletonLoader variant="locked" count={3} />
              </div>
            </div>

            <div className={`${styles.loadingColumn} ${styles.loadingColumnMiddle}`}>
              <div className={styles.loadingColumnHeader}>
                <Icon name={COLUMNS.AI.icon} style={{ color: COLUMNS.AI.color }} />
                <Text className={styles.columnTitle} style={{ color: COLUMNS.AI.color }}>
                  {COLUMNS.AI.title} (Loading...)
                </Text>
              </div>
              <div className={styles.loadingColumnContent}>
                <AttributeSkeletonLoader variant="ai" count={10} />
              </div>
            </div>

            <div className={styles.loadingColumn}>
              <div className={styles.loadingColumnHeader}>
                <Icon
                  name={COLUMNS.NOT_INCLUDED.icon}
                  style={{ color: COLUMNS.NOT_INCLUDED.color }}
                />
                <Text className={styles.columnTitle} style={{ color: COLUMNS.NOT_INCLUDED.color }}>
                  {COLUMNS.NOT_INCLUDED.title} (Loading...)
                </Text>
              </div>
              <div className={styles.loadingColumnContent}>
                <AttributeSkeletonLoader variant="notIncluded" count={2} />
              </div>
            </div>
          </div>

          <div className={styles.loadingFooter}>
            <div className={styles.loadingFooterLeft}>
              <Text className={styles.loadingFooterText}>{TEXT.LOADING_ATTRIBUTES}</Text>
            </div>
            <div className={styles.loadingFooterButtons}>
              <Button
                design="Emphasized"
                icon={ICONS.AI}
                disabled
                className={styles.transmuteButtonDisabled}
              >
                {TEXT.TRANSMUTE_BUTTON}
              </Button>
            </div>
          </div>
        </Card>

        <Card className={styles.successPanel}>
          <div className={styles.successPanelContent}>
            <div className={styles.successPanelHeader}>
              <Icon name={ICONS.TARGET_GROUP} className={styles.successPanelIcon} />
              <Text className={styles.successPanelTitle}>{TEXT.SUCCESS_PANEL_TITLE}</Text>
            </div>
            <div className={styles.successPanelDescription}>
              <Text className={styles.successPanelDescriptionText}>
                {TEXT.SUCCESS_PANEL_DESCRIPTION}
              </Text>
            </div>
            <div className={styles.successScoreDisplay}>
              <Text className={styles.successScoreValue}>{successScore}</Text>
              <Text className={styles.successScorePercent}>%</Text>
              <Text className={styles.successScoreLabel}>{getSuccessScoreLabel(successScore)}</Text>
            </div>
            <div className={styles.sliderContainer}>
              <Slider
                value={successScore}
                min={SUCCESS_SCORE_CONFIG.MIN}
                max={SUCCESS_SCORE_CONFIG.MAX}
                step={SUCCESS_SCORE_CONFIG.STEP}
                showTickmarks
                labelInterval={SUCCESS_SCORE_CONFIG.LABEL_INTERVAL}
                onChange={(e: any) => setSuccessScore(e.target.value)}
                disabled={isLoading}
                className={`${styles.sliderWrapper} ${isLoading ? styles.sliderWrapperDisabled : ''}`}
              />
              <div className={styles.sliderLabels}>
                <Text className={styles.sliderLabelText}>{TEXT.SLIDER_LOW}</Text>
                <Text className={styles.sliderLabelText}>{TEXT.SLIDER_HIGH}</Text>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!project.ontologySchema && Object.keys(articleAttributeOptions || {}).length === 0) {
    return (
      <Card className={styles.emptyCard}>
        <Text>{TEXT.NO_ATTRIBUTES}</Text>
      </Card>
    );
  }

  return (
    <div>
      <div className={styles.mainLayout}>
        {/* Parameters Card */}
        <Card className={styles.parametersCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderContent}>
              <div className={styles.cardHeaderLeft}>
                <Icon name={ICONS.AI} className={styles.cardHeaderIcon} />
                <div>
                  <Title level="H4" className={styles.cardTitle}>
                    {TEXT.CARD_TITLE}
                  </Title>
                  <Text className={styles.cardSubtitle}>{TEXT.CARD_SUBTITLE}</Text>
                </div>
              </div>
              {isOverLimit && (
                <div className={styles.warningContainer}>
                  <MessageStrip design="Negative" hideCloseButton>
                    {TEXT.WARNING_TOO_MANY(MAX_AI_VARIABLES)}
                  </MessageStrip>
                </div>
              )}
            </div>
          </div>

          <div className={styles.columnsContainer}>
            {/* Locked Column */}
            <div className={`${styles.column} ${styles.columnLeft}`}>
              <div className={styles.columnHeader}>
                <Icon name={COLUMNS.LOCKED.icon} />
                <Text className={`${styles.columnTitle} ${styles.columnTitleLocked}`}>
                  {COLUMNS.LOCKED.title} ({lockedAttributes.length})
                </Text>
              </div>

              {lockedAttributes.length === 0 ? (
                <Text className={styles.emptyText}>{TEXT.EMPTY_LOCKED}</Text>
              ) : (
                <div className={styles.columnContent}>
                  {lockedAttributes.map((attr) => (
                    <div key={attr.key} className={styles.lockedCard}>
                      <div className={styles.lockedCardHeader}>
                        <Text className={styles.lockedCardTitle}>{attr.displayName}</Text>
                        <Button
                          icon={ICONS.DECLINE}
                          design="Transparent"
                          tooltip="Move to Not Included"
                          onClick={() => handleMoveToNotIncluded(attr.key)}
                          className={styles.lockedCardButton}
                        />
                      </div>
                      <div className={styles.lockedCardControls}>
                        <Select
                          className={styles.lockedCardSelect}
                          value={attr.selectedValue || ''}
                          onChange={(e: any) =>
                            handleValueChange(attr.key, e.detail.selectedOption.value)
                          }
                        >
                          {attr.variants.map((variant) => (
                            <Option key={variant} value={variant}>
                              {variant}
                            </Option>
                          ))}
                        </Select>
                        <Button
                          icon={ICONS.ARROW_RIGHT}
                          design="Transparent"
                          tooltip="Move to AI Variables"
                          onClick={() => handleMoveToAIVariable(attr.key)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Column */}
            <div className={`${styles.column} ${styles.columnMiddle}`}>
              <div className={styles.columnHeader}>
                <Icon name={COLUMNS.AI.icon} style={{ color: COLUMNS.AI.color }} />
                <Text
                  className={`${styles.columnTitle} ${isOverLimit ? styles.columnTitleAIOverLimit : styles.columnTitleAI}`}
                >
                  {COLUMNS.AI.title} ({aiVariableCount}/{MAX_AI_VARIABLES})
                </Text>
              </div>

              {aiVariables.length === 0 ? (
                <Text className={styles.emptyText}>{TEXT.EMPTY_AI}</Text>
              ) : (
                <div className={`${styles.columnContent} ${styles.columnContentAI}`}>
                  {aiVariables.map((attr) => (
                    <div key={attr.key} className={styles.aiCard}>
                      <Button
                        icon={ICONS.ARROW_LEFT}
                        design="Transparent"
                        tooltip="Move to Locked Attributes"
                        onClick={() => handleMoveToLocked(attr.key)}
                      />
                      <div
                        className={`${styles.aiCardContent} ${isOverLimit ? styles.aiCardContentOverLimit : ''}`}
                      >
                        <Icon name={ICONS.AI} className={styles.aiCardIcon} />
                        <Text className={styles.aiCardTitle}>{attr.displayName}</Text>
                      </div>
                      <Button
                        icon={ICONS.DECLINE}
                        design="Transparent"
                        tooltip="Move to Not Included"
                        onClick={() => handleMoveToNotIncluded(attr.key)}
                        className={styles.aiCardButton}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Not Included Column */}
            <div className={styles.column}>
              <div className={styles.columnHeader}>
                <Icon
                  name={COLUMNS.NOT_INCLUDED.icon}
                  style={{ color: COLUMNS.NOT_INCLUDED.color }}
                />
                <Text className={`${styles.columnTitle} ${styles.columnTitleNotIncluded}`}>
                  {COLUMNS.NOT_INCLUDED.title} ({notIncludedAttributes.length})
                </Text>
              </div>

              {notIncludedAttributes.length === 0 ? (
                <Text className={styles.emptyText}>{TEXT.EMPTY_NOT_INCLUDED}</Text>
              ) : (
                <div className={`${styles.columnContent} ${styles.columnContentAI}`}>
                  {notIncludedAttributes.map((attr) => (
                    <div key={attr.key} className={styles.notIncludedCard}>
                      <Button
                        icon={ICONS.ADD}
                        design="Transparent"
                        tooltip="Move to AI Variables"
                        onClick={() => handleMoveToAIVariable(attr.key)}
                      />
                      <div className={styles.notIncludedCardContent}>
                        <Text className={styles.notIncludedCardTitle}>{attr.displayName}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.footerButtons}>
              <Button
                design="Emphasized"
                icon={ICONS.AI}
                onClick={handleTransmuteRequest}
                disabled={!canTransmute}
                className={canTransmute ? styles.transmuteButton : styles.transmuteButtonDisabled}
              >
                {transmuting ? TEXT.TRANSMUTING : TEXT.TRANSMUTE_BUTTON}
              </Button>
            </div>
          </div>
        </Card>

        {/* Success Score Panel */}
        <Card className={styles.successPanel}>
          <div className={styles.successPanelContent}>
            <div className={styles.successPanelHeader}>
              <Icon name={ICONS.TARGET_GROUP} className={styles.successPanelIcon} />
              <Text className={styles.successPanelTitle}>{TEXT.SUCCESS_PANEL_TITLE}</Text>
            </div>
            <div className={styles.successPanelDescription}>
              <Text className={styles.successPanelDescriptionText}>
                {TEXT.SUCCESS_PANEL_DESCRIPTION}
              </Text>
            </div>
            <div className={styles.successScoreDisplay}>
              <Text className={styles.successScoreValue}>{successScore}</Text>
              <Text className={styles.successScorePercent}>%</Text>
              <Text className={styles.successScoreLabel}>{getSuccessScoreLabel(successScore)}</Text>
            </div>
            <div className={styles.sliderContainer}>
              <Slider
                value={successScore}
                min={SUCCESS_SCORE_CONFIG.MIN}
                max={SUCCESS_SCORE_CONFIG.MAX}
                step={SUCCESS_SCORE_CONFIG.STEP}
                showTickmarks
                labelInterval={SUCCESS_SCORE_CONFIG.LABEL_INTERVAL}
                onChange={(e: any) => setSuccessScore(e.target.value)}
                className={styles.sliderWrapper}
              />
              <div className={styles.sliderLabels}>
                <Text className={styles.sliderLabelText}>{TEXT.SLIDER_LOW}</Text>
                <Text className={styles.sliderLabelText}>{TEXT.SLIDER_HIGH}</Text>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Transmuting Dialog */}
      <Dialog
        open={transmutingDialogOpen}
        onClose={transmuting ? undefined : () => setTransmutingDialogOpen(false)}
        header={
          !transmuting && (
            <Button
              icon="decline"
              design="Transparent"
              onClick={() => setTransmutingDialogOpen(false)}
              style={{ position: 'absolute', right: '1rem', top: '1rem' }}
            />
          )
        }
        className={styles.dialogSmall}
      >
        <div className={styles.dialogContent}>
          {transmuting ? (
            <>
              <Text className={styles.dialogTitle}>{TEXT.TRANSMUTING_MESSAGE}</Text>
              <div className={styles.dialogIconContainer}>
                <img
                  src="/alchemist-flask.svg"
                  alt="Alchemist Flask"
                  className={`${styles.dialogAnimatedFlask} ${styles.dialogAnimatedFlask1}`}
                />
                <img
                  src="/alchemist-flask.svg"
                  alt="Alchemist Flask"
                  className={`${styles.dialogAnimatedFlask} ${styles.dialogAnimatedFlask2}`}
                />
                <img
                  src="/alchemist-flask.svg"
                  alt="Alchemist Flask"
                  className={`${styles.dialogAnimatedFlask} ${styles.dialogAnimatedFlask3}`}
                />
                <img
                  src="/alchemist-flask.svg"
                  alt="Alchemist Flask"
                  className={`${styles.dialogAnimatedFlask} ${styles.dialogAnimatedFlask4}`}
                />
                <img
                  src="/alchemist-flask.svg"
                  alt="Alchemist Flask"
                  className={`${styles.dialogAnimatedFlask} ${styles.dialogAnimatedFlask5}`}
                />
              </div>
            </>
          ) : transmutingError ? (
            <>
              <Text className={styles.dialogErrorTitle}>{TEXT.ERROR_TITLE}</Text>
              <Text className={styles.dialogErrorMessage}>{transmutingError}</Text>
            </>
          ) : (
            <>
              <Text className={styles.dialogSuccessTitle}>{TEXT.SUCCESS_TITLE}</Text>
              <Text className={styles.dialogSuccessName}>"{designName}"</Text>
              <Button
                design="Emphasized"
                onClick={() => navigate(`/project/${project.id}/design/${designId}`)}
              >
                Go to Product
              </Button>
            </>
          )}
        </div>
      </Dialog>

      {/* Stale Velocity Warning Dialog */}
      <Dialog
        open={staleWarningDialogOpen}
        headerText="Context Has Changed"
        footer={
          <Bar
            endContent={
              <>
                <Button onClick={() => setStaleWarningDialogOpen(false)}>Cancel</Button>
                <Button design="Attention" onClick={handleTransmute}>
                  Continue Anyway
                </Button>
              </>
            }
          />
        }
      >
        <div className={styles.dialogPadding}>
          <MessageStrip design="Negative" hideCloseButton className={styles.dialogMessageStrip}>
            Your context has changed since velocity scores were last calculated.
          </MessageStrip>
          <Text>
            Results may not reflect current selection. It is recommended to recalculate velocity
            scores before running the transmutation.
          </Text>
        </div>
      </Dialog>
    </div>
  );
}

export default TheAlchemistTab;
