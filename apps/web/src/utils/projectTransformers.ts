/**
 * Project Transformation Utilities
 * Transforms API project data to UI-friendly format
 */

import type { ProjectListItem } from '@fashion/types';
import type { ProjectFromAPI } from '../types/api';

/**
 * Derive time period from seasonConfig
 */
export function deriveTimePeriod(seasonConfig: Record<string, unknown> | null): string | null {
  if (!seasonConfig) return null;

  const season = seasonConfig.season as string | undefined;
  if (season) {
    return season.charAt(0).toUpperCase() + season.slice(1);
  }

  const startDate = seasonConfig.startDate as string | undefined;
  const endDate = seasonConfig.endDate as string | undefined;
  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  return null;
}

/**
 * Derive product group from scopeConfig
 */
export function deriveProductGroup(scopeConfig: Record<string, unknown> | null): string | null {
  if (!scopeConfig) return null;

  const productGroups = scopeConfig.productGroups as string[] | undefined;
  if (productGroups && productGroups.length > 0) {
    if (productGroups.length === 1) return productGroups[0];
    return `${productGroups[0]} +${productGroups.length - 1}`;
  }

  const productTypes = scopeConfig.productTypes as string[] | undefined;
  if (productTypes && productTypes.length > 0) {
    if (productTypes.length === 1) return productTypes[0];
    return `${productTypes[0]} +${productTypes.length - 1}`;
  }

  return null;
}

/**
 * Transform API project to UI-friendly ProjectListItem
 */
export function transformProject(apiProject: ProjectFromAPI): ProjectListItem {
  return {
    id: apiProject.id,
    name: apiProject.name,
    status: apiProject.status,
    timePeriod: deriveTimePeriod(apiProject.seasonConfig),
    productGroup: deriveProductGroup(apiProject.scopeConfig),
    generatedProductsCount: apiProject.generatedProductsCount,
    createdAt: apiProject.createdAt,
    isPinned: apiProject.isPinned,
    pinnedAt: apiProject.pinnedAt,
  };
}

/**
 * Transform array of API projects
 */
export function transformProjects(apiProjects: ProjectFromAPI[]): ProjectListItem[] {
  return apiProjects.map(transformProject);
}
