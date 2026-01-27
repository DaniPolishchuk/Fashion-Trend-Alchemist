/**
 * API Response Types
 * Type definitions for API responses and requests
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ProjectFromAPI {
  id: string;
  userId: string;
  name: string;
  status: 'draft' | 'active';
  seasonConfig: Record<string, unknown> | null;
  scopeConfig: Record<string, unknown> | null;
  ontologySchema: Record<string, unknown> | null;
  createdAt: string;
  deletedAt: string | null;
  generatedProductsCount: number;
  isPinned?: boolean;
  pinnedAt?: string | null;
}

export interface CollectionFromAPI {
  id: string;
  name: string;
  itemCount: number;
  imageUrls: string[];
  createdAt: string;
}

export interface CollectionDetailsFromAPI {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  designs: {
    id: string;
    name: string;
    projectId: string;
    generatedImageUrl: string;
    generatedImages: string[] | null;
    predictedAttributes: Record<string, any>;
    inputConstraints: Record<string, any>;
    createdAt: string;
  }[];
}

export interface ProductGroupTaxonomy {
  productGroup: string;
  typeCount: number;
  productTypes: string[];
}

export interface Taxonomy {
  groups: ProductGroupTaxonomy[];
}

export interface CountResponse {
  count: number;
}

export interface FilterAttributesParams {
  types: string;
  season?: string;
  mdFrom?: string;
  mdTo?: string;
}

export interface ProductsParams {
  limit: string;
  offset: string;
  types: string;
  season?: string;
  mdFrom?: string;
  mdTo?: string;
  filter_productGroup?: string;
  filter_productFamily?: string;
  filter_styleConcept?: string;
  filter_colorFamily?: string;
  filter_customerSegment?: string;
  filter_patternStyle?: string;
  filter_specificColor?: string;
  filter_colorIntensity?: string;
  filter_fabricTypeBase?: string;
}

export interface ProductsResponse {
  items: any[];
  total: number;
}

export interface CreateProjectRequest {
  name: string;
  scopeConfig: {
    productTypes: string[];
    productGroups: string[];
  };
}

export interface ProjectCreatedResponse {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface LockContextRequest {
  articles: any[];
  seasonConfig: {
    season?: string;
    startDate?: string;
    endDate?: string;
  } | null;
  ontologySchema: any;
}

export interface GenerateAttributesRequest {
  productTypes: string[];
  feedback?: string;
  conversationHistory?: any[];
}

export interface GenerateAttributesResponse {
  attributeSet: any;
  conversationHistory?: any[];
}
