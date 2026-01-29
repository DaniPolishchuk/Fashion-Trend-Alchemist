import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Page,
  Button,
  Title,
  Text,
  Card,
  BusyIndicator,
  IllustratedMessage,
  Bar,
  Icon,
  Dialog,
  CheckBox,
  Input,
  Label,
  Breadcrumbs,
  BreadcrumbsItem,
  MessageStrip,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/calendar.js';
import '@ui5/webcomponents-icons/dist/group.js';
import '@ui5/webcomponents-icons/dist/palette.js';
import '@ui5/webcomponents-icons/dist/display.js';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-icons/dist/list.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/activate.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/lightbulb.js';
import '@ui5/webcomponents-icons/dist/filter.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-down.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-icons/dist/zoom-in.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';

import type { FiltersResponse } from '@fashion/types';
import { AttributeGenerationDialog } from '../components/AttributeGenerationDialog';
import { FilterCardItem } from '../components/FilterCardItem';
import { api } from '../services/api';
import { useDateRange } from '../hooks/useDateRange';
import { useContextFilters } from '../hooks/useContextFilters';
import { formatDateString, hasValidDateRange } from '../utils/dateValidation';
import { addDateParams, addFilterParams } from '../utils/urlParams';
import type { SeasonType } from '../constants/contextBuilder';
import {
  HIDDEN_COLUMNS,
  PAGINATION,
  SEASONS,
  BREADCRUMBS,
  LABELS,
  BUTTONS,
  FILTER_KEYS,
  FILTER_TITLES,
  FILTER_ICONS,
  ERROR_MESSAGES,
  MESSAGES,
  TABLE,
} from '../constants/contextBuilder';
import styles from '../styles/pages/ContextBuilder.module.css';

interface ProjectData {
  name: string;
  scopeConfig: {
    productTypes: string[];
    productGroups: string[];
  };
}

// Attribute cache utilities
const generateAttributeCacheKey = (productTypes: string[]): string => {
  return `attributeSchema_${[...productTypes].sort().join('_')}`;
};

const getCachedAttributes = (productTypes: string[]) => {
  try {
    const key = generateAttributeCacheKey(productTypes);
    const cached = sessionStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Failed to read from cache:', e);
  }
  return null;
};

const setCachedAttributes = (productTypes: string[], data: any) => {
  try {
    const key = generateAttributeCacheKey(productTypes);
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to write to cache:', e);
  }
};

function ContextBuilder() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Global State ---
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Custom Hooks ---
  const dateRange = useDateRange();
  const filters = useContextFilters();

  // --- Filter Options ---
  const [filterOptions, setFilterOptions] = useState<FiltersResponse | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // --- Dialog State ---
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [tempSelection, setTempSelection] = useState<string[]>([]);

  // --- Attribute Generation Dialog State ---
  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false);
  const [generatedAttributes, setGeneratedAttributes] = useState<any>(null);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [ontologySchema, setOntologySchema] = useState<any>(null);

  // --- Data State ---
  const [products, setProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lockingContext, setLockingContext] = useState(false);

  // --- Error Dialog State ---
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');

  // --- Expandable Row State ---
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // --- Image Modal State ---
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string>('');

  // --- Initial Load ---
  useEffect(() => {
    const projectData = (location.state as any)?.projectData;

    if (!projectData) {
      setError(ERROR_MESSAGES.NO_PROJECT_DATA);
      setLoading(false);
      return;
    }

    setProject(projectData);
    setLoading(false);
  }, [location.state]);

  // --- Cleanup: Clear attribute cache when leaving page ---
  useEffect(() => {
    return () => {
      if (project?.scopeConfig?.productTypes) {
        const key = generateAttributeCacheKey(project.scopeConfig.productTypes);
        sessionStorage.removeItem(key);
      }
    };
  }, [project]);

  // --- Fetch Filters ---
  const fetchFilterOptions = useCallback(async () => {
    if (!project?.scopeConfig?.productTypes) return;

    try {
      setFilterOptionsLoading(true);
      const result = await api.filters.getAttributes({
        types: project.scopeConfig.productTypes.join(','),
        season: dateRange.selectedSeason || undefined,
        mdFrom:
          !dateRange.selectedSeason &&
          hasValidDateRange(
            dateRange.startDay,
            dateRange.startMonth,
            dateRange.endDay,
            dateRange.endMonth
          )
            ? formatDateString(dateRange.startDay, dateRange.startMonth)
            : undefined,
        mdTo:
          !dateRange.selectedSeason &&
          hasValidDateRange(
            dateRange.startDay,
            dateRange.startMonth,
            dateRange.endDay,
            dateRange.endMonth
          )
            ? formatDateString(dateRange.endDay, dateRange.endMonth)
            : undefined,
      });

      if (result.error) throw new Error(result.error);
      if (result.data) setFilterOptions(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, [
    project,
    dateRange.selectedSeason,
    dateRange.startDay,
    dateRange.startMonth,
    dateRange.endDay,
    dateRange.endMonth,
  ]);

  useEffect(() => {
    if (project?.scopeConfig?.productTypes && project.scopeConfig.productTypes.length > 0) {
      const hasAnyDateInput =
        dateRange.startDay || dateRange.startMonth || dateRange.endDay || dateRange.endMonth;
      const shouldFetch =
        dateRange.selectedSeason ||
        !hasAnyDateInput ||
        hasValidDateRange(
          dateRange.startDay,
          dateRange.startMonth,
          dateRange.endDay,
          dateRange.endMonth
        );

      if (shouldFetch) {
        fetchFilterOptions();
      }
    }
  }, [
    project,
    fetchFilterOptions,
    dateRange.selectedSeason,
    dateRange.startDay,
    dateRange.startMonth,
    dateRange.endDay,
    dateRange.endMonth,
  ]);

  // --- Fetch Products ---
  const fetchProducts = useCallback(async () => {
    if (!project?.scopeConfig?.productTypes?.length) return;

    try {
      setProductsLoading(true);
      setProducts([]); // Clear products to show consistent loading animation
      setTotalProducts(0); // Clear count to match loading state
      const params = new URLSearchParams({
        limit: String(PAGINATION.ITEMS_PER_PAGE),
        offset: String((currentPage - 1) * PAGINATION.ITEMS_PER_PAGE),
        types: project.scopeConfig.productTypes.join(','),
      });

      addDateParams(
        params,
        dateRange.selectedSeason,
        dateRange,
        formatDateString,
        hasValidDateRange
      );
      addFilterParams(params, filters.getAllFilters());

      const result = await api.products.list(params);

      if (result.error) throw new Error(result.error);
      if (result.data) {
        setProducts(result.data.items || []);
        setTotalProducts(result.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  }, [
    project,
    currentPage,
    dateRange.selectedSeason,
    dateRange.startDay,
    dateRange.startMonth,
    dateRange.endDay,
    dateRange.endMonth,
    filters.selectedProductGroup,
    filters.selectedProductFamily,
    filters.selectedStyleConcept,
    filters.selectedColorFamily,
    filters.selectedCustomerSegment,
    filters.selectedPattern,
    filters.selectedSpecificColor,
    filters.selectedColorIntensity,
    filters.selectedFabricType,
  ]);

  useEffect(() => {
    if (project?.scopeConfig?.productTypes && project.scopeConfig.productTypes.length > 0) {
      const hasAnyDateInput =
        dateRange.startDay || dateRange.startMonth || dateRange.endDay || dateRange.endMonth;
      const shouldFetch =
        dateRange.selectedSeason ||
        !hasAnyDateInput ||
        hasValidDateRange(
          dateRange.startDay,
          dateRange.startMonth,
          dateRange.endDay,
          dateRange.endMonth
        );

      if (shouldFetch) {
        const timer = setTimeout(() => {
          fetchProducts();
        }, PAGINATION.DEBOUNCE_MS);
        return () => clearTimeout(timer);
      }
    }
  }, [
    project,
    fetchProducts,
    dateRange.selectedSeason,
    dateRange.startDay,
    dateRange.startMonth,
    dateRange.endDay,
    dateRange.endMonth,
    filters.selectedProductGroup,
    filters.selectedProductFamily,
    filters.selectedStyleConcept,
    filters.selectedColorFamily,
    filters.selectedCustomerSegment,
    filters.selectedPattern,
    filters.selectedSpecificColor,
    filters.selectedColorIntensity,
    filters.selectedFabricType,
  ]);

  // --- Handlers: Reset & Dialog ---
  const handleResetFilters = useCallback(() => {
    filters.resetAll();
    dateRange.resetDates();
    setCurrentPage(1);
  }, [filters, dateRange]);

  const openDialog = useCallback(
    (filterKey: string, currentSelection: string[]) => {
      setActiveDialog(filterKey);
      // If no current selection, select all options by default
      if (currentSelection.length === 0 && filterOptions) {
        const allOptions = (filterOptions as any)[filterKey] || [];
        setTempSelection([...allOptions]);
      } else {
        setTempSelection([...currentSelection]);
      }
    },
    [filterOptions]
  );

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setTempSelection([]);
  }, []);

  const applyDialog = useCallback(() => {
    if (!activeDialog) return;
    filters.updateFilter(activeDialog, tempSelection);
    setCurrentPage(1);
    closeDialog();
  }, [activeDialog, tempSelection, filters, closeDialog]);

  const getDialogOptions = useCallback(() => {
    if (!activeDialog || !filterOptions) return [];
    return (filterOptions as any)[activeDialog] || [];
  }, [activeDialog, filterOptions]);

  const handleSelectDeselectAll = useCallback(() => {
    const allOptions = getDialogOptions();
    if (tempSelection.length === allOptions.length) {
      // All selected, so deselect all
      setTempSelection([]);
    } else {
      // Some or none selected, so select all
      setTempSelection([...allOptions]);
    }
  }, [tempSelection, getDialogOptions]);

  // --- Handlers: Attribute Generation ---
  const generateAttributes = useCallback(
    async (withFeedback = false) => {
      if (!project?.scopeConfig?.productTypes) return;

      try {
        setAttributesLoading(true);

        const result = await api.attributes.generate({
          productTypes: project.scopeConfig.productTypes,
          feedback: withFeedback ? feedbackText : undefined,
          conversationHistory: withFeedback ? conversationHistory : undefined,
        });

        if (result.error) throw new Error(result.error);
        if (result.data) {
          setGeneratedAttributes(result.data.attributeSet);
          setConversationHistory(result.data.conversationHistory || []);
          if (withFeedback) setFeedbackText('');

          // Cache the generated attributes
          setCachedAttributes(project.scopeConfig.productTypes, {
            attributes: result.data.attributeSet,
            conversationHistory: result.data.conversationHistory || [],
            timestamp: Date.now(),
            productTypes: project.scopeConfig.productTypes,
          });
        }
      } catch (err) {
        console.error(ERROR_MESSAGES.GENERATE_ATTRIBUTES_FAILED, err);
      } finally {
        setAttributesLoading(false);
      }
    },
    [project, feedbackText, conversationHistory]
  );

  const handleOpenAttributeDialog = useCallback(() => {
    if (!project?.scopeConfig?.productTypes) return;

    setAttributeDialogOpen(true);
    setFeedbackText('');

    // Check cache first
    const cached = getCachedAttributes(project.scopeConfig.productTypes);
    if (cached) {
      setGeneratedAttributes(cached.attributes);
      setConversationHistory(cached.conversationHistory || []);
    } else {
      setConversationHistory([]);
      setGeneratedAttributes(null);
      generateAttributes();
    }
  }, [project, generateAttributes]);

  const handleCloseAttributeDialog = useCallback(() => {
    setAttributeDialogOpen(false);
    setGeneratedAttributes(null);
    setFeedbackText('');
    setConversationHistory([]);
  }, []);

  const handleRegenerate = useCallback(() => {
    if (feedbackText.trim()) {
      generateAttributes(true);
    } else {
      generateAttributes(false);
    }
  }, [feedbackText, generateAttributes]);

  const handleSaveAttributes = useCallback(
    (attributes: any) => {
      if (!project?.scopeConfig?.productTypes) return;

      setOntologySchema(attributes);

      // Update cache with the final attributes (including manual edits)
      setCachedAttributes(project.scopeConfig.productTypes, {
        attributes,
        conversationHistory,
        timestamp: Date.now(),
        productTypes: project.scopeConfig.productTypes,
      });

      setAttributeDialogOpen(false);
    },
    [project, conversationHistory]
  );

  // --- Handler: Lock Context ---
  const handleLockContext = useCallback(async () => {
    if (!project?.name || !project?.scopeConfig) return;

    try {
      setLockingContext(true);
      setError(null);

      const createResult = await api.projects.create({
        name: project.name,
        scopeConfig: project.scopeConfig,
      });

      if (createResult.error) throw new Error(createResult.error);
      if (!createResult.data) throw new Error(ERROR_MESSAGES.CREATE_PROJECT_FAILED);

      const createdProject = createResult.data;
      console.log('Project created successfully:', createdProject);

      const params = new URLSearchParams();
      addDateParams(
        params,
        dateRange.selectedSeason,
        dateRange,
        formatDateString,
        hasValidDateRange
      );
      addFilterParams(params, filters.getAllFilters());

      const previewResult = await api.projects.previewContext(createdProject.id, params);

      if (previewResult.error) throw new Error(previewResult.error);
      if (!previewResult.data) throw new Error(ERROR_MESSAGES.PREVIEW_CONTEXT_FAILED);

      const articles = previewResult.data;
      console.log('Retrieved articles for locking:', articles.length);

      const seasonConfig = dateRange.selectedSeason
        ? { season: dateRange.selectedSeason }
        : hasValidDateRange(
              dateRange.startDay,
              dateRange.startMonth,
              dateRange.endDay,
              dateRange.endMonth
            )
          ? {
              startDate: formatDateString(dateRange.startDay, dateRange.startMonth),
              endDate: formatDateString(dateRange.endDay, dateRange.endMonth),
            }
          : null;

      const lockResult = await api.projects.lockContext(createdProject.id, {
        articles,
        seasonConfig,
        ontologySchema,
      });

      if (lockResult.error) throw new Error(lockResult.error);
      console.log('Context locked successfully:', lockResult.data);

      setProject({
        ...createdProject,
        scopeConfig: project.scopeConfig,
      });

      navigate(`/project/${createdProject.id}`);
    } catch (err) {
      console.error('Failed to create project and lock context:', err);
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.LOCK_CONTEXT_FAILED;
      setErrorDialogMessage(errorMessage);
      setErrorDialogOpen(true);
    } finally {
      setLockingContext(false);
    }
  }, [project, dateRange, filters, ontologySchema, navigate]);

  // --- Handlers: Navigation & Pagination ---
  const handleBreadcrumbClick = useCallback(
    (e: CustomEvent) => {
      const text = e.detail.item.textContent?.trim();
      if (text === BREADCRUMBS.HOME) {
        navigate('/');
      } else if (text === BREADCRUMBS.PRODUCT_SELECTION) {
        navigate('/product-selection');
      }
    },
    [navigate]
  );

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  // --- Handlers: Expandable Rows & Image Modal ---
  const handleRowToggle = useCallback((articleId: string) => {
    setExpandedRowId((prev) => (prev === articleId ? null : articleId));
  }, []);

  const handleImageClick = useCallback((imageUrl: string) => {
    setImageModalUrl(imageUrl);
    setImageModalOpen(true);
  }, []);

  const getImageUrl = useCallback((articleId: string) => {
    const filerBaseUrl =
      import.meta.env.VITE_FILER_BASE_URL || 'https://seaweedfs.a549aaa.kyma.ondemand.com';
    const bucket = import.meta.env.VITE_FILER_BUCKET || 'images';
    const first2Digits = articleId.substring(0, 2);
    return `${filerBaseUrl}/${bucket}/${first2Digits}/${articleId}.jpg`;
  }, []);

  // --- Memoized Computations ---
  const getPopularityLabel = useCallback(() => {
    if (dateRange.selectedSeason) {
      const fromDate = formatDateString(dateRange.startDay, dateRange.startMonth);
      const toDate = formatDateString(dateRange.endDay, dateRange.endMonth);
      return `${dateRange.selectedSeason.charAt(0).toUpperCase() + dateRange.selectedSeason.slice(1)} (${fromDate} - ${toDate})`;
    }
    if (
      hasValidDateRange(
        dateRange.startDay,
        dateRange.startMonth,
        dateRange.endDay,
        dateRange.endMonth
      )
    ) {
      const fromDate = formatDateString(dateRange.startDay, dateRange.startMonth);
      const toDate = formatDateString(dateRange.endDay, dateRange.endMonth);
      return `${LABELS.ITEMS_FROM} ${fromDate} ${LABELS.TO} ${toDate}`;
    }
    return LABELS.ALL_TIME;
  }, [dateRange]);

  const getVisibleKeys = useMemo(() => {
    if (products.length === 0) return [];

    const keys = Object.keys(products[0]);
    const filteredKeys = keys.filter(
      (key) =>
        !HIDDEN_COLUMNS.includes(key) &&
        (typeof products[0][key] !== 'object' || products[0][key] === null)
    );

    const detailDescKey = filteredKeys.find(
      (key) => key.toLowerCase() === TABLE.DETAIL_DESC_COLUMN
    );
    const otherKeys = filteredKeys.filter((key) => key.toLowerCase() !== TABLE.DETAIL_DESC_COLUMN);

    const sortedOtherKeys = otherKeys.sort((a, b) => {
      const idxA = TABLE.PRIORITY_COLUMNS.indexOf(a as any);
      const idxB = TABLE.PRIORITY_COLUMNS.indexOf(b as any);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return detailDescKey ? [...sortedOtherKeys, detailDescKey] : sortedOtherKeys;
  }, [products]);

  const totalPages = Math.ceil(totalProducts / PAGINATION.ITEMS_PER_PAGE);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const activeFilterCount = useMemo(() => {
    let count = filters.getActiveFilterCount();
    if (
      dateRange.selectedSeason ||
      hasValidDateRange(
        dateRange.startDay,
        dateRange.startMonth,
        dateRange.endDay,
        dateRange.endMonth
      )
    ) {
      count++;
    }
    return count;
  }, [filters, dateRange]);

  // --- Render ---
  if (loading) {
    return (
      <Page className={styles.loadingPage}>
        <BusyIndicator active size="L" className={styles.loadingContainer} />
      </Page>
    );
  }

  if (error && !project) {
    return (
      <Page className={styles.loadingPage}>
        <IllustratedMessage name="NoData" titleText="Error">
          <Text>{error}</Text>
          <Button onClick={() => navigate('/product-selection')}>
            {BUTTONS.BACK_TO_SELECTION}
          </Button>
        </IllustratedMessage>
      </Page>
    );
  }

  if (!project) {
    return (
      <Page className={styles.loadingPage}>
        <IllustratedMessage name="NoData" titleText="No Project">
          <Button onClick={() => navigate('/product-selection')}>{BUTTONS.GO_TO_SELECTION}</Button>
        </IllustratedMessage>
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
          <BreadcrumbsItem>{BREADCRUMBS.CONTEXT_BUILDER}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      <div className={styles.headerContainer}>
        <Title level="H2" className={styles.pageTitle}>
          {LABELS.PAGE_TITLE_PREFIX} {getPopularityLabel()}
        </Title>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSectionContainer}>
        <Card>
          <div className={styles.filterCard}>
            {/* Date Section */}
            <div className={styles.dateSection}>
              <div className={styles.dateSectionInner}>
                <div className={styles.dateInputsColumn}>
                  <div className={styles.dateInputRow}>
                    <Label className={styles.dateLabel}>{LABELS.START_LABEL}</Label>
                    <Input
                      value={dateRange.startDay}
                      placeholder="DD"
                      onInput={(e: CustomEvent) =>
                        dateRange.handleDateInput('startDay', (e.target as HTMLInputElement).value)
                      }
                      valueState={dateRange.getValidationState('startDay')}
                      className={styles.dateInput}
                    />
                    <span className={styles.dateSeparator}>/</span>
                    <Input
                      value={dateRange.startMonth}
                      placeholder="MM"
                      onInput={(e: CustomEvent) =>
                        dateRange.handleDateInput(
                          'startMonth',
                          (e.target as HTMLInputElement).value
                        )
                      }
                      valueState={dateRange.getValidationState('startMonth')}
                      className={styles.dateInput}
                    />
                  </div>
                  <div className={styles.dateInputRow}>
                    <Label className={styles.dateLabel}>{LABELS.END_LABEL}</Label>
                    <Input
                      value={dateRange.endDay}
                      placeholder="DD"
                      onInput={(e: CustomEvent) =>
                        dateRange.handleDateInput('endDay', (e.target as HTMLInputElement).value)
                      }
                      valueState={dateRange.getValidationState('endDay')}
                      className={styles.dateInput}
                    />
                    <span className={styles.dateSeparator}>/</span>
                    <Input
                      value={dateRange.endMonth}
                      placeholder="MM"
                      onInput={(e: CustomEvent) =>
                        dateRange.handleDateInput('endMonth', (e.target as HTMLInputElement).value)
                      }
                      valueState={dateRange.getValidationState('endMonth')}
                      className={styles.dateInput}
                    />
                  </div>
                </div>

                <div className={styles.seasonButtonsColumn}>
                  <div className={styles.seasonButtonRow}>
                    <Button
                      design={
                        dateRange.selectedSeason === SEASONS.SPRING ? 'Emphasized' : 'Default'
                      }
                      onClick={() => dateRange.handleSeasonClick(SEASONS.SPRING as SeasonType)}
                      className={styles.seasonButton}
                    >
                      Spring
                    </Button>
                    <Button
                      design={
                        dateRange.selectedSeason === SEASONS.SUMMER ? 'Emphasized' : 'Default'
                      }
                      onClick={() => dateRange.handleSeasonClick(SEASONS.SUMMER as SeasonType)}
                      className={styles.seasonButton}
                    >
                      Summer
                    </Button>
                  </div>
                  <div className={styles.seasonButtonRow}>
                    <Button
                      design={
                        dateRange.selectedSeason === SEASONS.AUTUMN ? 'Emphasized' : 'Default'
                      }
                      onClick={() => dateRange.handleSeasonClick(SEASONS.AUTUMN as SeasonType)}
                      className={styles.seasonButton}
                    >
                      Autumn
                    </Button>
                    <Button
                      design={
                        dateRange.selectedSeason === SEASONS.WINTER ? 'Emphasized' : 'Default'
                      }
                      onClick={() => dateRange.handleSeasonClick(SEASONS.WINTER as SeasonType)}
                      className={styles.seasonButton}
                    >
                      Winter
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Scroll Section */}
            <div className={styles.filtersScrollSection}>
              <div className={styles.filtersScrollContainer}>
                <FilterCardItem
                  title={FILTER_TITLES[FILTER_KEYS.PATTERN_STYLE]}
                  icon={FILTER_ICONS[FILTER_KEYS.PATTERN_STYLE]}
                  selectedData={filters.selectedPattern}
                  onClick={() => openDialog(FILTER_KEYS.PATTERN_STYLE, filters.selectedPattern)}
                />
                <FilterCardItem
                  title={FILTER_TITLES[FILTER_KEYS.SPECIFIC_COLOR]}
                  icon={FILTER_ICONS[FILTER_KEYS.SPECIFIC_COLOR]}
                  selectedData={filters.selectedSpecificColor}
                  onClick={() =>
                    openDialog(FILTER_KEYS.SPECIFIC_COLOR, filters.selectedSpecificColor)
                  }
                />
                <FilterCardItem
                  title={FILTER_TITLES[FILTER_KEYS.COLOR_INTENSITY]}
                  icon={FILTER_ICONS[FILTER_KEYS.COLOR_INTENSITY]}
                  selectedData={filters.selectedColorIntensity}
                  onClick={() =>
                    openDialog(FILTER_KEYS.COLOR_INTENSITY, filters.selectedColorIntensity)
                  }
                />
                <FilterCardItem
                  title={FILTER_TITLES[FILTER_KEYS.COLOR_FAMILY]}
                  icon={FILTER_ICONS[FILTER_KEYS.COLOR_FAMILY]}
                  selectedData={filters.selectedColorFamily}
                  onClick={() => openDialog(FILTER_KEYS.COLOR_FAMILY, filters.selectedColorFamily)}
                />
                <FilterCardItem
                  title={FILTER_TITLES[FILTER_KEYS.PRODUCT_FAMILY]}
                  icon={FILTER_ICONS[FILTER_KEYS.PRODUCT_FAMILY]}
                  selectedData={filters.selectedProductFamily}
                  onClick={() =>
                    openDialog(FILTER_KEYS.PRODUCT_FAMILY, filters.selectedProductFamily)
                  }
                />
                <FilterCardItem
                  title={FILTER_TITLES[FILTER_KEYS.CUSTOMER_SEGMENT]}
                  icon={FILTER_ICONS[FILTER_KEYS.CUSTOMER_SEGMENT]}
                  selectedData={filters.selectedCustomerSegment}
                  onClick={() =>
                    openDialog(FILTER_KEYS.CUSTOMER_SEGMENT, filters.selectedCustomerSegment)
                  }
                />
                <FilterCardItem
                  title={FILTER_TITLES[FILTER_KEYS.STYLE_CONCEPT]}
                  icon={FILTER_ICONS[FILTER_KEYS.STYLE_CONCEPT]}
                  selectedData={filters.selectedStyleConcept}
                  onClick={() =>
                    openDialog(FILTER_KEYS.STYLE_CONCEPT, filters.selectedStyleConcept)
                  }
                />
                <FilterCardItem
                  title={FILTER_TITLES[FILTER_KEYS.FABRIC_TYPE_BASE]}
                  icon={FILTER_ICONS[FILTER_KEYS.FABRIC_TYPE_BASE]}
                  selectedData={filters.selectedFabricType}
                  onClick={() =>
                    openDialog(FILTER_KEYS.FABRIC_TYPE_BASE, filters.selectedFabricType)
                  }
                />
              </div>

              <div className={styles.resetButtonContainer}>
                <Button design="Transparent" onClick={handleResetFilters}>
                  {BUTTONS.RESET_ALL}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Section */}
      <div className={styles.statsContainer}>
        <div className={styles.statsLeft}>
          <div className={styles.statItem}>
            <Icon name="list" className={styles.statIcon} />
            <div>
              <Text className={styles.statLabel}>{LABELS.TOTAL_PRODUCTS}</Text>
              <Title level="H4">{totalProducts}</Title>
            </div>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <Icon name="filter" className={styles.statIcon} />
            <div>
              <Text className={styles.statLabel}>{LABELS.ACTIVE_FILTERS}</Text>
              <Title level="H4">{activeFilterCount}</Title>
            </div>
          </div>
        </div>

        <div className={styles.statsRight}>
          {!ontologySchema && (
            <div className={styles.infoMessage}>
              <Icon name="lightbulb" className={styles.infoIcon} />
              <Text className={styles.infoText}>{MESSAGES.GENERATE_ATTRIBUTES_BEFORE_CONFIRM}</Text>
            </div>
          )}

          <Button design="Emphasized" icon="lightbulb" onClick={handleOpenAttributeDialog}>
            {BUTTONS.GENERATE_ATTRIBUTES}
          </Button>

          <Button
            design="Emphasized"
            onClick={handleLockContext}
            disabled={lockingContext || totalProducts === 0 || !ontologySchema}
          >
            {lockingContext ? BUTTONS.CREATING_PROJECT : BUTTONS.CONFIRM_CREATE}
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className={styles.tableContainer}>
        <Card>
          <div className={styles.tableWrapper}>
            <table className={products.length > 0 ? styles.table : styles.tableEmpty}>
              <thead className={styles.tableHeader}>
                <tr>
                  {productsLoading ? (
                    <th className={styles.tableHeaderCell}>{LABELS.LOADING}</th>
                  ) : products.length > 0 ? (
                    <>
                      <th className={styles.tableHeaderCellExpand}></th>
                      <th className={styles.tableHeaderCellImage}>Image</th>
                      {getVisibleKeys.map((key) => (
                        <th key={key} className={styles.tableHeaderCell}>
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </>
                  ) : (
                    <th className={styles.tableHeaderCell}>{LABELS.NO_DATA}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {productsLoading ? (
                  <tr>
                    <td
                      colSpan={getVisibleKeys.length + 2 || 1}
                      className={styles.tableCellCentered}
                    >
                      <BusyIndicator active size="M" />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={getVisibleKeys.length + 2 || 1}
                      className={styles.tableCellCentered}
                    >
                      <IllustratedMessage name="NoData" titleText={LABELS.NO_ITEMS_FOUND} />
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isExpanded = expandedRowId === product.article_id;
                    const imageUrl = getImageUrl(product.article_id);

                    return (
                      <React.Fragment key={product.article_id}>
                        {/* Main Row */}
                        <tr
                          className={`${styles.tableRow} ${isExpanded ? styles.tableRowExpanded : ''}`}
                          onClick={() => handleRowToggle(product.article_id)}
                        >
                          <td className={styles.tableCellExpand}>
                            <Icon name={isExpanded ? 'slim-arrow-down' : 'slim-arrow-right'} />
                          </td>

                          <td className={styles.tableCellImage}>
                            <div className={styles.imageThumbnail}>
                              <img
                                src={imageUrl}
                                alt={product.article_id}
                                className={styles.imageThumbnailImg}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('ui5-icon')) {
                                    const icon = document.createElement('ui5-icon');
                                    icon.setAttribute('name', 'product');
                                    icon.style.fontSize = '1.5rem';
                                    parent.appendChild(icon);
                                  }
                                }}
                              />
                            </div>
                          </td>

                          {getVisibleKeys.map((key) => {
                            const isDetailDesc = key.toLowerCase() === TABLE.DETAIL_DESC_COLUMN;
                            return (
                              <td
                                key={`${product.article_id}-${key}`}
                                className={
                                  isDetailDesc ? styles.tableCellDetailDesc : styles.tableCell
                                }
                              >
                                {product[key]}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <tr key={`${product.article_id}-expanded`} className={styles.expandedRow}>
                            <td
                              colSpan={getVisibleKeys.length + 2}
                              className={styles.expandedContent}
                            >
                              <div className={styles.expandedLayout}>
                                <div
                                  className={styles.imageDetail}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageClick(imageUrl);
                                  }}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={product.article_id}
                                    className={styles.imageDetailImg}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <div className={styles.imageZoomIcon}>
                                    <Icon name="zoom-in" className={styles.imageZoomIconSvg} />
                                  </div>
                                </div>

                                <div className={styles.expandedDetails}>
                                  <Title level="H5" className={styles.detailsTitle}>
                                    Product Details
                                  </Title>

                                  <div className={styles.detailsGrid}>
                                    {getVisibleKeys.map((key) => (
                                      <div key={key}>
                                        <Text className={styles.detailLabel}>
                                          {key.replace(/_/g, ' ')}
                                        </Text>
                                        <Text className={styles.detailValue}>
                                          {product[key] || '-'}
                                        </Text>
                                      </div>
                                    ))}
                                  </div>
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
          {totalProducts > 0 && (
            <Bar
              design="Footer"
              startContent={
                <Text className={styles.paginationText}>
                  Showing {(currentPage - 1) * PAGINATION.ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * PAGINATION.ITEMS_PER_PAGE, totalProducts)} of{' '}
                  {totalProducts}
                </Text>
              }
              endContent={
                <div className={styles.paginationControls}>
                  <Button
                    icon="navigation-left-arrow"
                    design="Transparent"
                    disabled={!canGoPrevious}
                    onClick={handlePreviousPage}
                  />
                  <Text className={styles.paginationPageText}>
                    Page {currentPage} of {totalPages}
                  </Text>
                  <Button
                    icon="navigation-right-arrow"
                    design="Transparent"
                    disabled={!canGoNext}
                    onClick={handleNextPage}
                  />
                </div>
              }
            />
          )}
        </Card>
      </div>

      {/* Filter Dialog */}
      <Dialog
        open={!!activeDialog}
        headerText={`Select ${activeDialog?.replace(/([A-Z])/g, ' $1').trim()}`}
        footer={
          <Bar
            design="Footer"
            endContent={
              <>
                <Button design="Transparent" onClick={closeDialog}>
                  {BUTTONS.CANCEL}
                </Button>
                <Button design="Emphasized" onClick={applyDialog}>
                  {BUTTONS.APPLY}
                </Button>
              </>
            }
          />
        }
      >
        <div className={filterOptionsLoading ? styles.dialogContentLoading : styles.dialogContent}>
          {filterOptionsLoading ? (
            <BusyIndicator active size="M" />
          ) : (
            <>
              <div className={styles.dialogSelectAllContainer}>
                <Button
                  design="Transparent"
                  onClick={handleSelectDeselectAll}
                  style={{ width: '100%' }}
                >
                  {tempSelection.length === getDialogOptions().length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
              {getDialogOptions().map((opt: string) => {
                const isChecked = tempSelection.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      setTempSelection((prev) =>
                        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                      );
                    }}
                    className={styles.dialogCheckboxItem}
                  >
                    <CheckBox checked={isChecked} text={opt} onChange={() => {}} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </Dialog>

      {/* Attribute Generation Dialog */}
      <AttributeGenerationDialog
        open={attributeDialogOpen}
        onClose={handleCloseAttributeDialog}
        selectedTypes={project?.scopeConfig?.productTypes || []}
        productGroup={project?.scopeConfig?.productGroups?.[0] || 'Apparel & Fashion'}
        selectedSeason={dateRange.selectedSeason}
        dateRange={
          hasValidDateRange(
            dateRange.startDay,
            dateRange.startMonth,
            dateRange.endDay,
            dateRange.endMonth
          )
            ? {
                from: formatDateString(dateRange.startDay, dateRange.startMonth),
                to: formatDateString(dateRange.endDay, dateRange.endMonth),
              }
            : undefined
        }
        generatedAttributes={generatedAttributes}
        attributesLoading={attributesLoading}
        feedbackText={feedbackText}
        onFeedbackChange={setFeedbackText}
        onRegenerate={handleRegenerate}
        onSave={handleSaveAttributes}
      />

      {/* Error Dialog */}
      <Dialog
        open={errorDialogOpen}
        headerText="Project Creation Failed"
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Emphasized" onClick={() => setErrorDialogOpen(false)}>
                {BUTTONS.OK}
              </Button>
            }
          />
        }
      >
        <div className={styles.errorDialogContent}>
          <MessageStrip design="Negative" className={styles.errorDialogMessage}>
            {errorDialogMessage}
          </MessageStrip>
          <Text>{ERROR_MESSAGES.PROJECT_CREATION_DIALOG_TEXT}</Text>
        </div>
      </Dialog>

      {/* Image Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        header={
          <div className={styles.modalHeader}>
            <Title level="H5" className={styles.modalTitle}>
              Product Image
            </Title>
            <Button
              design="Transparent"
              icon="decline"
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
    </Page>
  );
}

export default ContextBuilder;
