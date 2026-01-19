/**
 * Taxonomy domain types
 * Represents product group and type hierarchies
 */

/**
 * Product group with its associated product types
 */
export interface ProductGroupTaxonomy {
  /** Product group name */
  productGroup: string;
  
  /** Number of distinct product types in this group */
  typeCount: number;
  
  /** Array of product type names */
  productTypes: string[];
}

/**
 * Complete taxonomy structure
 */
export interface Taxonomy {
  /** Array of product groups with their types */
  groups: ProductGroupTaxonomy[];
}
