import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
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
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/filter.js';
import '@ui5/webcomponents-icons/dist/list.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/color-fill.js';
import '@ui5/webcomponents-icons/dist/activate.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/lightbulb.js';
import '@ui5/webcomponents-icons/dist/refresh.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';

import type { FiltersResponse } from '@fashion/types';
import { AttributeGenerationDialog } from '../components/AttributeGenerationDialog';

const HIDDEN_COLUMNS = ['product_group', 'transactionCount', 'lastSaleDate', 'articleId'];

type Season = 'spring' | 'summer' | 'autumn' | 'winter' | null;

function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Global State ---
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Date / Season State ---
  const [selectedSeason, setSelectedSeason] = useState<Season>(null);
  const [startDay, setStartDay] = useState<string>('');
  const [startMonth, setStartMonth] = useState<string>('');
  const [endDay, setEndDay] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');

  // --- Filter Options ---
  const [filterOptions, setFilterOptions] = useState<FiltersResponse | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // --- Selected Filters ---
  const [selectedProductGroup, setSelectedProductGroup] = useState<string[]>([]);
  const [selectedProductFamily, setSelectedProductFamily] = useState<string[]>([]);
  const [selectedStyleConcept, setSelectedStyleConcept] = useState<string[]>([]);
  const [selectedColorFamily, setSelectedColorFamily] = useState<string[]>([]);
  const [selectedCustomerSegment, setSelectedCustomerSegment] = useState<string[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string[]>([]);
  const [selectedSpecificColor, setSelectedSpecificColor] = useState<string[]>([]);
  const [selectedColorIntensity, setSelectedColorIntensity] = useState<string[]>([]);
  const [selectedFabricType, setSelectedFabricType] = useState<string[]>([]);

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
  const [limit] = useState(10);
  const [lockingContext, setLockingContext] = useState(false);

  // --- Error Dialog State ---
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');

  // --- Helper Functions ---
  const getMaxDaysInMonth = (month: number): number => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysInMonth[month - 1] || 31;
  };

  const validateDate = (day: string, month: string): boolean => {
    const d = parseInt(day);
    const m = parseInt(month);
    if (isNaN(d) || isNaN(m)) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > getMaxDaysInMonth(m)) return false;
    return true;
  };

  const formatDateString = (day: string, month: string): string => {
    if (!day || !month) return '';
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    return `${m}-${d}`;
  };

  const hasValidDateRange = (): boolean => {
    return !!(
      startDay &&
      startMonth &&
      endDay &&
      endMonth &&
      validateDate(startDay, startMonth) &&
      validateDate(endDay, endMonth)
    );
  };

  // --- Initial Load ---
  useEffect(() => {
    const projectData = (location.state as any)?.projectData;

    if (!projectData) {
      setError('No project data provided');
      setLoading(false);
      return;
    }

    setProject(projectData);
    setLoading(false);
  }, [location.state]);

  // --- Fetch Filters ---
  useEffect(() => {
    if (project?.scopeConfig?.productTypes?.length > 0) {
      const hasAnyDateInput = startDay || startMonth || endDay || endMonth;
      const shouldFetch = selectedSeason || !hasAnyDateInput || hasValidDateRange();

      if (shouldFetch) {
        fetchFilterOptions();
      }
    }
  }, [project, selectedSeason, startDay, startMonth, endDay, endMonth]);

  // --- Fetch Products ---
  useEffect(() => {
    if (project?.scopeConfig?.productTypes?.length > 0) {
      const hasAnyDateInput = startDay || startMonth || endDay || endMonth;
      const shouldFetch = selectedSeason || !hasAnyDateInput || hasValidDateRange();

      if (shouldFetch) {
        const timer = setTimeout(() => {
          fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [
    project,
    selectedSeason,
    startDay,
    startMonth,
    endDay,
    endMonth,
    selectedProductGroup,
    selectedProductFamily,
    selectedStyleConcept,
    selectedColorFamily,
    selectedCustomerSegment,
    selectedPattern,
    selectedSpecificColor,
    selectedColorIntensity,
    selectedFabricType,
    currentPage,
  ]);

  // --- Handlers: Date & Reset ---
  const handleSeasonClick = (season: Season) => {
    if (selectedSeason === season) {
      setSelectedSeason(null);
      // Clear date fields when deselecting season
      setStartDay('');
      setStartMonth('');
      setEndDay('');
      setEndMonth('');
    } else {
      setSelectedSeason(season);
      // Set date fields based on selected season
      switch (season) {
        case 'spring':
          setStartDay('01');
          setStartMonth('03');
          setEndDay('31');
          setEndMonth('05');
          break;
        case 'summer':
          setStartDay('01');
          setStartMonth('06');
          setEndDay('31');
          setEndMonth('08');
          break;
        case 'autumn':
          setStartDay('01');
          setStartMonth('09');
          setEndDay('30');
          setEndMonth('11');
          break;
        case 'winter':
          setStartDay('01');
          setStartMonth('12');
          setEndDay('28');
          setEndMonth('02');
          break;
      }
    }
    setCurrentPage(1);
  };

  const handleDateInput = (
    field: 'startDay' | 'startMonth' | 'endDay' | 'endMonth',
    value: string
  ) => {
    if (value && !/^\d+$/.test(value)) return;
    setSelectedSeason(null);

    switch (field) {
      case 'startDay':
        setStartDay(value);
        break;
      case 'startMonth':
        setStartMonth(value);
        break;
      case 'endDay':
        setEndDay(value);
        break;
      case 'endMonth':
        setEndMonth(value);
        break;
    }

    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedProductGroup([]);
    setSelectedProductFamily([]);
    setSelectedStyleConcept([]);
    setSelectedColorFamily([]);
    setSelectedCustomerSegment([]);
    setSelectedPattern([]);
    setSelectedSpecificColor([]);
    setSelectedColorIntensity([]);
    setSelectedFabricType([]);
    setCurrentPage(1);
    setStartDay('');
    setStartMonth('');
    setEndDay('');
    setEndMonth('');
    setSelectedSeason(null);
  };

  // --- Handlers: Dialog ---
  const openDialog = (filterKey: string, currentSelection: string[]) => {
    setActiveDialog(filterKey);
    setTempSelection([...currentSelection]);
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setTempSelection([]);
  };

  const applyDialog = () => {
    if (!activeDialog) return;
    switch (activeDialog) {
      case 'customerSegment':
        setSelectedCustomerSegment(tempSelection);
        break;
      case 'colorFamily':
        setSelectedColorFamily(tempSelection);
        break;
      case 'styleConcept':
        setSelectedStyleConcept(tempSelection);
        break;
      case 'productFamily':
        setSelectedProductFamily(tempSelection);
        break;
      case 'patternStyle':
        setSelectedPattern(tempSelection);
        break;
      case 'specificColor':
        setSelectedSpecificColor(tempSelection);
        break;
      case 'colorIntensity':
        setSelectedColorIntensity(tempSelection);
        break;
      case 'fabricTypeBase':
        setSelectedFabricType(tempSelection);
        break;
    }
    setCurrentPage(1);
    closeDialog();
  };

  // --- Handlers: Attribute Generation ---
  const handleOpenAttributeDialog = () => {
    setAttributeDialogOpen(true);
    setFeedbackText('');
    setConversationHistory([]);
    setGeneratedAttributes(null);
    generateAttributes();
  };

  const handleCloseAttributeDialog = () => {
    setAttributeDialogOpen(false);
    setGeneratedAttributes(null);
    setFeedbackText('');
    setConversationHistory([]);
  };

  const generateAttributes = async (withFeedback = false) => {
    if (!project?.scopeConfig?.productTypes) return;

    try {
      setAttributesLoading(true);

      const response = await fetch('/api/generate-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTypes: project.scopeConfig.productTypes,
          feedback: withFeedback ? feedbackText : undefined,
          conversationHistory: withFeedback ? conversationHistory : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate attributes');
      }

      const data = await response.json();
      setGeneratedAttributes(data.attributeSet);
      setConversationHistory(data.conversationHistory || []);
      if (withFeedback) setFeedbackText('');
    } catch (err) {
      console.error('Failed to generate attributes:', err);
    } finally {
      setAttributesLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (feedbackText.trim()) {
      generateAttributes(true);
    } else {
      generateAttributes(false);
    }
  };

  const handleSaveAttributes = (attributes: any) => {
    console.log('Saving attributes:', attributes);
    // Store ontology in component state for use when confirming cohort
    setOntologySchema(attributes);
    // Close the dialog after saving
    handleCloseAttributeDialog();
  };

  // --- API Calls ---
  const fetchFilterOptions = async () => {
    if (!project?.scopeConfig?.productTypes) return;

    try {
      setFilterOptionsLoading(true);
      const typesParam = project.scopeConfig.productTypes.join(',');
      const params = new URLSearchParams({ types: typesParam });
      if (selectedSeason) params.append('season', selectedSeason);
      else if (hasValidDateRange()) {
        params.append('mdFrom', formatDateString(startDay, startMonth));
        params.append('mdTo', formatDateString(endDay, endMonth));
      }

      const response = await fetch(`/api/filters/attributes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch filters');
      const data = await response.json();
      setFilterOptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!project?.scopeConfig?.productTypes?.length) return;

    try {
      setProductsLoading(true);
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((currentPage - 1) * limit),
        types: project.scopeConfig.productTypes.join(','),
      });

      if (selectedSeason) params.append('season', selectedSeason);
      else if (hasValidDateRange()) {
        params.append('mdFrom', formatDateString(startDay, startMonth));
        params.append('mdTo', formatDateString(endDay, endMonth));
      }

      if (selectedProductGroup.length)
        params.append('filter_productGroup', selectedProductGroup.join(','));
      if (selectedProductFamily.length)
        params.append('filter_productFamily', selectedProductFamily.join(','));
      if (selectedStyleConcept.length)
        params.append('filter_styleConcept', selectedStyleConcept.join(','));
      if (selectedColorFamily.length)
        params.append('filter_colorFamily', selectedColorFamily.join(','));
      if (selectedCustomerSegment.length)
        params.append('filter_customerSegment', selectedCustomerSegment.join(','));
      if (selectedPattern.length) params.append('filter_patternStyle', selectedPattern.join(','));
      if (selectedSpecificColor.length)
        params.append('filter_specificColor', selectedSpecificColor.join(','));
      if (selectedColorIntensity.length)
        params.append('filter_colorIntensity', selectedColorIntensity.join(','));
      if (selectedFabricType.length)
        params.append('filter_fabricTypeBase', selectedFabricType.join(','));

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      setProducts(data.items || []);
      setTotalProducts(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleLockContext = async () => {
    if (!project?.name || !project?.scopeConfig) return;

    try {
      setLockingContext(true);
      setError(null);

      const createResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.name,
          scopeConfig: project.scopeConfig,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create project');
      }

      const createdProject = await createResponse.json();
      console.log('Project created successfully:', createdProject);

      // Navigate to Project Hub immediately after successful project creation
      navigate(`/project/${createdProject.id}`);

      const params = new URLSearchParams();
      // Only add date/season params if they exist, otherwise all year is analyzed
      if (selectedSeason) {
        params.append('season', selectedSeason);
      } else if (hasValidDateRange()) {
        params.append('mdFrom', formatDateString(startDay, startMonth));
        params.append('mdTo', formatDateString(endDay, endMonth));
      }

      if (selectedProductGroup.length)
        params.append('filter_productGroup', selectedProductGroup.join(','));
      if (selectedProductFamily.length)
        params.append('filter_productFamily', selectedProductFamily.join(','));
      if (selectedStyleConcept.length)
        params.append('filter_styleConcept', selectedStyleConcept.join(','));
      if (selectedColorFamily.length)
        params.append('filter_colorFamily', selectedColorFamily.join(','));
      if (selectedCustomerSegment.length)
        params.append('filter_customerSegment', selectedCustomerSegment.join(','));
      if (selectedPattern.length) params.append('filter_patternStyle', selectedPattern.join(','));
      if (selectedSpecificColor.length)
        params.append('filter_specificColor', selectedSpecificColor.join(','));
      if (selectedColorIntensity.length)
        params.append('filter_colorIntensity', selectedColorIntensity.join(','));
      if (selectedFabricType.length)
        params.append('filter_fabricTypeBase', selectedFabricType.join(','));

      const previewResponse = await fetch(
        `/api/projects/${createdProject.id}/preview-context?${params}`
      );
      if (!previewResponse.ok) {
        const errorData = await previewResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get articles for locking');
      }

      const articles = await previewResponse.json();
      console.log('Retrieved articles for locking:', articles.length);

      const seasonConfig = selectedSeason
        ? { season: selectedSeason }
        : hasValidDateRange()
          ? {
              startDate: formatDateString(startDay, startMonth),
              endDate: formatDateString(endDay, endMonth),
            }
          : null;

      const lockResponse = await fetch(`/api/projects/${createdProject.id}/lock-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles,
          seasonConfig,
          ontologySchema,
        }),
      });

      if (!lockResponse.ok) {
        const errorData = await lockResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to lock context');
      }

      const result = await lockResponse.json();
      console.log('Context locked successfully:', result);

      setProject({
        ...createdProject,
        status: 'active',
        lockedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to create project and lock context:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create project and lock context';
      setErrorDialogMessage(errorMessage);
      setErrorDialogOpen(true);
    } finally {
      setLockingContext(false);
    }
  };

  // --- Render Helpers ---
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedSeason || hasValidDateRange()) count++;
    if (selectedProductGroup.length) count++;
    if (selectedProductFamily.length) count++;
    if (selectedStyleConcept.length) count++;
    if (selectedColorFamily.length) count++;
    if (selectedCustomerSegment.length) count++;
    if (selectedPattern.length) count++;
    if (selectedSpecificColor.length) count++;
    if (selectedColorIntensity.length) count++;
    if (selectedFabricType.length) count++;
    return count;
  };

  const getPopularityLabel = () => {
    if (selectedSeason) {
      const fromDate = formatDateString(startDay, startMonth);
      const toDate = formatDateString(endDay, endMonth);
      return `${selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1)} (${fromDate} - ${toDate})`;
    }
    if (hasValidDateRange()) {
      const fromDate = formatDateString(startDay, startMonth);
      const toDate = formatDateString(endDay, endMonth);
      return `Items from ${fromDate} to ${toDate}`;
    }
    return 'All time';
  };

  // --- Pagination Helpers ---
  const totalPages = Math.ceil(totalProducts / limit);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePreviousPage = () => {
    if (canGoPrevious) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (canGoNext) setCurrentPage((prev) => prev + 1);
  };

  // --- COMPONENT: Filter Card Item ---
  const FilterCardItem = ({
    title,
    icon,
    selectedData,
    dialogKey,
  }: {
    title: string;
    icon: string;
    selectedData: string[];
    dialogKey: string;
  }) => {
    const isSelected = selectedData.length > 0;
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onClick={() => openDialog(dialogKey, selectedData)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          minWidth: '140px',
          height: '70px',
          border: `1px solid ${isSelected ? '#0070F2' : isHovered ? '#888' : 'var(--sapList_BorderColor)'}`,
          borderRadius: '0.5rem',
          padding: '0.75rem',
          backgroundColor: 'var(--sapList_Background)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Icon
            name={icon}
            style={{ color: isSelected ? '#0070F2' : 'var(--sapContent_IconColor)' }}
          />
          {isSelected && (
            <span
              style={{
                background: '#0070F2',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedData.length}
            </span>
          )}
        </div>
        <Text
          style={{
            fontSize: '0.75rem',
            color: isSelected ? '#0070F2' : 'var(--sapContent_LabelColor)',
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          {title}
        </Text>
      </div>
    );
  };

  const getDialogOptions = () => {
    if (!activeDialog || !filterOptions) return [];
    switch (activeDialog) {
      case 'customerSegment':
        return filterOptions.customerSegment;
      case 'colorFamily':
        return filterOptions.colorFamily;
      case 'styleConcept':
        return filterOptions.styleConcept;
      case 'productFamily':
        return filterOptions.productFamily;
      case 'patternStyle':
        return filterOptions.patternStyle;
      case 'specificColor':
        return filterOptions.specificColor;
      case 'colorIntensity':
        return filterOptions.colorIntensity;
      case 'fabricTypeBase':
        return filterOptions.fabricTypeBase;
      default:
        return [];
    }
  };

  // --- Dynamic Table Logic ---
  const getVisibleKeys = () => {
    if (products.length === 0) return [];

    const priority = ['article_id', 'product_name', 'product_type'];
    const keys = Object.keys(products[0]);

    const filteredKeys = keys.filter(
      (key) =>
        !HIDDEN_COLUMNS.includes(key) &&
        (typeof products[0][key] !== 'object' || products[0][key] === null)
    );

    const detailDescKey = filteredKeys.find((key) => key.toLowerCase() === 'detail_desc');
    const otherKeys = filteredKeys.filter((key) => key.toLowerCase() !== 'detail_desc');

    const sortedOtherKeys = otherKeys.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return detailDescKey ? [...sortedOtherKeys, detailDescKey] : sortedOtherKeys;
  };

  const visibleKeys = getVisibleKeys();

  if (loading)
    return (
      <BusyIndicator
        active
        size="L"
        style={{ display: 'block', margin: 'auto', marginTop: '20vh' }}
      />
    );

  if (error) {
    return (
      <IllustratedMessage name="NoData" titleText="Error">
        <Text>{error}</Text>
        <Button onClick={() => navigate('/product-selection')}>Back to Selection</Button>
      </IllustratedMessage>
    );
  }

  if (!project) {
    return (
      <IllustratedMessage name="NoData" titleText="No Project">
        <Button onClick={() => navigate('/product-selection')}>Go to Selection</Button>
      </IllustratedMessage>
    );
  }

  return (
    <div
      style={{
        background: 'var(--sapBackgroundColor)',
        minHeight: 'calc(100vh - 44px)',
        paddingBottom: '2rem',
      }}
    >
      {/* Breadcrumbs */}
      <div style={{ padding: '12px 2rem 0' }}>
        <Breadcrumbs
          onItemClick={(e: any) => {
            const text = e.detail.item.textContent?.trim();
            if (text === 'Home') {
              navigate('/');
            } else if (text === 'Product Selection') {
              navigate('/product-selection');
            }
          }}
        >
          <BreadcrumbsItem>Home</BreadcrumbsItem>
          <BreadcrumbsItem>Product Selection</BreadcrumbsItem>
          <BreadcrumbsItem>Analysis</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      <div style={{ padding: '1rem 2rem 0' }}>
        <Title level="H2" style={{ marginBottom: '0.5rem' }}>
          Context Analysis: {getPopularityLabel()}
        </Title>
      </div>

      {/* Filter Section */}
      <div style={{ padding: '0 2rem 1rem' }}>
        <Card>
          <div style={{ display: 'flex', height: '130px' }}>
            {/* Left: Date Section */}
            <div
              style={{
                width: '360px',
                padding: '1rem',
                borderRight: '1px solid var(--sapList_BorderColor)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                flexShrink: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Label style={{ fontSize: '0.875rem', minWidth: '40px' }}>Start:</Label>
                  <Input
                    value={startDay}
                    placeholder="DD"
                    onInput={(e: any) => handleDateInput('startDay', e.target.value)}
                    valueState={
                      startDay && !validateDate(startDay, startMonth || '1') ? 'Negative' : 'None'
                    }
                    style={{
                      width: '60px',
                      height: '25px',
                      background: 'var(--sapBackgroundColor)',
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>/</span>
                  <Input
                    value={startMonth}
                    placeholder="MM"
                    onInput={(e: any) => handleDateInput('startMonth', e.target.value)}
                    valueState={
                      startMonth && (parseInt(startMonth) < 1 || parseInt(startMonth) > 12)
                        ? 'Negative'
                        : 'None'
                    }
                    style={{
                      width: '60px',
                      height: '25px',
                      background: 'var(--sapBackgroundColor)',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Label style={{ fontSize: '0.875rem', minWidth: '40px' }}>End:</Label>
                  <Input
                    value={endDay}
                    placeholder="DD"
                    onInput={(e: any) => handleDateInput('endDay', e.target.value)}
                    valueState={
                      endDay && !validateDate(endDay, endMonth || '1') ? 'Negative' : 'None'
                    }
                    style={{
                      width: '60px',
                      height: '25px',
                      background: 'var(--sapBackgroundColor)',
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>/</span>
                  <Input
                    value={endMonth}
                    placeholder="MM"
                    onInput={(e: any) => handleDateInput('endMonth', e.target.value)}
                    valueState={
                      endMonth && (parseInt(endMonth) < 1 || parseInt(endMonth) > 12)
                        ? 'Negative'
                        : 'None'
                    }
                    style={{
                      width: '60px',
                      height: '25px',
                      background: 'var(--sapBackgroundColor)',
                    }}
                  />
                </div>
              </div>

              <div
                style={{ display: 'flex', gap: '0.25rem', width: '100%', justifyContent: 'center' }}
              >
                {(['spring', 'summer', 'autumn', 'winter'] as const).map((season) => (
                  <Button
                    key={season}
                    design={selectedSeason === season ? 'Emphasized' : 'Default'}
                    onClick={() => handleSeasonClick(season)}
                    style={{
                      flex: 1,
                      textTransform: 'capitalize',
                      fontSize: '0.75rem',
                      height: '20px',
                    }}
                  >
                    {season}
                  </Button>
                ))}
              </div>
            </div>

            {/* Right: Attribute Scroll + Reset Button */}
            <div
              style={{
                flex: 1,
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                gap: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  overflowX: 'auto',
                  flex: 1,
                  height: '100%',
                  alignItems: 'center',
                  scrollbarWidth: 'thin',
                }}
              >
                <FilterCardItem
                  title="Pattern/Style"
                  icon="display"
                  selectedData={selectedPattern}
                  dialogKey="patternStyle"
                />
                <FilterCardItem
                  title="Specific Color"
                  icon="palette"
                  selectedData={selectedSpecificColor}
                  dialogKey="specificColor"
                />
                <FilterCardItem
                  title="Color Intensity"
                  icon="palette"
                  selectedData={selectedColorIntensity}
                  dialogKey="colorIntensity"
                />
                <FilterCardItem
                  title="Color Family"
                  icon="palette"
                  selectedData={selectedColorFamily}
                  dialogKey="colorFamily"
                />
                <FilterCardItem
                  title="Product Family"
                  icon="product"
                  selectedData={selectedProductFamily}
                  dialogKey="productFamily"
                />
                <FilterCardItem
                  title="Customer Segment"
                  icon="group"
                  selectedData={selectedCustomerSegment}
                  dialogKey="customerSegment"
                />
                <FilterCardItem
                  title="Style Concept"
                  icon="display"
                  selectedData={selectedStyleConcept}
                  dialogKey="styleConcept"
                />
                <FilterCardItem
                  title="Fabric Type"
                  icon="activate"
                  selectedData={selectedFabricType}
                  dialogKey="fabricTypeBase"
                />
              </div>

              <div
                style={{
                  borderLeft: '1px solid var(--sapList_BorderColor)',
                  height: '100%',
                  paddingLeft: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Button design="Transparent" onClick={handleResetFilters}>
                  Reset All
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Section */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          padding: '0 2rem 1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="list" style={{ color: 'var(--sapContent_LabelColor)' }} />
            <div>
              <Text
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--sapContent_LabelColor)',
                  textTransform: 'uppercase',
                }}
              >
                Total Products
              </Text>
              <Title level="H4">{totalProducts}</Title>
            </div>
          </div>
          <div style={{ height: '30px', borderLeft: '1px solid var(--sapList_BorderColor)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="filter" style={{ color: 'var(--sapContent_LabelColor)' }} />
            <div>
              <Text
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--sapContent_LabelColor)',
                  textTransform: 'uppercase',
                }}
              >
                Active Filters
              </Text>
              <Title level="H4">{getActiveFilterCount()}</Title>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {project?.status === 'locked' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="accept" style={{ color: 'var(--sapPositiveColor)' }} />
              <Text style={{ color: 'var(--sapPositiveColor)', fontSize: '0.875rem' }}>
                Context Locked
              </Text>
            </div>
          )}

          {project?.status !== 'locked' && !ontologySchema && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'var(--sapInformationBackground)',
                border: '1px solid var(--sapInformationBorderColor)',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <Icon name="lightbulb" style={{ color: 'var(--sapInformativeColor)' }} />
              <Text style={{ color: 'var(--sapInformativeColor)' }}>
                Please generate attributes before confirming cohort
              </Text>
            </div>
          )}

          <Button design="Emphasized" icon="lightbulb" onClick={handleOpenAttributeDialog}>
            Generate Attributes
          </Button>

          {project?.status !== 'locked' && (
            <Button
              design="Emphasized"
              onClick={handleLockContext}
              disabled={lockingContext || totalProducts === 0 || !ontologySchema}
            >
              {lockingContext ? 'Creating Project...' : 'Confirm & create Project'}
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div style={{ padding: '0 2rem' }}>
        <Card>
          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            <table
              style={{
                minWidth: products.length > 0 ? 'max-content' : '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
              }}
            >
              <thead
                style={{
                  background: 'var(--sapList_HeaderBackground)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <tr>
                  {productsLoading ? (
                    <th style={{ padding: '1rem' }}>Loading data...</th>
                  ) : products.length > 0 ? (
                    visibleKeys.map((key) => (
                      <th
                        key={key}
                        style={{
                          padding: '1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--sapList_BorderColor)',
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))
                  ) : (
                    <th style={{ padding: '1rem' }}>No data</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {productsLoading ? (
                  <tr>
                    <td
                      colSpan={visibleKeys.length || 1}
                      style={{ textAlign: 'center', padding: '3rem' }}
                    >
                      <BusyIndicator active size="M" />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '3rem' }}>
                      <IllustratedMessage name="NoData" titleText="No items found" />
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.article_id}
                      style={{ borderBottom: '1px solid var(--sapList_BorderColor)' }}
                    >
                      {visibleKeys.map((key) => {
                        const isDetailDesc = key.toLowerCase() === 'detail_desc';
                        return (
                          <td
                            key={`${product.article_id}-${key}`}
                            style={{
                              padding: '0.75rem',
                              whiteSpace: isDetailDesc ? 'normal' : 'nowrap',
                              minWidth: isDetailDesc ? '400px' : 'auto',
                              maxWidth: isDetailDesc ? '600px' : '300px',
                              overflow: 'hidden',
                              textOverflow: isDetailDesc ? 'clip' : 'ellipsis',
                              wordWrap: isDetailDesc ? 'break-word' : 'normal',
                            }}
                          >
                            {product[key]}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalProducts > 0 && (
            <Bar
              design="Footer"
              startContent={
                <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>
                  Showing {(currentPage - 1) * limit + 1}-
                  {Math.min(currentPage * limit, totalProducts)} of {totalProducts}
                </Text>
              }
              endContent={
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Button
                    icon="navigation-left-arrow"
                    design="Transparent"
                    disabled={!canGoPrevious}
                    onClick={handlePreviousPage}
                  />
                  <Text style={{ fontSize: '0.875rem', minWidth: '80px', textAlign: 'center' }}>
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

      {/* Dialog with Checkbox-based Selection */}
      <Dialog
        open={!!activeDialog}
        headerText={`Select ${activeDialog?.replace(/([A-Z])/g, ' $1').trim()}`}
        footer={
          <Bar
            design="Footer"
            endContent={
              <>
                <Button design="Transparent" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button design="Emphasized" onClick={applyDialog}>
                  Apply
                </Button>
              </>
            }
          />
        }
      >
        <div
          style={{
            width: '300px',
            height: '230px',
            padding: filterOptionsLoading ? '0.5rem' : '0.75rem 0.5rem',
            overflowY: 'auto',
            display: filterOptionsLoading ? 'flex' : 'block',
            justifyContent: filterOptionsLoading ? 'center' : 'flex-start',
            alignItems: filterOptionsLoading ? 'center' : 'flex-start',
          }}
        >
          {filterOptionsLoading ? (
            <BusyIndicator active size="M" />
          ) : (
            <>
              {getDialogOptions().map((opt) => {
                const isChecked = tempSelection.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      setTempSelection((prev) =>
                        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                      );
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--sapList_Hover_Background)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <CheckBox
                      checked={isChecked}
                      text={opt}
                      onChange={() => {
                        // This will be triggered by direct checkbox click
                        // but the parent div onClick handles all clicks
                      }}
                    />
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
        productGroup={project?.scopeConfig?.productGroup || 'Apparel & Fashion'}
        selectedSeason={selectedSeason}
        dateRange={
          hasValidDateRange()
            ? {
                from: formatDateString(startDay, startMonth),
                to: formatDateString(endDay, endMonth),
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
                OK
              </Button>
            }
          />
        }
      >
        <div style={{ padding: '1rem', minWidth: '400px' }}>
          <MessageStrip design="Negative" style={{ marginBottom: '1rem' }}>
            {errorDialogMessage}
          </MessageStrip>
          <Text>
            The project creation failed. Please check your configuration and try again. If the
            problem persists, please contact support.
          </Text>
        </div>
      </Dialog>
    </div>
  );
}

export default Analysis;
