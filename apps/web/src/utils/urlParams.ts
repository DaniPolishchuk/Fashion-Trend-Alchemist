/**
 * URL Parameters Builder Utilities
 * Helper functions for building URL query parameters
 */

import type { SeasonType } from '../constants/contextBuilder';

export interface DateRange {
  startDay: string;
  startMonth: string;
  endDay: string;
  endMonth: string;
}

export interface FilterSelections {
  productGroup: string[];
  productFamily: string[];
  styleConcept: string[];
  colorFamily: string[];
  customerSegment: string[];
  pattern: string[];
  specificColor: string[];
  colorIntensity: string[];
  fabricType: string[];
}

/**
 * Add date/season parameters to URLSearchParams
 */
export function addDateParams(
  params: URLSearchParams,
  season: SeasonType | null,
  dateRange: DateRange,
  formatDateFn: (day: string, month: string) => string,
  hasValidDateFn: (
    startDay: string,
    startMonth: string,
    endDay: string,
    endMonth: string
  ) => boolean
): void {
  if (season) {
    params.append('season', season);
  } else if (
    hasValidDateFn(dateRange.startDay, dateRange.startMonth, dateRange.endDay, dateRange.endMonth)
  ) {
    params.append('mdFrom', formatDateFn(dateRange.startDay, dateRange.startMonth));
    params.append('mdTo', formatDateFn(dateRange.endDay, dateRange.endMonth));
  }
}

/**
 * Add filter parameters to URLSearchParams
 */
export function addFilterParams(params: URLSearchParams, filters: FilterSelections): void {
  if (filters.productGroup.length) {
    params.append('filter_productGroup', filters.productGroup.join(','));
  }
  if (filters.productFamily.length) {
    params.append('filter_productFamily', filters.productFamily.join(','));
  }
  if (filters.styleConcept.length) {
    params.append('filter_styleConcept', filters.styleConcept.join(','));
  }
  if (filters.colorFamily.length) {
    params.append('filter_colorFamily', filters.colorFamily.join(','));
  }
  if (filters.customerSegment.length) {
    params.append('filter_customerSegment', filters.customerSegment.join(','));
  }
  if (filters.pattern.length) {
    params.append('filter_patternStyle', filters.pattern.join(','));
  }
  if (filters.specificColor.length) {
    params.append('filter_specificColor', filters.specificColor.join(','));
  }
  if (filters.colorIntensity.length) {
    params.append('filter_colorIntensity', filters.colorIntensity.join(','));
  }
  if (filters.fabricType.length) {
    params.append('filter_fabricTypeBase', filters.fabricType.join(','));
  }
}
