/**
 * usePersistedSelection Hook
 * Manages selection state with localStorage persistence
 */

import { useState, useEffect } from 'react';

/**
 * Hook to persist selection state in localStorage
 * @param storageKey - The localStorage key to use
 * @param initialValue - Initial value if nothing in localStorage
 * @returns Tuple of [selectedItems, setSelectedItems]
 */
export function usePersistedSelection<T = string>(
  storageKey: string,
  initialValue: Set<T> = new Set()
): [Set<T>, React.Dispatch<React.SetStateAction<Set<T>>>] {
  const [selectedItems, setSelectedItems] = useState<Set<T>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as T[];
        return new Set(parsed);
      }
    } catch (error) {
      console.error(`Failed to load from localStorage (${storageKey}):`, error);
    }
    return initialValue;
  });

  // Save to localStorage whenever selection changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(selectedItems)));
    } catch (error) {
      console.error(`Failed to save to localStorage (${storageKey}):`, error);
    }
  }, [selectedItems, storageKey]);

  return [selectedItems, setSelectedItems];
}

/**
 * Clear persisted selection from localStorage
 */
export function clearPersistedSelection(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`Failed to clear localStorage (${storageKey}):`, error);
  }
}
