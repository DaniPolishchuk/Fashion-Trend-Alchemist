/**
 * The Alchemist Tab Helper Functions
 * Utility functions for attribute management, persistence, and design transformation
 */

import {
  ARTICLE_ATTRIBUTES,
  ATTRIBUTE_CATEGORIES,
  API_ENDPOINTS,
  getSessionStorageKey,
  type AttributeCategory,
} from '../constants/theAlchemistTab';
import type {
  AttributeConfig,
  PersistedAttribute,
  PersistedAlchemistState,
  GeneratedDesign,
} from '../types/theAlchemistTab';
import type { ContextItem } from '../types/enhancedTableTab';
import { fetchAPI } from '../services/api/client';

/**
 * Format attribute name: convert snake_case to Title Case
 */
export const formatAttributeName = (name: string): string => {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Analyze if an attribute has variation across context items
 * Returns true if attribute has multiple unique values, false if all same
 */
const hasAttributeVariation = (
  attributeKey: string,
  contextItems: ContextItem[],
  isArticleLevel: boolean
): boolean => {
  if (contextItems.length === 0) return true; // Default to variation if no items

  const values = new Set<string>();

  if (isArticleLevel) {
    // Article-level attributes: check all items
    const cleanKey = attributeKey.replace(/^article_/, '');
    const mappedKey = cleanKey
      .split('_')
      .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join('') as keyof ContextItem;

    for (const item of contextItems) {
      const value = item[mappedKey] as string | null;
      values.add(value || '__NULL__');
      if (values.size > 1) return true; // Early exit
    }

    return values.size > 1;
  } else {
    // Ontology attributes: only check enriched items
    const enrichedItems = contextItems.filter((item) => item.enrichedAttributes !== null);

    // Need at least 2 enriched items to determine variation, otherwise default to "has variation"
    if (enrichedItems.length < 2) {
      return true;
    }

    // For ontology attributes, strip the "ontology_productType_" prefix to match DB structure
    // e.g., "ontology_shirt_style" -> "style"
    const cleanKey = attributeKey.replace(/^ontology_[^_]+_/, '');

    for (const item of enrichedItems) {
      const value = item.enrichedAttributes![cleanKey] || null;
      values.add(value || '__NULL__');
      if (values.size > 1) return true; // Early exit
    }

    return values.size > 1;
  }
};

/**
 * Initialize attributes from article options and ontology schema
 * Excludes attributes with no variation, then splits remaining 50/50 between Locked and AI
 */
export const initializeAttributes = (
  articleAttributeOptions: Record<string, string[]>,
  ontologySchema: Record<string, Record<string, string[]>> | null,
  contextItems?: ContextItem[]
): AttributeConfig[] => {
  const allAttributes: AttributeConfig[] = [];

  // Collect all article-level attributes
  ARTICLE_ATTRIBUTES.forEach((attrKey) => {
    const variants = articleAttributeOptions[attrKey] || [];
    if (variants.length > 0) {
      allAttributes.push({
        key: `article_${attrKey}`,
        displayName: formatAttributeName(attrKey),
        variants,
        category: ATTRIBUTE_CATEGORIES.AI, // Temporary, will be assigned later
        selectedValue: null,
        isArticleLevel: true,
      });
    }
  });

  // Collect all ontology-generated attributes
  if (ontologySchema) {
    Object.entries(ontologySchema).forEach(([productType, productAttributes]) => {
      if (typeof productAttributes === 'object' && productAttributes !== null) {
        Object.entries(productAttributes).forEach(([attrKey, variants]) => {
          if (Array.isArray(variants) && variants.length > 0) {
            allAttributes.push({
              key: `ontology_${productType}_${attrKey}`,
              displayName: formatAttributeName(attrKey),
              variants,
              category: ATTRIBUTE_CATEGORIES.AI, // Temporary
              selectedValue: null,
              isArticleLevel: false,
            });
          }
        });
      }
    });
  }

  // If no context items, split all attributes 50/50
  if (!contextItems || contextItems.length === 0) {
    const midpoint = Math.floor(allAttributes.length / 2);
    return allAttributes.map((attr, index) => {
      if (index < midpoint) {
        return { ...attr, category: ATTRIBUTE_CATEGORIES.LOCKED, selectedValue: attr.variants[0] };
      }
      return { ...attr, category: ATTRIBUTE_CATEGORIES.AI };
    });
  }

  // Separate attributes by variation
  const withVariation: AttributeConfig[] = [];
  const withoutVariation: AttributeConfig[] = [];

  allAttributes.forEach((attr) => {
    const hasVariation = hasAttributeVariation(attr.key, contextItems, attr.isArticleLevel);
    if (hasVariation) {
      withVariation.push(attr);
    } else {
      withoutVariation.push({
        ...attr,
        category: ATTRIBUTE_CATEGORIES.NOT_INCLUDED,
        autoExcluded: true, // Mark as auto-excluded (hidden from UI)
      });
    }
  });

  // Split varying attributes 50/50: first half to Locked, second half to AI
  const midpoint = Math.floor(withVariation.length / 2);
  const finalAttributes = withVariation.map((attr, index) => {
    if (index < midpoint) {
      // First half: Locked with first variant selected
      return { ...attr, category: ATTRIBUTE_CATEGORIES.LOCKED, selectedValue: attr.variants[0] };
    }
    // Second half: AI Variables
    return { ...attr, category: ATTRIBUTE_CATEGORIES.AI };
  });

  // Add non-varying attributes to the end
  return [...finalAttributes, ...withoutVariation];
};

/**
 * Fetch article-level attribute options based on product types
 */
export const fetchArticleAttributes = async (
  productTypes: string[] | undefined
): Promise<Record<string, string[]>> => {
  if (!productTypes || productTypes.length === 0) {
    return {};
  }

  try {
    const typesParam = productTypes.join(',');
    const result = await fetchAPI<{
      productGroup?: string[];
      productFamily?: string[];
      patternStyle?: string[];
      specificColor?: string[];
      colorIntensity?: string[];
      colorFamily?: string[];
      customerSegment?: string[];
      styleConcept?: string[];
      fabricTypeBase?: string[];
    }>(API_ENDPOINTS.ATTRIBUTES(typesParam));

    if (result.data) {
      return {
        product_group: result.data.productGroup || [],
        product_family: result.data.productFamily || [],
        pattern_style: result.data.patternStyle || [],
        specific_color: result.data.specificColor || [],
        color_intensity: result.data.colorIntensity || [],
        color_family: result.data.colorFamily || [],
        customer_segment: result.data.customerSegment || [],
        style_concept: result.data.styleConcept || [],
        fabric_type_base: result.data.fabricTypeBase || [],
        product_type: productTypes,
      };
    }
  } catch (error) {
    console.error('Failed to fetch article attributes:', error);
  }

  return {};
};

/**
 * Build locked attributes object for API request
 */
export const buildLockedAttributes = (attributes: AttributeConfig[]): Record<string, string> => {
  return attributes
    .filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.LOCKED)
    .reduce(
      (acc, attr) => {
        acc[attr.key] = attr.selectedValue || '';
        return acc;
      },
      {} as Record<string, string>
    );
};

/**
 * Build AI variables array for API request
 */
export const buildAIVariables = (attributes: AttributeConfig[]): string[] => {
  return attributes
    .filter((attr) => attr.category === ATTRIBUTE_CATEGORIES.AI)
    .map((attr) => attr.key);
};

// ==================== SESSION STORAGE FUNCTIONS ====================

/**
 * Save attributes to sessionStorage
 */
export const saveAttributesToSession = (projectId: string, attributes: AttributeConfig[]): void => {
  try {
    const persistedState: PersistedAlchemistState = {
      projectId,
      attributes: attributes.map((attr) => ({
        key: attr.key,
        category: attr.category,
        selectedValue: attr.selectedValue,
        autoExcluded: attr.autoExcluded, // Persist auto-exclusion flag
      })),
    };
    sessionStorage.setItem(getSessionStorageKey(projectId), JSON.stringify(persistedState));
  } catch (error) {
    console.error('Failed to save attributes to sessionStorage:', error);
  }
};

/**
 * Load attributes from sessionStorage
 * Returns null if no valid state found
 */
export const loadAttributesFromSession = (projectId: string): PersistedAlchemistState | null => {
  try {
    const stored = sessionStorage.getItem(getSessionStorageKey(projectId));
    if (!stored) return null;

    const parsed = JSON.parse(stored) as PersistedAlchemistState;

    // Validate structure
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.projectId !== projectId ||
      !Array.isArray(parsed.attributes)
    ) {
      console.warn('Invalid sessionStorage state structure, ignoring');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load attributes from sessionStorage:', error);
    return null;
  }
};

/**
 * Clear attributes from sessionStorage for a project
 */
export const clearAttributesFromSession = (projectId: string): void => {
  try {
    sessionStorage.removeItem(getSessionStorageKey(projectId));
  } catch (error) {
    console.error('Failed to clear attributes from sessionStorage:', error);
  }
};

// ==================== VALIDATION & MERGE FUNCTIONS ====================

/**
 * Validate and merge stored attributes with current attribute definitions
 * This handles cases where stored state may be stale (schema changed)
 */
export const validateAndMergeAttributes = (
  storedAttributes: PersistedAttribute[],
  currentAttributes: AttributeConfig[]
): AttributeConfig[] => {
  // Build a map of current attributes by key
  const currentByKey = new Map(currentAttributes.map((attr) => [attr.key, attr]));
  const result: AttributeConfig[] = [];
  const processedKeys = new Set<string>();

  // Process stored attributes
  for (const storedAttr of storedAttributes) {
    const currentAttr = currentByKey.get(storedAttr.key);

    // Skip attributes that no longer exist in current schema
    if (!currentAttr) {
      console.warn(`Stored attribute "${storedAttr.key}" not found in current schema, skipping`);
      continue;
    }

    processedKeys.add(storedAttr.key);

    // Validate selectedValue for locked attributes
    let selectedValue = storedAttr.selectedValue;
    if (storedAttr.category === ATTRIBUTE_CATEGORIES.LOCKED && selectedValue) {
      if (!currentAttr.variants.includes(selectedValue)) {
        console.warn(
          `Stored value "${selectedValue}" for "${storedAttr.key}" not in current variants, using first variant`
        );
        selectedValue = currentAttr.variants[0] || null;
      }
    }

    // Validate category
    const validCategories = Object.values(ATTRIBUTE_CATEGORIES);
    const category = validCategories.includes(storedAttr.category as AttributeCategory)
      ? (storedAttr.category as AttributeCategory)
      : currentAttr.category;

    result.push({
      ...currentAttr,
      category,
      selectedValue,
      autoExcluded: storedAttr.autoExcluded, // Restore auto-exclusion flag
    });
  }

  // Add current attributes that weren't in stored state (use defaults)
  for (const currentAttr of currentAttributes) {
    if (!processedKeys.has(currentAttr.key)) {
      result.push(currentAttr);
    }
  }

  return result;
};

// ==================== REFINE DESIGN TRANSFORMATION ====================

/**
 * Transform a generated design's attributes into AttributeConfig format
 * - inputConstraints become Locked attributes with their values
 * - predictedAttributes become AI variables
 * - All other attributes become Not Included
 */
export const transformDesignToAttributes = (
  design: GeneratedDesign,
  currentAttributes: AttributeConfig[]
): AttributeConfig[] => {
  const inputConstraints = design.inputConstraints || {};
  const predictedAttributes = design.predictedAttributes || {};

  // Build sets of keys from the design
  const lockedKeys = new Set(Object.keys(inputConstraints));
  const aiKeys = new Set(Object.keys(predictedAttributes));

  return currentAttributes.map((attr) => {
    // Check if this attribute was in inputConstraints (locked)
    if (lockedKeys.has(attr.key)) {
      const value = inputConstraints[attr.key];
      // Validate value exists in variants
      const validValue = attr.variants.includes(value) ? value : attr.variants[0] || null;

      if (value && !attr.variants.includes(value)) {
        console.warn(
          `Design value "${value}" for "${attr.key}" not in current variants, using "${validValue}"`
        );
      }

      return {
        ...attr,
        category: ATTRIBUTE_CATEGORIES.LOCKED,
        selectedValue: validValue,
      };
    }

    // Check if this attribute was in predictedAttributes (AI variable)
    if (aiKeys.has(attr.key)) {
      return {
        ...attr,
        category: ATTRIBUTE_CATEGORIES.AI,
        selectedValue: null,
      };
    }

    // All other attributes go to Not Included
    return {
      ...attr,
      category: ATTRIBUTE_CATEGORIES.NOT_INCLUDED,
      selectedValue: null,
    };
  });
};
