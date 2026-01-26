/**
 * useContextFilters Hook
 * Manages all filter selections state
 */

import { useState, useCallback } from 'react';

export interface FilterState {
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

export function useContextFilters() {
  const [selectedProductGroup, setSelectedProductGroup] = useState<string[]>([]);
  const [selectedProductFamily, setSelectedProductFamily] = useState<string[]>([]);
  const [selectedStyleConcept, setSelectedStyleConcept] = useState<string[]>([]);
  const [selectedColorFamily, setSelectedColorFamily] = useState<string[]>([]);
  const [selectedCustomerSegment, setSelectedCustomerSegment] = useState<string[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string[]>([]);
  const [selectedSpecificColor, setSelectedSpecificColor] = useState<string[]>([]);
  const [selectedColorIntensity, setSelectedColorIntensity] = useState<string[]>([]);
  const [selectedFabricType, setSelectedFabricType] = useState<string[]>([]);

  const updateFilter = useCallback((filterKey: string, values: string[]) => {
    switch (filterKey) {
      case 'customerSegment':
        setSelectedCustomerSegment(values);
        break;
      case 'colorFamily':
        setSelectedColorFamily(values);
        break;
      case 'styleConcept':
        setSelectedStyleConcept(values);
        break;
      case 'productFamily':
        setSelectedProductFamily(values);
        break;
      case 'patternStyle':
        setSelectedPattern(values);
        break;
      case 'specificColor':
        setSelectedSpecificColor(values);
        break;
      case 'colorIntensity':
        setSelectedColorIntensity(values);
        break;
      case 'fabricTypeBase':
        setSelectedFabricType(values);
        break;
    }
  }, []);

  const resetAll = useCallback(() => {
    setSelectedProductGroup([]);
    setSelectedProductFamily([]);
    setSelectedStyleConcept([]);
    setSelectedColorFamily([]);
    setSelectedCustomerSegment([]);
    setSelectedPattern([]);
    setSelectedSpecificColor([]);
    setSelectedColorIntensity([]);
    setSelectedFabricType([]);
  }, []);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (selectedProductGroup.length) count++;
    if (selectedProductFamily.length) count++;
    if (selectedStyleConcept.length) count++;
    if (selectedColorFamily.length) count++;
    if (selectedCustomerSegment.length) count++;
    if (selectedPattern.length) count++;
    if (selectedSpecificColor.length) count++;
    if (selectedColorIntensity.length) count++;
    if (selectedFabricType.length) count++;
    return count;
  }, [
    selectedProductGroup,
    selectedProductFamily,
    selectedStyleConcept,
    selectedColorFamily,
    selectedCustomerSegment,
    selectedPattern,
    selectedSpecificColor,
    selectedColorIntensity,
    selectedFabricType,
  ]);

  const getAllFilters = useCallback(
    (): FilterState => ({
      productGroup: selectedProductGroup,
      productFamily: selectedProductFamily,
      styleConcept: selectedStyleConcept,
      colorFamily: selectedColorFamily,
      customerSegment: selectedCustomerSegment,
      pattern: selectedPattern,
      specificColor: selectedSpecificColor,
      colorIntensity: selectedColorIntensity,
      fabricType: selectedFabricType,
    }),
    [
      selectedProductGroup,
      selectedProductFamily,
      selectedStyleConcept,
      selectedColorFamily,
      selectedCustomerSegment,
      selectedPattern,
      selectedSpecificColor,
      selectedColorIntensity,
      selectedFabricType,
    ]
  );

  return {
    selectedProductGroup,
    selectedProductFamily,
    selectedStyleConcept,
    selectedColorFamily,
    selectedCustomerSegment,
    selectedPattern,
    selectedSpecificColor,
    selectedColorIntensity,
    selectedFabricType,
    updateFilter,
    resetAll,
    getActiveFilterCount,
    getAllFilters,
  };
}
