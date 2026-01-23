import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@ui5/webcomponents-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import App from './App';

// Set UI5 theme
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-react/dist/Assets.js';

// Apply saved theme BEFORE React renders
const savedTheme = localStorage.getItem('theme');
const initialTheme = savedTheme === 'dark' ? 'sap_horizon_dark' : 'sap_horizon';
setTheme(initialTheme);
document.documentElement.setAttribute('data-sap-theme', initialTheme);

// Create a QueryClient instance with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for this duration
      gcTime: 10 * 60 * 1000, // 10 minutes - cached data garbage collection time
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry once on failure
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
