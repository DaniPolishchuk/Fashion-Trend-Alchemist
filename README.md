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

![Technical Architecture](docs/Graphics&Photos/FTA_TechnicalArchitecture.png)
_System architecture showing the integration of frontend, backend, AI services, and data storage layers_

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

| Layer               | Technology                | Purpose                              |
| ------------------- | ------------------------- | ------------------------------------ |
| **Frontend**        | React 18 + Vite           | SPA Framework                        |
| **UI Library**      | SAP UI5 Web Components    | Enterprise Fiori design              |
| **State**           | TanStack Query            | Async server state management        |
| **Backend**         | Node.js 18+ with Fastify  | High-throughput API server           |
| **Database**        | PostgreSQL 16             | Relational DB with JSONB support     |
| **ORM**             | Drizzle ORM 0.29.5        | Type-safe SQL queries                |
| **Caching**         | Redis                     | Optional, 15-30x performance boost   |
| **AI - Text**       | OpenAI API                | LLM for ontology and name generation |
| **AI - Vision**     | LiteLLM Proxy             | Vision LLM for data enrichment       |
| **AI - Prediction** | SAP AI Core RPT-1         | Statistical inference engine         |
| **AI - Images**     | SAP AI Core Z-Image Turbo | Product image generation             |
| **Storage**         | SeaweedFS/S3              | Distributed file storage             |
| **Package Manager** | pnpm (workspaces)         | Monorepo management                  |
| **Language**        | TypeScript (strict)       | Full-stack type safety               |
| **Deployment**      | SAP Kyma                  | Kubernetes-based cloud platform      |

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

## Features & Screenshots

This section showcases the complete user workflow from project creation to AI-generated design results, combining feature descriptions with visual examples.

### 1. Home Dashboard

![Home Dashboard](docs/Graphics&Photos/HomePage.png)

**What it does:** The landing page where users can view all their projects in a table with search, pagination, and pinning capabilities (up to 3 pinned projects). The page also displays collections in a visual grid format with 2x2 image thumbnails per collection. This is where users start their journey and can access existing projects or create new ones through the "Create New Project" button.

**Key Features:**

- **Projects Table**: Displays projects with status, time period, product group, and generated designs count
- **Search & Pagination**: Filter projects by name with 5 items per page
- **Project Pinning**: Pin up to 3 projects for quick access
- **Project Management**: Delete projects with automatic image cleanup, inline name editing
- **Collections Grid**: Visual 2x2 image thumbnail grid per collection with preview dialog

---

### 2. Product Selection & Project Setup

![Product Selection](docs/Graphics&Photos/ProjectCreation.png)

**What it does:** Shows the initial project creation flow where users select product types from a hierarchical taxonomy browser organized by groups (e.g., Garment Upper Body, Shoes, Bags, Accessories). Users can choose multiple product types to analyze simultaneously, which determines the scope and structure of their project. The visual card-based interface makes it easy to browse and select relevant categories.

**Key Features:**

- **Taxonomy Browser**: Navigate product types organized by groups
- **Multi-Select**: Choose multiple product types for analysis
- **Visual Interface**: Card-based UI with product type icons and descriptions
- **Persistence**: Selection saved to localStorage
- **Clear Visual Feedback**: Selected items are clearly indicated

---

### 3. Context Builder

![Context Builder](docs/Graphics&Photos/ContextBuild.png)

**What it does:** The unified configuration hub where users define their project parameters to identify which historical products should be analyzed for trend patterns. Users can filter by date ranges, seasons, and 8 different attribute categories. The page provides a real-time preview showing how many articles match the current filter configuration, helping users refine their selection before creating the project.

**Key Features:**

- **Date & Season Filtering:**
  - Custom date ranges with DD/MM format inputs and month-specific validation
  - Season quick-select buttons (Spring, Summer, Autumn, Winter)
  - Cross-year support for filtering transactions across all years
- **Multi-Attribute Filtering:**
  - 8 filter categories: Pattern/Style, Specific Color, Color Intensity, Color Family, Product Family, Customer Segment, Style Concept, Fabric Type
  - Multi-select dialogs with checkbox-based selection
  - Active filter count indicators with visual badges
- **Context Preview & Project Creation:**
  - Real-time preview showing matching article count as you adjust filters
  - LLM-powered ontology generation for selected product types
  - One-click create with velocity calculation (top 25 + worst 25 performers)

---

### 4. AI Attribute Generation

![Ontology Generation](docs/Graphics&Photos/OntologyGeneration.png)

**What it does:** Dialog displaying the LLM-powered ontology generation process that creates custom attribute definitions based on the selected product types. The AI analyzes the product categories and generates a structured schema with relevant attributes (e.g., for dresses: neckline type, sleeve length, silhouette). This AI-generated ontology will be used throughout the project to structure product data and guide the Vision LLM during enrichment.

**Key Features:**

- **Automatic Schema Generation**: Uses OpenAI to generate product-specific attributes
- **Product-Type Specific**: Different schemas for bags vs. dresses vs. shoes
- **Real-time Feedback**: Shows generation progress
- **Persistent Storage**: Generated ontology stored in project configuration

---

### 5. Enrichment Monitoring (Enhanced Table Tab)

![Enhanced Table](docs/Graphics&Photos/EnhancedTable.png)

**What it does:** Displays all context items (historical products) in an interactive table showing their enrichment status. This is where raw product images are transformed into structured data through Vision LLM processing. Users can monitor the enrichment progress in real-time (5-second polling), view extracted attributes in dynamically generated columns based on the project's ontology, and manage failed items through retry functionality.

**Key Features:**

- **Context Items Table**: All project items with enrichment status (Pending/Successful/Failed)
- **Filter Chips**: Quick status filtering (All/Successful/Pending/Failed)
- **Dynamic Columns**: LLM-enriched attributes from the project ontology
- **Image Thumbnails**: With modal viewer and fallback placeholders
- **CSV Export**: Export all data including enriched attributes
- **Retry Functionality**: Single item or bulk retry for failed enrichments
- **Real-time Updates**: 5-second polling during processing with performance metrics

---

### 6. The Alchemist Tab - Configuration

![The Alchemist Configuration](docs/Graphics&Photos/Alchemist.png)

**What it does:** The RPT-1 configuration interface where users control the inverse design process. The three-column layout allows users to categorize attributes: "Locked Attributes" (fixed design requirements), "AI Variables" (features the AI can optimize, max 10), and "Not Included" (excluded features). Users drag and drop attributes between columns and set a target Success Score (0-100%) to indicate desired performance level. Clicking "Transmute" executes the RPT-1 prediction and triggers multi-image generation.

**Key Features:**

- **Three-Column Layout**: Locked Attributes | AI Variables (max 10) | Not Included
- **Attribute Sources**: Article attributes (from DB) + Ontology attributes (LLM-generated)
- **Success Score Slider**: Target performance level (0-100%)
- **Preview Request**: Shows context summary and query structure
- **Transmute Button**: Executes RPT-1 prediction and generates 3 images (front/back/model)
- **Refine Design Flow**: Pre-populate from existing design for iterations

---

### 7. The Alchemist Tab - After Generation

![Design Created](docs/Graphics&Photos/Design-Created.png)

**What it does:** Shows the Alchemist interface immediately after clicking "Transmute" - displays the AI's predicted attributes alongside the image generation status. This screen shows what RPT-1 recommends for a best-selling design based on the locked attributes and target success score. Users can see the prediction results while the multi-view images (front, back, model) are being generated by SAP AI Core's Z-Image Turbo service.

**Key Features:**

- **RPT-1 Predicted Attributes**: Display of AI-recommended design features
- **Real-time Image Generation Status**: Track progress of multi-view generation
- **Multi-Image Tracking**: Front, back, and model view generation monitoring
- **Predicted Success Score**: Based on input configuration
- **Immediate Feedback**: See results as images are being created

---

### 8. Design Detail View

![Design Detail](docs/Graphics&Photos/GeneratedProject.png)

**What it does:** The complete design detail page showing all aspects of a generated design. Users can view all generated images (front, back, model/lifestyle) with a thumbnail strip for easy navigation, explore predicted and given attributes in collapsible panels, read AI-generated marketing copy, and take actions like naming, downloading individual views, saving to collections, or refining the design to create variations.

**Key Features:**

- **Multi-Image Display**: Front, back, and model/lifestyle views with thumbnail strip navigation
- **Collapsible Panels**: Predicted Attributes (expanded), Given Attributes (collapsed)
- **Sales Text Panel**: AI-generated marketing copy with regeneration option
- **Magic Name Generation**: LLM-powered creative naming based on design attributes
- **Image Download**: Individual download buttons for each view
- **Save to Collection**: Add design to existing or create new collection
- **Refine Design**: Navigate to Alchemist tab with pre-populated attributes
- **Real-time Polling**: Automatic updates for image generation status

---

### Additional Tabs in Project Hub

**Tab 2: Result Overview (Generated Designs)**

- **Design List**: Paginated view with search filtering
- **Multi-Image Support**: Shows front view thumbnail
- **Actions**: Delete, rename, click to view details

**Tab 4: Data Analysis**

- Placeholder for future analytics features

---

## Database Schema

### Core Tables

| Table                   | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `articles`              | Static product catalog with attributes                        |
| `transactions_train`    | Sales data with dates and prices                              |
| `customers`             | Customer demographics                                         |
| `projects`              | User projects with scope, ontology, and enrichment status     |
| `project_context_items` | Context articles with velocity scores and enriched attributes |
| `generated_designs`     | AI-generated designs with multi-image support                 |
| `collections`           | User collections for organizing designs                       |
| `collection_items`      | Junction table linking collections and designs                |

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

| Method | Endpoint                   | Description             |
| ------ | -------------------------- | ----------------------- |
| `GET`  | `/health`                  | Health check            |
| `GET`  | `/api/taxonomy`            | Product type hierarchy  |
| `GET`  | `/api/filters/attributes`  | Dynamic filter options  |
| `GET`  | `/api/products`            | Paginated product list  |
| `POST` | `/api/generate-attributes` | LLM ontology generation |

### Project Routes (routes/projects.ts)

| Method   | Endpoint                                                                     | Description                     |
| -------- | ---------------------------------------------------------------------------- | ------------------------------- |
| `GET`    | `/api/projects`                                                              | List all projects               |
| `POST`   | `/api/projects`                                                              | Create new project              |
| `GET`    | `/api/projects/:id`                                                          | Get project by ID               |
| `DELETE` | `/api/projects/:id`                                                          | Delete project and images       |
| `PATCH`  | `/api/projects/:id/pin`                                                      | Toggle pin status               |
| `GET`    | `/api/projects/:id/preview-context`                                          | Calculate velocity scores       |
| `POST`   | `/api/projects/:id/lock-context`                                             | Lock context and create project |
| `GET`    | `/api/projects/:id/generated-designs`                                        | List designs for project        |
| `DELETE` | `/api/projects/:projectId/generated-designs/:designId`                       | Delete design                   |
| `PATCH`  | `/api/projects/:projectId/generated-designs/:designId`                       | Update design                   |
| `GET`    | `/api/projects/:projectId/generated-designs/:designId/image-status`          | Get image generation status     |
| `POST`   | `/api/projects/:projectId/generated-designs/:designId/regenerate-sales-text` | Regenerate sales text           |

### Enrichment Routes (routes/enrichment.ts)

| Method | Endpoint                                | Description                  |
| ------ | --------------------------------------- | ---------------------------- |
| `POST` | `/api/projects/:id/start-enrichment`    | Start Vision LLM enrichment  |
| `GET`  | `/api/projects/:id/enrichment-progress` | SSE for real-time progress   |
| `GET`  | `/api/projects/:id/enrichment-status`   | Get current enrichment state |
| `POST` | `/api/projects/:id/retry-enrichment`    | Retry failed items           |

### RPT-1 Routes (routes/rpt1.ts)

| Method | Endpoint                         | Description                       |
| ------ | -------------------------------- | --------------------------------- |
| `GET`  | `/api/projects/:id/rpt1-preview` | Get context row counts            |
| `POST` | `/api/projects/:id/rpt1-predict` | Execute RPT-1 and generate images |

### Collections Routes (routes/collections.ts)

| Method   | Endpoint                               | Description                   |
| -------- | -------------------------------------- | ----------------------------- |
| `GET`    | `/api/collections`                     | List user collections         |
| `POST`   | `/api/collections`                     | Create collection             |
| `GET`    | `/api/collections/:id`                 | Get collection details        |
| `PATCH`  | `/api/collections/:id`                 | Rename collection             |
| `DELETE` | `/api/collections/:id`                 | Delete collection             |
| `POST`   | `/api/collections/:id/items`           | Add design to collection      |
| `DELETE` | `/api/collections/:id/items/:designId` | Remove design from collection |

### Other Routes

| Method | Endpoint                          | Description                   |
| ------ | --------------------------------- | ----------------------------- |
| `POST` | `/api/generate-design-name`       | LLM-based creative naming     |
| `GET`  | `/api/projects/:id/context-items` | Get context items with status |

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
