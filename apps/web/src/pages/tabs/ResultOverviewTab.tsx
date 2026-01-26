/**
 * Result Overview Tab
 * Optimized with constants, CSS modules, types, and helper functions
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/delete.js';

// Constants, types, and utilities
import {
  ITEMS_PER_PAGE,
  ICONS,
  TEXT,
  API_ENDPOINTS,
  ROUTES,
} from '../../constants/resultOverviewTab';
import type { GeneratedDesign, ResultOverviewTabProps } from '../../types/resultOverviewTab';
import { getDisplayInfo, getPrimaryImageUrl } from '../../utils/resultOverviewHelpers';
import styles from '../../styles/pages/ResultOverviewTab.module.css';

function ResultOverviewTab({ projectId }: ResultOverviewTabProps) {
  const navigate = useNavigate();

  // Data state
  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<GeneratedDesign | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch generated designs
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(API_ENDPOINTS.GENERATED_DESIGNS(projectId));

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

  // Filter designs by search query
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;
    const query = searchQuery.toLowerCase();
    return designs.filter((d) => {
      const { givenText, predictedText } = getDisplayInfo(d);
      return (
        d.name.toLowerCase().includes(query) ||
        givenText.toLowerCase().includes(query) ||
        predictedText.toLowerCase().includes(query)
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
      const response = await fetch(API_ENDPOINTS.DELETE_DESIGN(projectId, designToDelete.id), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete design: ${response.statusText}`);
      }

      setDesigns((prev) => prev.filter((d) => d.id !== designToDelete.id));
      setDeleteDialogOpen(false);
      setDesignToDelete(null);
    } catch (err) {
      console.error('Error deleting design:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDesignToDelete(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <BusyIndicator active />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Text className={styles.errorText}>
          {TEXT.ERROR_PREFIX} {error}
        </Text>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <Input
          placeholder={TEXT.SEARCH_PLACEHOLDER}
          value={searchQuery}
          onInput={(e: any) => handleSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Results Header */}
      <div className={styles.resultsHeader}>
        <div className={styles.headerLeft}>
          <Title level="H5">{TEXT.TITLE}</Title>
          <Icon name={ICONS.ACCEPT} className={styles.headerIcon} />
        </div>
        <Text className={styles.headerCount}>{TEXT.VARIANTS_COUNT(filteredDesigns.length)}</Text>
      </div>

      {/* Results Card */}
      <Card>
        {/* Results List */}
        <div>
          {paginatedDesigns.length === 0 ? (
            <div className={styles.emptyContainer}>
              <Text className={styles.emptyText}>
                {searchQuery ? TEXT.NO_RESULTS : TEXT.NO_DESIGNS}
              </Text>
            </div>
          ) : (
            paginatedDesigns.map((design) => {
              const { givenText, predictedText } = getDisplayInfo(design);
              const imageUrl = getPrimaryImageUrl(design);

              return (
                <div
                  key={design.id}
                  className={styles.designItem}
                  onClick={() => navigate(ROUTES.DESIGN_DETAIL(projectId, design.id))}
                >
                  {/* Thumbnail */}
                  <div className={styles.thumbnail}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={design.name} className={styles.thumbnailImage} />
                    ) : (
                      <div className={styles.thumbnailPlaceholder} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={styles.designContent}>
                    <Text className={styles.designName}>{design.name}</Text>
                    <Text className={styles.designAttributes}>
                      {givenText && (
                        <>
                          <span className={styles.attributeLabel}>{TEXT.LABEL_GIVEN}</span>{' '}
                          {givenText}
                        </>
                      )}
                      {givenText && predictedText && ' | '}
                      {predictedText && (
                        <>
                          <span className={styles.attributeLabel}>{TEXT.LABEL_PREDICTED}</span>{' '}
                          {predictedText}
                        </>
                      )}
                      {!givenText && !predictedText && TEXT.NO_ATTRIBUTES}
                    </Text>
                  </div>

                  {/* Delete Button */}
                  <div className={styles.deleteButton}>
                    <Button
                      icon={ICONS.DELETE}
                      design="Transparent"
                      tooltip={TEXT.DELETE_TOOLTIP}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(design);
                      }}
                    />
                  </div>
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
              <Text className={styles.paginationText}>
                {TEXT.SHOWING_TEMPLATE(
                  (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  Math.min(currentPage * ITEMS_PER_PAGE, filteredDesigns.length),
                  filteredDesigns.length
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        headerText={TEXT.DELETE_DIALOG_TITLE}
        footer={
          <div className={styles.dialogFooter}>
            <Button onClick={handleDeleteCancel} disabled={deleting}>
              {TEXT.CANCEL_BUTTON}
            </Button>
            <Button design="Negative" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? TEXT.DELETING_BUTTON : TEXT.DELETE_BUTTON}
            </Button>
          </div>
        }
      >
        <Text>{designToDelete && TEXT.DELETE_CONFIRMATION(designToDelete.name)}</Text>
      </Dialog>
    </div>
  );
}

export default ResultOverviewTab;
