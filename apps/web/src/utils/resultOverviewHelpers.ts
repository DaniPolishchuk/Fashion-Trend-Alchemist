/**
 * Result Overview Tab Helper Functions
 * Utility functions for generated designs management
 */

import { MAX_ATTRIBUTES_DISPLAY } from '../constants/resultOverviewTab';
import type { GeneratedDesign, DisplayInfo } from '../types/resultOverviewTab';

/**
 * Extract given and predicted attributes for display
 * Filters internal keys and limits to MAX_ATTRIBUTES_DISPLAY
 */
export const getDisplayInfo = (design: GeneratedDesign): DisplayInfo => {
  const given = design.inputConstraints || {};
  const predicted = design.predictedAttributes || {};

  // Filter out internal keys (prefixed with _)
  const givenEntries = Object.entries(given).filter(([key]) => !key.startsWith('_'));
  const predictedEntries = Object.entries(predicted).filter(([key]) => !key.startsWith('_'));

  // Get first MAX_ATTRIBUTES_DISPLAY attributes from each
  const givenText = givenEntries
    .slice(0, MAX_ATTRIBUTES_DISPLAY)
    .map(([_, value]) => value)
    .join(', ');

  const predictedText = predictedEntries
    .slice(0, MAX_ATTRIBUTES_DISPLAY)
    .map(([_, value]) => value)
    .join(', ');

  return { givenText, predictedText };
};

/**
 * Get the primary image URL for a design
 * Prioritizes front image from generatedImages, falls back to generatedImageUrl
 */
export const getPrimaryImageUrl = (design: GeneratedDesign): string | null => {
  return design.generatedImages?.front?.url || design.generatedImageUrl || null;
};
