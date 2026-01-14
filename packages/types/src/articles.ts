/**
 * Article domain types
 * Represents the structure of product articles in the fashion catalog
 */

/**
 * Core article entity from the articles table
 */
export interface Article {
  articleId: number;
  productCode: number;
  prodName: string;
  productTypeNo: number;
  productTypeName: string;
  productGroupName: string;
  graphicalAppearanceNo: number;
  graphicalAppearanceName: string;
  colourGroupCode: number;
  colourGroupName: string;
  perceivedColourValueId: number;
  perceivedColourValueName: string;
  perceivedColourMasterId: number;
  perceivedColourMasterName: string;
  departmentNo: number;
  departmentName: string;
  indexCode: string;
  indexName: string;
  indexGroupNo: number;
  indexGroupName: string;
  sectionNo: number;
  sectionName: string;
  garmentGroupNo: number;
  garmentGroupName: string;
  detailDesc: string;
}

/**
 * Lightweight article reference with essential display fields
 */
export interface ArticleReference {
  articleId: number;
  prodName: string;
  productTypeName: string;
  productTypeNo: number;
}