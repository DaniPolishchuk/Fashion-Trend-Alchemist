/**
 * Enhanced Table Tab
 * Optimized with constants, CSS modules, types, and helper functions
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  Title,
  Text,
  Input,
  Icon,
  Button,
  Bar,
  BusyIndicator,
  ObjectStatus,
  Select,
  Option,
  Dialog,
  CheckBox,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/download.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-icons/dist/refresh.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/alert.js';
import '@ui5/webcomponents-icons/dist/pending.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-down.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-up.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-icons/dist/zoom-in.js';
import '@ui5/webcomponents-icons/dist/decline.js';

// Constants, types, and utilities
import {
  ITEMS_PER_PAGE,
  POLL_INTERVAL,
  FILTER_TYPES,
  SORT_FIELDS,
  ICONS,
  TEXT,
  TOOLTIPS,
  API_ENDPOINTS,
  type FilterType,
  type SortField,
} from '../../constants/enhancedTableTab';
import type { ContextItem, Summary, EnhancedTableTabProps } from '../../types/enhancedTableTab';
import {
  formatAttributeName,
  getVelocityColor,
  getStatusDisplay,
  exportToCSV,
} from '../../utils/enhancedTableHelpers';
import { getConfidenceLabel } from '../../constants/projectHub';
import { fetchAPI } from '../../services/api/client';
import styles from '../../styles/pages/EnhancedTableTab.module.css';

function EnhancedTableTab({
  projectId,
  enrichmentStatus,
  currentArticleId,
  onContextChange,
  refreshTrigger,
}: EnhancedTableTabProps) {
  // Data state
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    successful: 0,
    pending: 0,
    failed: 0,
  });
  const [ontologyAttributes, setOntologyAttributes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [controlPanelExpanded, setControlPanelExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(FILTER_TYPES.ALL);
  const [sortBy, setSortBy] = useState<SortField>(SORT_FIELDS.VELOCITY_SCORE);
  const [sortDesc, setSortDesc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Retry state
  const [retryingItems, setRetryingItems] = useState<Set<string>>(new Set());
  const [retryingAll, setRetryingAll] = useState(false);

  // Expandable row state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string>('');

  // Fetch context items
  const fetchContextItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAPI<{
        items: ContextItem[];
        summary: Summary;
        ontologyAttributes: string[];
      }>(API_ENDPOINTS.CONTEXT_ITEMS(projectId));

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setContextItems(result.data.items);
        setSummary(result.data.summary);
        setOntologyAttributes(result.data.ontologyAttributes);
      }
    } catch (err) {
      console.error('Error fetching context items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load context items');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchContextItems();
  }, [fetchContextItems]);

  // Refresh data when refreshTrigger changes (e.g., after recalculation)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchContextItems();
    }
  }, [refreshTrigger, fetchContextItems]);

  // Auto-expand control panel when enrichment is running or there are failed items
  useEffect(() => {
    if (enrichmentStatus === 'running' || summary.failed > 0) {
      setControlPanelExpanded(true);
    }
  }, [enrichmentStatus, summary.failed]);

  // Refresh data when enrichment completes
  useEffect(() => {
    if (enrichmentStatus === 'completed') {
      fetchContextItems();
    }
  }, [enrichmentStatus, fetchContextItems]);

  // Poll for updates while enrichment is running
  useEffect(() => {
    if (enrichmentStatus !== 'running') return;

    const pollInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          const result = await fetchAPI<{
            items: ContextItem[];
            summary: Summary;
            ontologyAttributes: string[];
          }>(API_ENDPOINTS.CONTEXT_ITEMS(projectId));

          if (result.data) {
            setContextItems(result.data.items);
            setSummary(result.data.summary);
            setOntologyAttributes(result.data.ontologyAttributes);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [enrichmentStatus, projectId]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = contextItems;

    // Status filter
    if (activeFilter === FILTER_TYPES.SUCCESSFUL) {
      items = items.filter((item) => item.enrichedAttributes !== null);
    } else if (activeFilter === FILTER_TYPES.PENDING) {
      items = items.filter(
        (item) => item.enrichedAttributes === null && item.enrichmentError === null
      );
    } else if (activeFilter === FILTER_TYPES.FAILED) {
      items = items.filter((item) => item.enrichmentError !== null);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const baseMatch =
          item.articleId.toLowerCase().includes(query) ||
          item.productType.toLowerCase().includes(query) ||
          (item.productGroup && item.productGroup.toLowerCase().includes(query)) ||
          (item.colorFamily && item.colorFamily.toLowerCase().includes(query)) ||
          (item.patternStyle && item.patternStyle.toLowerCase().includes(query)) ||
          (item.specificColor && item.specificColor.toLowerCase().includes(query)) ||
          (item.colorIntensity && item.colorIntensity.toLowerCase().includes(query)) ||
          (item.productFamily && item.productFamily.toLowerCase().includes(query)) ||
          (item.customerSegment && item.customerSegment.toLowerCase().includes(query)) ||
          (item.styleConcept && item.styleConcept.toLowerCase().includes(query)) ||
          (item.fabricTypeBase && item.fabricTypeBase.toLowerCase().includes(query)) ||
          (item.detailDesc && item.detailDesc.toLowerCase().includes(query)) ||
          item.velocityScore.toString().includes(query);

        const enrichedMatch = item.enrichedAttributes
          ? Object.values(item.enrichedAttributes).some(
              (value) => value && value.toLowerCase().includes(query)
            )
          : false;

        return baseMatch || enrichedMatch;
      });
    }

    return items;
  }, [contextItems, activeFilter, searchQuery]);

  // Sort items
  const sortedItems = useMemo(() => {
    let items = [...filteredItems];
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === SORT_FIELDS.VELOCITY_SCORE) {
        comparison = a.velocityScore - b.velocityScore;
      } else if (sortBy === SORT_FIELDS.ARTICLE_ID) {
        comparison = a.articleId.localeCompare(b.articleId);
      } else if (sortBy === SORT_FIELDS.PRODUCT_TYPE) {
        comparison = a.productType.localeCompare(b.productType);
      } else if (sortBy === SORT_FIELDS.MATCH_CONFIDENCE) {
        // Sort by mismatch confidence (null treated as 0 - likely match)
        const confA = a.mismatchConfidence ?? 0;
        const confB = b.mismatchConfidence ?? 0;
        comparison = confA - confB;
      }
      return sortDesc ? -comparison : comparison;
    });
    return items;
  }, [filteredItems, sortBy, sortDesc]);

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  // Handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleRetryItem = async (articleId: string) => {
    if (enrichmentStatus === 'running') return;

    setRetryingItems((prev) => new Set(prev).add(articleId));

    try {
      const result = await fetchAPI(API_ENDPOINTS.RETRY_ENRICHMENT(projectId), {
        method: 'POST',
        body: JSON.stringify({ articleIds: [articleId] }),
      });

      if (result.error) throw new Error(result.error);
      setTimeout(fetchContextItems, 1000);
    } catch (err) {
      console.error('Error retrying enrichment:', err);
    } finally {
      setRetryingItems((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    }
  };

  const handleRetryAllFailed = async () => {
    if (enrichmentStatus === 'running' || summary.failed === 0) return;

    setRetryingAll(true);

    try {
      const result = await fetchAPI(API_ENDPOINTS.RETRY_ENRICHMENT(projectId), {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (result.error) throw new Error(result.error);
      setTimeout(fetchContextItems, 1000);
    } catch (err) {
      console.error('Error retrying all failed:', err);
    } finally {
      setRetryingAll(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(sortedItems, ontologyAttributes, projectId);
  };

  // Handle exclusion toggle
  const handleToggleExclusion = async (articleId: string, currentlyExcluded: boolean) => {
    try {
      const result = await fetchAPI(API_ENDPOINTS.EXCLUDE_ITEM(projectId, articleId), {
        method: 'PATCH',
        body: JSON.stringify({ isExcluded: !currentlyExcluded }),
      });

      if (result.error) throw new Error(result.error);

      // Update local state
      setContextItems((prev) =>
        prev.map((item) =>
          item.articleId === articleId ? { ...item, isExcluded: !currentlyExcluded } : item
        )
      );

      // Notify parent component of context change
      if (onContextChange) {
        onContextChange();
      }
    } catch (err) {
      console.error('Error updating exclusion:', err);
    }
  };

  const handleRowToggle = (articleId: string) => {
    setExpandedRowId((prev) => (prev === articleId ? null : articleId));
  };

  const handleImageClick = (imageUrl: string) => {
    setImageModalUrl(imageUrl);
    setImageModalOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <BusyIndicator active size="L" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Text className={styles.errorText}>Error: {error}</Text>
        <div className={styles.errorActions}>
          <Button onClick={fetchContextItems}>Retry</Button>
        </div>
      </div>
    );
  }

  const filterCounts = {
    [FILTER_TYPES.ALL]: summary.total,
    [FILTER_TYPES.SUCCESSFUL]: summary.successful,
    [FILTER_TYPES.PENDING]: summary.pending,
    [FILTER_TYPES.FAILED]: summary.failed,
  };

  return (
    <div>
      {/* Control Panel */}
      <Card
        className={styles.controlPanel}
        header={
          <CardHeader
            titleText={TEXT.PANEL_TITLE}
            subtitleText={
              enrichmentStatus === 'running'
                ? TEXT.PANEL_SUBTITLE_RUNNING
                : TEXT.PANEL_SUBTITLE_TEMPLATE(summary.successful, summary.total)
            }
            interactive
            onClick={() => setControlPanelExpanded(!controlPanelExpanded)}
            action={<Icon name={controlPanelExpanded ? ICONS.ARROW_UP : ICONS.ARROW_DOWN} />}
          />
        }
      >
        {controlPanelExpanded && (
          <div className={styles.controlPanelContent}>
            <div className={styles.statusSummary}>
              <div className={styles.statusItem} title={TOOLTIPS.STATUS_SUCCESSFUL}>
                <ObjectStatus state="Positive">
                  <Icon name={ICONS.ACCEPT} /> {summary.successful} {TEXT.FILTER_SUCCESSFUL}
                </ObjectStatus>
              </div>
              <div className={styles.statusItem} title={TOOLTIPS.STATUS_PENDING}>
                <ObjectStatus state="Information">
                  <Icon name={ICONS.PENDING} /> {summary.pending} {TEXT.FILTER_PENDING}
                </ObjectStatus>
              </div>
              <div className={styles.statusItem} title={TOOLTIPS.STATUS_FAILED}>
                <ObjectStatus state="Negative">
                  <Icon name={ICONS.ALERT} /> {summary.failed} {TEXT.FILTER_FAILED}
                </ObjectStatus>
              </div>
            </div>

            {enrichmentStatus === 'running' && currentArticleId && (
              <div className={styles.processingInfo}>
                <Text className={styles.processingText}>
                  {TEXT.PROCESSING_LABEL} {currentArticleId}
                </Text>
              </div>
            )}

            {summary.failed > 0 && enrichmentStatus !== 'running' && (
              <Button
                design="Emphasized"
                icon={ICONS.REFRESH}
                onClick={handleRetryAllFailed}
                disabled={retryingAll}
              >
                {retryingAll ? TEXT.RETRYING : TEXT.RETRY_ALL_BUTTON(summary.failed)}
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Table Controls */}
      <div className={styles.tableControls}>
        <div className={styles.filterChips}>
          {Object.values(FILTER_TYPES).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`${styles.filterChip} ${activeFilter === filter ? styles.filterChipActive : ''}`}
            >
              {TEXT[`FILTER_${filter.toUpperCase()}` as keyof typeof TEXT] as string} (
              {filterCounts[filter]})
            </button>
          ))}
        </div>

        <div className={styles.rightControls}>
          <Select
            onChange={(e: any) => setSortBy(e.detail.selectedOption.dataset.value as SortField)}
            className={styles.sortSelect}
          >
            <Option
              data-value={SORT_FIELDS.VELOCITY_SCORE}
              selected={sortBy === SORT_FIELDS.VELOCITY_SCORE}
              title={TOOLTIPS.SORT_VELOCITY}
            >
              {TEXT.SORT_VELOCITY}
            </Option>
            <Option
              data-value={SORT_FIELDS.ARTICLE_ID}
              selected={sortBy === SORT_FIELDS.ARTICLE_ID}
              title={TOOLTIPS.SORT_ARTICLE}
            >
              {TEXT.SORT_ARTICLE}
            </Option>
            <Option
              data-value={SORT_FIELDS.PRODUCT_TYPE}
              selected={sortBy === SORT_FIELDS.PRODUCT_TYPE}
              title={TOOLTIPS.SORT_PRODUCT}
            >
              {TEXT.SORT_PRODUCT}
            </Option>
            <Option
              data-value={SORT_FIELDS.MATCH_CONFIDENCE}
              selected={sortBy === SORT_FIELDS.MATCH_CONFIDENCE}
              title={TOOLTIPS.SORT_MATCH_CONFIDENCE}
            >
              {TEXT.SORT_MATCH_CONFIDENCE}
            </Option>
          </Select>

          <Button
            icon={sortDesc ? ICONS.SORT_DESC : ICONS.SORT_ASC}
            design="Transparent"
            onClick={() => setSortDesc(!sortDesc)}
            tooltip={TOOLTIPS.SORT_DIRECTION}
          />

          <Input
            placeholder={TEXT.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onInput={(e: any) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            title={TOOLTIPS.SEARCH_BAR}
          />

          <Button
            icon={ICONS.DOWNLOAD}
            design="Transparent"
            onClick={handleExportCSV}
            tooltip={TOOLTIPS.EXPORT_CSV}
          />
        </div>
      </div>

      {/* Results Header */}
      <div className={styles.resultsHeader}>
        <Title level="H5">
          {TEXT.RESULTS_TITLE} ({sortedItems.length})
        </Title>
      </div>

      {/* Data Table */}
      <Card>
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCellExpand}></th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellInclude}`}
                  title={TOOLTIPS.COL_INCLUDE}
                >
                  {TEXT.COL_INCLUDE}
                </th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellImage}`}
                  title={TOOLTIPS.COL_IMAGE}
                >
                  {TEXT.COL_IMAGE}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_ARTICLE_ID}>
                  {TEXT.COL_ARTICLE_ID}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_PRODUCT_TYPE}>
                  {TEXT.COL_PRODUCT_TYPE}
                </th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellVelocity}`}
                  title={TOOLTIPS.COL_VELOCITY}
                >
                  {TEXT.COL_VELOCITY}
                </th>
                <th
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellConfidence}`}
                  title={TOOLTIPS.COL_MATCH_CONFIDENCE}
                >
                  {TEXT.COL_MATCH_CONFIDENCE}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_PATTERN}>
                  {TEXT.COL_PATTERN}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_COLOR_FAMILY}>
                  {TEXT.COL_COLOR_FAMILY}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_SPECIFIC_COLOR}>
                  {TEXT.COL_SPECIFIC_COLOR}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_COLOR_INTENSITY}>
                  {TEXT.COL_COLOR_INTENSITY}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_PRODUCT_FAMILY}>
                  {TEXT.COL_PRODUCT_FAMILY}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_CUSTOMER_SEGMENT}>
                  {TEXT.COL_CUSTOMER_SEGMENT}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_STYLE_CONCEPT}>
                  {TEXT.COL_STYLE_CONCEPT}
                </th>
                <th className={styles.tableHeaderCell} title={TOOLTIPS.COL_FABRIC_TYPE}>
                  {TEXT.COL_FABRIC_TYPE}
                </th>
                {ontologyAttributes.map((attr) => (
                  <th
                    key={attr}
                    className={styles.tableHeaderCell}
                    title={TOOLTIPS.COL_ONTOLOGY_ATTRIBUTE}
                  >
                    {formatAttributeName(attr)}
                  </th>
                ))}
                <th
                  className={`${styles.tableHeaderCellCenter} ${styles.tableHeaderCellStatus}`}
                  title={TOOLTIPS.COL_STATUS}
                >
                  {TEXT.COL_STATUS}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={16 + ontologyAttributes.length} className={styles.emptyCell}>
                    <Text className={styles.emptyText}>
                      {searchQuery ? TEXT.NO_MATCH : TEXT.NO_ITEMS}
                    </Text>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const statusInfo = getStatusDisplay(item);
                  const isProcessing = currentArticleId === item.articleId;
                  const isRetrying = retryingItems.has(item.articleId);
                  const isExpanded = expandedRowId === item.articleId;
                  const confidenceInfo = getConfidenceLabel(item.mismatchConfidence);

                  return (
                    <React.Fragment key={item.articleId}>
                      {/* Main Row */}
                      <tr
                        className={`${styles.tableRow} ${isExpanded ? styles.tableRowExpanded : ''} ${isProcessing ? styles.tableRowProcessing : ''} ${item.isExcluded ? styles.tableRowExcluded : ''}`}
                        onClick={() => handleRowToggle(item.articleId)}
                      >
                        <td className={styles.tableCellExpand}>
                          <Icon name={isExpanded ? ICONS.ARROW_DOWN : ICONS.ARROW_RIGHT} />
                        </td>

                        <td
                          className={styles.tableCellInclude}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CheckBox
                            checked={!item.isExcluded}
                            onChange={() => handleToggleExclusion(item.articleId, item.isExcluded)}
                          />
                        </td>

                        <td className={styles.tableCellImage}>
                          <div className={styles.imageThumbnail}>
                            <img
                              src={item.imageUrl}
                              alt={item.articleId}
                              className={styles.imageThumbnailImg}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('ui5-icon')) {
                                  const icon = document.createElement('ui5-icon');
                                  icon.setAttribute('name', ICONS.PRODUCT);
                                  icon.style.fontSize = '1.5rem';
                                  parent.appendChild(icon);
                                }
                              }}
                            />
                          </div>
                        </td>

                        <td className={styles.tableCell}>
                          <Text className={styles.articleId}>{item.articleId}</Text>
                        </td>

                        <td className={styles.tableCell}>
                          <Text>{item.productType}</Text>
                        </td>

                        <td className={styles.tableCell}>
                          <div className={styles.velocityContainer}>
                            <div className={styles.velocityBar}>
                              <div
                                className={styles.velocityBarFill}
                                style={{
                                  width: `${item.velocityScore}%`,
                                  backgroundColor: getVelocityColor(item.velocityScore),
                                }}
                              />
                            </div>
                            <Text
                              className={styles.velocityScore}
                              style={{ color: getVelocityColor(item.velocityScore) }}
                            >
                              {item.velocityScore.toFixed(1)}
                            </Text>
                          </div>
                        </td>

                        <td className={styles.tableCellConfidence}>
                          <Text style={{ color: confidenceInfo.color, fontWeight: 500 }}>
                            {confidenceInfo.label}
                          </Text>
                        </td>

                        <td className={styles.tableCell}>
                          <Text>{item.patternStyle || TEXT.EMPTY_VALUE}</Text>
                        </td>
                        <td className={styles.tableCell}>
                          <Text>{item.colorFamily || TEXT.EMPTY_VALUE}</Text>
                        </td>
                        <td className={styles.tableCell}>
                          <Text>{item.specificColor || TEXT.EMPTY_VALUE}</Text>
                        </td>
                        <td className={styles.tableCell}>
                          <Text>{item.colorIntensity || TEXT.EMPTY_VALUE}</Text>
                        </td>
                        <td className={styles.tableCell}>
                          <Text>{item.productFamily || TEXT.EMPTY_VALUE}</Text>
                        </td>
                        <td className={styles.tableCell}>
                          <Text>{item.customerSegment || TEXT.EMPTY_VALUE}</Text>
                        </td>
                        <td className={styles.tableCell}>
                          <Text>{item.styleConcept || TEXT.EMPTY_VALUE}</Text>
                        </td>
                        <td className={styles.tableCell}>
                          <Text>{item.fabricTypeBase || TEXT.EMPTY_VALUE}</Text>
                        </td>

                        {ontologyAttributes.map((attr) => (
                          <td key={attr} className={styles.tableCell}>
                            <Text>
                              {(item.enrichedAttributes && item.enrichedAttributes[attr]) ||
                                TEXT.EMPTY_VALUE}
                            </Text>
                          </td>
                        ))}

                        <td className={styles.tableCellCenter} onClick={(e) => e.stopPropagation()}>
                          <div className={styles.statusCell}>
                            <ObjectStatus state={statusInfo.state}>
                              <Icon name={statusInfo.icon} />
                            </ObjectStatus>
                            {item.enrichmentError && enrichmentStatus !== 'running' && (
                              <Button
                                icon={ICONS.REFRESH}
                                design="Transparent"
                                tooltip={TEXT.RETRY_TOOLTIP(item.enrichmentError)}
                                onClick={() => handleRetryItem(item.articleId)}
                                disabled={isRetrying}
                              />
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className={styles.expandedRow}>
                          <td
                            colSpan={16 + ontologyAttributes.length}
                            className={styles.expandedContent}
                          >
                            <div className={styles.expandedLayout}>
                              <div
                                className={styles.imageDetail}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageClick(item.imageUrl);
                                }}
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.articleId}
                                  className={styles.imageDetailImg}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className={styles.imageZoomIcon}>
                                  <Icon name={ICONS.ZOOM_IN} className={styles.imageZoomIconSvg} />
                                </div>
                              </div>

                              <div className={styles.expandedDetails}>
                                <Title level="H5" className={styles.detailsTitle}>
                                  {TEXT.DETAILS_TITLE}
                                </Title>

                                <div className={styles.detailsGrid}>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.LABEL_PRODUCT_GROUP}
                                    </Text>
                                    <Text className={styles.detailValue}>
                                      {item.productGroup || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.COL_PRODUCT_TYPE}
                                    </Text>
                                    <Text className={styles.detailValue}>{item.productType}</Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>{TEXT.COL_PATTERN}</Text>
                                    <Text className={styles.detailValue}>
                                      {item.patternStyle || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.COL_COLOR_FAMILY}
                                    </Text>
                                    <Text className={styles.detailValue}>
                                      {item.colorFamily || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.COL_SPECIFIC_COLOR}
                                    </Text>
                                    <Text className={styles.detailValue}>
                                      {item.specificColor || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.COL_COLOR_INTENSITY}
                                    </Text>
                                    <Text className={styles.detailValue}>
                                      {item.colorIntensity || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.COL_PRODUCT_FAMILY}
                                    </Text>
                                    <Text className={styles.detailValue}>
                                      {item.productFamily || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.COL_CUSTOMER_SEGMENT}
                                    </Text>
                                    <Text className={styles.detailValue}>
                                      {item.customerSegment || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.COL_STYLE_CONCEPT}
                                    </Text>
                                    <Text className={styles.detailValue}>
                                      {item.styleConcept || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.COL_FABRIC_TYPE}
                                    </Text>
                                    <Text className={styles.detailValue}>
                                      {item.fabricTypeBase || TEXT.EMPTY_VALUE}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className={styles.detailLabel}>{TEXT.COL_VELOCITY}</Text>
                                    <Text
                                      className={`${styles.detailValue} ${styles.detailValueVelocity}`}
                                      style={{ color: getVelocityColor(item.velocityScore) }}
                                    >
                                      {item.velocityScore.toFixed(2)}
                                    </Text>
                                  </div>
                                </div>

                                {item.detailDesc && (
                                  <div className={styles.descriptionSection}>
                                    <Text className={styles.detailLabel}>
                                      {TEXT.LABEL_DESCRIPTION}
                                    </Text>
                                    <Text className={styles.detailValue}>{item.detailDesc}</Text>
                                  </div>
                                )}

                                {item.enrichedAttributes &&
                                  Object.keys(item.enrichedAttributes).length > 0 && (
                                    <div className={styles.enrichedSection}>
                                      <Text className={styles.enrichedTitle}>
                                        {TEXT.ENRICHED_TITLE}
                                      </Text>
                                      <div className={styles.enrichedGrid}>
                                        {Object.entries(item.enrichedAttributes).map(
                                          ([key, value]) => (
                                            <div key={key}>
                                              <Text className={styles.detailLabel}>
                                                {formatAttributeName(key)}
                                              </Text>
                                              <Text className={styles.detailValue}>{value}</Text>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {item.enrichmentError && (
                                  <div className={styles.errorSection}>
                                    <Text className={styles.errorSectionTitle}>
                                      {TEXT.ERROR_TITLE}
                                    </Text>
                                    <Text className={styles.errorSectionText}>
                                      {item.enrichmentError}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sortedItems.length > ITEMS_PER_PAGE && (
          <Bar
            design="Footer"
            startContent={
              <Text className={styles.paginationText}>
                {TEXT.SHOWING_TEMPLATE(
                  (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length),
                  sortedItems.length
                )}
              </Text>
            }
            endContent={
              <div className={styles.paginationControls}>
                <Button
                  icon={ICONS.NAV_LEFT}
                  design="Transparent"
                  disabled={currentPage === 1}
                  onClick={handlePreviousPage}
                />
                <Text className={styles.paginationPage}>
                  {TEXT.PAGE_TEMPLATE(currentPage, totalPages)}
                </Text>
                <Button
                  icon={ICONS.NAV_RIGHT}
                  design="Transparent"
                  disabled={currentPage === totalPages}
                  onClick={handleNextPage}
                />
              </div>
            }
          />
        )}
      </Card>

      {/* Image Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        header={
          <div className={styles.modalHeader}>
            <Title level="H5" className={styles.modalTitle}>
              {TEXT.MODAL_TITLE}
            </Title>
            <Button
              design="Transparent"
              icon={ICONS.DECLINE}
              onClick={() => setImageModalOpen(false)}
              className={styles.modalCloseButton}
            />
          </div>
        }
      >
        <div className={styles.modalImageContainer}>
          <img src={imageModalUrl} alt="Product" className={styles.modalImage} />
        </div>
      </Dialog>
    </div>
  );
}

export default EnhancedTableTab;
