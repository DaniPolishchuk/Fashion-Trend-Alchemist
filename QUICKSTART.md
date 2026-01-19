# Quick Start Guide

Get the Fashion Trend Alchemist running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Docker and Docker Compose installed

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

The default values work for local development. No changes needed!

### 3. Start Infrastructure

```bash
cd infra
docker-compose up -d
cd ..
```

This starts:
- PostgreSQL on port 5432
- SeaweedFS S3 on port 8333
- SeaweedFS Master on port 9333
- SeaweedFS Filer on port 8888

Verify services are running:
```bash
docker ps
```

### 4. Build Packages

```bash
pnpm build
```

This compiles TypeScript for all packages.

## Database Schema

The system uses the following tables:

### Articles
- `article_id` - Unique product identifier (varchar)
- `product_type` - Product type category
- `product_group` - Product group classification
- `pattern_style` - Pattern/style identifier
- `specific_color` - Specific color name
- `color_intensity` - Color intensity level
- `color_family` - Color family classification
- `product_family` - Product family grouping
- `customer_segment` - Target customer segment
- `style_concept` - Style concept category
- `fabric_type_base` - Base fabric type
- `detail_desc` - Detailed product description

### Transactions Train
- `t_date` - Transaction date (DATE)
- `customer_id` - Customer identifier
- `article_id` - Article identifier
- `price` - Transaction price

### Customers
- `customer_id` - Unique customer identifier
- `age` - Customer age

## Loading Data

### Load Your Data

1. Load your CSV data into PostgreSQL:
   ```bash
   # Example with psql
   psql -h localhost -U postgres -d fashion_db -c "\COPY articles FROM 'path/to/articles.csv' CSV HEADER"
   psql -h localhost -U postgres -d fashion_db -c "\COPY customers FROM 'path/to/customers.csv' CSV HEADER"
   psql -h localhost -U postgres -d fashion_db -c "\COPY transactions_train FROM 'path/to/transactions.csv' CSV HEADER"
   ```

2. Upload images to SeaweedFS (if needed):
   - Images should follow the convention: `{first_2_digits}/{article_id}.jpg`
   - Example: Article `108775015` → `10/108775015.jpg`

## Using the Database

### With Drizzle ORM

```typescript
import { db, articles, transactionsTrain } from '@fashion/db';

// Query articles
const sweaters = await db
  .select()
  .from(articles)
  .where(eq(articles.productType, 'Sweater'))
  .limit(10);

// Query transactions with date filter
const recentTransactions = await db
  .select()
  .from(transactionsTrain)
  .where(gte(transactionsTrain.tDate, new Date('2024-01-01')))
  .limit(100);
```

### Using Analytics Functions

```typescript
import { fetchTopBottomByProductType, getDistinctProductTypes } from '@fashion/db';

// Get all product types
const productTypes = await getDistinctProductTypes();

// Get top/bottom sellers
const result = await fetchTopBottomByProductType({
  productType: 'Sweater',
  metric: 'units',
  limit: 500,
  includeZero: true
});
```

## Development Workflow

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
# Format code
pnpm format

# Build all packages
pnpm build
```

## Troubleshooting

### Port Already in Use

If ports 5432 or 8333 are in use:

1. Edit `.env` to change ports
2. Update `infra/docker-compose.yml` port mappings
3. Restart services

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker logs fashion-postgres

# Verify connection manually
psql -h localhost -U postgres -d fashion_db
```

### SeaweedFS Connection Failed

```bash
# Check S3 gateway
docker logs fashion-seaweed-s3

# Verify S3 is accessible
curl http://localhost:8333
```

### Images Not Loading

1. Verify SeaweedFS is running: `docker ps | grep seaweed`
2. Check folder structure: Images should be in `{first_2_digits}/{article_id}.jpg`
3. Test S3 access manually with AWS CLI

## Package Structure

### @fashion/db
Database schemas, queries, and connection management.

### @fashion/types
Shared TypeScript type definitions for articles, customers, transactions, and analytics.

### @fashion/config
Configuration and environment variable management.

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [docs/PRD.md](docs/PRD.md) for architecture details
- Explore the codebase - it's heavily documented!
- Use the database packages in your applications

## Getting Help

- Check existing GitHub issues
- Review inline code documentation
- Read error logs: `docker-compose logs -f`

---

**Happy coding! 🚀**
