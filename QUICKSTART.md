# Quick Start Guide

Get the Fashion Trend Alchemist running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Access to a PostgreSQL database (local or cloud)

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

Edit the `.env` file with your database connection details:

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
```

### 3. Database Setup

**Cloud Database Configuration**

This application uses a cloud-hosted PostgreSQL database:

1. Ensure your database is accessible (set up port forwarding if needed)
2. Update `.env` with your cloud database credentials
3. The database should already have the required tables and data loaded

**SSH Tunnel / Port Forwarding Example:**

If your database is behind a firewall, set up an SSH tunnel:

```bash
# Example: Forward remote PostgreSQL to local port 5432
caffeinate kubectl port-forward statefulset/yourdatabaseinstance 5432:5432 -n yournamespace

# Keep this terminal open while using the application
```

Then update your `.env`:
```env
PGHOST=localhost
PGPORT=5432
```

### 4. Start the Application

Start both the API server and the web application:

```bash
# Terminal 1: Start API server
cd apps/api-lite
pnpm run dev

# Terminal 2: Start web application
cd apps/web
pnpm run dev
```

The application will be available at:
- **Web App**: http://localhost:5173
- **API Server**: http://localhost:3001

---

## Current Features

### Product Selection Page
- Browse and select product types from the taxonomy hierarchy
- Visual card-based interface with product type icons
- Selection persists in browser localStorage

### Analysis Page
- **Date Range Filtering**: Enter start/end dates (DD/MM format) with validation
  - Validates days per month (Feb: 28, Apr/Jun/Sep/Nov: 30, others: 31)
  - Red border indicates invalid input
- **Season Filtering**: Quick-select buttons for Spring/Summer/Autumn/Winter
- **Multi-Attribute Filtering**: 
  - Pattern/Style, Color Family, Color Intensity, Specific Color
  - Customer Segment, Product Family, Style Concept, Fabric Type
  - Multi-select with checkboxes in dialogs
  - Options dynamically update based on filtered dataset
- **Product Table**: 
  - Displays filtered products with all attributes
  - Detail Description column at the end with full text wrapping
  - Shows product count and active filter count
- **Pagination**: Navigate through product pages (10 items per page)

---

## Database Schema

The system uses the following core tables:

### Articles
- `article_id` (varchar, PK) - Unique product identifier
- `product_type` (varchar) - Product type category (e.g., Dress, Sweater)
- `product_group` (varchar) - Product group classification
- `product_family` (varchar) - Product family grouping
- `style_concept` (varchar) - Style concept category
- `pattern_style` (varchar) - Pattern/style identifier
- `specific_color` (varchar) - Specific color name
- `color_intensity` (varchar) - Color intensity level (Dark, Light, etc.)
- `color_family` (varchar) - Color family classification
- `customer_segment` (varchar) - Target customer segment
- `fabric_type_base` (varchar) - Base fabric type
- `detail_desc` (text) - Detailed product description

### Transactions Train
- `t_date` (date) - Transaction date
- `customer_id` (varchar) - Customer identifier
- `article_id` (varchar, FK) - Article identifier
- `price` (numeric) - Transaction price

### Customers
- `customer_id` (varchar, PK) - Unique customer identifier
- `age` (integer) - Customer age

### Indexes
Performance-optimized indexes on:
- `transactions_train(article_id)`
- `transactions_train(t_date)`
- `transactions_train(customer_id)`

---

## API Endpoints

The API server provides the following endpoints:

### GET /health
Health check endpoint

### GET /taxonomy
Returns the product type hierarchy grouped by product groups

### GET /transactions/count
Count transactions for selected product types
- Query params: `types` (comma-separated product types)

### GET /filters/attributes
Get available filter options based on current filters
- Query params: `types`, `season`, `mdFrom`, `mdTo`
- Returns distinct values for all filter attributes

### GET /products
Get paginated product list with filters
- Query params: `types`, `season`, `mdFrom`, `mdTo`, `limit`, `offset`
- Filter params: `filter_productGroup`, `filter_colorFamily`, etc.
- Returns paginated product data with total count

---

## Development Workflow

### Running in Development Mode

```bash
# Start API server (Terminal 1)
cd apps/api-lite && pnpm run dev

# Start web app (Terminal 2)  
cd apps/web && pnpm run dev
```

### Code Quality

```bash
# Format code
pnpm format

# Build all packages
pnpm build
```

### Database Management

```bash
# Generate migrations after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

---

## Package Structure

### @fashion/db
Database schemas, queries, and connection management.
- PostgreSQL connection with connection pooling
- Drizzle ORM schemas for articles, customers, transactions
- Query functions for taxonomy and analytics

### @fashion/types
Shared TypeScript type definitions.
- `FiltersResponse` - Available filter options
- `ProductsResponse` - Paginated product data
- `Taxonomy` - Product type hierarchy
- `AttributeFilters` - Filter selections

### @fashion/config
Configuration and environment variable management.
- Environment variable loading and validation
- Database connection configuration
- API server configuration

---

## Troubleshooting

### Database Connection Failed

```bash
# Test connection manually
psql -h localhost -p 5432 -U postgres -d fashion_db

# If using port forwarding to cloud DB, ensure the tunnel is active
# Example: ssh -L 5432:remote-db-host:5432 user@jumphost
```

### Port Already in Use

If port 5173 (web) or 3001 (API) is in use, Vite/Fastify will automatically try the next available port.

### API Not Responding

Check that the API server is running:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "api-lite",
  "timestamp": "2026-01-19T..."
}
```

---

## Next Steps

- Explore the **Product Selection** page to choose product types
- Use the **Analysis** page to filter and analyze products
- Review [docs/PRD.md](docs/PRD.md) for the full product vision
- Check [docs/Data-summary.md](docs/Data-summary.md) for data model details

---

**Happy analyzing! 🚀**
