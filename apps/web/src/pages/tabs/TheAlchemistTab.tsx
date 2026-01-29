/**
 * The Alchemist Tab
 * Optimized with constants, CSS modules, types, and helper functions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  BusyIndicator,
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
import type {
  AttributeConfig,
  PreviewData,
  TheAlchemistTabProps,
} from '../../types/theAlchemistTab';
import {
  fetchArticleAttributes,
  initializeAttributes,
  buildLockedAttributes,
  buildAIVariables,
} from '../../utils/theAlchemistHelpers';
import styles from '../../styles/pages/TheAlchemistTab.module.css';

function TheAlchemistTab({ project }: TheAlchemistTabProps) {
  const [attributes, setAttributes] = useState<AttributeConfig[]>([]);
  const [articleAttributeOptions, setArticleAttributeOptions] = useState<Record<
    string,
    string[]
  > | null>(null);
  const [attributesInitialized, setAttributesInitialized] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [transmuting, setTransmuting] = useState(false);
  const [transmutingDialogOpen, setTransmutingDialogOpen] = useState(false);
  const [designName, setDesignName] = useState<string>('');
  const [transmutingError, setTransmutingError] = useState<string | null>(null);
  const [successScore, setSuccessScore] = useState(SUCCESS_SCORE_CONFIG.DEFAULT);
  const [velocityScoresStale, setVelocityScoresStale] = useState(false);
  const [staleWarningDialogOpen, setStaleWarningDialogOpen] = useState(false);

  // Memoize stable keys to prevent unnecessary refetches
  const productTypesKey = useMemo(
    () => (project.scopeConfig?.productTypes ?? []).slice().sort().join(','),
    [project.scopeConfig?.productTypes]
  );

  const ontologySchemaKey = useMemo(
    () => JSON.stringify(project.ontologySchema ?? {}),
    [project.ontologySchema]
  );

  // Fetch article attributes
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

  // Initialize attributes
  useEffect(() => {
    if (articleAttributeOptions === null) return;

    if (attributesInitialized) {
      const hasOntologyAttributes = attributes.some((attr) => !attr.isArticleLevel);
      const ontologyNowAvailable =
        project.ontologySchema && Object.keys(project.ontologySchema).length > 0;

      if (!hasOntologyAttributes && ontologyNowAvailable) {
        setAttributesInitialized(false);
        return;
      }
      return;
    }

    const initialized = initializeAttributes(articleAttributeOptions, project.ontologySchema);
    setAttributes(initialized);
    setAttributesInitialized(true);
  }, [
    ontologySchemaKey,
    articleAttributeOptions,
    attributesInitialized,
    project.ontologySchema,
    attributes,
  ]);

  // Fetch velocity stale status on mount
  useEffect(() => {
    const fetchVelocityStatus = async () => {
      try {
        const result = await fetchAPI<{ velocityScoresStale?: boolean }>(
          `/api/projects/${project.id}/context-items`
        );
        if (result.data) {
          setVelocityScoresStale(result.data.velocityScoresStale || false);
        }
      } catch (err) {
        console.error('Failed to fetch velocity status:', err);
      }
    };

    fetchVelocityStatus();
  }, [project.id]);

  // Attribute movement handlers
  const handleMoveToLocked = useCallback((key: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.key === key
          ? {
              ...attr,
              category: ATTRIBUTE_CATEGORIES.LOCKED,
              selectedValue: attr.variants[0] || null,
            }
          : attr
      )
    );
  }, []);

  const handleMoveToAIVariable = useCallback((key: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.key === key
          ? { ...attr, category: ATTRIBUTE_CATEGORIES.AI, selectedValue: null }
          : attr
      )
    );
  }, []);

  const handleMoveToNotIncluded = useCallback((key: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.key === key
          ? { ...attr, category: ATTRIBUTE_CATEGORIES.NOT_INCLUDED, selectedValue: null }
          : attr
      )
    );
  }, []);

  const handleValueChange = useCallback((key: string, value: string) => {
    setAttributes((prev) =>
      prev.map((attr) => (attr.key === key ? { ...attr, selectedValue: value } : attr))
    );
  }, []);

  // Fetch preview data
  const fetchPreviewData = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const result = await fetchAPI<{ enrichedCount?: number; totalCount?: number }>(
        API_ENDPOINTS.RPT1_PREVIEW(project.id)
      );
      if (result.error) throw new Error(result.error);

      const contextData = result.data!;
      const lockedAttrs = attributes
        .filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.LOCKED)
        .map((attr) => ({
          key: attr.key,
          displayName: attr.displayName,
          value: attr.selectedValue || '',
        }));

      const aiVars = attributes
        .filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.AI)
        .map((attr) => ({ key: attr.key, displayName: attr.displayName }));

      const queryRow: Record<string, string> = {};
      lockedAttrs.forEach((attr) => {
        queryRow[attr.key] = attr.value;
      });
      aiVars.forEach((attr) => {
        queryRow[attr.key] = TEXT.PREDICT_VALUE;
      });

      setPreviewData({
        contextRowCount: contextData.enrichedCount || 0,
        totalContextItems: contextData.totalCount || 0,
        missingEnrichmentCount: (contextData.totalCount || 0) - (contextData.enrichedCount || 0),
        lockedAttributes: lockedAttrs,
        aiVariables: aiVars,
        samplePayload: { rows: [{ '...': '(context rows from enriched articles)' }, queryRow] },
      });
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  }, [project.id, attributes]);

  const handlePreview = async () => {
    setPreviewDialogOpen(true);
    await fetchPreviewData();
  };

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
    setPreviewDialogOpen(false);
    setDesignName('');
    setTransmutingError(null);

    try {
      const result = await fetchAPI<{ designName: string; details?: string }>(
        API_ENDPOINTS.RPT1_PREDICT(project.id),
        {
          method: 'POST',
          body: JSON.stringify({
            lockedAttributes: buildLockedAttributes(attributes),
            aiVariables: buildAIVariables(attributes),
            successScore,
          }),
        }
      );

      if (result.error) {
        setTransmutingError(result.error);
        setTransmuting(false);
      } else {
        setDesignName(result.data!.designName);
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
    () => attributes.filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.LOCKED),
    [attributes]
  );
  const aiVariables = useMemo(
    () => attributes.filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.AI),
    [attributes]
  );
  const notIncludedAttributes = useMemo(
    () => attributes.filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.NOT_INCLUDED),
    [attributes]
  );

  const aiVariableCount = aiVariables.length;
  const isOverLimit = aiVariableCount > MAX_AI_VARIABLES;
  const canTransmute = aiVariableCount > 0 && aiVariableCount <= MAX_AI_VARIABLES && !transmuting;
  const isLoading = articleAttributeOptions === null || !attributesInitialized;

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
                        <Text className={styles.lockedCardTitle}>
                          {attr.displayName}
                          {attr.isArticleLevel && (
                            <span className={styles.lockedCardBadge}>{TEXT.ARTICLE_BADGE}</span>
                          )}
                        </Text>
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
                        <Text className={styles.aiCardTitle}>
                          {attr.displayName}
                          {attr.isArticleLevel && (
                            <span className={styles.lockedCardBadge}>{TEXT.ARTICLE_BADGE}</span>
                          )}
                        </Text>
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
                        <Text className={styles.notIncludedCardTitle}>
                          {attr.displayName}
                          {attr.isArticleLevel && (
                            <span className={styles.lockedCardBadge}>{TEXT.ARTICLE_BADGE}</span>
                          )}
                        </Text>
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
                onClick={handlePreview}
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
        headerText=""
        style={{ width: '400px' }}
      >
        <div className={styles.dialogContent}>
          {transmuting ? (
            <>
              <Text className={styles.dialogTitle}>{TEXT.TRANSMUTING_MESSAGE}</Text>
              <div className={styles.dialogIconContainer}>
                <Icon name={ICONS.LAB} className={styles.dialogAnimatedIcon} />
                <Icon name={ICONS.LAB} className={styles.dialogAnimatedIcon} />
                <Icon name={ICONS.LAB} className={styles.dialogAnimatedIcon} />
              </div>
            </>
          ) : transmutingError ? (
            <>
              <Text className={styles.dialogErrorTitle}>{TEXT.ERROR_TITLE}</Text>
              <Text className={styles.dialogErrorMessage}>{transmutingError}</Text>
              <Button design="Emphasized" onClick={() => setTransmutingDialogOpen(false)}>
                {TEXT.BUTTON_CLOSE}
              </Button>
            </>
          ) : (
            <>
              <Text className={styles.dialogSuccessTitle}>{TEXT.SUCCESS_TITLE}</Text>
              <Text className={styles.dialogSuccessName}>"{designName}"</Text>
              <Button design="Emphasized" onClick={() => setTransmutingDialogOpen(false)}>
                {TEXT.BUTTON_CLOSE}
              </Button>
            </>
          )}
        </div>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        headerText={TEXT.PREVIEW_DIALOG_TITLE}
        style={{ width: '600px' }}
        footer={
          <Bar
            endContent={
              <>
                <Button design="Transparent" onClick={() => setPreviewDialogOpen(false)}>
                  {TEXT.BUTTON_CANCEL}
                </Button>
                <Button
                  design="Emphasized"
                  onClick={handleTransmuteRequest}
                  disabled={!canTransmute || previewLoading || previewData?.contextRowCount === 0}
                >
                  Transmute
                </Button>
              </>
            }
          />
        }
      >
        {previewLoading ? (
          <div className={styles.previewLoading}>
            <BusyIndicator active size="M" />
            <Text className={styles.previewLoadingText}>{TEXT.LOADING_PREVIEW}</Text>
          </div>
        ) : previewData ? (
          <div className={styles.previewContent}>
            <div className={styles.previewSection}>
              <Title level="H5" className={styles.previewSectionTitle}>
                {TEXT.CONTEXT_SUMMARY_TITLE}
              </Title>
              <div className={styles.previewContextSummary}>
                <div className={styles.previewContextRow}>
                  <Text className={styles.previewContextLabel}>{TEXT.CONTEXT_ROWS}</Text>
                  <Text>
                    {previewData.contextRowCount} {TEXT.OF} {previewData.totalContextItems}{' '}
                    {TEXT.ARTICLES}
                  </Text>
                </div>
                {previewData.missingEnrichmentCount > 0 && (
                  <MessageStrip
                    design="Critical"
                    hideCloseButton
                    className={styles.previewMessageStrip}
                  >
                    {TEXT.WARNING_MISSING_ENRICHMENT(previewData.missingEnrichmentCount)}
                  </MessageStrip>
                )}
                {previewData.contextRowCount === 0 && (
                  <MessageStrip
                    design="Negative"
                    hideCloseButton
                    className={styles.previewMessageStrip}
                  >
                    {TEXT.WARNING_NO_CONTEXT}
                  </MessageStrip>
                )}
              </div>
            </div>

            <div className={styles.previewSection}>
              <Title level="H5" className={styles.previewSectionTitle}>
                {TEXT.QUERY_STRUCTURE_TITLE}
              </Title>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th className={styles.previewTableHeader}>
                      <Text>Attribute</Text>
                    </th>
                    <th className={styles.previewTableHeader}>
                      <Text>Type</Text>
                    </th>
                    <th className={styles.previewTableHeader}>
                      <Text>Value</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.lockedAttributes.map((attr) => (
                    <tr key={attr.key}>
                      <td className={styles.previewTableCell}>
                        <Text>{attr.displayName}</Text>
                      </td>
                      <td className={styles.previewTableCell}>
                        <Text>{TEXT.TYPE_LOCKED}</Text>
                      </td>
                      <td className={styles.previewTableCell}>
                        <Text>{attr.value}</Text>
                      </td>
                    </tr>
                  ))}
                  {previewData.aiVariables.map((attr) => (
                    <tr key={attr.key}>
                      <td className={styles.previewTableCell}>
                        <Text>{attr.displayName}</Text>
                      </td>
                      <td className={styles.previewTableCell}>
                        <Text className={styles.previewTableTextAI}>{TEXT.TYPE_AI}</Text>
                      </td>
                      <td className={styles.previewTableCell}>
                        <Text
                          className={`${styles.previewTableTextAI} ${styles.previewTableTextMonospace}`}
                        >
                          {TEXT.PREDICT_VALUE}
                        </Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <details className={styles.previewDetails}>
              <summary>
                <Text className={styles.previewDetailsText}>{TEXT.VIEW_RAW_JSON}</Text>
              </summary>
              <pre className={styles.previewJson}>
                {JSON.stringify(previewData.samplePayload, null, 2)}
              </pre>
            </details>
          </div>
        ) : null}
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
        <div style={{ padding: '1rem' }}>
          <MessageStrip design="Negative" hideCloseButton style={{ marginBottom: '1rem' }}>
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
