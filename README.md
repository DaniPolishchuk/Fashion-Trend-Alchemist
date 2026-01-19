# Fashion Trend Alchemist

A TypeScript-based fashion analytics platform for analyzing product trends and sales data.

## 📊 Current Status

**Phase 1: Product Analysis - ✅ COMPLETE**

The application currently provides:
- Product type selection and taxonomy browsing
- Advanced filtering and analysis of fashion products
- Multi-dimensional attribute filtering with dynamic options
- Date range and seasonal filtering
- Paginated product exploration

**Future Phases (See [docs/PRD.md](docs/PRD.md)):**
- Phase 2: LLM-based attribute enrichment
- Phase 3: RPT-1 inverse design engine
- Phase 4: AI image generation

---

## 🏗️ Architecture

### Monorepo Structure

```
fashion-trend-alchemist/
├── apps/
│   ├── web/              # React + Vite frontend (SAP UI5 Web Components)
│   └── api-lite/         # Fastify backend API
├── packages/
│   ├── db/               # Database schemas, queries (Drizzle ORM)
│   ├── types/            # Shared TypeScript types
│   └── config/           # Configuration and environment handling
└── docs/                 # Documentation (PRD, data model, etc.)
```

### Technology Stack

- **Frontend**: React 18 + Vite + SAP UI5 Web Components for React
- **Backend**: Node.js 18+ with Fastify
- **Database**: PostgreSQL 16 (cloud-hosted with port forwarding)
- **ORM**: Drizzle ORM with type-safe queries
- **Package Manager**: pnpm (workspaces for monorepo)
- **Language**: TypeScript (strict mode)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Access to PostgreSQL database (cloud or local)

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
   # Edit .env with your database credentials
   ```

3. **Start the application**
   ```bash
   # Terminal 1: API Server
   cd apps/api-lite && pnpm run dev
   
   # Terminal 2: Web App
   cd apps/web && pnpm run dev
   ```

4. **Access the application**
   - Web: http://localhost:5173
   - API: http://localhost:3001

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

---

## 🎨 Features

### 1. Product Selection
- **Taxonomy Browser**: Navigate product types organized by groups
- **Multi-Select**: Choose multiple product types for analysis
- **Visual Interface**: Card-based UI with icons and descriptions
- **Persistence**: Selection saved to localStorage

### 2. Analysis Dashboard

#### Date & Season Filtering
- **Custom Date Range**: DD/MM format inputs with smart validation
  - Month-specific day limits (Feb: 28, Apr/Jun/Sep/Nov: 30, others: 31)
  - Real-time validation with visual feedback (red borders)
- **Season Quick Select**: Spring, Summer, Autumn, Winter buttons
- **Cross-year support**: Filters transactions across all years for selected dates

#### Multi-Attribute Filtering
- **8 Filter Categories**:
  - Pattern/Style, Specific Color, Color Intensity, Color Family
  - Product Family, Customer Segment, Style Concept, Fabric Type
- **Multi-Select Dialogs**: Checkbox-based selection with "Apply" action
- **Dynamic Options**: Filter options update based on current dataset
  - Example: After date filtering, only colors present in filtered data appear
- **Loading Indicators**: Visual feedback during filter option loading
- **Active Filter Count**: Shows number of applied filters

#### Product Table
- **Comprehensive Display**: All product attributes in table format
- **Smart Column Ordering**: 
  - Priority: Article ID, Product Name, Product Type
  - Detail Description: Always at the end with full text wrapping
- **Pagination**: 
  - 10 products per page
  - Previous/Next navigation
  - Page indicator (Page X of Y)
  - Product count display (Showing X-Y of Z)
- **Performance**: Optimized queries with proper indexing

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

### Performance Indexes
- `idx_transactions_article_id` on `transactions_train(article_id)`
- `idx_transactions_t_date` on `transactions_train(t_date)`
- `idx_transactions_customer_id` on `transactions_train(customer_id)`

---

## 🔌 API Reference

### Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "api-lite",
  "timestamp": "2026-01-19T12:00:00.000Z"
}
```

#### `GET /taxonomy`
Returns product type hierarchy.

**Response:**
```json
{
  "groups": [
    {
      "name": "Garment Upper body",
      "types": ["Sweater", "Hoodie", "Blouse", ...]
    }
  ]
}
```

#### `GET /filters/attributes`
Get available filter options based on current filters.

**Query Parameters:**
- `types` (required): Comma-separated product types
- `season` (optional): spring | summer | autumn | winter
- `mdFrom` (optional): Start date in MM-DD format
- `mdTo` (optional): End date in MM-DD format

**Response:**
```json
{
  "productGroup": ["Garment Upper body", ...],
  "productFamily": ["Knitwear", "Jersey", ...],
  "styleConcept": ["Contemporary Smart", ...],
  "patternStyle": ["Solid", "Check", ...],
  "colorFamily": ["Blue", "Red", ...],
  "colorIntensity": ["Dark", "Light", ...],
  "specificColor": ["Dark Blue", "Light Pink", ...],
  "customerSegment": ["Menswear", "Ladieswear", ...],
  "fabricTypeBase": ["Jersey", "Woven", ...]
}
```

#### `GET /products`
Get paginated, filtered product list.

**Query Parameters:**
- `types` (required): Comma-separated product types
- `season` (optional): Season filter
- `mdFrom`, `mdTo` (optional): Date range (MM-DD format)
- `limit` (optional, default: 10): Items per page
- `offset` (optional, default: 0): Pagination offset
- `filter_productGroup`, `filter_productFamily`, etc.: Multi-value filters (comma-separated)

**Response:**
```json
{
  "items": [
    {
      "article_id": "108775015",
      "product_type": "Sweater",
      "product_name": "...",
      "color_family": "Blue",
      ...
    }
  ],
  "total": 1543,
  "limit": 10,
  "offset": 0
}
```

---

## 📦 Package Details

### @fashion/db
**Database access layer with Drizzle ORM**

Key exports:
- `pool` - PostgreSQL connection pool
- `fetchProductTaxonomy()` - Get product type hierarchy
- Schema definitions for `articles`, `customers`, `transactions_train`

### @fashion/types
**Shared TypeScript type definitions**

Key types:
- `Taxonomy` - Product type hierarchy structure
- `FiltersResponse` - Available filter options
- `ProductsResponse` - Paginated product data
- `ProductListItem` - Individual product with attributes
- `AttributeFilters` - Filter selection structure

### @fashion/config
**Configuration management**

Exports:
- Environment variable validation
- Database connection configuration
- Constants and defaults

---

## 🔧 Development

### Running Services

```bash
# API Server (port 3001)
cd apps/api-lite && pnpm run dev

# Web Application (port 5173)
cd apps/web && pnpm run dev
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

## 🎯 Use Cases

### Fashion Merchandiser
"I want to analyze which dress styles sold well in Spring for the Ladieswear segment"

1. Select "Dress" from Product Selection
2. Navigate to Analysis page
3. Filter by Season: Spring
4. Filter by Customer Segment: Ladieswear
5. Browse paginated results with full product details

### Trend Analyst
"Show me all blue sweaters with specific patterns sold in January"

1. Select "Sweater" from Product Selection
2. Navigate to Analysis page
3. Set date range: 01/01 to 31/01
4. Filter Color Family: Blue
5. Filter Pattern/Style: Check, Stripe, etc.
6. Export or analyze the filtered product list

---

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Setup and installation guide
- [docs/PRD.md](docs/PRD.md) - Full product requirements and future vision
- [docs/Data-summary.md](docs/Data-summary.md) - Dataset structure and semantics
- [docs/DataModel.md](docs/DataModel.md) - Entity relationship diagrams

---

## 🛠️ Tech Stack Details

### Frontend
- **React 18**: Component-based UI framework
- **Vite**: Fast build tool and dev server
- **SAP UI5 Web Components**: Enterprise-grade UI components
- **TypeScript**: Type-safe development

### Backend
- **Fastify**: High-performance web framework
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe API development

### Database
- **PostgreSQL 16**: Relational database
- **Drizzle ORM**: Type-safe database queries
- **Connection Pooling**: Optimized for concurrent requests

---

## 🐛 Troubleshooting

### Database Connection Issues

**Cloud Database:**
```bash
# Test connection
psql -h your-db-host -p 5432 -U postgres -d fashion_db

# If using SSH tunnel/port forwarding:
ssh -L 5432:remote-db:5432 user@jumphost
```

**Verify Port Forwarding:**
```bash
# Check if port forwarding is active
netstat -an | grep 5432

# Test local connection through tunnel
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

### Frontend Issues

```bash
# Clear browser cache and localStorage
# Open DevTools -> Application -> Clear storage

# Restart dev server
cd apps/web && pnpm run dev
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes with proper TypeScript types
3. Test thoroughly (especially filter combinations)
4. Update documentation as needed
5. Submit pull request

---

## 📄 License

[License Type] - See LICENSE file for details

---

**Built with ❤️ using TypeScript, React, and PostgreSQL**
