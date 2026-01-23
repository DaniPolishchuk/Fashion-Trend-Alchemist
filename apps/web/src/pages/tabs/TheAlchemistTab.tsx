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
  Toast,
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
import '@ui5/webcomponents-icons/dist/inspection.js';
import '@ui5/webcomponents-icons/dist/target-group.js';

// Article-level attribute keys (from database schema)
const ARTICLE_ATTRIBUTES = [
  'product_type',
  'product_group',
  'product_family',
  'pattern_style',
  'specific_color',
  'color_intensity',
  'color_family',
  'customer_segment',
  'style_concept',
  'fabric_type_base',
] as const;

// Attributes that start in "Locked" by default (first 3 after product_type)
const DEFAULT_LOCKED = ['product_family', 'pattern_style', 'specific_color'];

// Attributes that start in "Not Included" by default
const DEFAULT_NOT_INCLUDED = ['product_group', 'product_type'];

// Maximum AI Variables allowed (RPT-1 Large limit)
const MAX_AI_VARIABLES = 10;

interface ProjectData {
  id: string;
  name: string;
  ontologySchema: Record<string, Record<string, string[]>> | null;
  scopeConfig: {
    productTypes?: string[];
    [key: string]: unknown;
  } | null;
}

type AttributeCategory = 'locked' | 'ai' | 'notIncluded';

interface AttributeConfig {
  key: string;
  displayName: string;
  variants: string[];
  category: AttributeCategory;
  selectedValue: string | null;
  isArticleLevel: boolean; // true if from article schema, false if from ontology
}

interface TheAlchemistTabProps {
  project: ProjectData;
}

interface PreviewData {
  contextRowCount: number;
  totalContextItems: number;
  missingEnrichmentCount: number;
  lockedAttributes: { key: string; displayName: string; value: string }[];
  aiVariables: { key: string; displayName: string }[];
  samplePayload: object;
}

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
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [successScore, setSuccessScore] = useState(100); // Default to 100% (maximum success)

  // Memoize productTypes as a stable string to prevent unnecessary refetches
  // when the array reference changes but values remain the same
  const productTypesKey = useMemo(
    () => (project.scopeConfig?.productTypes ?? []).slice().sort().join(','),
    [project.scopeConfig?.productTypes]
  );

  // Memoize ontologySchema as a stable string to prevent unnecessary effect runs
  const ontologySchemaKey = useMemo(
    () => JSON.stringify(project.ontologySchema ?? {}),
    [project.ontologySchema]
  );

  // Format attribute name: convert snake_case to Title Case
  const formatAttributeName = (name: string): string => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Fetch article-level attribute options based on product types
  // Uses cancellation flag to prevent stale fetches from updating state (React Strict Mode safety)
  useEffect(() => {
    let isCancelled = false;

    const fetchArticleAttributes = async () => {
      const productTypes = project.scopeConfig?.productTypes;
      if (!productTypes || productTypes.length === 0) {
        // No product types - set empty options so initialization can proceed
        if (!isCancelled) setArticleAttributeOptions({});
        return;
      }

      try {
        const typesParam = productTypes.join(',');
        const response = await fetch(
          `/api/filters/attributes?types=${encodeURIComponent(typesParam)}`
        );

        // Don't update state if the effect was cleaned up (component unmounted or deps changed)
        if (isCancelled) return;

        if (response.ok) {
          const data = await response.json();
          // Map response keys to snake_case to match article schema
          setArticleAttributeOptions({
            product_group: data.productGroup || [],
            product_family: data.productFamily || [],
            pattern_style: data.patternStyle || [],
            specific_color: data.specificColor || [],
            color_intensity: data.colorIntensity || [],
            color_family: data.colorFamily || [],
            customer_segment: data.customerSegment || [],
            style_concept: data.styleConcept || [],
            fabric_type_base: data.fabricTypeBase || [],
            // product_type comes from scopeConfig
            product_type: productTypes,
          });
        } else {
          // On error, set empty options so initialization can proceed
          setArticleAttributeOptions({});
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch article attributes:', error);
          // On error, set empty options so initialization can proceed
          setArticleAttributeOptions({});
        }
      }
    };

    fetchArticleAttributes();

    // Cleanup: cancel stale fetch updates when deps change or component unmounts
    return () => {
      isCancelled = true;
    };
  }, [productTypesKey, project.scopeConfig?.productTypes]); // productTypesKey for stable comparison, productTypes for ESLint

  // Initialize attributes ONCE when article options are loaded
  // Uses attributesInitialized flag to prevent re-initialization on subsequent renders
  // BUT allows re-initialization if ontologySchema changes from null to a value (after lock-context)
  useEffect(() => {
    // Wait until article attributes have been fetched (null = not yet fetched)
    if (articleAttributeOptions === null) return;

    // Debug: Log current state to diagnose initialization issues
    console.log('[TheAlchemistTab] Attribute initialization check:', {
      articleAttributeOptionsLoaded: articleAttributeOptions !== null,
      articleAttributeCount: Object.keys(articleAttributeOptions || {}).length,
      ontologySchema: project.ontologySchema,
      ontologySchemaKey,
      attributesInitialized,
      projectStatus: project.scopeConfig ? 'has scopeConfig' : 'no scopeConfig',
    });

    // Only initialize once, UNLESS ontologySchema was previously null and now has a value
    // This handles the case where user creates a project (ontologySchema=null) and later
    // locks context (ontologySchema gets populated)
    if (attributesInitialized) {
      // Check if we need to re-initialize because ontologySchema was added
      const hasOntologyAttributes = attributes.some((attr) => !attr.isArticleLevel);
      const ontologyNowAvailable =
        project.ontologySchema && Object.keys(project.ontologySchema).length > 0;

      if (!hasOntologyAttributes && ontologyNowAvailable) {
        console.log('[TheAlchemistTab] Ontology schema now available, re-initializing attributes');
        // Reset flag to allow re-initialization with ontology attributes
        setAttributesInitialized(false);
        return;
      }

      // Already initialized and no new ontology data - skip
      return;
    }

    const initialAttributes: AttributeConfig[] = [];

    // Add article-level attributes
    ARTICLE_ATTRIBUTES.forEach((attrKey) => {
      const variants = articleAttributeOptions[attrKey] || [];
      if (variants.length > 0) {
        const isLocked = DEFAULT_LOCKED.includes(attrKey);
        const isNotIncluded = DEFAULT_NOT_INCLUDED.includes(attrKey);

        let category: AttributeCategory;
        let selectedValue: string | null = null;

        if (isLocked) {
          category = 'locked';
          selectedValue = variants[0] || null; // Set first variant as default
        } else if (isNotIncluded) {
          category = 'notIncluded';
        } else {
          category = 'ai';
        }

        initialAttributes.push({
          key: `article_${attrKey}`,
          displayName: formatAttributeName(attrKey),
          variants,
          category,
          selectedValue,
          isArticleLevel: true,
        });
      }
    });

    // Add ontology-generated attributes
    if (project.ontologySchema) {
      Object.entries(project.ontologySchema).forEach(([productType, productAttributes]) => {
        if (typeof productAttributes === 'object' && productAttributes !== null) {
          Object.entries(productAttributes).forEach(([attrKey, variants]) => {
            if (Array.isArray(variants) && variants.length > 0) {
              initialAttributes.push({
                key: `ontology_${productType}_${attrKey}`,
                displayName: formatAttributeName(attrKey),
                variants,
                category: 'ai', // Ontology attributes default to AI Variables
                selectedValue: null,
                isArticleLevel: false,
              });
            }
          });
        }
      });
    } else {
      console.log(
        '[TheAlchemistTab] WARNING: ontologySchema is null/undefined - ontology attributes will not be loaded'
      );
    }

    // Debug: Log what attributes were initialized
    const articleCount = initialAttributes.filter((a) => a.isArticleLevel).length;
    const ontologyCount = initialAttributes.filter((a) => !a.isArticleLevel).length;
    console.log('[TheAlchemistTab] Initializing attributes:', {
      totalAttributes: initialAttributes.length,
      articleAttributes: articleCount,
      ontologyAttributes: ontologyCount,
      attributeKeys: initialAttributes.map((a) => a.key),
    });

    setAttributes(initialAttributes);
    setAttributesInitialized(true);
  }, [
    ontologySchemaKey,
    articleAttributeOptions,
    attributesInitialized,
    project.ontologySchema,
    attributes,
  ]);

  // Move attribute to locked
  const handleMoveToLocked = (key: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.key === key
          ? { ...attr, category: 'locked', selectedValue: attr.variants[0] || null }
          : attr
      )
    );
  };

  // Move attribute to AI Variable
  const handleMoveToAIVariable = (key: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.key === key ? { ...attr, category: 'ai', selectedValue: null } : attr
      )
    );
  };

  // Move attribute to Not Included
  const handleMoveToNotIncluded = (key: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.key === key ? { ...attr, category: 'notIncluded', selectedValue: null } : attr
      )
    );
  };

  // Update selected value for locked attribute
  const handleValueChange = (key: string, value: string) => {
    setAttributes((prev) =>
      prev.map((attr) => (attr.key === key ? { ...attr, selectedValue: value } : attr))
    );
  };

  // Fetch preview data
  const fetchPreviewData = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/rpt1-preview`);
      if (!response.ok) {
        throw new Error('Failed to fetch preview data');
      }
      const contextData = await response.json();

      const lockedAttrs = attributes
        .filter((attr) => attr.category === 'locked')
        .map((attr) => ({
          key: attr.key,
          displayName: attr.displayName,
          value: attr.selectedValue || '',
        }));

      const aiVars = attributes
        .filter((attr) => attr.category === 'ai')
        .map((attr) => ({
          key: attr.key,
          displayName: attr.displayName,
        }));

      // Build sample payload
      const queryRow: Record<string, string> = {};
      lockedAttrs.forEach((attr) => {
        queryRow[attr.key] = attr.value;
      });
      aiVars.forEach((attr) => {
        queryRow[attr.key] = '[PREDICT]';
      });

      setPreviewData({
        contextRowCount: contextData.enrichedCount || 0,
        totalContextItems: contextData.totalCount || 0,
        missingEnrichmentCount: (contextData.totalCount || 0) - (contextData.enrichedCount || 0),
        lockedAttributes: lockedAttrs,
        aiVariables: aiVars,
        samplePayload: {
          rows: [{ '...': '(context rows from enriched articles)' }, queryRow],
        },
      });
    } catch (error) {
      console.error('Failed to fetch preview:', error);
      // Show basic preview without context data
      const lockedAttrs = attributes
        .filter((attr) => attr.category === 'locked')
        .map((attr) => ({
          key: attr.key,
          displayName: attr.displayName,
          value: attr.selectedValue || '',
        }));

      const aiVars = attributes
        .filter((attr) => attr.category === 'ai')
        .map((attr) => ({
          key: attr.key,
          displayName: attr.displayName,
        }));

      setPreviewData({
        contextRowCount: 0,
        totalContextItems: 0,
        missingEnrichmentCount: 0,
        lockedAttributes: lockedAttrs,
        aiVariables: aiVars,
        samplePayload: {},
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [project.id, attributes]);

  // Handle Preview button click
  const handlePreview = async () => {
    setPreviewDialogOpen(true);
    await fetchPreviewData();
  };

  // Handle Transmute (Run RPT-1) button click
  const handleTransmute = async () => {
    setTransmuting(true);
    setPreviewDialogOpen(false);

    try {
      const lockedAttrs = attributes
        .filter((attr) => attr.category === 'locked')
        .reduce(
          (acc, attr) => {
            acc[attr.key] = attr.selectedValue || '';
            return acc;
          },
          {} as Record<string, string>
        );

      const aiVars = attributes.filter((attr) => attr.category === 'ai').map((attr) => attr.key);

      const response = await fetch(`/api/projects/${project.id}/rpt1-predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockedAttributes: lockedAttrs,
          aiVariables: aiVars,
          successScore: successScore, // Target success score (0-100)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show error with code and description
        const errorCode = response.status;
        const errorMessages: Record<number, string> = {
          400: 'Bad Request - Invalid data format or validation error',
          401: 'Unauthorized - Invalid or missing API token',
          429: 'Too Many Requests - Rate limit exceeded',
          503: 'Service Unavailable - Server is under high load',
          500: 'Internal Server Error - Contact support',
        };
        const errorDesc = errorMessages[errorCode] || 'Unknown error occurred';
        setToastMessage({
          text: `Error ${errorCode}: ${errorDesc}${result.details ? ` - ${result.details}` : ''}`,
          type: 'error',
        });
      } else {
        setToastMessage({
          text: `Design "${result.designName}" created successfully!`,
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Transmutation failed:', error);
      setToastMessage({
        text: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setTransmuting(false);
    }
  };

  const lockedAttributes = attributes.filter((attr) => attr.category === 'locked');
  const aiVariables = attributes.filter((attr) => attr.category === 'ai');
  const notIncludedAttributes = attributes.filter((attr) => attr.category === 'notIncluded');

  const aiVariableCount = aiVariables.length;
  const isOverLimit = aiVariableCount > MAX_AI_VARIABLES;
  const canTransmute = aiVariableCount > 0 && aiVariableCount <= MAX_AI_VARIABLES && !transmuting;

  // Show loading state until all data is fetched and attributes are initialized
  const isLoading = articleAttributeOptions === null || !attributesInitialized;

  if (isLoading) {
    return (
      <div>
        {/* Main Layout: Parameters Card + Success Score Panel with Skeleton Loading */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left: Transmutation Parameters Card with Skeleton */}
          <Card style={{ flex: 1 }}>
            {/* Card Header */}
            <div
              style={{ padding: '1.5rem', borderBottom: '1px solid var(--sapList_BorderColor)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon name="ai" style={{ fontSize: '1.25rem', color: '#0070F2' }} />
                <div>
                  <Title level="H4" style={{ marginBottom: '0.25rem' }}>
                    Transmutation Parameters
                  </Title>
                  <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                    Configure locked attributes and AI targets for RPT-1 prediction
                  </Text>
                </div>
              </div>
            </div>

            {/* Three Column Layout with Skeleton Loading */}
            <div
              style={{ display: 'flex', minHeight: '400px' }}
              role="status"
              aria-busy="true"
              aria-label="Loading attributes"
            >
              {/* Left Column: Locked Attributes Skeleton */}
              <div
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  borderRight: '1px solid var(--sapList_BorderColor)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <Icon name="locked" style={{ color: 'var(--sapContent_LabelColor)' }} />
                  <Text
                    style={{
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      color: 'var(--sapContent_LabelColor)',
                    }}
                  >
                    Locked Attributes (Loading...)
                  </Text>
                </div>
                <AttributeSkeletonLoader variant="locked" count={3} />
              </div>

              {/* Middle Column: AI Variables Skeleton */}
              <div
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  borderRight: '1px solid var(--sapList_BorderColor)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <Icon name="ai" style={{ color: '#E9730C' }} />
                  <Text
                    style={{
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      color: '#E9730C',
                    }}
                  >
                    AI Variables (Loading...)
                  </Text>
                </div>
                <AttributeSkeletonLoader variant="ai" count={10} />
              </div>

              {/* Right Column: Not Included Skeleton */}
              <div style={{ flex: 1, padding: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <Icon name="hint" style={{ color: 'var(--sapNeutralTextColor)' }} />
                  <Text
                    style={{
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      color: 'var(--sapNeutralTextColor)',
                    }}
                  >
                    Not Included (Loading...)
                  </Text>
                </div>
                <AttributeSkeletonLoader variant="notIncluded" count={2} />
              </div>
            </div>

            {/* Footer with Disabled Transmute Button */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--sapList_BorderColor)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                  Loading attributes...
                </Text>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  design="Transparent"
                  icon="inspection"
                  disabled
                  tooltip="Loading attributes..."
                >
                  Preview Request
                </Button>
                <Button
                  design="Emphasized"
                  icon="ai"
                  disabled
                  tooltip="Loading attributes..."
                  style={{ opacity: 0.5 }}
                >
                  Transmute (Run RPT-1)
                </Button>
              </div>
            </div>
          </Card>

          {/* Right: Success Score Panel (remains visible during loading) */}
          <Card style={{ width: '280px', flexShrink: 0 }}>
            <div style={{ padding: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <Icon name="target-group" style={{ color: '#107E3E' }} />
                <Text
                  style={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    color: '#107E3E',
                  }}
                >
                  Target Success
                </Text>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <Text
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--sapContent_LabelColor)',
                    marginBottom: '0.75rem',
                    display: 'block',
                  }}
                >
                  Set the desired performance level for the generated design. Higher values target
                  top-performing attribute combinations.
                </Text>
              </div>

              {/* Success Score Display */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  background:
                    'linear-gradient(135deg, rgba(16, 126, 62, 0.1) 0%, rgba(16, 126, 62, 0.05) 100%)',
                  borderRadius: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <Text
                  style={{
                    fontSize: '3rem',
                    fontWeight: 700,
                    color: '#107E3E',
                    lineHeight: 1,
                  }}
                >
                  {successScore}
                </Text>
                <Text
                  style={{
                    fontSize: '1rem',
                    color: '#107E3E',
                    marginLeft: '0.25rem',
                  }}
                >
                  %
                </Text>
                <Text
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--sapContent_LabelColor)',
                    marginTop: '0.5rem',
                  }}
                >
                  {successScore >= 90
                    ? 'Top Performer'
                    : successScore >= 70
                      ? 'Above Average'
                      : successScore >= 50
                        ? 'Average'
                        : 'Below Average'}
                </Text>
              </div>

              {/* Slider - disabled during loading */}
              <div style={{ padding: '0 0.5rem' }}>
                <Slider
                  value={successScore}
                  min={0}
                  max={100}
                  step={5}
                  showTickmarks
                  labelInterval={4}
                  onChange={(e: any) => setSuccessScore(e.target.value)}
                  disabled={isLoading}
                  style={{ width: '100%', opacity: isLoading ? 0.6 : 1 }}
                />
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}
                >
                  <Text style={{ fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>
                    Low
                  </Text>
                  <Text style={{ fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>
                    High
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!project.ontologySchema && Object.keys(articleAttributeOptions || {}).length === 0) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center' }}>
        <Text>No attributes available for this project.</Text>
      </Card>
    );
  }

  return (
    <div>
      {/* Toast for success/error messages */}
      {toastMessage && (
        <Toast open onClose={() => setToastMessage(null)} duration={5000} placement="TopCenter">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: toastMessage.type === 'error' ? '#BB0000' : '#107E3E',
            }}
          >
            <Icon name={toastMessage.type === 'error' ? 'error' : 'message-success'} />
            {toastMessage.text}
          </div>
        </Toast>
      )}

      {/* Main Layout: Parameters Card + Success Score Panel */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left: Transmutation Parameters Card */}
        <Card style={{ flex: 1 }}>
          {/* Card Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon name="ai" style={{ fontSize: '1.25rem', color: '#0070F2' }} />
                <div>
                  <Title level="H4" style={{ marginBottom: '0.25rem' }}>
                    Transmutation Parameters
                  </Title>
                  <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                    Configure locked attributes and AI targets for RPT-1 prediction
                  </Text>
                </div>
              </div>
              {/* Warning message for too many AI Variables - moved from column to header */}
              {isOverLimit && (
                <div style={{ maxWidth: '300px' }}>
                  <MessageStrip design="Negative" hideCloseButton>
                    Too many AI Variables. Maximum is {MAX_AI_VARIABLES}. Move some to "Not
                    Included".
                  </MessageStrip>
                </div>
              )}
            </div>
          </div>

          {/* Three Column Layout */}
          <div style={{ display: 'flex', minHeight: '400px' }}>
            {/* Left Column: Locked Attributes */}
            <div
              style={{
                flex: 1,
                padding: '1.5rem',
                borderRight: '1px solid var(--sapList_BorderColor)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <Icon name="locked" style={{ color: 'var(--sapContent_LabelColor)' }} />
                <Text
                  style={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    color: 'var(--sapContent_LabelColor)',
                  }}
                >
                  Locked Attributes ({lockedAttributes.length})
                </Text>
              </div>

              {lockedAttributes.length === 0 ? (
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>
                  No locked attributes. Move attributes here to fix their values.
                </Text>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    maxHeight: 'calc(5 * 4.25rem)', // ~5 items height + 20px increase
                    overflowY: 'auto',
                    paddingRight: '0.5rem', // Space for scrollbar
                  }}
                >
                  {lockedAttributes.map((attr) => (
                    <div key={attr.key}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          {attr.displayName}
                          {attr.isArticleLevel && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--sapContent_LabelColor)',
                                marginLeft: '0.5rem',
                              }}
                            >
                              (Article)
                            </span>
                          )}
                        </Text>
                        <Button
                          icon="decline"
                          design="Transparent"
                          tooltip="Move to Not Included"
                          onClick={() => handleMoveToNotIncluded(attr.key)}
                          style={{ minWidth: 'auto', padding: '0.25rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Select
                          style={{ flex: 1 }}
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
                          icon="arrow-right"
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

            {/* Middle Column: AI Variables */}
            <div
              style={{
                flex: 1,
                padding: '1.5rem',
                borderRight: '1px solid var(--sapList_BorderColor)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <Icon name="ai" style={{ color: '#E9730C' }} />
                <Text
                  style={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    color: isOverLimit ? '#BB0000' : '#E9730C',
                  }}
                >
                  AI Variables ({aiVariableCount}/{MAX_AI_VARIABLES})
                </Text>
              </div>

              {aiVariables.length === 0 ? (
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>
                  No AI variables. Move attributes here to have RPT-1 predict them.
                </Text>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    maxHeight: 'calc(5 * 4.25rem)', // ~5 items height + 20px increase (uniform with locked)
                    overflowY: 'auto',
                    paddingRight: '0.5rem', // Space for scrollbar
                  }}
                >
                  {aiVariables.map((attr) => (
                    <div
                      key={attr.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Button
                        icon="arrow-left"
                        design="Transparent"
                        tooltip="Move to Locked Attributes"
                        onClick={() => handleMoveToLocked(attr.key)}
                      />
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          border: `1px solid ${isOverLimit ? '#BB0000' : '#E9730C'}`,
                          borderRadius: '0.5rem',
                          background: isOverLimit
                            ? 'rgba(187, 0, 0, 0.05)'
                            : 'rgba(233, 115, 12, 0.05)',
                        }}
                      >
                        <Icon
                          name="ai"
                          style={{
                            color: '#E9730C',
                            fontSize: '1.25rem',
                          }}
                        />
                        <Text style={{ fontSize: '0.875rem' }}>
                          {attr.displayName}
                          {attr.isArticleLevel && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--sapContent_LabelColor)',
                                marginLeft: '0.5rem',
                              }}
                            >
                              (Article)
                            </span>
                          )}
                        </Text>
                      </div>
                      <Button
                        icon="decline"
                        design="Transparent"
                        tooltip="Move to Not Included"
                        onClick={() => handleMoveToNotIncluded(attr.key)}
                        style={{ minWidth: 'auto' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Not Included */}
            <div style={{ flex: 1, padding: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <Icon name="hint" style={{ color: 'var(--sapNeutralTextColor)' }} />
                <Text
                  style={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    color: 'var(--sapNeutralTextColor)',
                  }}
                >
                  Not Included ({notIncludedAttributes.length})
                </Text>
              </div>

              {notIncludedAttributes.length === 0 ? (
                <Text style={{ color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>
                  No excluded attributes. Use the X button to move attributes here.
                </Text>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    maxHeight: 'calc(5 * 4.25rem)', // ~5 items height + 20px increase (uniform with locked)
                    overflowY: 'auto',
                    paddingRight: '0.5rem', // Space for scrollbar
                  }}
                >
                  {notIncludedAttributes.map((attr) => (
                    <div
                      key={attr.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Button
                        icon="add"
                        design="Transparent"
                        tooltip="Move to AI Variables"
                        onClick={() => handleMoveToAIVariable(attr.key)}
                      />
                      <div
                        style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          border: '1px dashed var(--sapNeutralBorderColor)',
                          borderRadius: '0.5rem',
                          background: 'var(--sapNeutralBackground)',
                        }}
                      >
                        <Text style={{ color: 'var(--sapNeutralTextColor)', fontSize: '0.875rem' }}>
                          {attr.displayName}
                          {attr.isArticleLevel && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--sapContent_LabelColor)',
                                marginLeft: '0.5rem',
                              }}
                            >
                              (Article)
                            </span>
                          )}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer with Transmute Button */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--sapList_BorderColor)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                design="Transparent"
                icon="inspection"
                onClick={handlePreview}
                disabled={transmuting}
              >
                Preview Request
              </Button>
              <Button
                design="Emphasized"
                icon="ai"
                onClick={handlePreview}
                disabled={!canTransmute}
                style={{
                  background: canTransmute
                    ? 'linear-gradient(90deg, #0070F2 0%, #0050C8 100%)'
                    : undefined,
                  opacity: canTransmute ? 1 : 0.5,
                }}
              >
                {transmuting ? 'Transmuting...' : 'Transmute (Run RPT-1)'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Right: Success Score Panel */}
        <Card style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Icon name="target-group" style={{ color: '#107E3E' }} />
              <Text
                style={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  color: '#107E3E',
                }}
              >
                Target Success
              </Text>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <Text
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--sapContent_LabelColor)',
                  marginBottom: '0.75rem',
                  display: 'block',
                }}
              >
                Set the desired performance level for the generated design. Higher values target
                top-performing attribute combinations.
              </Text>
            </div>

            {/* Success Score Display */}
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                background:
                  'linear-gradient(135deg, rgba(16, 126, 62, 0.1) 0%, rgba(16, 126, 62, 0.05) 100%)',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <Text
                style={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: '#107E3E',
                  lineHeight: 1,
                }}
              >
                {successScore}
              </Text>
              <Text
                style={{
                  fontSize: '1rem',
                  color: '#107E3E',
                  marginLeft: '0.25rem',
                }}
              >
                %
              </Text>
              <Text
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'var(--sapContent_LabelColor)',
                  marginTop: '0.5rem',
                }}
              >
                {successScore >= 90
                  ? 'Top Performer'
                  : successScore >= 70
                    ? 'Above Average'
                    : successScore >= 50
                      ? 'Average'
                      : 'Below Average'}
              </Text>
            </div>

            {/* Slider */}
            <div style={{ padding: '0 0.5rem' }}>
              <Slider
                value={successScore}
                min={0}
                max={100}
                step={5}
                showTickmarks
                labelInterval={4}
                onChange={(e: any) => setSuccessScore(e.target.value)}
                style={{ width: '100%' }}
              />
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}
              >
                <Text style={{ fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>
                  Low
                </Text>
                <Text style={{ fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>
                  High
                </Text>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        headerText="RPT-1 Request Preview"
        style={{ width: '600px' }}
        footer={
          <Bar
            endContent={
              <>
                <Button design="Transparent" onClick={() => setPreviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  design="Emphasized"
                  onClick={handleTransmute}
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
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <BusyIndicator active size="M" />
            <Text style={{ display: 'block', marginTop: '1rem' }}>Loading preview data...</Text>
          </div>
        ) : previewData ? (
          <div style={{ padding: '1rem' }}>
            {/* Context Summary */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Title level="H5" style={{ marginBottom: '0.75rem' }}>
                Context Summary
              </Title>
              <div
                style={{
                  padding: '1rem',
                  background: 'var(--sapList_Background)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--sapList_BorderColor)',
                }}
              >
                <Text style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <strong>Context Rows:</strong> {previewData.contextRowCount} of{' '}
                  {previewData.totalContextItems} articles
                </Text>
                {previewData.missingEnrichmentCount > 0 && (
                  <MessageStrip design="Critical" hideCloseButton style={{ marginTop: '0.5rem' }}>
                    {previewData.missingEnrichmentCount} articles missing enriched attributes (will
                    be excluded)
                  </MessageStrip>
                )}
                {previewData.contextRowCount === 0 && (
                  <MessageStrip design="Negative" hideCloseButton style={{ marginTop: '0.5rem' }}>
                    No context rows available. Run image enrichment first.
                  </MessageStrip>
                )}
              </div>
            </div>

            {/* Query Structure */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Title level="H5" style={{ marginBottom: '0.75rem' }}>
                Query Structure
              </Title>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem',
                        borderBottom: '1px solid var(--sapList_BorderColor)',
                      }}
                    >
                      Attribute
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem',
                        borderBottom: '1px solid var(--sapList_BorderColor)',
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem',
                        borderBottom: '1px solid var(--sapList_BorderColor)',
                      }}
                    >
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.lockedAttributes.map((attr) => (
                    <tr key={attr.key}>
                      <td
                        style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid var(--sapList_BorderColor)',
                        }}
                      >
                        {attr.displayName}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid var(--sapList_BorderColor)',
                        }}
                      >
                        <span style={{ color: 'var(--sapContent_LabelColor)' }}>Locked</span>
                      </td>
                      <td
                        style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid var(--sapList_BorderColor)',
                        }}
                      >
                        {attr.value}
                      </td>
                    </tr>
                  ))}
                  {previewData.aiVariables.map((attr) => (
                    <tr key={attr.key}>
                      <td
                        style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid var(--sapList_BorderColor)',
                        }}
                      >
                        {attr.displayName}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid var(--sapList_BorderColor)',
                        }}
                      >
                        <span style={{ color: '#E9730C' }}>AI Variable</span>
                      </td>
                      <td
                        style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid var(--sapList_BorderColor)',
                        }}
                      >
                        <code style={{ color: '#E9730C' }}>[PREDICT]</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Raw JSON (collapsible) */}
            <details>
              <summary
                style={{
                  cursor: 'pointer',
                  color: 'var(--sapContent_LabelColor)',
                  marginBottom: '0.5rem',
                }}
              >
                View Raw JSON Payload
              </summary>
              <pre
                style={{
                  background: 'var(--sapShell_Background)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  maxHeight: '200px',
                }}
              >
                {JSON.stringify(previewData.samplePayload, null, 2)}
              </pre>
            </details>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

export default TheAlchemistTab;
