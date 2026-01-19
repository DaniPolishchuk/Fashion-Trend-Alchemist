/**
 * Article domain types
 * Represents the structure of product articles in the fashion catalog
 */

/**
 * Core article entity from the articles table
 */
export interface Article {
  articleId: string;
  productType: string;
  productGroup: string | null;
  patternStyle: string | null;
  specificColor: string | null;
  colorIntensity: string | null;
  colorFamily: string | null;
  productFamily: string | null;
  customerSegment: string | null;
  styleConcept: string | null;
  fabricTypeBase: string | null;
  detailDesc: string | null;
}

/**
 * Lightweight article reference with essential display fields
 */
export interface ArticleReference {
  articleId: string;
  productType: string;
  detailDesc: string | null;
}
