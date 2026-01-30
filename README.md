# Fashion Trend Alchemist

A TypeScript-based AI-powered fashion analytics platform for analyzing product trends and generating design attributes for future best-sellers.

## 📊 Current Status

**All Core Phases Complete! 🎉**

The application currently provides:

- **Phase 1 (✅ COMPLETE)**: Product Analysis
  - Product type selection and taxonomy browsing
  - Context builder with advanced filtering
  - Date range and seasonal filtering
  - Dynamic attribute filtering with real-time updates
- **Phase 2 (✅ COMPLETE)**: LLM-based Attribute Enrichment
  - Vision LLM extracts structured attributes from product images
  - Parallel processing with configurable concurrency
  - Real-time progress monitoring via SSE
  - Retry mechanism for failed enrichments
- **Phase 3 (✅ COMPLETE)**: RPT-1 Inverse Design Engine
  - Three-column attribute management (Locked/AI/Not Included)
  - Success score targeting (0-100%)
  - SAP AI Core integration with OAuth2 authentication
  - Velocity-based context with normalized scores
- **Phase 4 (🚧 IN PROGRESS)**: AI Image Generation
  - Multi-image generation (front/back/model views)
  - Per-view status tracking with real-time polling
  - Design detail page with attribute panels
  - Magic name generation via LLM
  - Project and design management (pin/delete/rename)

---

## 🏗️ Architecture

### Monorepo Structure

```
fashion-trend-alchemist/
├── apps/
│   ├── web/              # React + Vite frontend (SAP UI5 Web Components)
│   │   ├── public/
│   │   │   └── logo.svg                        # Application logo
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx                    # Dashboard with projects & collections
│   │       │   ├── ProductSelection.tsx         # Product type taxonomy browser
│   │       │   ├── ContextBuilder.tsx           # Context config & project creation
│   │       │   ├── ProjectHub.tsx               # Project workspace with tabs
│   │       │   ├── DesignDetail.tsx             # Design detail with multi-image
│   │       │   └── tabs/                        # ProjectHub tab components
│   │       │       ├── TheAlchemistTab.tsx      # RPT-1 attribute configuration
│   │       │       ├── ResultOverviewTab.tsx    # Generated designs list
│   │       │       ├── EnhancedTableTab.tsx     # Enrichment monitoring
│   │       │       └── DataAnalysisTab.tsx      # Placeholder
│   │       ├── components/
│   │       │   ├── AppShell.tsx                        # SAP Fiori shell wrapper
│   │       │   ├── AttributeGenerationDialog.tsx       # LLM attribute generation
│   │       │   ├── AttributeSkeletonLoader.tsx         # Loading skeleton
│   │       │   ├── CollectionPreviewDialog.tsx         # Collection preview with designs
│   │       │   ├── CreateCollectionDialog.tsx          # Create new collection
│   │       │   ├── EnrichmentStatusCard.tsx            # Enrichment status card
│   │       │   ├── FilterCardItem.tsx                  # Reusable filter card
│   │       │   ├── HelpDialog.tsx                      # Context-sensitive help dialog
│   │       │   └── SaveToCollectionPopover.tsx         # Save design to collection
│   │       ├── constants/                       # Centralized constants per feature
│   │       │   ├── appShell.ts                  # App shell navigation & UI constants
│   │       │   ├── attributeDialog.ts           # Attribute generation dialog constants
│   │       │   ├── contextBuilder.ts            # Context builder page constants
│   │       │   ├── enhancedTableTab.ts          # Enhanced table tab constants
│   │       │   ├── home.ts                      # Home page constants
│   │       │   ├── productSelection.ts          # Product selection constants
│   │       │   ├── projectHub.ts                # Project hub constants
│   │       │   ├── resultOverviewTab.ts         # Result overview tab constants
│   │       │   ├── skeletonLoader.ts            # Skeleton loader constants
│   │       │   └── theAlchemistTab.ts           # The Alchemist tab constants
│   │       ├── hooks/                           # Custom React hooks
│   │       │   ├── useAttributeEditor.ts        # Attribute editing logic
│   │       │   ├── useContextFilters.ts         # Context filter state management
│   │       │   ├── useDateRange.ts              # Date range validation & state
│   │       │   ├── useDebounce.ts               # Debounce hook for inputs
│   │       │   ├── useEnrichmentSSE.ts          # SSE enrichment progress tracking
│   │       │   ├── useFilterOptions.ts          # Dynamic filter options fetching
│   │       │   ├── useOptionsManager.ts         # Attribute options management
│   │       │   ├── usePersistedSelection.ts     # localStorage persistence
│   │       │   ├── useProducts.ts               # Product data fetching
│   │       │   ├── useProjectData.ts            # Project data management
│   │       │   └── useTheme.ts                  # Theme management
│   │       ├── services/
│   │       │   └── api/                         # API client layer
│   │       │       ├── client.ts                # Base fetch client
│   │       │       ├── index.ts                 # Aggregated API exports
│   │       │       ├── attributes.ts            # Attribute generation endpoints
│   │       │       ├── collections.ts           # Collections endpoints
│   │       │       ├── filters.ts               # Filter options endpoints
│   │       │       ├── products.ts              # Product listing endpoints
│   │       │       ├── projects.ts              # Project CRUD endpoints
│   │       │       ├── taxonomy.ts              # Taxonomy endpoints
│   │       │       └── transactions.ts          # Transaction endpoints
│   │       ├── styles/                          # CSS Modules
│   │       │   ├── components/                  # Component-specific styles
│   │       │   │   ├── AppShell.module.css
│   │       │   │   ├── AttributeGenerationDialog.module.css
│   │       │   │   └── AttributeSkeletonLoader.module.css
│   │       │   └── pages/                       # Page-specific styles
│   │       │       ├── ContextBuilder.module.css
│   │       │       ├── EnhancedTableTab.module.css
│   │       │       ├── Home.module.css
│   │       │       ├── ProductSelection.module.css
│   │       │       ├── ProjectHub.module.css
│   │       │       ├── ResultOverviewTab.module.css
│   │       │       └── TheAlchemistTab.module.css
│   │       ├── types/                           # Frontend-specific types
│   │       │   ├── index.ts                     # Type exports
│   │       │   ├── api.ts                       # API response types
│   │       │   ├── enhancedTableTab.ts          # Enhanced table types
│   │       │   ├── resultOverviewTab.ts         # Result overview types
│   │       │   └── theAlchemistTab.ts           # The Alchemist types
│   │       ├── utils/                           # Helper functions
│   │       │   ├── attributeFormatting.ts       # Attribute display formatting
│   │       │   ├── dateValidation.ts            # Date validation logic
│   │       │   ├── enhancedTableHelpers.ts      # Enhanced table utilities
│   │       │   ├── projectTransformers.ts       # Project data transformers
│   │       │   ├── resultOverviewHelpers.ts     # Result overview utilities
│   │       │   ├── theAlchemistHelpers.ts       # The Alchemist utilities
│   │       │   └── urlParams.ts                 # URL parameter helpers
│   │       ├── config/                          # Frontend configuration
│   │       │   ├── index.ts                     # Config exports
│   │       │   └── routes.ts                    # Route definitions
│   │       ├── App.tsx                          # Root app component
│   │       ├── main.tsx                         # Entry point
│   │       └── vite-env.d.ts                    # Vite type definitions
│   └── api-lite/         # Fastify backend API
│       └── src/
│           ├── main.ts                # Main API server with core endpoints
│           ├── constants.ts           # Backend constants
│           ├── routes/                # Modular API routes
│           │   ├── projects.ts        # Project CRUD & context management
│           │   ├── enrichment.ts      # Vision LLM enrichment
│           │   ├── rpt1.ts            # RPT-1 predictions via SAP AI Core
│           │   ├── context-items.ts   # Context items with enrichment status
│           │   ├── collections.ts     # Collections (mock data)
│           │   └── design-name.ts     # LLM-based name generation
│           └── services/
│               ├── cache.ts           # Redis caching layer
│               ├── enrichment.ts      # Vision LLM service
│               ├── imageGeneration.ts # SAP AI Core image generation
│               └── s3.ts              # SeaweedFS/S3 storage
├── packages/
│   ├── db/               # Database schemas, queries (Drizzle ORM)
│   │   └── src/
│   │       ├── schema/   # Database table definitions
│   │       └── queries/  # Reusable query functions
│   ├── types/            # Shared TypeScript types and Zod schemas
│   └── config/           # Configuration and environment handling
└── docs/                 # Documentation (PRD, data model, etc.)
```

### Technology Stack

- **Frontend**: React 18 + Vite + SAP UI5 Web Components for React
- **Backend**: Node.js 18+ with Fastify (modular routes)
- **Database**: PostgreSQL 16 (cloud-hosted with port forwarding)
- **ORM**: Drizzle ORM 0.29.5 with type-safe queries
- **Caching**: Redis (optional, 15-30x performance boost)
- **AI Integration**:
  - OpenAI API for LLM text generation (ontology, names)
  - LiteLLM proxy for Vision LLM (data enrichment)
  - SAP AI Core for RPT-1 predictions and image generation
- **Storage**: SeaweedFS/S3 for generated images
- **Package Manager**: pnpm (workspaces for monorepo)
- **Language**: TypeScript (strict mode)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Access to PostgreSQL database (cloud or local)
- Redis (optional, for caching)
- OpenAI API key
- SAP AI Core credentials

### Quick Setup

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd fashion-trend-alchemist
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   ```

3. **Build packages**

   ```bash
   pnpm build
   ```

4. **Start the application**

   ```bash
   # Terminal 1: API Server
   cd apps/api-lite && pnpm run dev

   # Terminal 2: Web App
   cd apps/web && pnpm run dev
   ```

5. **Access the application**
   - Web: http://localhost:5173
   - API: http://localhost:3001

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

---

## 🎨 Features

### 1. Home Dashboard

- **Projects Table**:
  - Displays all projects with status, time period, product group, and generated designs count
  - Search filtering and pagination (5 items per page)
  - Pin up to 3 projects to the top for quick access
  - Delete projects (with automatic image cleanup)
- **Collections Grid**:
  - Visual 2x2 image thumbnail grid per collection
  - Currently using mock data (see docs/CollectionMock.md)

### 2. Product Selection

- **Taxonomy Browser**: Navigate product types organized by groups
- **Multi-Select**: Choose multiple product types for analysis
- **Visual Interface**: Card-based UI with icons and descriptions
- **Persistence**: Selection saved to localStorage

### 3. Context Builder (Unified Workflow)

**New unified page combining filtering, preview, and project creation**

#### Date & Season Filtering

- **Custom Date Range**: DD/MM format inputs with smart validation
  - Month-specific day limits (Feb: 28, Apr/Jun/Sep/Nov: 30, others: 31)
  - Real-time validation with visual feedback
- **Season Quick Select**: Spring, Summer, Autumn, Winter buttons
- **Cross-year support**: Filters transactions across all years for selected dates

#### Multi-Attribute Filtering

- **8 Filter Categories**:
  - Pattern/Style, Specific Color, Color Intensity, Color Family
  - Product Family, Customer Segment, Style Concept, Fabric Type
- **Multi-Select Dialogs**: Checkbox-based selection with "Apply" action
- **Dynamic Options**: Filter options update based on current dataset
- **Active Filter Count**: Shows number of applied filters

#### Context Preview Table

- **Real-time Preview**: See matching articles as you adjust filters
- **Smart Column Ordering**: Priority attributes first, detail description last
- **Pagination**: 10 products per page with navigation
- **Performance**: Optimized with database indexes

#### Attribute Generation

- **LLM-Powered**: Generate structured attribute definitions for selected product types
- **Interactive Dialog**: Provide feedback to refine attributes
- **Conversation History**: Iterative refinement with context
- **Required Step**: Must generate attributes before creating project

#### Project Creation

- **One-Click Create**: "Confirm & Create Project" button
- **Velocity Calculation**: System calculates top 25 + worst 25 performers (or all if ≤50)
- **Normalized Scores**: Velocity scores normalized to 0-100 scale
- **Auto-Navigate**: Redirects to ProjectHub after successful creation

### 4. Project Hub (Workspace)

Main workspace with 4 tabs for different workflows:

#### Tab 1: The Alchemist (RPT-1 Configuration)

- **Three-Column Layout**: Locked Attributes | AI Variables | Not Included
- **Attribute Sources**:
  - Article attributes from database (product_type, color_family, etc.)
  - Ontology attributes from LLM generation
- **AI Variable Limit**: Maximum 10 variables (RPT-1 Large constraint)
- **Success Score Slider**: Target performance level (0-100%)
- **Preview Request**: Shows context summary and query structure
- **Transmute Button**: Executes RPT-1 prediction via SAP AI Core
- **Refine Design Flow**: Pre-populate from existing design via URL parameter

#### Tab 2: Result Overview (Generated Designs)

- **Design List**: Paginated view of all generated designs
- **Search**: Filter designs by name
- **Multi-Image Support**: Shows front view thumbnail (with back/model support)
- **Actions**: Delete and rename designs
- **Click to View**: Navigate to DesignDetail page

#### Tab 3: Enhanced Table (Enrichment Monitoring)

- **Context Items Table**: All project context items with enrichment status
- **Collapsible Control Panel**: Status summary and retry controls
- **Filter Chips**: All/Successful/Pending/Failed quick filters
- **Sortable Columns**: Velocity score, article ID, product type
- **Dynamic Columns**: LLM-enriched attributes from ontology
- **Image Thumbnails**: With fallback placeholder on error
- **Expandable Rows**: Click to see full details (accordion behavior)
- **Image Modal**: Full-size image viewer
- **CSV Export**: Export all data including enriched attributes
- **Retry Functionality**: Single item or bulk "Retry All Failed"
- **Real-time Updates**: 5-second polling during enrichment
- **Color-coded Scores**: Green (≥70), gray (40-69), red (<40)

#### Tab 4: Data Analysis (Placeholder)

- Future analytics and insights features

### 5. Design Detail Page

- **Multi-Image Display**: Front, back, and model views with thumbnail strip
- **Collapsible Panels**:
  - Predicted Attributes (expanded by default)
  - Given Attributes (collapsed by default)
- **Magic Name Generation**: LLM-powered creative naming with sparkle button
- **Image Download**: Download functionality per view
- **Full-size Modal**: Click to zoom any image
- **Refine Design**: Button to navigate to TheAlchemistTab with pre-populated attributes
- **Real-time Polling**: Updates image generation status automatically

---

## 🗄️ Database Schema

### Core Tables

#### Articles (Static Product Catalog)

```sql
article_id          VARCHAR PRIMARY KEY
product_type        VARCHAR    -- Dress, Sweater, etc.
product_group       VARCHAR    -- Garment Upper body, etc.
product_family      VARCHAR    -- Knitwear, Trouser, etc.
style_concept       VARCHAR    -- Contemporary Smart, etc.
pattern_style       VARCHAR    -- Solid, Check, etc.
specific_color      VARCHAR    -- Dark Blue, Light Pink, etc.
color_intensity     VARCHAR    -- Dark, Light, Bright, etc.
color_family        VARCHAR    -- Blue, Red, etc.
customer_segment    VARCHAR    -- Menswear, Ladieswear, etc.
fabric_type_base    VARCHAR    -- Jersey, Woven, etc.
detail_desc         TEXT       -- Full product description
```

#### Transactions Train (Sales Data)

```sql
t_date              DATE       -- Transaction date
customer_id         VARCHAR    -- Customer identifier
article_id          VARCHAR    -- FK to articles
price               NUMERIC    -- Transaction price
```

#### Customers (Customer Demographics)

```sql
customer_id         VARCHAR PRIMARY KEY
age                 INTEGER
```

#### Projects (User Projects)

```sql
id                  UUID PRIMARY KEY
user_id             UUID       -- FK to users (hardcoded for now)
name                VARCHAR    -- Project name
status              ENUM       -- draft | active
scope_config        JSONB      -- Product types and groups
season_config       JSONB      -- Date range or season
ontology_schema     JSONB      -- LLM-generated attribute definitions
is_pinned           BOOLEAN    -- Pin status
pinned_at           TIMESTAMP  -- Pin timestamp
created_at          TIMESTAMP
```

#### Project Context Items (Context Articles)

```sql
project_id          UUID       -- FK to projects
article_id          VARCHAR    -- FK to articles
velocity_score      DECIMAL    -- Normalized 0-100
enriched_attributes JSONB      -- Vision LLM extracted attributes
enrichment_error    TEXT       -- Error message if failed
```

#### Generated Designs (AI-Generated Outputs)

```sql
id                      UUID PRIMARY KEY
project_id              UUID       -- FK to projects
name                    VARCHAR    -- Design name
input_constraints       JSONB      -- User-specified locked attributes
predicted_attributes    JSONB      -- RPT-1 predicted attributes
generated_images        JSONB      -- Multi-view images (front/back/model)
generated_image_url     VARCHAR    -- Legacy single image URL
image_generation_status VARCHAR    -- pending/generating/completed/failed/partial
created_at              TIMESTAMP
```

#### Collections (User Collections - Mock Data)

```sql
id          UUID PRIMARY KEY
user_id     UUID       -- FK to users
name        VARCHAR    -- Collection name
created_at  TIMESTAMP
```

#### Collection Items (Junction Table)

```sql
collection_id        UUID  -- FK to collections
generated_design_id  UUID  -- FK to generated_designs
```

### Performance Indexes

- `idx_transactions_article_id` on `transactions_train(article_id)`
- `idx_transactions_t_date` on `transactions_train(t_date)`
- `idx_transactions_customer_id` on `transactions_train(customer_id)`
- **9 strategic indexes on articles table** for 5-10x faster filtering (see PERFORMANCE_OPTIMIZATION.md)

---

## 🔌 API Reference

### Core Endpoints

#### `GET /health`

Health check endpoint.

#### `GET /api/taxonomy`

Returns product type hierarchy grouped by product groups.

#### `GET /api/filters/attributes`

Get available filter options based on current filters (dynamically updates).

**Query Parameters:**

- `types` (required): Comma-separated product types
- `season` (optional): spring | summer | autumn | winter
- `mdFrom` (optional): Start date in MM-DD format
- `mdTo` (optional): End date in MM-DD format
- Filter parameters: `filter_productGroup`, `filter_colorFamily`, etc.

#### `GET /api/products`

Get paginated, filtered product list.

#### `POST /api/generate-attributes`

Generate structured attribute definitions using LLM for selected product types.

### Project Routes

#### `POST /api/projects`

Create new project (draft status).

#### `GET /api/projects`

List all projects with generated designs count and pin status.

#### `GET /api/projects/:id`

Get single project by ID.

#### `GET /api/projects/:id/preview-context`

Calculate velocity scores for context preview (top 25 + worst 25 performers).

#### `POST /api/projects/:id/lock-context`

Lock project context, save articles with normalized velocity scores, and set project to active.

#### `DELETE /api/projects/:id`

Delete project and cleanup all associated images from SeaweedFS.

#### `PATCH /api/projects/:id/pin`

Toggle project pin status (max 3 projects can be pinned).

#### `GET /api/projects/:id/generated-designs`

Get all generated designs for a project.

#### `DELETE /api/projects/:projectId/generated-designs/:designId`

Delete specific design and its images.

#### `PATCH /api/projects/:projectId/generated-designs/:designId`

Update design (e.g., rename).

#### `GET /api/projects/:projectId/generated-designs/:designId/image-status`

Get multi-image generation status for a specific design.

### Enrichment Routes

#### `POST /api/projects/:id/start-enrichment`

Start Vision LLM enrichment for all unenriched context items.

#### `GET /api/projects/:id/enrichment-progress`

Server-Sent Events (SSE) endpoint for real-time enrichment progress updates.

#### `GET /api/projects/:id/enrichment-status`

Get current enrichment state (for page reload recovery).

#### `POST /api/projects/:id/retry-enrichment`

Retry failed enrichment items (optionally specify articleIds array).

#### `GET /api/projects/:id/context-items`

Get all context items with enrichment status for Enhanced Table display.

### RPT-1 Routes

#### `GET /api/projects/:id/rpt1-preview`

Get context row counts for RPT-1 preview.

#### `POST /api/projects/:id/rpt1-predict`

Execute RPT-1 prediction via SAP AI Core (generates 3 images: front/back/model).

### Other Routes

#### `GET /api/collections`

List user collections with item counts and preview images (currently using mock data).

#### `POST /api/generate-design-name`

LLM-based creative name generation for designs.

---

## 📦 Package Details

### @fashion/db

**Database access layer with Drizzle ORM**

Key exports:

- `pool` - PostgreSQL connection pool
- `fetchProductTaxonomy()` - Get product type hierarchy
- Schema definitions for all tables
- Query functions for analytics, product types, taxonomy

### @fashion/types

**Shared TypeScript type definitions and Zod schemas**

Key types:

- `Taxonomy` - Product type hierarchy structure
- `FiltersResponse` - Available filter options
- `ProductsResponse` - Paginated product data
- `CreateProjectInput` - Project creation input
- `LockContextInput` - Context locking input
- Many more for API contracts

### @fashion/config

**Configuration management**

Exports:

- Environment variable validation
- Database connection configuration
- API configuration
- Constants and defaults

---

## 🔧 Development

### Running Services

```bash
# API Server (port 3001)
cd apps/api-lite && pnpm run dev

# Web Application (port 5173)
cd apps/web && pnpm run dev

# Redis (optional, for caching)
docker run -d -p 6379:6379 --name fashion-redis redis:7-alpine
```

### Database Management

```bash
# Generate migrations after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio (GUI)
pnpm db:studio
```

### Code Quality

```bash
# Format all code
pnpm format

# Build all packages
pnpm build

# Type check
pnpm --recursive run type-check
```

---

## 🎯 User Workflows

### Workflow 1: Create a New Project

1. **Home** → Click "Create New Project"
2. **Product Selection** → Select product types (e.g., "Dress", "Skirt")
3. **Context Builder** → Configure filters (date/season, attributes)
4. **Generate Attributes** → Click "Generate Attributes" button, review and refine
5. **Create Project** → Click "Confirm & Create Project"
6. **Automatic Redirect** → Navigate to ProjectHub

### Workflow 2: Enrich Context & Generate Designs

1. **ProjectHub** → Navigate to project from Home
2. **Enhanced Table Tab** → View context items, start enrichment if needed
3. **The Alchemist Tab** → Configure locked/AI attributes
4. **Transmute** → Click "Transmute (Run RPT-1)" to generate design
5. **Result Overview Tab** → View generated designs
6. **Design Detail** → Click design to see full details with multi-image views

### Workflow 3: Refine an Existing Design

1. **Design Detail** → View design, click "Refine Design" button
2. **Automatic Navigation** → Redirect to TheAlchemistTab with pre-populated attributes
3. **Adjust Attributes** → Modify locked/AI variables as needed
4. **Generate Again** → Create variation with adjusted parameters

---

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Detailed setup and installation guide
- [CLAUDE.md](CLAUDE.md) - Development guide for AI assistants
- [docs/PRD.md](docs/PRD.md) - Full product requirements and architecture
- [docs/Data-summary.md](docs/Data-summary.md) - Dataset structure and semantics
- [docs/DataModel.md](docs/DataModel.md) - Entity relationship diagrams with JSONB schemas
- [docs/CollectionMock.md](docs/CollectionMock.md) - Mock collections implementation details
- [docs/PERFORMANCE_OPTIMIZATION.md](docs/PERFORMANCE_OPTIMIZATION.md) - Performance improvements (Phase 1 & 2)

---

## 🛠️ Tech Stack Details

### Frontend

- **React 18**: Component-based UI framework
- **Vite**: Fast build tool and dev server
- **SAP UI5 Web Components**: Enterprise-grade UI components with Fiori design
- **React Router 7**: Client-side routing
- **TypeScript**: Type-safe development

### Backend

- **Fastify**: High-performance web framework
- **Node.js 18+**: Runtime environment
- **Modular Routes**: Organized in separate files for maintainability
- **TypeScript**: Type-safe API development
- **Redis**: Optional caching layer for 15-30x performance boost

### Database & ORM

- **PostgreSQL 16**: Relational database with JSONB support
- **Drizzle ORM 0.29.5**: Type-safe SQL query builder
- **Connection Pooling**: Optimized for concurrent requests
- **Strategic Indexing**: 9 indexes for 5-10x faster queries

### AI & ML

- **OpenAI API**: Text generation for ontology and names
- **LiteLLM Proxy**: Vision LLM for data enrichment
- **SAP AI Core**: RPT-1 predictions and image generation
- **OAuth2**: Secure authentication with SAP AI Core

### Storage

- **SeaweedFS/S3**: Distributed file storage for generated images
- **Automatic Cleanup**: Images deleted when designs/projects are removed

---

## 🐛 Troubleshooting

### Database Connection Issues

**Cloud Database:**

```bash
# Test connection
psql -h your-db-host -p 5432 -U postgres -d fashion_db

# If using port forwarding:
caffeinate kubectl port-forward statefulset/your-db-instance 5432:5432 -n your-namespace
```

**Verify Port Forwarding:**

```bash
# Check if port forwarding is active
netstat -an | grep 5432

# Test local connection
psql -h localhost -p 5432 -U postgres -d fashion_db
```

### API Server Issues

```bash
# Check if API is running
curl http://localhost:3001/health

# Check if port is in use
lsof -ti:3001

# Restart API server
cd apps/api-lite && pnpm run dev
```

### Redis Cache Issues

```bash
# Check if Redis is running
redis-cli ping

# Start Redis with Docker
docker run -d -p 6379:6379 --name fashion-redis redis:7-alpine

# View cache statistics
redis-cli info stats
```

### Frontend Issues

```bash
# Clear browser cache and localStorage
# Open DevTools -> Application -> Clear storage

# Restart dev server
cd apps/web && pnpm run dev
```

### Image Generation Issues

```bash
# Check SeaweedFS/S3 connection in .env
# Verify S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY

# Check SAP AI Core credentials
# Verify AI_API_URL, AUTH_URL, CLIENT_ID, CLIENT_SECRET
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes with proper TypeScript types
3. Test thoroughly (especially new workflows)
4. Update documentation as needed
5. Submit pull request

---

## 📄 License

[License Type] - See LICENSE file for details

---

**Built with ❤️ using TypeScript, React, PostgreSQL, and AI**
