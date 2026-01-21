import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Input,
  Icon,
  Button,
  Bar,
  Dialog,
  BusyIndicator,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/filter.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/delete.js';

interface GeneratedDesign {
  id: string;
  name: string;
  predictedAttributes: Record<string, string> | null;
  generatedImageUrl: string | null;
}

interface ResultOverviewTabProps {
  projectId: string;
}

const ITEMS_PER_PAGE = 5;

function ResultOverviewTab({ projectId }: ResultOverviewTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<GeneratedDesign | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch generated designs from API
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/projects/${projectId}/generated-designs`);

        if (!response.ok) {
          throw new Error(`Failed to fetch designs: ${response.statusText}`);
        }

        const data = await response.json();
        setDesigns(data);
      } catch (err) {
        console.error('Error fetching generated designs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load generated designs');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchDesigns();
    }
  }, [projectId]);

  // Extract category and subcategory from predictedAttributes
  const getDisplayInfo = (design: GeneratedDesign) => {
    if (!design.predictedAttributes) {
      return { category: '', subcategory: '' };
    }

    const attributes = Object.entries(design.predictedAttributes);
    const category = attributes[0]?.[1] || '';
    const subcategory = attributes[1]?.[1] || '';

    return { category, subcategory };
  };

  // Filter designs by search query
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;
    const query = searchQuery.toLowerCase();
    return designs.filter((d) => {
      const { category, subcategory } = getDisplayInfo(d);
      return (
        d.name.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        subcategory.toLowerCase().includes(query)
      );
    });
  }, [designs, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredDesigns.length / ITEMS_PER_PAGE);
  const paginatedDesigns = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDesigns.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDesigns, currentPage]);

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // Delete functionality
  const handleDeleteClick = (design: GeneratedDesign) => {
    setDesignToDelete(design);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!designToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `/api/projects/${projectId}/generated-designs/${designToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete design: ${response.statusText}`);
      }

      // Remove from local state
      setDesigns((prev) => prev.filter((d) => d.id !== designToDelete.id));

      // Close dialog
      setDeleteDialogOpen(false);
      setDesignToDelete(null);
    } catch (err) {
      console.error('Error deleting design:', err);
      // You could show an error message here if needed
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDesignToDelete(null);
  };

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}
      >
        <BusyIndicator active />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Text style={{ color: 'var(--sapNegativeColor)' }}>Error: {error}</Text>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Input
          placeholder="Search generated variants..."
          icon={<Icon name="search" />}
          value={searchQuery}
          onInput={(e: any) => handleSearchChange(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button icon="filter" design="Transparent" tooltip="Filter options" />
      </div>

      {/* Results Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Title level="H5">Generated Products</Title>
          <Icon name="accept" style={{ color: 'var(--sapPositiveColor)' }} />
        </div>
        <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
          {filteredDesigns.length} variants generated
        </Text>
      </div>

      {/* Results Card */}
      <Card>
        {/* Results List */}
        <div>
          {paginatedDesigns.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Text style={{ color: 'var(--sapContent_LabelColor)' }}>
                {searchQuery ? 'No results match your search.' : 'No generated designs yet.'}
              </Text>
            </div>
          ) : (
            paginatedDesigns.map((design, index) => {
              const { category, subcategory } = getDisplayInfo(design);
              return (
                <div
                  key={design.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    borderBottom:
                      index < paginatedDesigns.length - 1
                        ? '1px solid var(--sapList_BorderColor)'
                        : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--sapList_Hover_Background)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '0.5rem',
                      background: 'var(--sapBackgroundColor)',
                      marginRight: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {design.generatedImageUrl ? (
                      <img
                        src={design.generatedImageUrl}
                        alt={design.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'block' }}>
                      {design.name}
                    </Text>
                    <Text
                      style={{
                        color: 'var(--sapContent_LabelColor)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {category}
                      {subcategory ? ` / ${subcategory}` : ''}
                    </Text>
                  </div>

                  {/* Delete Icon */}
                  <div style={{ marginRight: '1rem' }}>
                    <Button
                      icon="delete"
                      design="Transparent"
                      tooltip="Delete generated product"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(design);
                      }}
                    />
                  </div>

                  {/* Arrow */}
                  <Icon name="slim-arrow-right" style={{ color: 'var(--sapContent_IconColor)' }} />
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {filteredDesigns.length > ITEMS_PER_PAGE && (
          <Bar
            design="Footer"
            startContent={
              <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredDesigns.length)} of{' '}
                {filteredDesigns.length}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        headerText="Delete Generated Product?"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </Button>
            <Button design="Negative" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        <Text>
          Are you sure you want to delete "{designToDelete?.name}"? This action cannot be undone.
        </Text>
      </Dialog>
    </div>
  );
}

export default ResultOverviewTab;
