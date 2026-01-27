import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Bar,
  Button,
  Title,
  Text,
  Input,
  Card,
  CardHeader,
  CheckBox,
  List,
  ListItemStandard,
  BusyIndicator,
  MessageStrip,
  Breadcrumbs,
  BreadcrumbsItem,
  ObjectStatus,
  Icon,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/filter.js';
import '@ui5/webcomponents-icons/dist/sort-ascending.js';
import '@ui5/webcomponents-icons/dist/product.js';

import { api } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { usePersistedSelection, clearPersistedSelection } from '../hooks/usePersistedSelection';
import type { Taxonomy } from '../types/api';
import {
  STORAGE_KEY,
  DEBOUNCE_MS,
  BREADCRUMBS,
  LABELS,
  BUTTONS,
  ERROR_MESSAGES,
} from '../constants/productSelection';
import styles from '../styles/pages/ProductSelection.module.css';

function ProductSelection() {
  const navigate = useNavigate();

  // State
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = usePersistedSelection<string>(STORAGE_KEY);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortAZ, setSortAZ] = useState(true);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [articleCount, setArticleCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectCreating, setProjectCreating] = useState(false);

  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_MS);

  // Fetch taxonomy on mount
  const fetchTaxonomy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.taxonomy.get();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setTaxonomy(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.FETCH_TAXONOMY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  // Fetch counts with debounce
  const fetchCounts = useCallback(async (productTypes: string[]) => {
    if (productTypes.length === 0) {
      setRowCount(0);
      setArticleCount(0);
      return;
    }

    try {
      setCountLoading(true);

      const [transactionResult, articleResult] = await Promise.all([
        api.transactions.getCount(productTypes),
        api.transactions.getArticleCount(productTypes),
      ]);

      if (transactionResult.data) {
        setRowCount(transactionResult.data.count);
      }

      if (articleResult.data) {
        setArticleCount(articleResult.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch counts:', err);
      setRowCount(null);
      setArticleCount(null);
    } finally {
      setCountLoading(false);
    }
  }, []);

  // Debounced count fetch when selection changes
  useEffect(() => {
    // Extract product type names from selection keys
    const productTypes = Array.from(selectedTypes).map((key) => key.split('::')[1]);

    const timer = setTimeout(() => {
      fetchCounts(productTypes);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [selectedTypes, fetchCounts]);

  // Handlers
  const handleExpandAll = useCallback(() => {
    if (taxonomy) {
      if (expandedGroups.size === taxonomy.groups.length) {
        setExpandedGroups(new Set());
      } else {
        setExpandedGroups(new Set(taxonomy.groups.map((g) => g.productGroup)));
      }
    }
  }, [taxonomy, expandedGroups.size]);

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupName)) {
        newExpanded.delete(groupName);
      } else {
        newExpanded.add(groupName);
      }
      return newExpanded;
    });
  }, []);

  const toggleType = useCallback(
    (groupName: string, typeName: string) => {
      const key = `${groupName}::${typeName}`;
      setSelectedTypes((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(key)) {
          newSelected.delete(key);
        } else {
          newSelected.add(key);
        }
        return newSelected;
      });
    },
    [setSelectedTypes]
  );

  const handleClearAll = useCallback(() => {
    setSelectedTypes(new Set());
  }, [setSelectedTypes]);

  const handleCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleProceed = useCallback(async () => {
    if (!projectName.trim()) {
      setError(ERROR_MESSAGES.PROJECT_NAME_REQUIRED);
      return;
    }

    if (selectedTypes.size === 0) {
      setError(ERROR_MESSAGES.SELECT_TYPES_REQUIRED);
      return;
    }

    try {
      setProjectCreating(true);
      setError(null);

      // Extract product types and groups from selections
      const productTypes: string[] = [];
      const productGroups = new Set<string>();

      Array.from(selectedTypes).forEach((key) => {
        const [groupName, typeName] = key.split('::');
        productTypes.push(typeName);
        productGroups.add(groupName);
      });

      // Clear localStorage since we're proceeding
      clearPersistedSelection(STORAGE_KEY);

      // Navigate to context builder with project data
      navigate('/context-builder', {
        state: {
          projectData: {
            name: projectName.trim(),
            scopeConfig: {
              productTypes,
              productGroups: Array.from(productGroups),
            },
          },
        },
      });
    } catch (err) {
      console.error('Failed to proceed:', err);
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.PROCEED_FAILED);
    } finally {
      setProjectCreating(false);
    }
  }, [projectName, selectedTypes, navigate]);

  const handleBreadcrumbClick = useCallback(
    (e: CustomEvent) => {
      const text = e.detail.item.textContent?.trim();
      if (text === BREADCRUMBS.HOME) {
        navigate('/');
      }
    },
    [navigate]
  );

  // Memoized computations
  const filterTypes = useCallback(
    (types: string[]) => {
      if (!debouncedSearchQuery) return types;
      return types.filter((type) =>
        type.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    },
    [debouncedSearchQuery]
  );

  const sortedGroups = useMemo(() => {
    if (!taxonomy) return [];
    const groups = [...taxonomy.groups].filter((g) => g.productGroup !== 'Unknown');
    return sortAZ
      ? groups.sort((a, b) => a.productGroup.localeCompare(b.productGroup))
      : groups.sort((a, b) => b.productGroup.localeCompare(a.productGroup));
  }, [taxonomy, sortAZ]);

  const selectedCategoriesCount = useMemo(() => {
    return new Set(Array.from(selectedTypes).map((s) => s.split('::')[0])).size;
  }, [selectedTypes]);

  // Loading state
  if (loading) {
    return (
      <Page className={styles.loadingPage}>
        <div className={styles.loadingContainer}>
          <BusyIndicator active size="L" />
        </div>
      </Page>
    );
  }

  // Error state
  if (error && !taxonomy) {
    return (
      <Page className={styles.loadingPage}>
        <MessageStrip design="Negative">
          {ERROR_MESSAGES.LOAD_TAXONOMY}: {error}
        </MessageStrip>
        <Button onClick={fetchTaxonomy}>{BUTTONS.RETRY}</Button>
      </Page>
    );
  }

  return (
    <Page className={styles.pageContainer}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbsContainer}>
        <Breadcrumbs onItemClick={handleBreadcrumbClick}>
          <BreadcrumbsItem>{BREADCRUMBS.HOME}</BreadcrumbsItem>
          <BreadcrumbsItem>{BREADCRUMBS.PRODUCT_SELECTION}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* Header with Title and Stats */}
      <div className={styles.headerContainer}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.projectNameContainer}>
              <Text className={styles.projectNameLabel}>{LABELS.PROJECT_NAME_LABEL}</Text>
              <Input
                placeholder={LABELS.PROJECT_NAME_PLACEHOLDER}
                value={projectName}
                onInput={(e: CustomEvent) => setProjectName((e.target as HTMLInputElement).value)}
                className={styles.projectNameInput}
              />
            </div>
            <Title level="H2" className={styles.pageTitle}>
              {LABELS.PAGE_TITLE}
            </Title>
            <Text className={styles.pageSubtitle}>{LABELS.PAGE_SUBTITLE}</Text>
          </div>
          <div className={styles.statsContainer}>
            {countLoading ? (
              <ObjectStatus state="Information">{LABELS.LOADING_TEXT}</ObjectStatus>
            ) : rowCount !== null ? (
              <>
                <ObjectStatus state="Information">
                  {rowCount.toLocaleString()} {LABELS.TRANSACTION_ROWS}
                </ObjectStatus>
                {articleCount !== null && (
                  <ObjectStatus state="Information">
                    {articleCount.toLocaleString()} {LABELS.UNIQUE_ARTICLES}
                  </ObjectStatus>
                )}
              </>
            ) : (
              <ObjectStatus state="None">{LABELS.SELECT_TYPES_TEXT}</ObjectStatus>
            )}
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className={styles.searchActionsBar}>
        <Card className={styles.searchCard}>
          <div className={styles.searchCardContent}>
            {/* Filter input */}
            <div className={styles.filterInputContainer}>
              <Icon name="filter" className={styles.filterIcon} />
              <Input
                placeholder={LABELS.FILTER_PLACEHOLDER}
                value={searchQuery}
                onInput={(e: CustomEvent) => setSearchQuery((e.target as HTMLInputElement).value)}
                className={styles.filterInput}
              />
            </div>

            {/* Actions */}
            <div className={styles.actionsContainer}>
              <Button
                icon="sort-ascending"
                design="Transparent"
                onClick={() => setSortAZ((prev) => !prev)}
              >
                {sortAZ ? BUTTONS.SORT_AZ : BUTTONS.SORT_ZA}
              </Button>
              <Button design="Transparent" onClick={handleExpandAll}>
                {expandedGroups.size === sortedGroups.length
                  ? BUTTONS.COLLAPSE_ALL
                  : BUTTONS.EXPAND_ALL}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Product Groups Grid */}
      <div className={styles.cardsGrid}>
        {sortedGroups.map((group) => {
          const filteredTypes = filterTypes(group.productTypes);
          const isExpanded = expandedGroups.has(group.productGroup);

          // Hide groups with no matching types when searching
          if (filteredTypes.length === 0 && searchQuery) {
            return null;
          }

          return (
            <Card
              key={group.productGroup}
              className={styles.productCard}
              header={
                <CardHeader
                  titleText={group.productGroup}
                  subtitleText={`${filteredTypes.length} ${LABELS.ITEMS}`}
                  avatar={<Icon name="product" />}
                  interactive
                  onClick={() => toggleGroup(group.productGroup)}
                />
              }
            >
              {isExpanded && (
                <List className={styles.productList}>
                  {filteredTypes.map((type) => {
                    const key = `${group.productGroup}::${type}`;
                    const isSelected = selectedTypes.has(key);

                    return (
                      <ListItemStandard
                        key={type}
                        type="Active"
                        onClick={() => toggleType(group.productGroup, type)}
                      >
                        <CheckBox
                          checked={isSelected}
                          style={{ pointerEvents: 'none' }}
                          text={type}
                        />
                      </ListItemStandard>
                    );
                  })}
                </List>
              )}
            </Card>
          );
        })}
      </div>

      {/* Selection Footer Bar */}
      <Bar
        design="FloatingFooter"
        className={styles.footerBar}
        startContent={
          <Text>
            <span className={styles.footerText}>
              {selectedTypes.size} {LABELS.ITEMS_SELECTED}
            </span>
            {selectedTypes.size > 0 && (
              <span className={styles.footerSubtext}>
                {LABELS.FROM_CATEGORIES} {selectedCategoriesCount} {LABELS.CATEGORIES}
              </span>
            )}
          </Text>
        }
        endContent={
          <>
            <Button design="Transparent" onClick={handleClearAll}>
              {BUTTONS.CLEAR_ALL}
            </Button>
            <Button design="Transparent" onClick={handleCancel}>
              {BUTTONS.CANCEL}
            </Button>
            <Button
              design="Emphasized"
              onClick={handleProceed}
              disabled={selectedTypes.size === 0 || !projectName.trim() || projectCreating}
            >
              {projectCreating ? BUTTONS.PROCEED_CREATING : BUTTONS.PROCEED}
            </Button>
          </>
        }
      />
    </Page>
  );
}

export default ProductSelection;
