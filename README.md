# Fashion Trend Alchemist

A TypeScript-based fashion analytics platform for analyzing product trends and sales data.

## 🏗️ Architecture

### Monorepo Structure

```
fashion-trend-alchemist/
├── packages/
│   ├── db/               # Database schema, migrations, and queries
│   ├── types/            # Shared TypeScript types
│   └── config/           # Configuration and environment handling
├── infra/                # Docker Compose infrastructure
├── correration/          # Correlation analysis scripts
└── docs/                 # Documentation
```

### Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Package Manager**: pnpm (workspaces)
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Object Storage**: SeaweedFS (S3-compatible)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Docker & Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fashion-trend-alchemist
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure services**
   ```bash
   cd infra
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL on port 5432
   - SeaweedFS S3 gateway on port 8333
   - SeaweedFS master on port 9333
   - SeaweedFS filer on port 8888

5. **Run database migrations**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

## 🗄️ Database Schema

### Updated Schema (2026)

The database schema has been aligned with the new data structure:

#### Articles Table
- `article_id` (varchar, primary key) - Unique article identifier
- `product_type` (varchar) - Product type category
- `product_group` (varchar) - Product group classification
- `pattern_style` (varchar) - Pattern/style identifier
- `specific_color` (varchar) - Specific color name
- `color_intensity` (varchar) - Color intensity level
- `color_family` (varchar) - Color family classification
- `product_family` (varchar) - Product family grouping
- `customer_segment` (varchar) - Target customer segment
- `style_concept` (varchar) - Style concept category
- `fabric_type_base` (varchar) - Base fabric type
- `detail_desc` (text) - Detailed product description

#### Transactions Train Table
- `t_date` (date) - Transaction date
- `customer_id` (varchar) - Customer identifier
- `article_id` (varchar) - Article identifier (FK to articles)
- `price` (numeric) - Transaction price

#### Customers Table
- `customer_id` (varchar, primary key) - Unique customer identifier
- `age` (integer) - Customer age

### Indexes

Optimized for analytics queries:
- `idx_transactions_article_id` on `transactions_train(article_id)`
- `idx_transactions_t_date` on `transactions_train(t_date)`
- `idx_transactions_customer_id` on `transactions_train(customer_id)`

## 🖼️ Image Storage

Images are stored in SeaweedFS following this structure:

```
bucket: images
├── 10/
│   ├── 108775015.jpg
│   ├── 108775044.jpg
│   └── 108775051.jpg
├── 11/
│   ├── 110065001.jpg
│   └── 118458003.jpg
└── ...
```

**Convention:**
- Folder name: First 2 digits of article ID
- File name: Article ID + `.jpg`
- Access: Via S3-compatible presigned URLs

## 📦 Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @fashion/db build
pnpm --filter @fashion/types build
pnpm --filter @fashion/config build
```

## 🔧 Development Scripts

```bash
# Generate database types
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Format code
pnpm format
```

## 🐳 Docker Services

```bash
# Start all services
cd infra && docker-compose up -d

# Start with pgAdmin
cd infra && docker-compose --profile admin up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

## 📝 Database Migrations

The project uses Drizzle Kit for schema management:

1. **Modify schema** in `packages/db/src/schema/*.ts`
2. **Generate migration**: `pnpm db:generate`
3. **Apply migration**: `pnpm db:migrate`
4. **Inspect schema**: `pnpm db:studio`

## 🔐 Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `PGHOST`, `PGPORT`, `PGDATABASE`: PostgreSQL connection
- `S3_ENDPOINT`, `S3_BUCKET`: SeaweedFS configuration  
- `NODE_ENV`: Environment (development/production)

## 📚 Package Structure

### @fashion/db
Database schemas, queries, and connection management.
- Drizzle ORM schemas for articles, customers, and transactions
- Optimized analytics queries for trend analysis
- Connection pooling and client management

### @fashion/types
Shared TypeScript type definitions.
- Domain types for articles, customers, and transactions
- Analytics query and result types
- Ensures type safety across the monorepo

### @fashion/config
Configuration and environment variable management.
- Centralized configuration loading
- Type-safe environment variables
- Constants and defaults

## 📚 Documentation

- [Product Requirements](docs/PRD.md) - Detailed specifications

## 🤝 Contributing

1. Create a feature branch
2. Make changes with proper documentation
3. Write tests for new functionality
4. Submit pull request

## 📄 License

[License Type] - See LICENSE file for details

## 🆘 Support

For issues and questions:
- Create a GitHub issue
- Check existing documentation
- Review code comments (extensively documented)

---

**Built with ❤️ using TypeScript and Drizzle ORM**
