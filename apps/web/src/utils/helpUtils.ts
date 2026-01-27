/**
 * Help Utility Functions
 * Helper functions for context-sensitive help system
 */

import { HELP_CONTENT, type HelpContent } from '../constants/helpContent';

/**
 * Get help content for the current route
 * Handles dynamic routes with IDs (e.g., /project/:id)
 */
export function getHelpContentForRoute(pathname: string): HelpContent | null {
  // Exact match
  if (HELP_CONTENT[pathname]) {
    return HELP_CONTENT[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith('/project/') && pathname.includes('/design/')) {
    // Design detail page: /project/:projectId/design/:designId
    return HELP_CONTENT['/design'];
  }

  if (pathname.startsWith('/project/') && pathname.includes('/context-builder')) {
    // Context builder within project: /project/:projectId/context-builder
    return HELP_CONTENT['/context-builder'];
  }

  if (pathname.startsWith('/project/')) {
    // Project hub: /project/:projectId
    return HELP_CONTENT['/project'];
  }

  // Default fallback
  return null;
}

/**
 * Get page title from route for display purposes
 */
export function getPageTitle(pathname: string): string {
  const content = getHelpContentForRoute(pathname);
  return content?.title || 'Help';
}
