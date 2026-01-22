import { useState, useEffect, useMemo } from 'react';
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
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/action-settings.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/synchronize.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-icons/dist/pushpin-off.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoEntries.js';

import type { ProjectListItem, CollectionListItem } from '@fashion/types';

interface ProjectFromAPI {
  id: string;
  userId: string;
  name: string;
  status: 'draft' | 'active';
  seasonConfig: Record<string, unknown> | null;
  scopeConfig: Record<string, unknown> | null;
  ontologySchema: Record<string, unknown> | null;
  createdAt: string;
  deletedAt: string | null;
  generatedProductsCount: number;
}

const ITEMS_PER_PAGE = 5;

function Home() {
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch projects and collections on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, collectionsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/collections'),
        ]);

        if (projectsRes.ok) {
          const projectsData: ProjectFromAPI[] = await projectsRes.json();
          // Transform projects to ProjectListItem format
          const transformedProjects: ProjectListItem[] = projectsData.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            timePeriod: deriveTimePeriod(p.seasonConfig),
            productGroup: deriveProductGroup(p.scopeConfig),
            generatedProductsCount: p.generatedProductsCount,
            createdAt: p.createdAt,
          }));
          setProjects(transformedProjects);
        }

        if (collectionsRes.ok) {
          const collectionsData: CollectionListItem[] = await collectionsRes.json();
          setCollections(collectionsData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derive time period from seasonConfig
  const deriveTimePeriod = (seasonConfig: Record<string, unknown> | null): string | null => {
    if (!seasonConfig) return null;
    const season = seasonConfig.season as string | undefined;
    if (season) {
      return season.charAt(0).toUpperCase() + season.slice(1);
    }
    const startDate = seasonConfig.startDate as string | undefined;
    const endDate = seasonConfig.endDate as string | undefined;
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    }
    return null;
  };

  // Derive product group from scopeConfig
  const deriveProductGroup = (scopeConfig: Record<string, unknown> | null): string | null => {
    if (!scopeConfig) return null;
    const productGroups = scopeConfig.productGroups as string[] | undefined;
    if (productGroups && productGroups.length > 0) {
      if (productGroups.length === 1) return productGroups[0];
      return `${productGroups[0]} +${productGroups.length - 1}`;
    }
    const productTypes = scopeConfig.productTypes as string[] | undefined;
    if (productTypes && productTypes.length > 0) {
      if (productTypes.length === 1) return productTypes[0];
      return `${productTypes[0]} +${productTypes.length - 1}`;
    }
    return null;
  };

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.productGroup && p.productGroup.toLowerCase().includes(query)) ||
        (p.timePeriod && p.timePeriod.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const handleCreateProject = () => {
    navigate('/product-selection');
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 44px)',
        }}
      >
        <BusyIndicator active size="L" />
      </div>
    );
  }

  return (
    <Page
      style={{
        height: 'calc(100vh - 44px)',
        padding: '1.5rem 2rem',
        background: 'var(--sapBackgroundColor)',
      }}
    >
        {/* Projects Section */}
        <Card
          style={{ marginBottom: '1.5rem' }}
          header={
            <CardHeader
              titleText={`Projects (${filteredProjects.length})`}
              interactive={false}
              action={
                <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                  <Input
                    placeholder="Search projects..."
                    icon={<Icon name="search" />}
                    value={searchQuery}
                    onInput={(e: CustomEvent) =>
                      setSearchQuery((e.target as HTMLInputElement).value)
                    }
                    style={{ width: '200px' }}
                  />
                  <Button icon="action-settings" design="Transparent" />
                  <Button icon="add" design="Emphasized" onClick={handleCreateProject}>
                    Create New Project
                  </Button>
                </FlexBox>
              }
            />
          }
        >
          {paginatedProjects.length === 0 ? (
            <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
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
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '40px' }}>
                        <Icon name="pushpin-off" style={{ color: 'var(--sapContent_IconColor)' }} />
                      </th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '100px' }}>
                        Status
                      </th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Project Name</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Time Period</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Product Group</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        Generated Products
                      </th>
                      <th style={{ padding: '0.75rem 1rem', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProjects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--sapList_BorderColor)',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            'var(--sapList_Hover_Background)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Icon
                            name="pushpin-off"
                            style={{
                              color: 'var(--sapContent_IconColor)',
                              opacity: 0.3,
                              cursor: 'pointer',
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <ObjectStatus
                            state={project.status === 'active' ? 'Positive' : 'Information'}
                          >
                            {project.status === 'active' ? 'Ready' : 'Processing'}
                          </ObjectStatus>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div>
                            <Text style={{ fontWeight: 500 }}>{project.name}</Text>
                            <Text
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--sapContent_LabelColor)',
                                display: 'block',
                              }}
                            >
                              {project.id.slice(0, 8)}...
                            </Text>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Text>{project.timePeriod || '-'}</Text>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Text>{project.productGroup || '-'}</Text>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <Text>{project.generatedProductsCount}</Text>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Icon
                            name="slim-arrow-right"
                            style={{ color: 'var(--sapContent_IconColor)' }}
                          />
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
                    <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of{' '}
                      {filteredProjects.length}
                    </Text>
                  }
                  endContent={
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
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
                    </FlexBox>
                  }
                />
              )}
            </>
          )}
        </Card>

        {/* Collections Section - Only show if collections exist */}
        {collections.length > 0 && (
          <div>
            <FlexBox
              justifyContent="SpaceBetween"
              alignItems="Center"
              style={{ marginBottom: '1rem' }}
            >
              <Title level="H4">Collections</Title>
              <Button design="Transparent">View All</Button>
            </FlexBox>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                maxWidth: '100%',
              }}
            >
              {collections.slice(0, 8).map((collection) => (
                <Card
                  key={collection.id}
                  style={{
                    cursor: 'pointer',
                    height: 'fit-content',
                  }}
                  header={
                    <CardHeader
                      titleText={collection.name}
                      subtitleText={`${collection.itemCount} Items`}
                      interactive
                    />
                  }
                  onClick={() => console.log('View collection:', collection.id)}
                >
                  <div style={{ padding: '0.75rem' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {/* Show up to 4 images in a 2x2 grid */}
                      {[0, 1, 2, 3].map((index) => {
                        const imageUrl = collection.imageUrls[index];
                        return (
                          <div
                            key={index}
                            style={{
                              aspectRatio: '1',
                              borderRadius: '6px',
                              backgroundColor: 'var(--sapNeutralBackground)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              border: '1px solid var(--sapList_BorderColor)',
                            }}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  // Hide broken images and show placeholder
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const placeholder = document.createElement('div');
                                    placeholder.innerHTML = '<ui5-icon name="product"></ui5-icon>';
                                    placeholder.style.display = 'flex';
                                    placeholder.style.alignItems = 'center';
                                    placeholder.style.justifyContent = 'center';
                                    placeholder.style.width = '100%';
                                    placeholder.style.height = '100%';
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            ) : (
                              <Icon
                                name="product"
                                style={{ color: 'var(--sapContent_IconColor)', fontSize: '1.5rem' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--sapContent_LabelColor)',
                      }}
                    >
                      <Text style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}>
                        Created 2 days ago
                      </Text>
                      <Icon
                        name="slim-arrow-right"
                        style={{ color: 'var(--sapContent_IconColor)', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Page>
  );
}

export default Home;
