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
- `src/services/` - Service layer:
  - `cache.ts` - Redis caching service
  - `enrichment.ts` - Vision LLM enrichment processing
  - `imageGeneration.ts` - Z-Image Turbo API integration
  - `promptGeneration.ts` - LLM-based image prompt generation (NEW)
  - `salesTextGeneration.ts` - LLM-based sales text generation
  - `s3.ts` - S3/SeaweedFS image storage

**Frontend (`apps/web/`):**

- `public/` - Static assets (logo.svg)
- `src/pages/` - Page components (Home, ProductSelection, ContextBuilder, ProjectHub, DesignDetail)
- `src/pages/tabs/` - ProjectHub tab components (TheAlchemistTab, ResultOverviewTab, EnhancedTableTab, DataAnalysisTab)
- `src/components/` - Reusable components (AppShell, AttributeGenerationDialog, AttributeSkeletonLoader, EnrichmentStatusCard, FilterCardItem, HelpDialog)
- `src/constants/` - Centralized constants per feature
- `src/hooks/` - Custom React hooks
- `src/services/api/` - API client layer
- `src/styles/` - CSS Modules organized by components/ and pages/
- `src/types/` - Frontend-specific TypeScript types
- `src/utils/` - Helper functions and utilities
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
- **AI Integration**:
  - OpenAI/GPT-4.1 via LiteLLM proxy for attribute generation and image prompts
  - SAP AI Core for RPT-1 predictions
  - Z-Image Turbo for image generation
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
- **projects** - User projects with scope, status, and pinning support:
  - `id`, `user_id`, `name`, `status` (draft/active)
  - `scope_config` (JSONB) - Product type selection
  - `season_config` (JSONB) - Date/season filtering
  - `ontology_schema` (JSONB) - LLM-generated attribute definitions
  - Enrichment tracking: `enrichment_status`, `enrichment_processed`, `enrichment_total`
  - Pinning: `is_pinned`, `pinned_at`
  - Mismatch review: `mismatch_review_completed`, `velocity_scores_stale`
- **project_context_items** - Context articles per project:
  - `project_id`, `article_id` (composite PK)
  - `velocity_score` (normalized 0-100), `raw_velocity_score`
  - `enriched_attributes` (JSONB) - Vision LLM extracted attributes
  - `enrichment_error` - Error message if enrichment failed
  - `mismatch_confidence` (0-100) - Product type mismatch likelihood
  - `is_excluded`, `original_is_excluded` - Exclusion tracking
- **generated_designs** - AI-generated design outputs:
  - `project_id`, `name`, `input_constraints`, `predicted_attributes`
  - `generated_images` (JSONB) - Multi-view images: `{ front: { url, status }, back: { url, status }, model: { url, status } }`
  - `generated_image_url` (legacy) - Single image URL for backward compatibility
  - `image_generation_status` - Overall status: pending/generating/completed/failed/partial
  - `sales_text`, `sales_text_generation_status` - Generated marketing copy
  - `created_at` - Timestamp for sorting
- **collections** - User-created collections (id, user_id, name, created_at)
- **collection_items** - Junction table linking collections to generated designs

#### Important Indexes

- `idx_transactions_article_id` on `transactions_train(article_id)`
- `idx_transactions_t_date` on `transactions_train(t_date)`
- `idx_transactions_customer_id` on `transactions_train(customer_id)`

### Data Flow Architecture

1. **Product Selection Flow**: User selects product types from taxonomy → stored in localStorage → passed to ContextBuilder
2. **Context Builder Flow**: Configure date/season filters + attribute filters → preview context with velocity calculation → generate ontology via LLM → lock context (creates project and saves top/worst performers)
3. **Project Flow**: Project created in active status → navigate to ProjectHub
4. **LLM Enrichment Flow**: Project context items are processed in parallel (configurable concurrency) → Vision LLM extracts attributes from product images AND detects product type mismatches → enriched attributes and mismatch confidence stored in DB with SSE progress updates
5. **Mismatch Review Flow**: After enrichment, flagged items (mismatchConfidence >= 80) can be reviewed → users exclude mismatched articles → velocity scores recalculated for included items only
6. **RPT-1 Generation Flow**:
   - User configures locked/AI attributes in TheAlchemistTab
   - Frontend sends: `lockedAttributes`, `aiVariables`, `successScore`, `contextAttributes` (auto-excluded attributes)
   - Backend calls SAP AI Core RPT-1 for attribute prediction
   - LLM generates view-specific image prompts (front/back/model)
   - Z-Image Turbo generates 3 images sequentially
   - Images uploaded to S3/SeaweedFS

### API Structure

The API server uses Fastify with modular routes:

#### Core Endpoints (`apps/api-lite/src/main.ts`)

- `/health` - Health check
- `/api/taxonomy` - Product type hierarchy
- `/api/transactions/count` - Count filtered transactions
- `/api/articles/count` - Count distinct articles by product type
- `/api/filters/attributes` - Dynamic filter options based on current filters
- `/api/products` - Paginated product listing with filters
- `/api/generate-attributes` - LLM-based ontology attribute generation

#### Project Routes (`apps/api-lite/src/routes/projects.ts`)

- `GET /api/projects` - List all projects with generated designs count and pin status
- `POST /api/projects` - Create new project (draft status)
- `GET /api/projects/:id` - Get single project by ID
- `GET /api/projects/:id/preview-context` - Calculate velocity scores for context preview
- `POST /api/projects/:id/lock-context` - Lock project context and save articles
- `DELETE /api/projects/:id` - Delete project and cleanup images
- `PATCH /api/projects/:id/pin` - Toggle project pin status (max 3 pinned)
- `GET /api/projects/:id/generated-designs` - Get all generated designs
- `DELETE /api/projects/:projectId/generated-designs/:designId` - Delete design
- `PATCH /api/projects/:projectId/generated-designs/:designId` - Update design (rename)
- `GET /api/projects/:projectId/generated-designs/:designId/image-status` - Get image status
- `PATCH /api/projects/:id/mismatch-review` - Bulk update article exclusions
- `PATCH /api/projects/:id/context-items/:articleId/exclude` - Toggle single exclusion
- `POST /api/projects/:id/recalculate-velocity` - Re-normalize velocity scores

#### Enrichment Routes (`apps/api-lite/src/routes/enrichment.ts`)

- `POST /api/projects/:id/start-enrichment` - Start enrichment
- `GET /api/projects/:id/enrichment-progress` - SSE endpoint for progress
- `GET /api/projects/:id/enrichment-status` - Get current state
- `POST /api/projects/:id/retry-enrichment` - Retry failed items

#### Context Items Routes (`apps/api-lite/src/routes/context-items.ts`)

- `GET /api/projects/:id/context-items` - Get all context items with enrichment status

#### RPT-1 Routes (`apps/api-lite/src/routes/rpt1.ts`)

- `GET /api/projects/:id/rpt1-preview` - Get context row counts
- `POST /api/projects/:id/rpt1-predict` - Execute RPT-1 prediction with image generation
  - Request body includes: `lockedAttributes`, `aiVariables`, `successScore`, `contextAttributes`
  - `contextAttributes` contains auto-excluded attributes (single-variant) for image prompt context

#### Collections Routes (`apps/api-lite/src/routes/collections.ts`)

- `GET /api/collections` - List user collections (currently using mock data)

#### Design Name Routes (`apps/api-lite/src/routes/design-name.ts`)

- `POST /api/generate-design-name` - LLM-based name generation

### Image Generation System

#### Architecture

```
RPT-1 Prediction
       │
       ▼
promptGeneration.ts
├── preprocessAttributes() - Extract product type, category, customer segment
├── generateImagePromptsWithFallback() - LLM call with retry + fallback
└── Returns { front, back, model } prompts
       │
       ▼
imageGeneration.ts
├── generateImageWithRetry() - Call Z-Image Turbo API
└── Returns image buffer
       │
       ▼
s3.ts
├── uploadGeneratedImageForViewWithRetry() - Upload to SeaweedFS
└── Returns public URL
```

#### Prompt Generation (`apps/api-lite/src/services/promptGeneration.ts`)

The LLM-based prompt generation system:

1. **Preprocessing**: Extracts product type from ontology keys or `article_product_type`, determines product category (Upper Body, Lower Body, Full Body, Footwear, Accessory), and infers model gender from customer segment
2. **LLM Call**: GPT-4.1 generates view-specific prompts following Z-Image Turbo best practices
3. **Fallback**: If LLM fails after 2 retries, uses static template-based prompts

**View-Specific Rules**:
- **Front**: Ghost mannequin (garments) or flat lay (pants/bottoms)
- **Back**: Excludes front-only features (buttons, lapels, neckline)
- **Model**: Adds complementary garments based on product category

**Product Category Mapping**: Hardcoded map from product type → category (Upper Body, Lower Body, etc.)

### Frontend Structure

The frontend (`apps/web/src/`) uses:

- **Routing**: React Router 7 with pages in `src/pages/`
- **UI Components**: SAP UI5 Web Components (@ui5/webcomponents-react)
- **State**: Local state + localStorage for persistence
- **API Communication**: Fetch API with manual state management

#### Key Pages

- `Home.tsx` - Dashboard with projects table and collections grid
- `ProductSelection.tsx` - Product type taxonomy browser
- `ContextBuilder.tsx` - Context configuration and project creation
- `ProjectHub.tsx` - Project workspace with tabbed navigation
- `DesignDetail.tsx` - Design detail view with multi-image support

#### ProjectHub Tabs

1. **TheAlchemistTab** - Transmutation Parameters configuration
   - Three-column layout: Locked Attributes | AI Variables | Not Included
   - Auto-excluded attributes (single variant) are hidden but sent as `contextAttributes`
   - Success Score slider (0-100%)
   - "Transmute" button triggers RPT-1 + image generation

2. **ResultOverviewTab** - Generated designs display with pagination

3. **EnhancedTableTab** - Context items table with enrichment monitoring
   - Include/exclude checkbox column
   - Match confidence column with color coding
   - Expandable rows for full details

4. **DataAnalysisTab** - Placeholder

### Important Implementation Details

#### Attribute Categories

Attributes in TheAlchemistTab have three categories:
- **LOCKED**: User-specified values sent to RPT-1 query row
- **AI**: Attributes for RPT-1 to predict (marked as `[PREDICT]`)
- **NOT_INCLUDED**: Excluded from RPT-1 (may be auto-excluded if single variant)

Auto-excluded attributes (single variant) are:
- Marked with `autoExcluded: true`
- Hidden from UI
- Sent via `contextAttributes` parameter for image prompt generation
- NOT used in RPT-1 context building

#### Velocity Score Calculation

**Formula:** `Velocity = Transaction Count / Days Available`

**Normalization:** At lock time, normalized to 0-100:
- `normalized = (score - min) / (max - min) * 100`

**Usage in RPT-1:** Sent as `success_score` (first column) to target specific performance levels.

#### Product Type Mismatch Detection

During Vision LLM enrichment:
- **0-59**: "Likely match"
- **60-79**: "Possible mismatch"
- **80-89**: "Likely mismatch"
- **90-100**: "Very likely mismatch"

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

# LLM Integration (for ontology generation and image prompts)
LLM_API_URL, LLM_API_KEY, LLM_MODEL

# Vision LLM (for data enrichment)
LITELLM_PROXY_URL, LITELLM_API_KEY, VISION_LLM_MODEL

# Enrichment Processing
ENRICHMENT_CONCURRENCY (default: 5)
ENRICHMENT_PROGRESS_INTERVAL_MS (default: 500)

# RPT-1 / SAP AI Core
AI_API_URL, AUTH_URL, CLIENT_ID, CLIENT_SECRET, RESOURCE_GROUP

# Image Generation (Z-Image Turbo)
IMAGE_GEN_TOKEN_URL, IMAGE_GEN_CLIENT_ID, IMAGE_GEN_CLIENT_SECRET
IMAGE_GEN_API_URL, IMAGE_GEN_WIDTH, IMAGE_GEN_HEIGHT

# S3/SeaweedFS
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

The monorepo enforces Drizzle ORM version 0.29.5 via pnpm overrides.

## Common Development Patterns

### Adding a New API Endpoint

1. Create or update route file in `apps/api-lite/src/routes/`
2. Register route in `apps/api-lite/src/main.ts` using `fastify.register()`
3. Define request/response types in `packages/types/src/`
4. Add database queries in `packages/db/src/queries/` if needed
5. Use parameterized queries for all user input

### Adding a New Database Table

1. Define schema in `packages/db/src/schema/[table-name].ts`
2. Export from `packages/db/src/schema/index.ts`
3. Run `pnpm db:generate` to create migration
4. Run `pnpm db:migrate` to apply migration
5. Export query functions from `packages/db/src/index.ts`

### Adding a New Filter Attribute

1. Add column to articles table schema
2. Update `/api/filters/attributes` endpoint
3. Update `/api/products` endpoint
4. Update `FiltersResponse` type
5. Add UI controls in ContextBuilder

## Project Phases

- **Phase 1 (COMPLETE)**: Product analysis with filtering and pagination
- **Phase 2 (COMPLETE)**: LLM-based attribute enrichment
- **Phase 3 (COMPLETE)**: RPT-1 inverse design engine
- **Phase 4 (IN PROGRESS)**: AI image generation
  - Multi-image generation (front/back/model) ✅
  - LLM-based prompt generation ✅
  - Design detail page ✅
  - Magic name generation ✅
  - Project/design management ✅
  - Collections (mock data only)

## Key Architecture Changes

### Recent Updates

1. **LLM-Based Image Prompt Generation**: New `promptGeneration.ts` service generates optimized prompts for Z-Image Turbo using GPT-4.1
2. **Context Attributes**: Auto-excluded attributes (single variant) are now sent to the API for image generation context
3. **View-Specific Prompts**: Different photography styles for different views (ghost mannequin vs flat lay)
4. **Product Category Awareness**: Automatic determination of product category for appropriate styling

### Known Technical Debt

1. **Mock Collections**: Collections feature uses mock data
2. **Hardcoded User**: `userId` defaults to `'00000000-0000-0000-0000-000000000000'`
3. **No JSONB Validation**: Database accepts any JSON structure
4. **SeaweedFS Dependency**: Images require port-forwarding for local dev
