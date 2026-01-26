/**
 * useAttributeEditor Hook
 * Manages attribute editing, adding, and deleting operations
 */

import { useState, useCallback } from 'react';
import { displayNameToKey } from '../utils/attributeFormatting';

export function useAttributeEditor(
  attributes: any,
  setAttributes: (attrs: any) => void,
  defaultCategory: string
) {
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const [editingAttributeValue, setEditingAttributeValue] = useState('');
  const [addingNewAttribute, setAddingNewAttribute] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');

  // Start editing an attribute
  const startEdit = useCallback((category: string, key: string, currentName: string) => {
    setEditingAttribute(`${category}::${key}`);
    setEditingAttributeValue(currentName);
  }, []);

  // Save attribute name edit
  const saveEdit = useCallback(
    (category: string, oldKey: string) => {
      if (editingAttributeValue.trim()) {
        const newKey = displayNameToKey(editingAttributeValue);
        const updatedAttrs = { ...attributes };

        if (updatedAttrs[category]) {
          const values = updatedAttrs[category][oldKey];
          delete updatedAttrs[category][oldKey];
          updatedAttrs[category][newKey] = values;
        }

        setAttributes(updatedAttrs);
      }
      setEditingAttribute(null);
      setEditingAttributeValue('');
    },
    [editingAttributeValue, attributes, setAttributes]
  );

  // Cancel attribute edit
  const cancelEdit = useCallback(() => {
    setEditingAttribute(null);
    setEditingAttributeValue('');
  }, []);

  // Delete an attribute
  const deleteAttribute = useCallback(
    (category: string, key: string) => {
      const updatedAttrs = { ...attributes };
      if (updatedAttrs[category]) {
        delete updatedAttrs[category][key];
        if (Object.keys(updatedAttrs[category]).length === 0) {
          delete updatedAttrs[category];
        }
      }
      setAttributes(updatedAttrs);
    },
    [attributes, setAttributes]
  );

  // Start adding new attribute
  const startAddNew = useCallback(() => {
    setAddingNewAttribute(true);
    setNewAttributeName('');
  }, []);

  // Cancel adding new attribute
  const cancelAddNew = useCallback(() => {
    setAddingNewAttribute(false);
    setNewAttributeName('');
  }, []);

  // Add new attribute
  const addNew = useCallback(() => {
    if (newAttributeName.trim()) {
      const key = displayNameToKey(newAttributeName);
      const category = defaultCategory;

      const updatedAttrs = { ...attributes };
      if (!updatedAttrs[category]) {
        updatedAttrs[category] = {};
      }
      updatedAttrs[category][key] = [];

      setAttributes(updatedAttrs);
      setNewAttributeName('');
      setAddingNewAttribute(false);
    }
  }, [newAttributeName, defaultCategory, attributes, setAttributes]);

  return {
    // Editing state
    editingAttribute,
    editingAttributeValue,
    setEditingAttributeValue,

    // Adding state
    addingNewAttribute,
    newAttributeName,
    setNewAttributeName,

    // Actions
    startEdit,
    saveEdit,
    cancelEdit,
    deleteAttribute,
    startAddNew,
    cancelAddNew,
    addNew,
  };
}
