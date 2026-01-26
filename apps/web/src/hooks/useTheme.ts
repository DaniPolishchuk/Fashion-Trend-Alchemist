/**
 * useTheme Hook
 * Manages theme state and persistence with localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { setTheme as setUI5Theme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import { THEME } from '../constants/appShell';

export function useTheme() {
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME.STORAGE_KEY);
      // Default to light theme if not set
      if (savedTheme === null) return false;
      return savedTheme === THEME.DARK.value;
    } catch (error) {
      console.error('Failed to read theme from localStorage:', error);
      return false; // Default to light theme on error
    }
  });

  // Apply theme on mount and when it changes
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const themeConfig = isDarkTheme ? THEME.DARK : THEME.LIGHT;

        // Apply theme using UI5 API
        await setUI5Theme(themeConfig.theme);

        // Set on HTML element for immediate visual effect
        document.documentElement.setAttribute('data-sap-theme', themeConfig.theme);

        // Save to localStorage
        localStorage.setItem(THEME.STORAGE_KEY, themeConfig.value);
      } catch (error) {
        console.error('Failed to apply theme:', error);
      }
    };

    applyTheme();
  }, [isDarkTheme]);

  // Initialize default theme in localStorage if not set
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME.STORAGE_KEY);
      if (savedTheme === null) {
        localStorage.setItem(THEME.STORAGE_KEY, THEME.LIGHT.value);
      }
    } catch (error) {
      console.error('Failed to initialize theme in localStorage:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkTheme((prev) => !prev);
  }, []);

  const currentTheme = isDarkTheme ? THEME.DARK : THEME.LIGHT;

  return {
    isDarkTheme,
    toggleTheme,
    themeIcon: currentTheme.icon,
    themeLabel: currentTheme.label,
  };
}
