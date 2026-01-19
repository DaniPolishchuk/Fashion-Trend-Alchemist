/**
 * Filter and product list types for the Analysis page
 */

/**
 * Available filter attribute values based on current selection
 */
export interface FiltersResponse {
  productGroup: string[];
  productFamily: string[];
  styleConcept: string[];
  patternStyle: string[];
  colorFamily: string[];
  colorIntensity: string[];
  specificColor: string[];
  customerSegment: string[];
  fabricTypeBase: string[];
}

/**
 * Product item in the list with aggregated transaction data
 */
export interface ProductListItem {
  articleId: string;
  productType: string;
  productGroup: string | null;
  productFamily: string | null;
  styleConcept: string | null;
  patternStyle: string | null;
  colorFamily: string | null;
  specificColor: string | null;
  colorIntensity: string | null;
  customerSegment: string | null;
  fabricTypeBase: string | null;
  transactionCount: number;
  lastSaleDate: string | null;
}

/**
 * Paginated products response
 */
export interface ProductsResponse {
  items: ProductListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Filter selections for API queries
 */
export interface AttributeFilters {
  productGroup?: string[];
  productFamily?: string[];
  styleConcept?: string[];
  patternStyle?: string[];
  colorFamily?: string[];
  colorIntensity?: string[];
  specificColor?: string[];
  customerSegment?: string[];
  fabricTypeBase?: string[];
}
