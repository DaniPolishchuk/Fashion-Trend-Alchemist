# Quick Start Guide

Get the Fashion Trend Alchemist running locally.

## Prerequisites

- Node.js 18+ installed
- pnpm 8+ installed (`npm install -g pnpm`)
- Access to a PostgreSQL database (local or cloud)
- Redis (optional, for caching)
- API credentials (OpenAI, SAP AI Core)

## Installation Steps

### 1. Install Dependencies

```bash
pnpm install
```

This installs all packages across the monorepo workspace.

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
PGHOST=localhost          # Or your cloud database host
PGPORT=5432              # Or your forwarded port
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=postgres
PGMAX=10

# Application Configuration
NODE_ENV=development
API_PORT=3001
API_HOST=0.0.0.0
LOG_LEVEL=info

# Redis Cache (optional - 15-30x performance boost)
REDIS_URL=redis://localhost:6379

# SeaweedFS Filer Configuration (for image storage)
# VITE_ prefix required for frontend access
VITE_FILER_BASE_URL=https://your-seaweedfs-url.com
VITE_FILER_BUCKET=images
VITE_FILER_GENERATED_BUCKET=generatedProducts

# Vision LLM Configuration (for image enrichment)
LITELLM_PROXY_URL=https://your-litellm-proxy-url.com/
LITELLM_API_KEY=your-litellm-api-key
VISION_LLM_MODEL=sapgenai-gpt-4.1

# RPT-1 / SAP AI Core (for design prediction)
AI_API_URL=https://api.ai.prod.ap-northeast-1.aws.ml.hana.ondemand.com
AUTH_URL=your_oauth_url
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
RESOURCE_GROUP=generative-ai

# Image Generation (SAP AI Core Z-Image Turbo)
IMAGE_GEN_TOKEN_URL=your_token_url
IMAGE_GEN_CLIENT_ID=your_client_id
IMAGE_GEN_CLIENT_SECRET=your_client_secret
IMAGE_GEN_API_URL=your_api_url
```

### 3. Database Setup

**Cloud Database Configuration**

This application uses a cloud-hosted PostgreSQL database:

1. Ensure your database is accessible (set up port forwarding if needed)
2. Update `.env` with your cloud database credentials
3. The database should already have the required tables and data loaded

**SSH Tunnel / Port Forwarding Example:**

If your database is behind a firewall, set up a tunnel:

```bash
# Example using kubectl:
caffeinate kubectl port-forward statefulset/yourdatabaseinstance 5432:5432 -n yournamespace

# Keep this terminal open while using the application
```

Then update your `.env`:
```env
PGHOST=localhost
PGPORT=5432
```

### 4. Build Packages

Build the shared packages before starting the application:

```bash
# Build all shared packages (@fashion/db, @fashion/types, @fashion/config)
pnpm build
```

This compiles the TypeScript packages that both the API and web app depend on.

### 5. Start the Application

Start both the API server and the web application:

```bash
# Terminal 1: Start API server
cd apps/api-lite
pnpm run dev

# Terminal 2: Start web application
cd apps/web
pnpm run dev
```

Or start both at once from root:

```bash
pnpm run dev
```

The application will be available at:
- **Web App**: http://localhost:5173
- **API Server**: http://localhost:3001

### 6. Optional: Start Redis

For 15-30x faster repeated queries:

```bash
# Using Docker
docker run -d -p 6379:6379 --name fashion-redis redis:7-alpine
```

---

## Application Features

### Home Dashboard
- Projects table with search, pagination, and pinning (max 3)
- Collections grid with 2x2 image thumbnails
- Quick access to create new projects

### Product Selection
- Browse and select product types from the taxonomy hierarchy
- Visual card-based interface with product type icons
- Selection persists in browser localStorage

### Context Builder
- **Date Range Filtering**: Enter start/end dates (DD/MM format) with validation
- **Season Filtering**: Quick-select buttons for Spring/Summer/Autumn/Winter
- **Multi-Attribute Filtering**: Pattern/Style, Color Family, Color Intensity, Specific Color, Customer Segment, Product Family, Style Concept, Fabric Type
- **Context Preview Table**: See matching articles with velocity scores
- **Attribute Generation**: LLM-powered ontology generation for selected product types
- **Project Creation**: One-click project creation with automatic velocity calculation

### Project Hub (4 Tabs)
1. **The Alchemist**: Configure locked/AI attributes, set success score, run RPT-1
2. **Result Overview**: View generated designs with multi-image support
3. **Enhanced Table**: Monitor enrichment, manage exclusions, export CSV
4. **Data Analysis**: Placeholder for future analytics

### Design Detail
- Multi-image display (front/back/model views)
- Collapsible attribute panels
- Sales text with regeneration option
- Magic name generation
- Save to collection
- Refine design flow

---

## Database Schema Overview

The system uses the following core tables:

### Articles
- `article_id` (varchar, PK) - Unique product identifier
- `product_type`, `product_group`, `product_family` - Classification
- `pattern_style`, `color_family`, `color_intensity`, `specific_color` - Visual attributes
- `customer_segment`, `style_concept`, `fabric_type_base` - Context attributes
- `detail_desc` (text) - Detailed product description

### Transactions Train
- `t_date` (date), `customer_id`, `article_id`, `price`

### Projects
- Scope, season config, ontology schema
- Enrichment tracking (status, progress, timestamps)
- Pinning and mismatch review status

### Project Context Items
- Velocity scores (normalized and raw)
- Enriched attributes and mismatch confidence
- Exclusion tracking

### Generated Designs
- Multi-image support (front/back/model)
- Predicted attributes and sales text
- Status tracking for async generation

### Collections
- User-created collections with design references

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/taxonomy` - Product type hierarchy
- `GET /api/filters/attributes` - Dynamic filter options
- `GET /api/products` - Paginated product list
- `POST /api/generate-attributes` - LLM ontology generation

### Projects
- Full CRUD operations
- Context preview and locking
- Pin management (max 3)
- Generated designs management

### Enrichment
- Start/retry enrichment
- SSE progress streaming
- Status polling

### RPT-1
- Preview and prediction endpoints
- Multi-image generation

### Collections
- Full CRUD operations
- Add/remove designs

---

## Troubleshooting

### Database Connection Failed

```bash
# Test connection manually
psql -h localhost -p 5432 -U postgres -d fashion_db

# If using port forwarding, ensure the tunnel is active
```

### API Not Responding

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "api-lite",
  "timestamp": "2026-..."
}
```

### Redis Cache Issues

```bash
# Check if Redis is running
redis-cli ping

# View cache statistics
redis-cli info stats
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules/.cache
pnpm install
pnpm build
```

---

## Next Steps

1. Create a new project via **Home** → **Create New Project**
2. Select product types in **Product Selection**
3. Configure filters and generate attributes in **Context Builder**
4. Start enrichment in **Enhanced Table** tab
5. Configure and run RPT-1 in **The Alchemist** tab
6. View generated designs in **Result Overview**

For detailed documentation:
- [README.md](README.md) - Full feature documentation
- [docs/PRD.md](docs/PRD.md) - Product requirements
- [docs/DataModel.md](docs/DataModel.md) - Database schema details
- [docs/FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md) - Code quality improvements
