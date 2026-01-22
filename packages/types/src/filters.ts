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
  article_id?: string; // Support both camelCase and snake_case from API
  productType: string;
  product_type?: string;
  productName?: string;
  product_name?: string;
  productGroup: string | null;
  product_group?: string | null;
  productFamily: string | null;
  product_family?: string | null;
  styleConcept: string | null;
  style_concept?: string | null;
  patternStyle: string | null;
  pattern_style?: string | null;
  colorFamily: string | null;
  color_family?: string | null;
  specificColor: string | null;
  specific_color?: string | null;
  colorIntensity: string | null;
  color_intensity?: string | null;
  customerSegment: string | null;
  customer_segment?: string | null;
  fabricTypeBase: string | null;
  fabric_type_base?: string | null;
  detailDesc?: string | null;
  detail_desc?: string | null;
  transactionCount?: number;
  lastSaleDate?: string | null;
  // Allow additional dynamic properties from database
  [key: string]: string | number | null | undefined;
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
