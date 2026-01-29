/**
 * The Alchemist Tab Helper Functions
 * Utility functions for attribute management
 */

import {
  ARTICLE_ATTRIBUTES,
  DEFAULT_LOCKED,
  DEFAULT_NOT_INCLUDED,
  ATTRIBUTE_CATEGORIES,
  API_ENDPOINTS,
  type AttributeCategory,
} from '../constants/theAlchemistTab';
import type { AttributeConfig } from '../types/theAlchemistTab';
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
 * Initialize attributes from article options and ontology schema
 */
export const initializeAttributes = (
  articleAttributeOptions: Record<string, string[]>,
  ontologySchema: Record<string, Record<string, string[]>> | null
): AttributeConfig[] => {
  const initialAttributes: AttributeConfig[] = [];

  // Add article-level attributes
  ARTICLE_ATTRIBUTES.forEach((attrKey) => {
    const variants = articleAttributeOptions[attrKey] || [];
    if (variants.length > 0) {
      const isLocked = (DEFAULT_LOCKED as readonly string[]).includes(attrKey);
      const isNotIncluded = (DEFAULT_NOT_INCLUDED as readonly string[]).includes(attrKey);

      let category: AttributeCategory;
      let selectedValue: string | null = null;

      if (isLocked) {
        category = ATTRIBUTE_CATEGORIES.LOCKED;
        selectedValue = variants[0] || null;
      } else if (isNotIncluded) {
        category = ATTRIBUTE_CATEGORIES.NOT_INCLUDED;
      } else {
        category = ATTRIBUTE_CATEGORIES.AI;
      }

      initialAttributes.push({
        key: `article_${attrKey}`,
        displayName: formatAttributeName(attrKey),
        variants,
        category,
        selectedValue,
        isArticleLevel: true,
      });
    }
  });

  // Add ontology-generated attributes
  if (ontologySchema) {
    Object.entries(ontologySchema).forEach(([productType, productAttributes]) => {
      if (typeof productAttributes === 'object' && productAttributes !== null) {
        Object.entries(productAttributes).forEach(([attrKey, variants]) => {
          if (Array.isArray(variants) && variants.length > 0) {
            initialAttributes.push({
              key: `ontology_${productType}_${attrKey}`,
              displayName: formatAttributeName(attrKey),
              variants,
              category: ATTRIBUTE_CATEGORIES.AI,
              selectedValue: null,
              isArticleLevel: false,
            });
          }
        });
      }
    });
  }

  return initialAttributes;
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
