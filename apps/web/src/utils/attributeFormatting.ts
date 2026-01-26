/**
 * Attribute Formatting Utilities
 * Helper functions for formatting attribute names and display values
 */

import { TEXT } from '../constants/attributeDialog';

/**
 * Format attribute name: remove product type prefix and convert to Title Case
 * @param name - Raw attribute name (e.g., "bag_closure_type")
 * @param productTypes - List of product types to remove as prefixes
 * @returns Formatted name (e.g., "Closure Type")
 */
export function formatAttributeName(name: string, productTypes: string[]): string {
  // Remove product type prefixes
  let cleanName = name;
  productTypes.forEach((type) => {
    const prefix = type.toLowerCase() + '_';
    if (cleanName.toLowerCase().startsWith(prefix)) {
      cleanName = cleanName.substring(prefix.length);
    }
  });

  // Convert snake_case to Title Case
  return cleanName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get seasonal lens display string
 * @param selectedSeason - Selected season name
 * @param dateRange - Custom date range (if no season selected)
 * @returns Formatted display string
 */
export function getSeasonalLens(
  selectedSeason: string | null,
  dateRange?: { from: string; to: string }
): string {
  if (selectedSeason) {
    return selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1);
  }
  if (dateRange) {
    return `${dateRange.from} to ${dateRange.to}`;
  }
  return TEXT.SEASONAL_ALL_TIME;
}

/**
 * Parse attribute key into category and key components
 * @param attributeKey - Combined key in format "category::key"
 * @returns Tuple of [category, key]
 */
export function parseAttributeKey(attributeKey: string): [string, string] {
  const parts = attributeKey.split('::');
  return [parts[0] || '', parts[1] || ''];
}

/**
 * Build attribute key from category and key
 * @param category - Attribute category
 * @param key - Attribute key
 * @returns Combined key in format "category::key"
 */
export function buildAttributeKey(category: string, key: string): string {
  return `${category}::${key}`;
}

/**
 * Convert display name to snake_case key
 * @param displayName - Human-readable name (e.g., "Closure Type")
 * @returns Snake case key (e.g., "closure_type")
 */
export function displayNameToKey(displayName: string): string {
  return displayName.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Get attributes as flat list for display
 * @param attributes - Nested attributes object
 * @returns Flat list of attributes with metadata
 */
export function flattenAttributes(
  attributes: any
): Array<{ category: string; key: string; name: string; values: string[] }> {
  const list: Array<{ category: string; key: string; name: string; values: string[] }> = [];

  Object.entries(attributes).forEach(([category, attrs]: [string, any]) => {
    Object.entries(attrs).forEach(([key, values]: [string, any]) => {
      list.push({
        category,
        key,
        name: key, // Will be formatted by component
        values: Array.isArray(values) ? values : [values],
      });
    });
  });

  return list;
}
