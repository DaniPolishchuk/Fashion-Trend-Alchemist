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

**Backend (`apps/api-lite/`):**

- `src/main.ts` - Main API server with core endpoints
- `src/constants.ts` - Backend constants and configuration
- `src/routes/` - Modular API routes (projects, enrichment, rpt1, context-items, collections, design-name)
- `src/services/` - Service layer (cache, enrichment, imageGeneration, s3)

**Frontend (`apps/web/`):**

- `public/` - Static assets (logo.svg)
- `src/pages/` - Page components (Home, ProductSelection, ContextBuilder, ProjectHub, DesignDetail)
- `src/pages/tabs/` - ProjectHub tab components (TheAlchemistTab, ResultOverviewTab, EnhancedTableTab, DataAnalysisTab)
- `src/components/` - Reusable components (AppShell, AttributeGenerationDialog, AttributeSkeletonLoader, EnrichmentStatusCard, FilterCardItem, MismatchReviewBadge, MismatchReviewDialog, VelocityRecalcIndicator)
- `src/constants/` - Centralized constants per feature (9 files for each page/component)
- `src/hooks/` - Custom React hooks (13 files including useAttributeEditor, useContextFilters, useDateRange, useDebounce, useEnrichmentSSE, useFilterOptions, useOptionsManager, usePersistedSelection, useProducts, useProjectData, useTheme)
- `src/services/api/` - API client layer (8 files: client, attributes, collections, filters, products, projects, taxonomy, transactions)
- `src/styles/` - CSS Modules organized by components/ and pages/
- `src/types/` - Frontend-specific TypeScript types (5 files)
- `src/utils/` - Helper functions and utilities (7 files)
- `src/config/` - Frontend configuration (routes, etc.)

**Shared Packages:**

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
- **Caching**: Redis (optional) for 15-30x performance improvement

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
- **projects** - User projects with scope, status, and pinning support (draft/active, isPinned, pinnedAt, mismatchReviewCompleted, velocityScoresStale)
- **project_context_items** - Context articles per project: top 25 and worst 25 articles (by velocity score) when >50 total results, otherwise all matching articles (up to 50). Includes mismatch detection fields (mismatchConfidence, isExcluded)
- **generated_designs** - AI-generated design outputs with multi-image support:
  - `project_id`, `name`, `input_constraints`, `predicted_attributes`
  - `generated_images` (JSONB) - Multi-view images: `{ front: { url, status }, back: { url, status }, model: { url, status } }`
  - `generated_image_url` (legacy) - Single image URL for backward compatibility
  - `image_generation_status` - Overall status: pending/generating/completed/failed/partial
  - `created_at` - Timestamp for sorting
- **collections** - User-created collections grouping generated designs (id, user_id, name, created_at)
- **collection_items** - Junction table linking collections to generated designs (collection_id, generated_design_id)

#### Important Indexes

- `idx_transactions_article_id` on `transactions_train(article_id)`
- `idx_transactions_t_date` on `transactions_train(t_date)`
- `idx_transactions_customer_id` on `transactions_train(customer_id)`
- Performance indexes on articles table for faster filtering (see PERFORMANCE_OPTIMIZATION.md)

### Data Flow Architecture

1. **Product Selection Flow**: User selects product types from taxonomy → stored in localStorage → passed to ContextBuilder
2. **Context Builder Flow**: Configure date/season filters + attribute filters → preview context with velocity calculation → generate ontology via LLM → lock context (creates project and saves top/worst performers)
3. **Project Flow**: Project created in active status → navigate to ProjectHub
4. **LLM Enrichment Flow**: Project context items are processed in parallel (configurable concurrency) → Vision LLM extracts attributes from product images AND detects product type mismatches → enriched attributes and mismatch confidence stored in DB with SSE progress updates
5. **Mismatch Review Flow**: After enrichment, flagged items (mismatchConfidence >= 80) can be reviewed → users exclude mismatched articles → velocity scores recalculated for included items only
6. **RPT-1 Generation Flow**: User configures locked/AI attributes → calls SAP AI Core → generates 3 images sequentially (front/back/model). Excluded articles are filtered out from context.

### API Structure

The API server uses Fastify with modular routes:

#### Core Endpoints (`apps/api-lite/src/main.ts`)

- `/health` - Health check
- `/api/taxonomy` - Product type hierarchy
- `/api/transactions/count` - Count filtered transactions
- `/api/articles/count` - Count distinct articles by product type
- `/api/filters/attributes` - Dynamic filter options based on current filters
- `/api/products` - Paginated product listing with filters
- `/api/generate-attributes` - LLM-based attribute generation (uses OpenAI)

#### Project Routes (`apps/api-lite/src/routes/projects.ts`)

- `GET /api/projects` - List all projects with generated designs count and pin status
- `POST /api/projects` - Create new project (draft status)
- `GET /api/projects/:id` - Get single project by ID
- `GET /api/projects/:id/preview-context` - Calculate velocity scores for context preview (top 25 + worst 25)
- `POST /api/projects/:id/lock-context` - Lock project context and save articles with normalized velocity scores
- `DELETE /api/projects/:id` - Delete project and cleanup images from SeaweedFS
- `PATCH /api/projects/:id/pin` - Toggle project pin status (max 3 pinned)
- `GET /api/projects/:id/generated-designs` - Get all generated designs for a project
- `DELETE /api/projects/:projectId/generated-designs/:designId` - Delete specific design and its images
- `PATCH /api/projects/:projectId/generated-designs/:designId` - Update design (e.g., rename)
- `GET /api/projects/:projectId/generated-designs/:designId/image-status` - Get multi-image generation status
- `PATCH /api/projects/:id/mismatch-review` - Bulk update article exclusions and mark review complete
- `PATCH /api/projects/:id/context-items/:articleId/exclude` - Toggle single article exclusion
- `POST /api/projects/:id/recalculate-velocity` - Re-normalize velocity scores for included articles

#### Enrichment Routes (`apps/api-lite/src/routes/enrichment.ts`)

- `POST /api/projects/:id/start-enrichment` - Start enrichment for all unenriched items
- `GET /api/projects/:id/enrichment-progress` - SSE endpoint for real-time progress updates
- `GET /api/projects/:id/enrichment-status` - Get current enrichment state (for page reload recovery)
- `POST /api/projects/:id/retry-enrichment` - Retry failed enrichment items

#### Context Items Routes (`apps/api-lite/src/routes/context-items.ts`)

- `GET /api/projects/:id/context-items` - Get all context items with enrichment status, mismatch confidence, exclusion status, and mismatch summary for Enhanced Table

#### RPT-1 Routes (`apps/api-lite/src/routes/rpt1.ts`)

- `GET /api/projects/:id/rpt1-preview` - Get context row counts for RPT-1 preview
- `POST /api/projects/:id/rpt1-predict` - Execute RPT-1 prediction via SAP AI Core (generates 3 images: front/back/model). Excludes articles marked as excluded from context.

#### Collections Routes (`apps/api-lite/src/routes/collections.ts`)

- `GET /api/collections` - List user collections with item counts and preview images (currently using mock data)

#### Design Name Routes (`apps/api-lite/src/routes/design-name.ts`)

- `POST /api/generate-design-name` - LLM-based creative name generation for designs

### Frontend Structure

The frontend (`apps/web/src/`) uses:

- **Routing**: React Router 7 with pages in `src/pages/`
- **UI Components**: SAP UI5 Web Components (@ui5/webcomponents-react)
- **State**: Local state + localStorage for persistence
- **API Communication**: Fetch API with manual state management

#### Key Components (`src/components/`)

- `AppShell.tsx` - Unified SAP Fiori-style shell wrapper with header (ShellBar), logo, search, notifications popover, and user profile popover with menu. Wraps all pages via App.tsx.
- `AttributeGenerationDialog.tsx` - LLM attribute generation UI with conversation history
- `AttributeSkeletonLoader.tsx` - Loading skeleton for attribute cards
- `EnrichmentStatusCard.tsx` - Status card for enrichment monitoring
- `FilterCardItem.tsx` - Reusable filter card component
- `MismatchReviewBadge.tsx` - Clickable badge showing flagged item count and review status (red=needs review, green=reviewed)
- `MismatchReviewDialog.tsx` - Modal dialog for reviewing flagged articles with bulk include/exclude actions
- `VelocityRecalcIndicator.tsx` - Warning indicator shown when velocity scores are stale after exclusion changes

#### Key Pages (`src/pages/`)

- `Home.tsx` - Dashboard with searchable/paginated projects table (with pin/delete actions) and collections grid
- `ProductSelection.tsx` - Product type taxonomy browser
- `ContextBuilder.tsx` - **New unified page** for context configuration, filter preview, attribute generation, and project creation (replaces Analysis.tsx workflow)
- `ProjectHub.tsx` - Project workspace hub with tabbed navigation (see below)
- `DesignDetail.tsx` - Individual design detail view with:
  - Multi-image support (front/back/model views) with thumbnail strip
  - Collapsible attribute panels (Predicted Attributes expanded, Given Attributes collapsed by default)
  - Magic name generation via LLM (sparkle button)
  - Image download functionality per view
  - Full-size image modal with zoom
  - "Refine Design" button that navigates to TheAlchemistTab with pre-populated attributes
  - Real-time polling for image generation status

#### ProjectHub Page (`/project/:projectId`)

The ProjectHub is the main workspace for working with a project after it's created. It features:

- **Header**: Project name, status badge (ACTIVE), enrichment progress indicator, mismatch review badge (when flagged items exist), and velocity recalculation indicator (when scores are stale)
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
   - **Stale Velocity Warning**: Shows warning dialog if velocity scores are stale before transmutation
   - **Refine Design Flow**: Supports `?refineFrom=<designId>` URL parameter to pre-populate attributes from an existing design (locked attributes stay locked, predicted become AI variables)
2. **ResultOverviewTab** - Generated designs display
   - Paginated list of generated designs with search
   - Shows design name, given/predicted attributes preview, front image thumbnail
   - Supports multi-image format (uses `generatedImages.front` with fallback to legacy `generatedImageUrl`)
   - Delete and rename functionality for designs
3. **EnhancedTableTab** - Context items table with enrichment monitoring
   - Displays all project context items joined with article data
   - Shows enrichment status (successful/pending/failed) per item
   - **Include checkbox column**: Toggle article inclusion/exclusion from RPT-1 context
   - **Match Confidence column**: Shows mismatch likelihood (Likely match/Possible mismatch/Likely mismatch/Very likely mismatch) with color coding
   - Collapsible control panel with status summary and retry controls
   - Filter chips (All/Successful/Pending/Failed) for quick filtering
   - Sortable columns (velocity score, article ID, product type, match confidence)
   - Dynamic columns for LLM-enriched attributes from ontology schema
   - Image thumbnails with fallback placeholder on load error
   - Single item retry and bulk "Retry All Failed" functionality
   - CSV export with all base and enriched attributes
   - Processing row highlight animation during active enrichment
   - **Excluded row styling**: Red tint and reduced opacity for excluded articles
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

- **Projects Table**: Displays all user projects with status (Ready/Processing), name, time period, product group, generated products count, and pin/delete actions. Supports search filtering and pagination (5 items per page). Pinned projects appear at the top (max 3 pins).
- **Collections Section**: Shows user collections as cards with 2x2 image thumbnail grids. Only visible when collections exist. Images fall back to product icons when unavailable. **Note: Currently using mock data.**

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

#### Product Type Mismatch Detection

During Vision LLM enrichment, the system also detects potential product type mismatches:

**Mismatch Confidence Scores (0-100):**
- 0-59: "Likely match" - Image matches expected product type
- 60-79: "Possible mismatch" - Questionable, could fit but uncertain
- 80-89: "Likely mismatch" - Probably a different product type
- 90-100: "Very likely mismatch" - Clearly different category

**Review Workflow:**
1. After enrichment completes, flagged items (confidence >= 80) trigger the mismatch review badge
2. Users click the badge to open the review dialog showing all flagged items
3. Users can include/exclude individual items or use bulk actions
4. On confirm, exclusions are saved and velocity scores are automatically recalculated

**Velocity Score Recalculation:**
- When articles are excluded via the Enhanced Table checkbox, `velocityScoresStale` is set to true
- The VelocityRecalcIndicator shows a warning with a "Recalculate" button
- Recalculation re-normalizes velocity scores among included items only (does not re-query transactions)
- TheAlchemistTab shows a warning dialog if trying to transmute with stale velocity scores

#### Project Lifecycle

1. **Product Selection**: User selects product types from taxonomy
2. **Context Builder**: User configures date/season filters, attribute filters, previews context, generates ontology attributes via LLM, then clicks "Confirm & Create Project"
3. **Lock Context**: System creates project (active status), calculates velocity scores for all matching articles
   - If >50 articles match: selects top 25 and worst 25 by velocity score
   - If ≤50 articles match: includes all matching articles
   - Normalizes velocity scores to 0-100 scale
   - Saves articles to `project_context_items` with normalized scores
   - Saves `ontologySchema` to project
   - Redirects to ProjectHub
4. **Active Status**: Context is locked, user can now enrich attributes and generate designs via RPT-1

**Important**: Navigation to ProjectHub happens **after** lock-context completes to ensure `ontologySchema` is available when TheAlchemistTab loads. This prevents a race condition where the tab would only show article attributes without ontology attributes.

### Environment Configuration

Required environment variables (see `.env.example`):

```
# Database
PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

# API
API_PORT (default: 3001)
API_HOST (default: 0.0.0.0)

# Redis Cache (optional)
REDIS_URL (e.g., redis://localhost:6379)

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

1. Create or update route file in `apps/api-lite/src/routes/`
2. Register route in `apps/api-lite/src/main.ts` using `fastify.register()`
3. Define request/response types in `packages/types/src/`
4. Add database queries in `packages/db/src/queries/` if needed
5. Use parameterized queries for all user input to prevent SQL injection

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
5. Add UI controls in `apps/web/src/pages/ContextBuilder.tsx`

## Testing & Validation

### Manual Testing Workflow

1. Ensure database port forwarding is active
2. Start API server and verify `/health` endpoint responds
3. Start web app and verify it loads at http://localhost:5173
4. Test product selection → context builder → project creation flow
5. Test enrichment → RPT-1 generation flow

### Database Connection Testing

```bash
# Test direct connection
psql -h localhost -p 5432 -U postgres -d fashion_db

# Test API connection
curl http://localhost:3001/health
```

## Project Phases

The system is being built in phases (see docs/PRD.md):

- **Phase 1 (COMPLETE)**: Product analysis with filtering and pagination (now integrated into ContextBuilder)
- **Phase 2 (COMPLETE)**: LLM-based attribute enrichment for top performers
- **Phase 3 (COMPLETE)**: RPT-1 inverse design engine for predicting attributes
  - Three-column attribute management (Locked/AI/Not Included)
  - Success score targeting (0-100%)
  - SAP AI Core integration with OAuth2 authentication
  - Velocity-based context with normalized scores
- **Phase 4 (IN PROGRESS)**: AI image generation for design visualization
  - Multi-image generation: front, back, and model views (sequential generation)
  - Per-view status tracking with real-time polling
  - Design detail page with collapsible attribute panels
  - Magic name generation via LLM
  - Image download functionality
  - Refine Design flow (pre-populate TheAlchemistTab from existing design)
  - Project management (pin/delete projects)
  - Design management (delete/rename designs)

Current focus is on UI polish, collections implementation, and additional image generation features.

## Key Architecture Changes

### Recent Updates

1. **ContextBuilder Page**: Unified page replacing the previous Analysis page workflow. Combines product filtering, context preview, attribute generation, and project creation in a single streamlined interface.
2. **Project Pinning**: Users can pin up to 3 projects to the top of the projects list for quick access.
3. **Multi-Image Generation**: Designs now support 3 views (front/back/model) generated sequentially via SAP AI Core.
4. **Design Management**: Users can delete and rename generated designs directly from ResultOverviewTab.
5. **Modular API Routes**: API routes are now organized in separate files under `apps/api-lite/src/routes/` for better maintainability.
6. **Product Type Mismatch Detection**: Vision LLM now detects potential product type mismatches during enrichment. Flagged items can be reviewed and excluded from the RPT-1 context. Features include:
   - Mismatch confidence scoring (0-100) with labeled categories
   - MismatchReviewBadge in ProjectHub header (red=needs review, green=reviewed)
   - MismatchReviewDialog for bulk review of flagged items
   - Include/exclude checkbox column in EnhancedTableTab
   - Match Confidence column with color-coded labels
   - Automatic velocity score recalculation when exclusions change
   - VelocityRecalcIndicator for stale score warnings
   - Stale velocity warning in TheAlchemistTab before transmutation

### Known Technical Debt

1. **Mock Collections**: Collections feature uses mock data (see docs/CollectionMock.md)
2. **Hardcoded User**: `userId` defaults to `'00000000-0000-0000-0000-000000000000'`
3. **No JSONB Validation**: Database accepts any JSON structure without schema validation
4. **SeaweedFS Dependency**: Images require port-forwarding for local dev
