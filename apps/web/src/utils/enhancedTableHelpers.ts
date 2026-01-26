/**
 * Enhanced Table Tab Helper Functions
 * Utility functions for context items management
 */

import { VELOCITY_COLORS, STATUS, TEXT, CSV_BASE_HEADERS } from '../constants/enhancedTableTab';
import type { ContextItem, StatusDisplay } from '../types/enhancedTableTab';

/**
 * Format attribute name: replace underscores with spaces and capitalize first letter
 */
export const formatAttributeName = (attr: string): string => {
  return attr.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Get color for velocity score based on value (0-100)
 * Returns heat map style colors for intuitive velocity performance visualization
 */
export const getVelocityColor = (score: number): string => {
  if (score >= VELOCITY_COLORS.EXCELLENT.threshold) return VELOCITY_COLORS.EXCELLENT.color;
  if (score >= VELOCITY_COLORS.STRONG.threshold) return VELOCITY_COLORS.STRONG.color;
  if (score >= VELOCITY_COLORS.AVERAGE.threshold) return VELOCITY_COLORS.AVERAGE.color;
  if (score >= VELOCITY_COLORS.BELOW_AVERAGE.threshold) return VELOCITY_COLORS.BELOW_AVERAGE.color;
  return VELOCITY_COLORS.POOR.color;
};

/**
 * Get status icon and color for an item
 */
export const getStatusDisplay = (item: ContextItem): StatusDisplay => {
  if (item.enrichedAttributes) {
    return STATUS.SUCCESS;
  }
  if (item.enrichmentError) {
    return STATUS.FAILED;
  }
  return STATUS.PENDING;
};

/**
 * Escape CSV values
 */
const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Export items to CSV
 */
export const exportToCSV = (
  items: ContextItem[],
  ontologyAttributes: string[],
  projectId: string
): void => {
  const headers = [...CSV_BASE_HEADERS, ...ontologyAttributes];

  const rows = items.map((item) => {
    const status = item.enrichedAttributes
      ? TEXT.CSV_STATUS_SUCCESS
      : item.enrichmentError
        ? TEXT.CSV_STATUS_FAILED
        : TEXT.CSV_STATUS_PENDING;

    const baseData = [
      item.articleId,
      item.productType,
      item.productGroup || '',
      item.colorFamily || '',
      item.patternStyle || '',
      item.specificColor || '',
      item.colorIntensity || '',
      item.productFamily || '',
      item.customerSegment || '',
      item.styleConcept || '',
      item.fabricTypeBase || '',
      item.velocityScore.toFixed(2),
      status,
    ];

    const enrichedData = ontologyAttributes.map(
      (attr) => (item.enrichedAttributes && item.enrichedAttributes[attr]) || ''
    );

    return [...baseData, ...enrichedData];
  });

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = TEXT.CSV_FILENAME(projectId);
  link.click();
  URL.revokeObjectURL(url);
};
