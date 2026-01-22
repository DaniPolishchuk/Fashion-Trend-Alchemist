import { useState, useMemo, useEffect, useCallback } from 'react';
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
  CheckBox,
  Select,
  Option,
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

interface ContextItem {
  articleId: string;
  productType: string;
  productGroup: string | null;
  colorFamily: string | null;
  patternStyle: string | null;
  detailDesc: string | null;
  velocityScore: number;
  enrichedAttributes: Record<string, string> | null;
  enrichmentError: string | null;
  imageUrl: string;
}

interface Summary {
  total: number;
  successful: number;
  pending: number;
  failed: number;
}

interface EnhancedTableTabProps {
  projectId: string;
  enrichmentStatus: 'idle' | 'running' | 'completed' | 'failed';
  currentArticleId: string | null;
}

type FilterType = 'all' | 'successful' | 'pending' | 'failed';
type SortField = 'velocityScore' | 'articleId' | 'productType';

const ITEMS_PER_PAGE = 25;

/**
 * Format attribute name: replace underscores with spaces and capitalize first letter
 */
function formatAttributeName(attr: string): string {
  return attr
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get color for velocity score based on value (0-100)
 * Returns SAP theme-compatible colors
 */
function getVelocityColor(score: number): string {
  if (score >= 70) return 'var(--sapPositiveColor)'; // Green for high performers
  if (score >= 40) return 'var(--sapNeutralColor)'; // Neutral/gray for medium
  return 'var(--sapNegativeColor)'; // Red for low performers
}

function EnhancedTableTab({ projectId, enrichmentStatus, currentArticleId }: EnhancedTableTabProps) {
  // Data state
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, successful: 0, pending: 0, failed: 0 });
  const [ontologyAttributes, setOntologyAttributes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [controlPanelExpanded, setControlPanelExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortField>('velocityScore');
  const [sortDesc, setSortDesc] = useState(true);
  const [failedFirst, setFailedFirst] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Retry state
  const [retryingItems, setRetryingItems] = useState<Set<string>>(new Set());
  const [retryingAll, setRetryingAll] = useState(false);

  // Fetch context items
  const fetchContextItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/context-items`);

      if (!response.ok) {
        throw new Error(`Failed to fetch context items: ${response.statusText}`);
      }

      const data = await response.json();
      setContextItems(data.items);
      setSummary(data.summary);
      setOntologyAttributes(data.ontologyAttributes);
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

  // Filter items
  const filteredItems = useMemo(() => {
    let items = contextItems;

    // Apply filter
    if (activeFilter === 'successful') {
      items = items.filter((item) => item.enrichedAttributes !== null);
    } else if (activeFilter === 'pending') {
      items = items.filter((item) => item.enrichedAttributes === null && item.enrichmentError === null);
    } else if (activeFilter === 'failed') {
      items = items.filter((item) => item.enrichmentError !== null);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.articleId.toLowerCase().includes(query) ||
          item.productType.toLowerCase().includes(query) ||
          (item.colorFamily && item.colorFamily.toLowerCase().includes(query)) ||
          (item.patternStyle && item.patternStyle.toLowerCase().includes(query))
      );
    }

    return items;
  }, [contextItems, activeFilter, searchQuery]);

  // Sort items
  const sortedItems = useMemo(() => {
    let items = [...filteredItems];

    // Sort by field
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'velocityScore') {
        comparison = a.velocityScore - b.velocityScore;
      } else if (sortBy === 'articleId') {
        comparison = a.articleId.localeCompare(b.articleId);
      } else if (sortBy === 'productType') {
        comparison = a.productType.localeCompare(b.productType);
      }
      return sortDesc ? -comparison : comparison;
    });

    // Move failed items to top if enabled
    if (failedFirst) {
      const failed = items.filter((item) => item.enrichmentError !== null);
      const rest = items.filter((item) => item.enrichmentError === null);
      items = [...failed, ...rest];
    }

    return items;
  }, [filteredItems, sortBy, sortDesc, failedFirst]);

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

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // Retry single item
  const handleRetryItem = async (articleId: string) => {
    if (enrichmentStatus === 'running') return;

    setRetryingItems((prev) => new Set(prev).add(articleId));

    try {
      const response = await fetch(`/api/projects/${projectId}/retry-enrichment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: [articleId] }),
      });

      if (!response.ok) {
        throw new Error('Failed to retry enrichment');
      }

      // Refresh data after a short delay to let enrichment start
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

  // Retry all failed items
  const handleRetryAllFailed = async () => {
    if (enrichmentStatus === 'running' || summary.failed === 0) return;

    setRetryingAll(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/retry-enrichment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty body = retry all failed
      });

      if (!response.ok) {
        throw new Error('Failed to retry enrichment');
      }

      // Refresh data after a short delay
      setTimeout(fetchContextItems, 1000);
    } catch (err) {
      console.error('Error retrying all failed:', err);
    } finally {
      setRetryingAll(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Article ID',
      'Product Type',
      'Product Group',
      'Color Family',
      'Pattern Style',
      'Velocity Score',
      'Status',
      ...ontologyAttributes,
    ];

    const rows = sortedItems.map((item) => {
      const status = item.enrichedAttributes ? 'Success' : item.enrichmentError ? 'Failed' : 'Pending';
      const baseData = [
        item.articleId,
        item.productType,
        item.productGroup || '',
        item.colorFamily || '',
        item.patternStyle || '',
        item.velocityScore.toFixed(2),
        status,
      ];

      const enrichedData = ontologyAttributes.map(
        (attr) => (item.enrichedAttributes && item.enrichedAttributes[attr]) || ''
      );

      return [...baseData, ...enrichedData];
    });

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `context-items-${projectId.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get status icon and color for an item
  const getStatusDisplay = (item: ContextItem) => {
    if (item.enrichedAttributes) {
      return { icon: 'accept', state: 'Positive' as const, label: 'Success' };
    }
    if (item.enrichmentError) {
      return { icon: 'alert', state: 'Negative' as const, label: 'Failed' };
    }
    return { icon: 'pending', state: 'Information' as const, label: 'Pending' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <BusyIndicator active size="L" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Text style={{ color: 'var(--sapNegativeColor)' }}>Error: {error}</Text>
        <div style={{ marginTop: '1rem' }}>
          <Button onClick={fetchContextItems}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Enrichment Control Panel */}
      <Card
        style={{ marginBottom: '1rem' }}
        header={
          <CardHeader
            titleText="Enrichment Status"
            subtitleText={
              enrichmentStatus === 'running'
                ? 'Processing...'
                : `${summary.successful} of ${summary.total} items enriched`
            }
            interactive
            onClick={() => setControlPanelExpanded(!controlPanelExpanded)}
            action={
              <Icon
                name={controlPanelExpanded ? 'slim-arrow-up' : 'slim-arrow-down'}
                style={{ color: 'var(--sapContent_IconColor)' }}
              />
            }
          />
        }
      >
        {controlPanelExpanded && (
          <div style={{ padding: '1rem' }}>
            {/* Status Summary */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ObjectStatus state="Positive">
                  <Icon name="accept" /> {summary.successful} Successful
                </ObjectStatus>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ObjectStatus state="Information">
                  <Icon name="pending" /> {summary.pending} Pending
                </ObjectStatus>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ObjectStatus state="Negative">
                  <Icon name="alert" /> {summary.failed} Failed
                </ObjectStatus>
              </div>
            </div>

            {/* Current Article Display */}
            {enrichmentStatus === 'running' && currentArticleId && (
              <div style={{ marginBottom: '1rem' }}>
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                  Processing: {currentArticleId}
                </Text>
              </div>
            )}

            {/* Retry Button */}
            {summary.failed > 0 && enrichmentStatus !== 'running' && (
              <Button
                design="Emphasized"
                icon="refresh"
                onClick={handleRetryAllFailed}
                disabled={retryingAll}
              >
                {retryingAll ? 'Retrying...' : `Retry All Failed (${summary.failed})`}
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Table Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'successful', 'pending', 'failed'] as FilterType[]).map((filter) => {
            const counts: Record<FilterType, number> = {
              all: summary.total,
              successful: summary.successful,
              pending: summary.pending,
              failed: summary.failed,
            };
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: '0.5rem 1rem',
                  border: `1px solid ${isActive ? '#0070F2' : 'var(--sapList_BorderColor)'}`,
                  borderRadius: '1rem',
                  background: isActive ? '#0070F2' : 'transparent',
                  color: isActive ? 'white' : 'var(--sapTextColor)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({counts[filter]})
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Select
            onChange={(e: any) => setSortBy(e.detail.selectedOption.dataset.value as SortField)}
            style={{ minWidth: '150px' }}
          >
            <Option data-value="velocityScore" selected={sortBy === 'velocityScore'}>
              Velocity Score
            </Option>
            <Option data-value="articleId" selected={sortBy === 'articleId'}>
              Article ID
            </Option>
            <Option data-value="productType" selected={sortBy === 'productType'}>
              Product Type
            </Option>
          </Select>

          <Button
            icon={sortDesc ? 'slim-arrow-down' : 'slim-arrow-up'}
            design="Transparent"
            onClick={() => setSortDesc(!sortDesc)}
            tooltip={sortDesc ? 'Descending' : 'Ascending'}
          />

          <CheckBox
            text="Failed first"
            checked={failedFirst}
            onChange={() => setFailedFirst(!failedFirst)}
          />

          <Input
            placeholder="Search..."
            icon={<Icon name="search" />}
            value={searchQuery}
            onInput={(e: any) => setSearchQuery(e.target.value)}
            style={{ width: '200px' }}
          />

          <Button icon="download" design="Transparent" onClick={handleExportCSV} tooltip="Export CSV" />
        </div>
      </div>

      {/* Results Header */}
      <div style={{ marginBottom: '0.5rem' }}>
        <Title level="H5">Context Items ({sortedItems.length})</Title>
      </div>

      {/* Data Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}
          >
            <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '60px' }}>Image</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Article ID</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Product Type</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '120px' }}>
                  Velocity Score
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Color Family</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Pattern Style</th>
                {/* Dynamic LLM attribute columns */}
                {ontologyAttributes.map((attr) => (
                  <th key={attr} style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                    {formatAttributeName(attr)}
                  </th>
                ))}
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '100px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7 + ontologyAttributes.length}
                    style={{ padding: '3rem', textAlign: 'center' }}
                  >
                    <Text style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {searchQuery ? 'No items match your search.' : 'No context items found.'}
                    </Text>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const statusInfo = getStatusDisplay(item);
                  const isProcessing = currentArticleId === item.articleId;
                  const isRetrying = retryingItems.has(item.articleId);

                  return (
                    <tr
                      key={item.articleId}
                      style={{
                        borderBottom: '1px solid var(--sapList_BorderColor)',
                        animation: isProcessing ? 'pulse 2s ease-in-out infinite' : undefined,
                        backgroundColor: isProcessing ? 'var(--sapInformationBackground)' : undefined,
                      }}
                    >
                      {/* Image */}
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--sapNeutralBackground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.articleId}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('ui5-icon')) {
                                const icon = document.createElement('ui5-icon');
                                icon.setAttribute('name', 'product');
                                icon.style.color = 'var(--sapContent_IconColor)';
                                icon.style.fontSize = '1.5rem';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        </div>
                      </td>

                      {/* Article ID */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Text style={{ fontWeight: 500 }}>{item.articleId}</Text>
                      </td>

                      {/* Product Type */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Text>{item.productType}</Text>
                      </td>

                      {/* Velocity Score */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Custom progress bar without percentage label */}
                          <div
                            style={{
                              width: '60px',
                              height: '6px',
                              backgroundColor: 'var(--sapContent_ForegroundBorderColor)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${item.velocityScore}%`,
                                height: '100%',
                                backgroundColor: getVelocityColor(item.velocityScore),
                                borderRadius: '3px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <Text
                            style={{
                              fontSize: '0.75rem',
                              color: getVelocityColor(item.velocityScore),
                              fontWeight: 600,
                              minWidth: '35px',
                            }}
                          >
                            {item.velocityScore.toFixed(1)}
                          </Text>
                        </div>
                      </td>

                      {/* Color Family */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Text>{item.colorFamily || '-'}</Text>
                      </td>

                      {/* Pattern Style */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Text>{item.patternStyle || '-'}</Text>
                      </td>

                      {/* Dynamic LLM attributes */}
                      {ontologyAttributes.map((attr) => (
                        <td key={attr} style={{ padding: '0.75rem 1rem' }}>
                          <Text>
                            {(item.enrichedAttributes && item.enrichedAttributes[attr]) || '-'}
                          </Text>
                        </td>
                      ))}

                      {/* Status */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <ObjectStatus state={statusInfo.state}>
                            <Icon name={statusInfo.icon} />
                          </ObjectStatus>
                          {item.enrichmentError && enrichmentStatus !== 'running' && (
                            <Button
                              icon="refresh"
                              design="Transparent"
                              tooltip={`Retry: ${item.enrichmentError}`}
                              onClick={() => handleRetryItem(item.articleId)}
                              disabled={isRetrying}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedItems.length > ITEMS_PER_PAGE && (
          <Bar
            design="Footer"
            startContent={
              <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length)} of {sortedItems.length}
              </Text>
            }
            endContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                  icon="navigation-left-arrow"
                  design="Transparent"
                  disabled={currentPage === 1}
                  onClick={handlePreviousPage}
                />
                <Text style={{ fontSize: '0.875rem', minWidth: '80px', textAlign: 'center' }}>
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  icon="navigation-right-arrow"
                  design="Transparent"
                  disabled={currentPage === totalPages}
                  onClick={handleNextPage}
                />
              </div>
            }
          />
        )}
      </Card>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { background-color: transparent; }
          50% { background-color: var(--sapInformationBackground); }
        }
      `}</style>
    </div>
  );
}

export default EnhancedTableTab;
