# Quick Start Guide

Get the Fashion Trend Alchemist running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
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
PGDATABASE=fashion_db

# API Configuration
API_PORT=3001
API_HOST=0.0.0.0

# Redis Cache (optional - 15-30x performance boost)
REDIS_URL=redis://localhost:6379

# LLM Integration (for ontology generation)
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=your_openai_key
LLM_MODEL=gpt-4

# Vision LLM (for data enrichment)
LITELLM_PROXY_URL=your_litellm_proxy_url
LITELLM_API_KEY=your_litellm_key
VISION_LLM_MODEL=gpt-4-vision-preview

# Enrichment Processing
ENRICHMENT_CONCURRENCY=5
ENRICHMENT_PROGRESS_INTERVAL_MS=500

# RPT-1 / SAP AI Core (for design prediction)
AI_API_URL=your_sap_ai_core_url
AUTH_URL=your_oauth_url
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
RESOURCE_GROUP=generative-ai

# S3/SeaweedFS (for image storage)
S3_ENDPOINT=your_s3_endpoint
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=fashion-images
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

## Current Features

### Home Dashboard
- Projects table with search, pagination, and pinning (max 3)
- Collections grid with 2x2 image thumbnails
- Quick access to create new projects

### Product Selection
- Browse and select product types from the taxonomy hierarchy
- Visual card-based interface with product type icons
- Selection persists in browser localStorage

### Context Builder (Unified Workflow)
- **Date Range Filtering**: Enter start/end dates (DD/MM format) with validation
- **Season Filtering**: Quick-select buttons for Spring/Summer/Autumn/Winter
- **Multi-Attribute Filtering**:
  - Pattern/Style, Color Family, Color Intensity, Specific Color
  - Customer Segment, Product Family, Style Concept, Fabric Type
- **Context Preview Table**: See matching articles with velocity scores
- **Attribute Generation**: LLM-powered ontology generation for selected product types
- **Project Creation**: One-click project creation with automatic velocity calculation

### Project Hub (4 Tabs)
1. **The Alchemist**: Configure locked/AI attributes, set success score, run RPT-1
2. **Result Overview**: View generated designs with multi-image support
3. **Enhanced Table**: Monitor enrichment, review mismatches, manage exclusions
4. **Data Analysis**: Placeholder for future analytics

### Design Detail
- Multi-image display (front/back/model views)
- Collapsible attribute panels
- Sales text with regeneration option
- Magic name generation
- Save to collection
- Refine design flow

---

## Database Schema

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
- Mismatch review and velocity recalculation

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
- [CLAUDE.md](CLAUDE.md) - Development guide
- [docs/PRD.md](docs/PRD.md) - Product requirements
- [docs/DataModel.md](docs/DataModel.md) - Database schema details

---

**Happy analyzing! 🚀**
