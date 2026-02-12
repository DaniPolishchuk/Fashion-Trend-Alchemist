# Fashion Trend Alchemist

A TypeScript-based AI-powered fashion analytics platform for analyzing product trends and generating design attributes for future best-sellers.

## Project Status: Complete

**All development phases are complete.** This application is a fully functional AI-powered inverse design workstation.

### Implemented Features

- **Phase 1**: Product Analysis - Taxonomy browsing, context builder with advanced filtering
- **Phase 2**: LLM-based Attribute Enrichment - Vision LLM extracts structured attributes from images
- **Phase 3**: RPT-1 Inverse Design Engine - Three-column attribute management with SAP AI Core integration
- **Phase 4**: AI Image Generation - Multi-image generation (front/back/model views)

---

## Architecture

### Monorepo Structure

```
fashion-trend-alchemist/
├── apps/
│   ├── web/              # React + Vite frontend (SAP UI5 Web Components)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx                    # Dashboard with projects & collections
│   │       │   ├── ProductSelection.tsx        # Product type taxonomy browser
│   │       │   ├── ContextBuilder.tsx          # Context config & project creation
│   │       │   ├── ProjectHub.tsx              # Project workspace with tabs
│   │       │   ├── DesignDetail.tsx            # Design detail with multi-image
│   │       │   └── tabs/
│   │       │       ├── TheAlchemistTab.tsx     # RPT-1 attribute configuration
│   │       │       ├── ResultOverviewTab.tsx   # Generated designs list
│   │       │       ├── EnhancedTableTab.tsx    # Enrichment monitoring
│   │       │       └── DataAnalysisTab.tsx     # Placeholder for analytics
│   │       ├── components/                     # Reusable UI components
│   │       ├── constants/                      # Centralized constants
│   │       ├── hooks/                          # Custom React hooks
│   │       ├── services/api/                   # API client layer
│   │       ├── styles/                         # CSS Modules
│   │       ├── types/                          # Frontend-specific types
│   │       └── utils/                          # Helper functions
│   ├── api-lite/         # Fastify backend API
│   │   └── src/
│   │       ├── main.ts                # Main API server
│   │       ├── routes/                # Modular API routes
│   │       │   ├── projects.ts        # Project CRUD & context management
│   │       │   ├── enrichment.ts      # Vision LLM enrichment
│   │       │   ├── rpt1.ts            # RPT-1 predictions via SAP AI Core
│   │       │   ├── context-items.ts   # Context items with enrichment status
│   │       │   ├── collections.ts     # Collections CRUD
│   │       │   ├── design-name.ts     # LLM-based name generation
│   │       │   └── user.ts            # User endpoints
│   │       └── services/
│   │           ├── cache.ts           # Redis caching layer
│   │           ├── enrichment.ts      # Vision LLM service
│   │           ├── imageGeneration.ts # SAP AI Core image generation
│   │           ├── salesTextGeneration.ts # LLM sales text generation
│   │           ├── promptGeneration.ts    # LLM-based image prompt generation
│   │           └── s3.ts              # SeaweedFS/S3 storage
│   └── approuter/        # SAP Approuter for Kyma deployment
├── packages/
│   ├── db/               # Database schemas, queries (Drizzle ORM)
│   │   └── src/
│   │       ├── schema/   # Database table definitions
│   │       └── queries/  # Reusable query functions
│   ├── types/            # Shared TypeScript types and Zod schemas
│   └── config/           # Configuration and environment handling
├── k8s/                  # Kubernetes manifests for Kyma deployment
└── docs/                 # Documentation
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | SPA Framework |
| **UI Library** | SAP UI5 Web Components | Enterprise Fiori design |
| **State** | TanStack Query | Async server state management |
| **Backend** | Node.js 18+ with Fastify | High-throughput API server |
| **Database** | PostgreSQL 16 | Relational DB with JSONB support |
| **ORM** | Drizzle ORM 0.29.5 | Type-safe SQL queries |
| **Caching** | Redis | Optional, 15-30x performance boost |
| **AI - Text** | OpenAI API | LLM for ontology and name generation |
| **AI - Vision** | LiteLLM Proxy | Vision LLM for data enrichment |
| **AI - Prediction** | SAP AI Core RPT-1 | Statistical inference engine |
| **AI - Images** | SAP AI Core Z-Image Turbo | Product image generation |
| **Storage** | SeaweedFS/S3 | Distributed file storage |
| **Package Manager** | pnpm (workspaces) | Monorepo management |
| **Language** | TypeScript (strict) | Full-stack type safety |
| **Deployment** | SAP Kyma | Kubernetes-based cloud platform |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Access to PostgreSQL database
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
   # Edit .env with your credentials
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

## Features

### 1. Home Dashboard

- **Projects Table**: Displays projects with status, time period, product group, and generated designs count
- **Search & Pagination**: Filter projects by name with 5 items per page
- **Project Pinning**: Pin up to 3 projects for quick access
- **Project Management**: Delete projects (with automatic image cleanup), inline name editing
- **Collections Grid**: Visual 2x2 image thumbnail grid per collection with preview dialog

### 2. Product Selection

- **Taxonomy Browser**: Navigate product types organized by groups (e.g., Garment Upper Body, Shoes, Bags)
- **Multi-Select**: Choose multiple product types for analysis
- **Visual Interface**: Card-based UI with product type icons and descriptions
- **Persistence**: Selection saved to localStorage

### 3. Context Builder

Unified page combining filtering, preview, and project creation.

#### Date & Season Filtering
- **Custom Date Range**: DD/MM format inputs with month-specific validation
- **Season Quick Select**: Spring, Summer, Autumn, Winter buttons
- **Cross-year Support**: Filters transactions across all years for selected dates

#### Multi-Attribute Filtering
- **8 Filter Categories**: Pattern/Style, Specific Color, Color Intensity, Color Family, Product Family, Customer Segment, Style Concept, Fabric Type
- **Multi-Select Dialogs**: Checkbox-based selection with dynamic options
- **Active Filter Count**: Visual indicator of applied filters

#### Context Preview & Project Creation
- **Real-time Preview**: See matching articles as you adjust filters
- **Attribute Generation**: LLM-powered ontology generation for selected product types
- **One-Click Create**: Creates project with velocity calculation (top 25 + worst 25 performers)

### 4. Project Hub

Main workspace with 4 tabs:

#### Tab 1: The Alchemist (RPT-1 Configuration)
- **Three-Column Layout**: Locked Attributes | AI Variables (max 10) | Not Included
- **Attribute Sources**: Article attributes (from DB) + Ontology attributes (LLM-generated)
- **Success Score Slider**: Target performance level (0-100%)
- **Preview Request**: Shows context summary and query structure
- **Transmute Button**: Executes RPT-1 prediction and generates 3 images
- **Refine Design Flow**: Pre-populate from existing design

#### Tab 2: Result Overview (Generated Designs)
- **Design List**: Paginated view with search filtering
- **Multi-Image Support**: Shows front view thumbnail
- **Actions**: Delete, rename, click to view details

#### Tab 3: Enhanced Table (Enrichment Monitoring)
- **Context Items Table**: All project items with enrichment status
- **Filter Chips**: All/Successful/Pending/Failed quick filters
- **Dynamic Columns**: LLM-enriched attributes from ontology
- **Image Thumbnails**: With fallback placeholder and modal viewer
- **CSV Export**: Export all data including enriched attributes
- **Retry Functionality**: Single item or bulk retry
- **Real-time Updates**: 5-second polling during enrichment

#### Tab 4: Data Analysis
- Placeholder for future analytics features

### 5. Design Detail Page

- **Multi-Image Display**: Front, back, and model/lifestyle views with thumbnail strip
- **Collapsible Panels**: Predicted Attributes (expanded), Given Attributes (collapsed)
- **Sales Text Panel**: AI-generated marketing copy with regeneration option
- **Magic Name Generation**: LLM-powered creative naming
- **Image Download**: Per-view download functionality
- **Save to Collection**: Add design to existing or new collection
- **Refine Design**: Navigate to Alchemist tab with pre-populated attributes
- **Real-time Polling**: Updates image generation status automatically

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `articles` | Static product catalog with attributes |
| `transactions_train` | Sales data with dates and prices |
| `customers` | Customer demographics |
| `projects` | User projects with scope, ontology, and enrichment status |
| `project_context_items` | Context articles with velocity scores and enriched attributes |
| `generated_designs` | AI-generated designs with multi-image support |
| `collections` | User collections for organizing designs |
| `collection_items` | Junction table linking collections and designs |

### Key JSONB Schemas

- `projects.scope_config` - Product types and filter selections
- `projects.season_config` - Date range configuration (MM-DD format)
- `projects.ontology_schema` - LLM-generated attribute definitions per product type
- `project_context_items.enriched_attributes` - Vision LLM extracted attributes
- `generated_designs.input_constraints` - User-locked attributes + target score
- `generated_designs.predicted_attributes` - RPT-1 output
- `generated_designs.generated_images` - Multi-view image URLs and status

See [docs/DataModel.md](docs/DataModel.md) for detailed schema documentation.

---

## API Reference

### Core Endpoints (main.ts)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/taxonomy` | Product type hierarchy |
| `GET` | `/api/filters/attributes` | Dynamic filter options |
| `GET` | `/api/products` | Paginated product list |
| `POST` | `/api/generate-attributes` | LLM ontology generation |

### Project Routes (routes/projects.ts)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/projects/:id` | Get project by ID |
| `DELETE` | `/api/projects/:id` | Delete project and images |
| `PATCH` | `/api/projects/:id/pin` | Toggle pin status |
| `GET` | `/api/projects/:id/preview-context` | Calculate velocity scores |
| `POST` | `/api/projects/:id/lock-context` | Lock context and create project |
| `GET` | `/api/projects/:id/generated-designs` | List designs for project |
| `DELETE` | `/api/projects/:projectId/generated-designs/:designId` | Delete design |
| `PATCH` | `/api/projects/:projectId/generated-designs/:designId` | Update design |
| `GET` | `/api/projects/:projectId/generated-designs/:designId/image-status` | Get image generation status |
| `POST` | `/api/projects/:projectId/generated-designs/:designId/regenerate-sales-text` | Regenerate sales text |

### Enrichment Routes (routes/enrichment.ts)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/projects/:id/start-enrichment` | Start Vision LLM enrichment |
| `GET` | `/api/projects/:id/enrichment-progress` | SSE for real-time progress |
| `GET` | `/api/projects/:id/enrichment-status` | Get current enrichment state |
| `POST` | `/api/projects/:id/retry-enrichment` | Retry failed items |

### RPT-1 Routes (routes/rpt1.ts)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/:id/rpt1-preview` | Get context row counts |
| `POST` | `/api/projects/:id/rpt1-predict` | Execute RPT-1 and generate images |

### Collections Routes (routes/collections.ts)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/collections` | List user collections |
| `POST` | `/api/collections` | Create collection |
| `GET` | `/api/collections/:id` | Get collection details |
| `PATCH` | `/api/collections/:id` | Rename collection |
| `DELETE` | `/api/collections/:id` | Delete collection |
| `POST` | `/api/collections/:id/items` | Add design to collection |
| `DELETE` | `/api/collections/:id/items/:designId` | Remove design from collection |

### Other Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-design-name` | LLM-based creative naming |
| `GET` | `/api/projects/:id/context-items` | Get context items with status |

---

## Deployment

### Local Development

```bash
# API Server (port 3001)
cd apps/api-lite && pnpm run dev

# Web Application (port 5173)
cd apps/web && pnpm run dev

# Redis (optional)
docker run -d -p 6379:6379 --name fashion-redis redis:7-alpine
```

### Kyma Deployment

The application deploys to SAP Kyma using a 3-container architecture:

1. **Approuter** (port 5000) - XSUAA authentication and request routing
2. **Frontend** (port 80) - Nginx serving React SPA
3. **Backend** (port 3001) - Fastify API server

See [k8s/README.md](k8s/README.md) for detailed deployment instructions.

---

## User Workflows

### Create a New Project
1. Home → Create New Project
2. Product Selection → Select product types
3. Context Builder → Configure filters, generate attributes
4. Click "Confirm & Create Project"

### Generate Designs
1. ProjectHub → Enhanced Table tab → Start enrichment
2. The Alchemist tab → Configure locked/AI attributes
3. Click "Transmute" to generate design
4. Result Overview tab → View generated designs

### Refine an Existing Design
1. Design Detail → Click "Refine Design"
2. Alchemist tab opens with pre-populated attributes
3. Adjust and generate new variation

---

## Documentation

- [QUICKSTART.md](QUICKSTART.md) - Setup and installation guide
- [docs/PRD.md](docs/PRD.md) - Product requirements document
- [docs/DataModel.md](docs/DataModel.md) - Database schema and JSONB documentation
- [docs/Data-summary.md](docs/Data-summary.md) - Dataset structure and semantics
- [docs/image-prompt-system-design.md](docs/image-prompt-system-design.md) - Image generation prompt system
- [docs/prompt-templates-by-product-group.md](docs/prompt-templates-by-product-group.md) - Prompt templates
- [k8s/README.md](k8s/README.md) - Kyma deployment guide
- [docs/FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md) - Code quality improvements for future development

---

## Troubleshooting

### Database Connection
```bash
# Test connection
psql -h localhost -p 5432 -U postgres -d fashion_db

# Check API health
curl http://localhost:3001/health
```

### Redis Cache
```bash
redis-cli ping
redis-cli info stats
```

### Image Generation
- Verify S3 credentials in `.env`
- Check SAP AI Core credentials
- Review backend logs for errors

---

## License

[License Type] - See LICENSE file for details

---

**Built with TypeScript, React, PostgreSQL, and AI**
