/**
 * useOptionsManager Hook
 * Manages options popup dialog and option editing operations
 */

import { useState, useCallback } from 'react';
import { parseAttributeKey } from '../utils/attributeFormatting';

export function useOptionsManager(attributes: any, setAttributes: (attrs: any) => void) {
  const [optionsPopupOpen, setOptionsPopupOpen] = useState(false);
  const [selectedAttributeKey, setSelectedAttributeKey] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');
  const [addingNewOption, setAddingNewOption] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');

  // Open options popup for a specific attribute
  const openPopup = useCallback((category: string, key: string) => {
    setSelectedAttributeKey(`${category}::${key}`);
    setOptionsPopupOpen(true);
  }, []);

  // Close options popup and reset state
  const closePopup = useCallback(() => {
    setOptionsPopupOpen(false);
    setSelectedAttributeKey(null);
    setEditingOption(null);
    setAddingNewOption(false);
    setNewOptionValue('');
    setEditingOptionValue('');
  }, []);

  // Get current options for selected attribute
  const getCurrentOptions = useCallback((): string[] => {
    if (!selectedAttributeKey) return [];
    const [category, key] = parseAttributeKey(selectedAttributeKey);
    return attributes[category]?.[key] || [];
  }, [selectedAttributeKey, attributes]);

  // Start editing an option
  const startEditOption = useCallback((index: number, currentValue: string) => {
    setEditingOption(index);
    setEditingOptionValue(currentValue);
  }, []);

  // Save option edit
  const saveOptionEdit = useCallback(
    (index: number) => {
      if (editingOptionValue.trim() && selectedAttributeKey) {
        const [category, key] = parseAttributeKey(selectedAttributeKey);
        const updatedAttrs = { ...attributes };
        if (updatedAttrs[category]?.[key]) {
          updatedAttrs[category][key][index] = editingOptionValue.trim();
          setAttributes(updatedAttrs);
        }
      }
      setEditingOption(null);
      setEditingOptionValue('');
    },
    [editingOptionValue, selectedAttributeKey, attributes, setAttributes]
  );

  // Cancel option edit
  const cancelOptionEdit = useCallback(() => {
    setEditingOption(null);
    setEditingOptionValue('');
  }, []);

  // Delete an option
  const deleteOption = useCallback(
    (index: number) => {
      if (selectedAttributeKey) {
        const [category, key] = parseAttributeKey(selectedAttributeKey);
        const updatedAttrs = { ...attributes };
        if (updatedAttrs[category]?.[key]) {
          updatedAttrs[category][key] = updatedAttrs[category][key].filter(
            (_: any, i: number) => i !== index
          );
          setAttributes(updatedAttrs);
        }
      }
    },
    [selectedAttributeKey, attributes, setAttributes]
  );

  // Start adding new option
  const startAddNewOption = useCallback(() => {
    setAddingNewOption(true);
    setNewOptionValue('');
  }, []);

  // Cancel adding new option
  const cancelAddNewOption = useCallback(() => {
    setAddingNewOption(false);
    setNewOptionValue('');
  }, []);

  // Add new option
  const addNewOption = useCallback(() => {
    if (newOptionValue.trim() && selectedAttributeKey) {
      const [category, key] = parseAttributeKey(selectedAttributeKey);
      const updatedAttrs = { ...attributes };
      if (updatedAttrs[category]?.[key]) {
        updatedAttrs[category][key].push(newOptionValue.trim());
        setAttributes(updatedAttrs);
      }
      setNewOptionValue('');
      setAddingNewOption(false);
    }
  }, [newOptionValue, selectedAttributeKey, attributes, setAttributes]);

  return {
    // Popup state
    optionsPopupOpen,
    selectedAttributeKey,

    // Editing state
    editingOption,
    editingOptionValue,
    setEditingOptionValue,

    // Adding state
    addingNewOption,
    newOptionValue,
    setNewOptionValue,

    // Actions
    openPopup,
    closePopup,
    getCurrentOptions,
    startEditOption,
    saveOptionEdit,
    cancelOptionEdit,
    deleteOption,
    startAddNewOption,
    cancelAddNewOption,
    addNewOption,
  };
}
