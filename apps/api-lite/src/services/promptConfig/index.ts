/**
 * Prompt Config Index
 * Exports all prompt configuration modules
 */

export {
  type PhotographyCategory,
  PRODUCT_GROUP_TO_CATEGORY,
  getPhotographyCategory
} from './categoryMapping.js';

export {
  type ModelProfile,
  SEGMENT_TO_MODEL_PROFILE,
  DEFAULT_MODEL_PROFILE,
  getModelProfile
} from './modelProfiles.js';

export {
  QUALITY_SUFFIX,
  BASE_SYSTEM_PROMPT,
  CATEGORY_RULES,
  buildSystemPrompt
} from './systemPrompts.js';
