# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Fashion Trend Alchemist** is an AI-powered fashion analytics platform with inverse design capabilities. It analyzes product trends and sales data to generate design attributes for future best-sellers using LLM-based enrichment and RPT-1 inference logic.

## Development Commands

### Starting the Application

The application requires both API and web app to be running:

```bash
# Terminal 1: Start API server (port 3001)
cd apps/api-lite && pnpm run dev

# Terminal 2: Start web app (port 5173)
cd apps/web && pnpm run dev
```

Or start both at once from root:
```bash
pnpm run dev
```

### Building

```bash
# Build all packages (required before starting app)
pnpm build

# Build individual packages
pnpm build:api
pnpm build:web
```

### Database Operations

```bash
# Generate migrations after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Code Quality

```bash
# Format all code
pnpm format
```

## Architecture

### Monorepo Structure

This is a **pnpm workspace monorepo** with the following structure:

- `apps/api-lite/` - Fastify backend API server
- `apps/web/` - React + Vite frontend with SAP UI5 Web Components
- `packages/db/` - Database layer with Drizzle ORM schemas and queries
- `packages/types/` - Shared TypeScript types and Zod schemas
- `packages/config/` - Configuration and environment management

### Key Technologies

- **Frontend**: React 18 + Vite + SAP UI5 Web Components for React
- **Backend**: Node.js 18+ with Fastify
- **Database**: PostgreSQL 16 (cloud-hosted, typically accessed via port forwarding)
- **ORM**: Drizzle ORM 0.29.5 (version pinned in root package.json)
- **AI Integration**: OpenAI API for LLM-based attribute generation
- **Package Manager**: pnpm with workspaces

### Database Connection

The application connects to a cloud-hosted PostgreSQL database. Typical workflow involves:

1. Setting up port forwarding (example):
   ```bash
   caffeinate kubectl port-forward statefulset/your-db-instance 5432:5432 -n your-namespace
   ```

2. Configuring `.env` with connection details:
   ```
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=fashion_db
   PGUSER=postgres
   PGPASSWORD=<password>
   ```

### Core Database Schema

#### Primary Tables
- **articles** - Static product catalog with attributes (article_id, product_type, product_group, color_family, pattern_style, etc.)
- **transactions_train** - Sales data linking articles to customers and dates (t_date, customer_id, article_id, price)
- **customers** - Customer demographics (customer_id, age)
- **projects** - User projects with scope and status (draft/active)
- **project_context_items** - Context articles per project: top 25 and worst 25 articles (by velocity score) when >50 total results, otherwise all matching articles (up to 50)
- **generated_designs** - AI-generated design outputs (project_id, name, input_constraints, predicted_attributes, generated_image_url)
- **collections** - User-created collections grouping generated designs (id, user_id, name, created_at)
- **collection_items** - Junction table linking collections to generated designs (collection_id, generated_design_id)

#### Important Indexes
- `idx_transactions_article_id` on `transactions_train(article_id)`
- `idx_transactions_t_date` on `transactions_train(t_date)`
- `idx_transactions_customer_id` on `transactions_train(customer_id)`

### Data Flow Architecture

1. **Product Selection Flow**: User selects product types from taxonomy → stored in localStorage
2. **Analysis Flow**: Filters applied (date/season + attributes) → API queries with dynamic WHERE clauses → paginated results
3. **Project Flow**: Create project (draft) → preview context with velocity calculation → lock context (moves to active)
4. **LLM Enrichment Flow**: Project context items are processed in parallel (configurable concurrency) → Vision LLM extracts attributes from product images → enriched attributes stored in DB with SSE progress updates

### API Structure

The API server (`apps/api-lite/src/main.ts`) uses Fastify with the following endpoint categories:

- `/health` - Health check
- `/api/taxonomy` - Product type hierarchy
- `/api/transactions/count` - Count filtered transactions
- `/api/articles/count` - Count distinct articles by product type
- `/api/filters/attributes` - Dynamic filter options based on current filters
- `/api/products` - Paginated product listing with filters
- `/api/generate-attributes` - LLM-based attribute generation (uses OpenAI)
- `/api/projects` - List all projects (GET), create project (POST)
- `/api/projects/:id` - Get single project by ID (GET)
- `/api/projects/:id/preview-context` - Calculate velocity scores for context preview
- `/api/projects/:id/lock-context` - Lock project context and save articles
- `/api/collections` - List user collections with item counts and preview images (see `routes/collections.ts`)
- `/api/projects/:id/rpt1-preview` - Get context row counts for RPT-1 preview
- `/api/projects/:id/rpt1-predict` - Execute RPT-1 prediction via SAP AI Core
- `/api/projects/:id/context-items` - Get all context items with enrichment status for Enhanced Table (see `routes/context-items.ts`)
- `/api/projects/:id/retry-enrichment` - Retry failed enrichment items (POST with optional articleIds array)

### Frontend Structure

The frontend (`apps/web/src/`) uses:

- **Routing**: React Router 7 with pages in `src/pages/`
- **UI Components**: SAP UI5 Web Components (@ui5/webcomponents-react)
- **State**: Local state + localStorage for persistence
- **API Communication**: Fetch API with manual state management

Key components:
- `components/AppShell.tsx` - Unified SAP Fiori-style shell wrapper with header (ShellBar), logo, search, notifications popover, and user profile popover with menu. Wraps all pages via App.tsx.
- `components/AttributeGenerationDialog.tsx` - LLM attribute generation UI

Key pages:
- `Home.tsx` - Dashboard with searchable/paginated projects table and collections grid
- `ProductSelection.tsx` - Product type taxonomy browser
- `Analysis.tsx` - Filtering and analysis dashboard
- `ProjectHub.tsx` - Project workspace hub with tabbed navigation (see below)
- `DesignDetail.tsx` - Individual design detail view

#### ProjectHub Page (`/project/:projectId`)
The ProjectHub is the main workspace for working with a project after it's created. It features:
- **Header**: Project name, status badge (DRAFT/ACTIVE), and progress indicator (dummy for now)
- **Tab Navigation**: Four tabs for different workflows

**Tab Components** (located in `src/pages/tabs/`):
1. **TheAlchemistTab** - Transmutation Parameters configuration
   - Three-column layout: Locked Attributes | AI Variables | Not Included
   - Combines article-level attributes (from DB) and ontology-generated attributes
   - Article attributes (product_type, color_family, etc.) get options from existing data
   - Ontology attributes come from project's `ontologySchema`
   - Maximum 10 AI Variables allowed (RPT-1 Large limit)
   - Success Score slider (0-100%) on the right panel to set target performance
   - "Preview Request" button shows context summary and query structure
   - "Transmute (Run RPT-1)" button calls SAP AI Core to generate predictions
2. **ResultOverviewTab** - Generated designs display
   - Paginated list of generated designs with search
   - Shows design name, category, confidence score, thumbnail
   - Uses mock data (ready for API integration)
3. **EnhancedTableTab** - Context items table with enrichment monitoring
   - Displays all project context items joined with article data
   - Shows enrichment status (successful/pending/failed) per item
   - Collapsible control panel with status summary and retry controls
   - Filter chips (All/Successful/Pending/Failed) for quick filtering
   - Sortable columns (velocity score, article ID, product type) with "Failed first" option
   - Dynamic columns for LLM-enriched attributes from ontology schema
   - Image thumbnails with fallback placeholder on load error
   - Single item retry and bulk "Retry All Failed" functionality
   - CSV export with all base and enriched attributes
   - Processing row highlight animation during active enrichment
   - Pagination (25 items per page)
   - **Expandable rows**: Click any row to expand and see full article details, larger image, all enriched attributes, and error messages (accordion behavior - only one row expanded at a time)
   - **Image modal**: Click zoom icon on expanded image to view full-size in dialog
   - **Real-time updates**: 5-second polling during enrichment (when tab is visible)
   - **Color-coded velocity scores**: Green (≥70), gray (40-69), red (<40)
4. **DataAnalysisTab** - Placeholder (displays "Data Analysis")

#### Ontology Schema Structure
The `ontologySchema` in projects is a nested structure:
```json
{
  "productType": {
    "attributeName": ["variant1", "variant2", ...],
    ...
  }
}
```
Example for skirts: `{ "skirt": { "style": ["A-line", "Pencil", ...], "fit": ["Loose", "Slim", ...] } }`

#### Home Page Features
- **Projects Table**: Displays all user projects with status (Ready/Processing), name, time period, product group, and generated products count. Supports search filtering and pagination (5 items per page).
- **Collections Section**: Shows user collections as cards with 2x2 image thumbnail grids. Only visible when collections exist. Images fall back to product icons when unavailable.

### Important Implementation Details

#### Date/Season Filtering

The system uses **MM-DD format** for date ranges that apply across all years:
- Season filters map to months: spring (3,4,5), summer (6,7,8), autumn (9,10,11), winter (12,1,2)
- Date range filtering uses EXTRACT(MONTH/DAY) to work across years
- Cross-year ranges (e.g., Dec 15 - Jan 15) are handled with OR logic
- **If no date/season is selected**: All data across all years is analyzed (no date filtering applied)

#### Multi-Attribute Filtering

- 9 filter categories: productGroup, productFamily, styleConcept, patternStyle, colorFamily, colorIntensity, specificColor, customerSegment, fabricTypeBase
- Filter options dynamically update based on current dataset
- Frontend sends comma-separated values like `filter_colorFamily=Blue,Red`
- Backend converts camelCase to snake_case for SQL column names
- All filters use parameterized queries to prevent SQL injection

#### Velocity Score Calculation

The velocity score measures sales performance normalized across products:

**Formula:** `Velocity = Transaction Count / Days Available`
- Days Available is approximated by `(last_transaction_date - first_transaction_date + 1)`
- This measures how quickly items sell relative to their availability period

**Normalization:** At lock time, raw velocity scores are normalized to 0-100:
- `normalized = (score - min) / (max - min) * 100`
- The lowest performer in context = 0, highest = 100
- Stored in `project_context_items.velocityScore`

**Usage in RPT-1:** The normalized score is sent as `success_score` (first column) to RPT-1, allowing users to target specific performance levels when generating new designs.

#### Project Lifecycle

1. **Draft Status**: User creates project, configures scope (product types, filters)
2. **Preview Context**: System calculates velocity scores for all matching articles
   - If >50 articles match: selects top 25 and worst 25 by velocity score
   - If ≤50 articles match: includes all matching articles
3. **Lock Context**: User confirms selection (via "Confirm Cohort"), project moves to "active", articles saved to `project_context_items` with normalized velocity scores (0-100). User stays on the same page.
4. **Active Status**: Context is locked, user can now enrich attributes and generate designs via RPT-1

### Environment Configuration

Required environment variables (see `.env.example`):

```
# Database
PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

# API
API_PORT (default: 3001)
API_HOST (default: 0.0.0.0)

# LLM Integration (for ontology generation)
LLM_API_URL, LLM_API_KEY, LLM_MODEL

# Vision LLM (for image enrichment)
LITELLM_PROXY_URL, LITELLM_API_KEY, VISION_LLM_MODEL

# Enrichment Processing
ENRICHMENT_CONCURRENCY (default: 5) - Number of parallel Vision LLM requests
ENRICHMENT_PROGRESS_INTERVAL_MS (default: 500) - Progress update batching interval

# RPT-1 / SAP AI Core (for design prediction)
AI_API_URL - SAP AI Core API endpoint
AUTH_URL - OAuth2 authentication endpoint
CLIENT_ID, CLIENT_SECRET - Service credentials
RESOURCE_GROUP - AI Core resource group (e.g., "generative-ai")

# S3/SeaweedFS (for image storage)
S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET
```

### TypeScript Configuration

- Root `tsconfig.base.json` provides base configuration
- Each package/app has its own `tsconfig.json` extending the base
- Strict mode enabled
- ESM modules (type: "module" in all package.json files)

### Package Dependencies

All packages use workspace protocol (`workspace:*`) for internal dependencies:
- `@fashion/db` exports database client, schemas, and query functions
- `@fashion/types` exports shared TypeScript types and Zod schemas
- `@fashion/config` exports environment configuration

The monorepo enforces Drizzle ORM version 0.29.5 via pnpm overrides in root package.json.

## Common Development Patterns

### Adding a New API Endpoint

1. Add endpoint handler in `apps/api-lite/src/main.ts` or create new route file in `apps/api-lite/src/routes/`
2. Define request/response types in `packages/types/src/`
3. Add database queries in `packages/db/src/queries/` if needed
4. Use parameterized queries for all user input to prevent SQL injection

### Adding a New Database Table

1. Define schema in `packages/db/src/schema/[table-name].ts` using Drizzle syntax
2. Export from `packages/db/src/schema/index.ts`
3. Run `pnpm db:generate` to create migration
4. Run `pnpm db:migrate` to apply migration
5. Export query functions from `packages/db/src/index.ts`

### Adding a New Filter Attribute

1. Add column to articles table schema
2. Update `/api/filters/attributes` endpoint to include new attribute in SELECT
3. Update `/api/products` endpoint to add filter key to `filterKeys` array and `validColumns` set
4. Update `FiltersResponse` type in `packages/types/`
5. Add UI controls in `apps/web/src/pages/Analysis.tsx`

## Testing & Validation

### Manual Testing Workflow

1. Ensure database port forwarding is active
2. Start API server and verify `/health` endpoint responds
3. Start web app and verify it loads at http://localhost:5173
4. Test product selection → analysis flow
5. Test project creation → context preview → lock flow

### Database Connection Testing

```bash
# Test direct connection
psql -h localhost -p 5432 -U postgres -d fashion_db

# Test API connection
curl http://localhost:3001/health
```

## Project Phases

The system is being built in phases (see docs/PRD.md):

- **Phase 1 (COMPLETE)**: Product analysis with filtering and pagination
- **Phase 2 (COMPLETE)**: LLM-based attribute enrichment for top performers
- **Phase 3 (COMPLETE)**: RPT-1 inverse design engine for predicting attributes
  - Three-column attribute management (Locked/AI/Not Included)
  - Success score targeting (0-100%)
  - SAP AI Core integration with OAuth2 authentication
  - Velocity-based context with normalized scores
- **Phase 4**: AI image generation for design visualization

Current focus is on results display and image generation (Phase 4).
