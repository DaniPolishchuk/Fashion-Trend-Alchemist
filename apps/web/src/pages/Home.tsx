import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Bar,
  Button,
  Title,
  Text,
  Card,
  CardHeader,
  FlexBox,
  Input,
  Icon,
  ObjectStatus,
  IllustratedMessage,
  BusyIndicator,
  Dialog,
  MessageStrip,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-icons/dist/pushpin-off.js';
import '@ui5/webcomponents-icons/dist/pushpin-on.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';

import type { ProjectListItem, CollectionListItem } from '@fashion/types';
import { api } from '../services/api';
import { transformProjects } from '../utils/projectTransformers';
import { useDebounce } from '../hooks/useDebounce';
import { PAGINATION, COLLECTIONS, NOTIFICATION, SEARCH } from '../constants/home';
import type { ProjectFromAPI } from '../types/api';
import styles from '../styles/pages/Home.module.css';

function Home() {
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Image error tracking (React way - no DOM manipulation!)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pin notification state
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);

  // Debounced search for performance
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH.DEBOUNCE_MS);

  // Fetch projects and collections with proper error handling
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsResult, collectionsResult] = await Promise.all([
        api.projects.list(),
        api.collections.list(),
      ]);

      if (projectsResult.error) {
        throw new Error(projectsResult.error);
      }

      if (collectionsResult.error) {
        console.warn('Failed to load collections:', collectionsResult.error);
        // Don't fail entirely if collections fail - they're optional
      }

      if (projectsResult.data) {
        const transformedProjects = transformProjects(projectsResult.data as ProjectFromAPI[]);
        setProjects(transformedProjects);
      }

      if (collectionsResult.data) {
        setCollections(collectionsResult.data as CollectionListItem[]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter projects by debounced search query
  const filteredProjects = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return projects;
    const query = debouncedSearchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.productGroup && p.productGroup.toLowerCase().includes(query)) ||
        (p.timePeriod && p.timePeriod.toLowerCase().includes(query))
    );
  }, [projects, debouncedSearchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / PAGINATION.ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGINATION.ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + PAGINATION.ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  // Handlers
  const handleCreateProject = useCallback(() => {
    navigate('/product-selection');
  }, [navigate]);

  const handleProjectClick = useCallback(
    (projectId: string) => {
      navigate(`/project/${projectId}`);
    },
    [navigate]
  );

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }, [currentPage, totalPages]);

  // Pin toggle handler with optimistic UI update
  const handlePinToggle = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, project: ProjectListItem) => {
      e.stopPropagation();

      if (pinningId) return; // Prevent concurrent pin operations

      try {
        setPinningId(project.id);
        const newPinState = !project.isPinned;

        const result = await api.projects.pin(project.id, newPinState);

        if (result.error) {
          if (result.error.includes('Maximum')) {
            setPinMessage('Maximum 3 projects can be pinned');
            setTimeout(() => setPinMessage(null), NOTIFICATION.DURATION_MS);
            return;
          }
          throw new Error(result.error);
        }

        // Optimistic UI update
        setProjects((prev) => {
          const updated = prev.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  isPinned: newPinState,
                  pinnedAt: newPinState ? new Date().toISOString() : null,
                }
              : p
          );

          // Sort: pinned first, then by pinnedAt, then by createdAt
          return updated.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.isPinned && b.isPinned) {
              return (b.pinnedAt || '').localeCompare(a.pinnedAt || '');
            }
            return b.createdAt.localeCompare(a.createdAt);
          });
        });
      } catch (err) {
        console.error('Pin toggle failed:', err);
        setPinMessage('Failed to update pin status');
        setTimeout(() => setPinMessage(null), NOTIFICATION.DURATION_MS);
      } finally {
        setPinningId(null);
      }
    },
    [pinningId]
  );

  // Delete handlers
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, project: ProjectListItem) => {
      e.stopPropagation();
      setProjectToDelete(project);
      setDeleteDialogOpen(true);
    },
    []
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      setDeleting(true);
      const result = await api.projects.delete(projectToDelete.id);

      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete project. Please try again.');
      setTimeout(() => setError(null), NOTIFICATION.DURATION_MS);
    } finally {
      setDeleting(false);
    }
  }, [projectToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  }, []);

  // Image error handler (React way!)
  const handleImageError = useCallback((collectionId: string, index: number) => {
    setImageErrors((prev) => new Set(prev).add(`${collectionId}-${index}`));
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <BusyIndicator active size="L" />
      </div>
    );
  }

  return (
    <Page className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Error message */}
        {error && (
          <div className={styles.messageStripContainer}>
            <MessageStrip design="Negative" hideCloseButton>
              {error}
            </MessageStrip>
          </div>
        )}

        {/* Pin notification message */}
        {pinMessage && (
          <div className={styles.messageStripContainer}>
            <MessageStrip design="Information" hideCloseButton>
              {pinMessage}
            </MessageStrip>
          </div>
        )}

        {/* Projects Section */}
        <Card className={styles.card}>
          <Bar
            design="Header"
            startContent={
              <Title level="H5" style={{ margin: 0 }}>
                Projects ({filteredProjects.length})
              </Title>
            }
            endContent={
              <FlexBox alignItems="Center" className={styles.searchAndButtonGroup}>
                <Input
                  placeholder="Search projects..."
                  showClearIcon
                  value={searchQuery}
                  onInput={(e: CustomEvent) => setSearchQuery((e.target as HTMLInputElement).value)}
                  className={styles.searchInput}
                />
                <Button icon="add" design="Emphasized" onClick={handleCreateProject}>
                  Create New Project
                </Button>
              </FlexBox>
            }
          />
          {paginatedProjects.length === 0 ? (
            <div className={styles.illustratedMessageContainer}>
              <IllustratedMessage
                name="NoData"
                titleText={searchQuery ? 'No Projects Found' : 'No Projects Yet'}
                subtitleText={
                  searchQuery
                    ? 'Try adjusting your search query'
                    : 'Create your first project to start analyzing fashion trends'
                }
              >
                {!searchQuery && (
                  <Button design="Emphasized" icon="add" onClick={handleCreateProject}>
                    Create New Project
                  </Button>
                )}
              </IllustratedMessage>
            </div>
          ) : (
            <>
              {/* Table */}
              <div>
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th className={styles.tableHeaderCell} style={{ width: '40px' }}></th>
                      <th className={styles.tableHeaderCell} style={{ width: '100px' }}>
                        Status
                      </th>
                      <th className={styles.tableHeaderCell}>Project Name</th>
                      <th className={styles.tableHeaderCell}>Time Period</th>
                      <th className={styles.tableHeaderCell}>Product Group</th>
                      <th className={styles.tableHeaderCellRight}>Generated Products</th>
                      <th className={styles.tableHeaderCellCenter} style={{ width: '80px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProjects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className={`${styles.tableRow} ${project.isPinned ? styles.tableRowPinned : ''}`}
                      >
                        <td className={styles.pinCell}>
                          <Button
                            icon={project.isPinned ? 'pushpin-on' : 'pushpin-off'}
                            design="Transparent"
                            onClick={(e: any) => handlePinToggle(e, project)}
                            tooltip={project.isPinned ? 'Unpin project' : 'Pin project'}
                            disabled={pinningId === project.id}
                            className={
                              project.isPinned ? styles.pinnedButton : styles.unpinnedButton
                            }
                          />
                        </td>
                        <td className={styles.statusCell}>
                          <ObjectStatus
                            state={project.status === 'active' ? 'Positive' : 'Information'}
                          >
                            {project.status === 'active' ? 'Ready' : 'Processing'}
                          </ObjectStatus>
                        </td>
                        <td className={styles.projectNameCell}>
                          <div>
                            <Text style={{ fontWeight: 500 }}>{project.name}</Text>
                            <Text className={styles.projectIdText}>
                              {project.id.slice(0, 8)}...
                            </Text>
                          </div>
                        </td>
                        <td className={styles.tableHeaderCell}>
                          <Text>{project.timePeriod || '-'}</Text>
                        </td>
                        <td className={styles.tableHeaderCell}>
                          <Text>{project.productGroup || '-'}</Text>
                        </td>
                        <td className={styles.tableHeaderCellRight}>
                          <Text>{project.generatedProductsCount}</Text>
                        </td>
                        <td className={styles.actionsCell}>
                          <FlexBox
                            justifyContent="Center"
                            className={styles.actionButtonsContainer}
                          >
                            <Button
                              icon="delete"
                              design="Transparent"
                              onClick={(e: any) => handleDeleteClick(e, project)}
                              tooltip="Delete project"
                              className={styles.deleteButton}
                            />
                          </FlexBox>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <Bar
                  design="Footer"
                  startContent={
                    <Text className={styles.paginationText}>
                      Showing {(currentPage - 1) * PAGINATION.ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * PAGINATION.ITEMS_PER_PAGE, filteredProjects.length)}{' '}
                      of {filteredProjects.length}
                    </Text>
                  }
                  endContent={
                    <FlexBox alignItems="Center" className={styles.paginationControls}>
                      <Button
                        icon="navigation-left-arrow"
                        design="Transparent"
                        disabled={currentPage === 1}
                        onClick={handlePreviousPage}
                      />
                      <Text className={styles.paginationPageText}>
                        Page {currentPage} of {totalPages}
                      </Text>
                      <Button
                        icon="navigation-right-arrow"
                        design="Transparent"
                        disabled={currentPage === totalPages}
                        onClick={handleNextPage}
                      />
                    </FlexBox>
                  }
                />
              )}
            </>
          )}
        </Card>

        {/* Collections Section - Only show if collections exist */}
        {collections.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <FlexBox
              justifyContent="SpaceBetween"
              alignItems="Center"
              className={styles.sectionHeader}
            >
              <Title level="H4">Collections</Title>
              <Button design="Transparent">View All</Button>
            </FlexBox>

            <div className={styles.collectionsGrid}>
              {collections.slice(0, COLLECTIONS.MAX_PREVIEW_COUNT).map((collection) => (
                <Card
                  key={collection.id}
                  className={styles.collectionCard}
                  header={
                    <CardHeader
                      titleText={collection.name}
                      subtitleText={`${collection.itemCount} Items`}
                      interactive
                    />
                  }
                  onClick={() => console.log('View collection:', collection.id)}
                >
                  <div className={styles.collectionCardContent}>
                    <div className={styles.collectionImagesGrid}>
                      {Array.from({ length: COLLECTIONS.PREVIEW_IMAGES_COUNT }).map((_, index) => {
                        const imageUrl = collection.imageUrls[index];
                        const errorKey = `${collection.id}-${index}`;
                        const hasError = imageErrors.has(errorKey);

                        return (
                          <div key={index} className={styles.collectionImageBox}>
                            {imageUrl && !hasError ? (
                              <img
                                src={imageUrl}
                                alt=""
                                className={styles.collectionImage}
                                onError={() => handleImageError(collection.id, index)}
                              />
                            ) : (
                              <Icon name="product" className={styles.collectionIcon} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.collectionFooter}>
                      <Text className={styles.collectionDateText}>Created 2 days ago</Text>
                      <Icon name="slim-arrow-right" className={styles.collectionArrowIcon} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          headerText="Delete Project?"
          footer={
            <div className={styles.dialogFooter}>
              <Button onClick={handleDeleteCancel} disabled={deleting}>
                Cancel
              </Button>
              <Button design="Negative" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          }
        >
          <div className={styles.dialogContent}>
            <Text>
              Are you sure you want to delete <strong>"{projectToDelete?.name}"</strong>?
            </Text>
            <br />
            <br />
            <Text>
              This will also delete all{' '}
              <strong>{projectToDelete?.generatedProductsCount || 0}</strong> generated products
              associated with this project.
            </Text>
            <br />
            <br />
            <Text className={styles.deleteWarningText}>This action cannot be undone.</Text>
          </div>
        </Dialog>
      </div>
    </Page>
  );
}

export default Home;
