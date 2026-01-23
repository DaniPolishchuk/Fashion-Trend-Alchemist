import { useState, useEffect } from 'react';
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

interface ProductGroupTaxonomy {
  productGroup: string;
  typeCount: number;
  productTypes: string[];
}

interface Taxonomy {
  groups: ProductGroupTaxonomy[];
}

const STORAGE_KEY = 'fashion.productSelection.selectedTypes';

function ProductSelection() {
  const navigate = useNavigate();
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortAZ, setSortAZ] = useState(true);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [articleCount, setArticleCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectCreating, setProjectCreating] = useState(false);

  // Load selections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        setSelectedTypes(new Set(parsed));
      } catch (e) {
        console.error('Failed to load saved selections', e);
      }
    }
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedTypes)));
  }, [selectedTypes]);

  useEffect(() => {
    fetchTaxonomy();
  }, []);

  // Debounced count fetch (both transactions and articles)
  useEffect(() => {
    if (selectedTypes.size === 0) {
      setRowCount(0);
      setArticleCount(0);
      return;
    }

    const timer = setTimeout(() => {
      fetchRowCount();
      fetchArticleCount();
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedTypes]);

  const fetchTaxonomy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/taxonomy');

      if (!response.ok) {
        throw new Error('Failed to fetch taxonomy');
      }

      const data: Taxonomy = await response.json();
      setTaxonomy(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchRowCount = async () => {
    try {
      setCountLoading(true);
      // Extract just the product type names from the keys
      const types = Array.from(selectedTypes).map((key) => key.split('::')[1]);
      const typesParam = types.join(',');

      const response = await fetch(
        `/api/transactions/count?types=${encodeURIComponent(typesParam)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch row count');
      }

      const data = await response.json();
      setRowCount(data.count);
    } catch (err) {
      console.error('Failed to fetch row count:', err);
      setRowCount(null);
    } finally {
      setCountLoading(false);
    }
  };

  const fetchArticleCount = async () => {
    try {
      // Extract just the product type names from the keys
      const types = Array.from(selectedTypes).map((key) => key.split('::')[1]);
      const typesParam = types.join(',');

      const response = await fetch(`/api/articles/count?types=${encodeURIComponent(typesParam)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch article count');
      }

      const data = await response.json();
      setArticleCount(data.count);
    } catch (err) {
      console.error('Failed to fetch article count:', err);
      setArticleCount(null);
    }
  };

  const handleExpandAll = () => {
    if (taxonomy) {
      if (expandedGroups.size === taxonomy.groups.length) {
        setExpandedGroups(new Set());
      } else {
        setExpandedGroups(new Set(taxonomy.groups.map((g) => g.productGroup)));
      }
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleType = (groupName: string, typeName: string) => {
    const key = `${groupName}::${typeName}`;
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedTypes(newSelected);
  };

  const handleClearAll = () => {
    setSelectedTypes(new Set());
  };

  const handleProceed = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    if (selectedTypes.size === 0) {
      setError('Please select at least one product type');
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
      localStorage.removeItem(STORAGE_KEY);

      // Navigate to context builder page with project data (no project creation yet)
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
      setError(err instanceof Error ? err.message : 'Failed to proceed');
    } finally {
      setProjectCreating(false);
    }
  };

  const filterTypes = (types: string[]) => {
    if (!searchQuery) return types;
    return types.filter((type) => type.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const getSortedGroups = () => {
    if (!taxonomy) return [];
    const groups = [...taxonomy.groups].filter((g) => g.productGroup !== 'Unknown');
    return sortAZ
      ? groups.sort((a, b) => a.productGroup.localeCompare(b.productGroup))
      : groups.sort((a, b) => b.productGroup.localeCompare(a.productGroup));
  };

  if (loading) {
    return (
      <Page style={{ height: 'calc(100vh - 44px)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <BusyIndicator active size="L" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page style={{ height: 'calc(100vh - 44px)' }}>
        <MessageStrip design="Negative">Error loading product taxonomy: {error}</MessageStrip>
        <Button onClick={fetchTaxonomy}>Retry</Button>
      </Page>
    );
  }

  const sortedGroups = getSortedGroups();

  return (
    <Page
      style={{
        minHeight: 'calc(100vh - 44px)',
        paddingBottom: '140px',
        background: 'var(--sapBackgroundColor)',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      {/* Breadcrumbs */}
      <div style={{ padding: '12px 16px 0 16px' }}>
        <Breadcrumbs
          onItemClick={(e: any) => {
            const text = e.detail.item.textContent?.trim();
            if (text === 'Home') {
              navigate('/');
            }
          }}
        >
          <BreadcrumbsItem>Home</BreadcrumbsItem>
          <BreadcrumbsItem>Product Selection</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* Header with Title and Row Count */}
      <div style={{ padding: '16px 16px 0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, marginRight: '24px' }}>
            <Title level="H2" style={{ marginBottom: '8px', fontSize: '30px' }}>
              Select Product Scope
            </Title>
            <Text
              style={{
                color: 'var(--sapContent_LabelColor)',
                fontSize: '15px',
                marginBottom: '12px',
              }}
            >
              Choose product groups and types for the upcoming product generation.
            </Text>
            <div style={{ maxWidth: '400px' }}>
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '4px',
                  display: 'block',
                }}
              >
                Project Name
              </Text>
              <Input
                placeholder="Enter a descriptive name for this project..."
                value={projectName}
                onInput={(e: any) => setProjectName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div
            style={{
              marginTop: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: 'flex-end',
            }}
          >
            {countLoading ? (
              <ObjectStatus state="Information">Loading...</ObjectStatus>
            ) : rowCount !== null ? (
              <>
                <ObjectStatus state="Information">
                  {rowCount.toLocaleString()} transaction rows
                </ObjectStatus>
                {articleCount !== null && (
                  <ObjectStatus state="Information">
                    {articleCount.toLocaleString()} unique articles
                  </ObjectStatus>
                )}
              </>
            ) : (
              <ObjectStatus state="None">Select types</ObjectStatus>
            )}
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div
        style={{
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingBottom: '16px',
          paddingTop: 0,
        }}
      >
        <Card
          style={{
            width: '100%',
            minHeight: '72px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Pill-style filter input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                maxWidth: '760px',
                backgroundColor: 'var(--sapUiBaseBG)',
                borderRadius: '12px',
                padding: '8px 12px',
              }}
            >
              <Icon name="filter" style={{ color: 'var(--sapContent_IconColor)' }} />
              <Input
                placeholder="Filter product types by name..."
                value={searchQuery}
                onInput={(e: any) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--sapBackgroundColor)',
                  border: 'none',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                icon={sortAZ ? 'sort-ascending' : 'sort-ascending'}
                design="Transparent"
                onClick={() => setSortAZ(!sortAZ)}
              >
                Sort {sortAZ ? 'A-Z' : 'Z-A'}
              </Button>
              <Button design="Transparent" onClick={handleExpandAll}>
                {expandedGroups.size === sortedGroups.length ? 'Collapse All' : 'Expand All'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div
        style={{
          columnCount: 3,
          columnGap: '16px',
          padding: '16px',
          marginBottom: '80px',
        }}
      >
        {sortedGroups.map((group) => {
          const filteredTypes = filterTypes(group.productTypes);
          const isExpanded = expandedGroups.has(group.productGroup);

          if (filteredTypes.length === 0 && searchQuery) {
            return null;
          }

          return (
            <Card
              key={group.productGroup}
              style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                width: '100%',
              }}
              header={
                <CardHeader
                  titleText={group.productGroup}
                  subtitleText={`${filteredTypes.length} items`}
                  avatar={<Icon name="product" />}
                  interactive
                  onClick={() => toggleGroup(group.productGroup)}
                />
              }
            >
              {isExpanded && (
                <List style={{ maxHeight: '220px', overflowY: 'auto' }}>
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
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          width: '100%',
        }}
        startContent={
          <Text>
            <strong>{selectedTypes.size} items selected</strong>
            {selectedTypes.size > 0 && (
              <span style={{ marginLeft: '1rem', color: 'var(--sapContent_LabelColor)' }}>
                from {new Set(Array.from(selectedTypes).map((s) => s.split('::')[0])).size}{' '}
                categories
              </span>
            )}
          </Text>
        }
        endContent={
          <>
            <Button design="Transparent" onClick={handleClearAll}>
              Clear all
            </Button>
            <Button design="Transparent" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button
              design="Emphasized"
              onClick={handleProceed}
              disabled={selectedTypes.size === 0 || !projectName.trim() || projectCreating}
            >
              {projectCreating ? 'Creating Project...' : 'Proceed to Analysis'}
            </Button>
          </>
        }
      />
    </Page>
  );
}

export default ProductSelection;
