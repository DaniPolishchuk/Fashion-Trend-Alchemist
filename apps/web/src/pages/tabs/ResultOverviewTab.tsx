import { useState, useMemo } from 'react';
import {
  Card,
  Title,
  Text,
  Input,
  Icon,
  Button,
  Bar,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/filter.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-icons/dist/accept.js';

interface GeneratedDesign {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  confidence: number;
  imageUrl: string | null;
}

interface ResultOverviewTabProps {
  projectId: string;
}

// Mock data - can be easily replaced with API call
const MOCK_GENERATED_DESIGNS: GeneratedDesign[] = [
  {
    id: '1',
    name: 'Urban Utility Gilet V1',
    category: 'Streetwear',
    subcategory: 'Utility',
    confidence: 98,
    imageUrl: null,
  },
  {
    id: '2',
    name: 'Technical Field Vest',
    category: 'Tactical',
    subcategory: 'Outdoor',
    confidence: 94,
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Modern Utility Overcoat',
    category: 'Smart Utility',
    subcategory: '',
    confidence: 89,
    imageUrl: null,
  },
  {
    id: '4',
    name: 'Padded Utility Waistcoat',
    category: 'Workwear',
    subcategory: '',
    confidence: 85,
    imageUrl: null,
  },
  {
    id: '5',
    name: 'Minimalist Cargo Jacket',
    category: 'Streetwear',
    subcategory: 'Minimal',
    confidence: 82,
    imageUrl: null,
  },
  {
    id: '6',
    name: 'Relaxed Linen Blazer',
    category: 'Smart Casual',
    subcategory: 'Summer',
    confidence: 79,
    imageUrl: null,
  },
  {
    id: '7',
    name: 'Oversized Wool Coat',
    category: 'Outerwear',
    subcategory: 'Winter',
    confidence: 76,
    imageUrl: null,
  },
  {
    id: '8',
    name: 'Cropped Denim Jacket',
    category: 'Casual',
    subcategory: 'Denim',
    confidence: 73,
    imageUrl: null,
  },
];

const ITEMS_PER_PAGE = 5;

function ResultOverviewTab({ projectId }: ResultOverviewTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // In a real implementation, this would fetch from API
  // const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  // useEffect(() => {
  //   fetch(`/api/projects/${projectId}/generated-designs`)
  //     .then(res => res.json())
  //     .then(data => setDesigns(data));
  // }, [projectId]);

  const designs = MOCK_GENERATED_DESIGNS;

  // Filter designs by search query
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;
    const query = searchQuery.toLowerCase();
    return designs.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.category.toLowerCase().includes(query) ||
        d.subcategory.toLowerCase().includes(query)
    );
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

  // Log projectId usage to avoid unused variable warning
  console.debug('ResultOverviewTab for project:', projectId);

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
            paginatedDesigns.map((design, index) => (
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
                  {design.imageUrl ? (
                    <img
                      src={design.imageUrl}
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
                    {design.category}
                    {design.subcategory ? ` / ${design.subcategory}` : ''}
                  </Text>
                </div>

                {/* Confidence */}
                <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                  <Text
                    style={{
                      color: 'var(--sapContent_LabelColor)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      display: 'block',
                    }}
                  >
                    Confidence
                  </Text>
                  <Text
                    style={{
                      color: design.confidence >= 90 ? 'var(--sapPositiveColor)' : '#0070F2',
                      fontWeight: 600,
                      fontSize: '1rem',
                    }}
                  >
                    {design.confidence}%
                  </Text>
                </div>

                {/* Arrow */}
                <Icon name="slim-arrow-right" style={{ color: 'var(--sapContent_IconColor)' }} />
              </div>
            ))
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
    </div>
  );
}

export default ResultOverviewTab;
