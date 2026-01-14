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

Verify services are running:
```bash
docker ps
```

### 4. Build Packages

```bash
pnpm build
```

This compiles TypeScript for all packages.

### 5. Start API Server

```bash
pnpm dev:api
```

The API will start on `http://localhost:3000`

### 6. Test the API

Open a new terminal and test:

```bash
# Health check
curl http://localhost:3000/health

# Analytics health
curl http://localhost:3000/analytics/health

# Top/bottom sellers (will return empty initially - needs data)
curl "http://localhost:3000/analytics/top-bottom?productTypeName=Sweater"
```

## Loading Data

### Option 1: Sample Data (Quick Test)

```bash
pnpm --filter @fashion/scripts seed
```

This loads a few sample articles and transactions for testing.

### Option 2: Your Data

1. Load your CSV data into PostgreSQL:
   ```bash
   # Example with psql
   psql -h localhost -U postgres -d fashion_db -c "\COPY articles FROM 'path/to/articles.csv' CSV HEADER"
   psql -h localhost -U postgres -d fashion_db -c "\COPY customers FROM 'path/to/customers.csv' CSV HEADER"
   psql -h localhost -U postgres -d fashion_db -c "\COPY transactions_train FROM 'path/to/transactions.csv' CSV HEADER"
   ```

2. Upload images to SeaweedFS:
   ```bash
   pnpm --filter @fashion/scripts migrate-images
   ```

## Test with Real Data

```bash
# Top 500 sweaters by units sold (including zero sales)
curl "http://localhost:3000/analytics/top-bottom?productTypeName=Sweater"

# Top 100 trousers by revenue
curl "http://localhost:3000/analytics/top-bottom?productTypeName=Trousers&metric=revenue&limit=100"

# Filter by date range
curl "http://localhost:3000/analytics/top-bottom?productTypeName=Sweater&startDate=2023-01-01&endDate=2023-12-31"

# Online sales only
curl "http://localhost:3000/analytics/top-bottom?productTypeName=Dress&salesChannelId=1"
```

## Development Workflow

### Watch Mode

```bash
# API with hot reload
pnpm dev:api

# Specific package
pnpm --filter @fashion/db dev
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
# Format code
pnpm format

# Run tests
pnpm test
```

## Troubleshooting

### Port Already in Use

If ports 3000, 5432, or 8333 are in use:

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
2. Check image migration: `pnpm --filter @fashion/scripts migrate-images`
3. Test S3 access manually with AWS CLI

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [docs/PRD.md](docs/PRD.md) for architecture details
- Explore the codebase - it's heavily documented!
- Build the React frontend (coming soon)

## Getting Help

- Check existing GitHub issues
- Review inline code documentation
- Read error logs: `docker-compose logs -f`

---

**Happy coding! 🚀**