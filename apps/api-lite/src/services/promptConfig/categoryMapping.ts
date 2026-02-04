/**
 * Category Mapping Configuration
 * Maps product groups to photography categories
 */

// ==================== TYPES ====================

export type PhotographyCategory = 'wearable' | 'footwear' | 'accessories' | 'non_wearable';

// ==================== MAPPINGS ====================

/**
 * Maps product groups from the database to photography categories
 */
export const PRODUCT_GROUP_TO_CATEGORY: Record<string, PhotographyCategory> = {
  // WEARABLE (7 product groups)
  'Garment Upper body': 'wearable',
  'Garment Lower body': 'wearable',
  'Garment Full body': 'wearable',
  'Nightwear': 'wearable',
  'Swimwear': 'wearable',
  'Underwear': 'wearable',
  'Underwear/nightwear': 'wearable',

  // FOOTWEAR (2 product groups)
  'Shoes': 'footwear',
  'Socks & Tights': 'footwear',

  // ACCESSORIES (2 product groups)
  'Bags': 'accessories',
  'Accessories': 'accessories',

  // NON-WEARABLE (7 product groups)
  'Interior textile': 'non_wearable',
  'Furniture': 'non_wearable',
  'Cosmetic': 'non_wearable',
  'Garment and Shoe care': 'non_wearable',
  'Items': 'non_wearable',
  'Fun': 'non_wearable',
  'Stationery': 'non_wearable',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get photography category from product group
 * Falls back to inferring from product type if group is unknown
 */
export function getPhotographyCategory(
  productGroup: string | null,
  productType: string
): PhotographyCategory {
  // Try direct lookup first
  if (productGroup && PRODUCT_GROUP_TO_CATEGORY[productGroup]) {
    return PRODUCT_GROUP_TO_CATEGORY[productGroup];
  }

  // Fallback: infer from product type
  return inferCategoryFromProductType(productType);
}

/**
 * Infer photography category from product type when product group is unknown
 */
function inferCategoryFromProductType(productType: string): PhotographyCategory {
  const lower = productType.toLowerCase();

  // Footwear indicators
  const footwearKeywords = ['shoe', 'sneaker', 'boot', 'heel', 'sandal', 'loafer', 'flat', 'pump', 'mule', 'slipper', 'sock', 'tight', 'hosiery'];
  if (footwearKeywords.some(k => lower.includes(k))) {
    return 'footwear';
  }

  // Accessories indicators
  const accessoryKeywords = ['bag', 'handbag', 'backpack', 'tote', 'clutch', 'hat', 'cap', 'beanie', 'scarf', 'belt', 'watch', 'jewelry', 'necklace', 'bracelet', 'earring', 'sunglasses', 'gloves', 'tie'];
  if (accessoryKeywords.some(k => lower.includes(k))) {
    return 'accessories';
  }

  // Non-wearable indicators
  const nonWearableKeywords = ['cushion', 'pillow', 'blanket', 'towel', 'furniture', 'table', 'cosmetic', 'lipstick', 'makeup', 'toy', 'umbrella', 'keychain', 'case', 'pen', 'marker', 'stationery'];
  if (nonWearableKeywords.some(k => lower.includes(k))) {
    return 'non_wearable';
  }

  // Default to wearable (most common case)
  return 'wearable';
}
