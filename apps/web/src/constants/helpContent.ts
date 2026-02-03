/**
 * Help Content Constants
 * Context-sensitive help information for each page
 */

export interface HelpContent {
  title: string;
  description: string;
  features: string[];
  tips: string[];
  tabs?: Record<string, string>;
}

export const HELP_CONTENT: Record<string, HelpContent> = {
  '/': {
    title: 'Project Dashboard',
    description: 'Central hub for managing your fashion trend analysis projects and collections',
    features: [
      'Create new projects with custom configurations',
      'View and search existing projects with pagination',
      'Pin up to 3 important projects for quick access',
      'Delete projects and their associated generated products',
      'Create and manage collections to organize designs',
      'Preview collection contents with image grid',
      'Delete collections when no longer needed',
    ],
    tips: [
      'Click "Create New Project" to start a new trend analysis',
      'Pinned projects appear at the top of your dashboard',
      'Search works across project names, time periods, and product groups',
      'Collections help you organize and group related designs',
      'Click on a collection card to preview its designs',
      'Use the project status indicator to see if enrichment is ready or processing',
    ],
  },
  '/product-selection': {
    title: 'Product Selection',
    description: 'Select product types and give your project a name to define the analysis scope',
    features: [
      'Name your project with a descriptive title',
      'Browse product catalog organized by groups',
      'Expand/collapse product groups to view available types',
      'Select multiple product types across different groups',
      'View real-time stats showing matching transaction rows and unique articles',
      'Sort product groups alphabetically (A-Z or Z-A)',
      'Filter product types with search functionality',
      'Review selection summary before proceeding',
    ],
    tips: [
      'Give your project a clear name before selecting products',
      'Stats update automatically as you select product types',
      'Click on product groups to expand and see available types within',
      'Use the sorting button to change between ascending/descending order',
      'The selection persists if you navigate away and come back',
      'Transaction row count shows how much data matches your selection',
    ],
  },
  '/context-builder': {
    title: 'Context Builder',
    description: 'Define time periods, apply filters, and configure AI attributes for your project',
    features: [
      'Select seasonal date ranges (Spring, Summer, Autumn, Winter)',
      'Set custom date ranges with start and end dates (DD/MM format)',
      'Apply multiple attribute filters (pattern, color, fabric, style, customer segment)',
      'View real-time product count as filters are applied',
      'Generate AI-powered attribute schemas with LLM assistance',
      'Provide feedback to refine generated attribute schemas',
      'Preview product data in expandable table with images',
      'View active filter count and total matching products',
      'Confirm and lock context to create the project',
    ],
    tips: [
      'Seasonal buttons auto-fill date ranges for convenience',
      'You must generate AI attributes before creating the project',
      'Use filters to narrow down products for more focused analysis',
      'Click on table rows to expand and see full product details',
      'Click on product images to view them in full size',
      'The attribute generation dialog lets you iterate with AI feedback',
      'Active filter count shows how many filters are currently applied',
    ],
  },
  '/project': {
    title: 'Project Workspace',
    description: 'Generate designs, manage product data, and analyze results in your project',
    features: [
      'Start enrichment process to add AI-powered attributes to products',
      'Monitor enrichment progress with real-time status updates',
      'Switch between 4 different tabs for various project tasks',
      'View project creation date and current status',
      'Navigate between tabs without losing context',
    ],
    tips: [
      'Start enrichment before generating designs for best results',
      'The Enhanced Table shows enrichment progress in real-time',
      'Enrichment status card displays current progress and completion time',
      'Use tabs to access different features: generation, data, and results',
      'All tabs share the same project context and data',
    ],
  },
  '/design': {
    title: 'Design Detail',
    description:
      'View comprehensive design information with multi-angle images and attribute details',
    features: [
      'View design across multiple angles: front, secondary shot, and model views',
      'Monitor image generation status for each view independently',
      'Compare AI-predicted attributes with given constraints side-by-side',
      'Edit design name manually or generate AI-powered names',
      'Navigate between image views using arrow keys or buttons',
      'Save designs to collections for organization',
      'Create design variations with "Refine Design" feature',
      'View overall generation status (pending, generating, completed, partial, failed)',
    ],
    tips: [
      'Use left/right arrow keys to quickly switch between image views',
      'AI-predicted attributes are highlighted in orange for easy identification',
      'Click "Generate Name" for AI suggestions based on design attributes',
      'Partial status means some views generated successfully while others failed',
      'Click "Refine Design" to create a new variant using current attributes',
      'Thumbnails show generation status: completed, generating, pending, or failed',
      'Click thumbnail images to switch to that specific view',
      "The view badge shows which angle you're currently viewing",
    ],
  },
};
