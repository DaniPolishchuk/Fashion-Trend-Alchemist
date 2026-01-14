# Product Requirements Document (PRD)
## Fashion Trend Alchemist - Analytics Platform

**Version:** 1.0.0  
**Last Updated:** January 14, 2026  
**Status:** Initial Implementation

---

## 1. Executive Summary

The Fashion Trend Alchemist is a data analytics platform designed to provide insights into fashion product performance. The system analyzes historical transaction data to identify top and bottom performing products by category, enabling data-driven merchandising decisions.

### Key Objectives

- Provide fast, accurate analytics on product performance
- Support flexible filtering by product type, date range, and sales channel
- Enable ranking by multiple metrics (units sold or revenue)
- Include comprehensive image access for visual product identification
- Support analysis of zero-sales products for inventory optimization

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                  (React Web Application)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│                  (Fastify + TypeScript)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Controller  │  │   Service    │  │  S3 Client   │     │
│  │    Layer     │→ │    Layer     │→ │   (Images)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────────┐      ┌─────────────────────┐
│   PostgreSQL DB     │      │  SeaweedFS S3       │
│   (Drizzle ORM)     │      │  (Image Storage)    │
│                     │      │                     │
│  • articles         │      │  Folder: XX/        │
│  • customers        │      │  Files: ID.jpg      │
│  • transactions     │      │                     │
└─────────────────────┘      └─────────────────────┘
```

### 2.2 Technology Stack

#### Backend
- **Runtime**: Node.js 18+ with TypeScript 5.3+
- **Framework**: Fastify 4.x (high-performance HTTP server)
- **ORM**: Drizzle ORM (type-safe SQL queries)
- **Database**: PostgreSQL 16
- **Storage**: SeaweedFS S3-compatible object storage

#### Frontend (Future)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5.x
- **UI Library**: UI5 Web Components for React
- **State Management**: TBD (React Query recommended)

#### Infrastructure
- **Package Manager**: pnpm with workspaces
- **Containerization**: Docker Compose
- **Monitoring**: Health check endpoints

---

## 3. Functional Requirements

### 3.1 Core Analytics Feature

#### FR-1: Top/Bottom Sellers Endpoint

**Endpoint**: `GET /analytics/top-bottom`

**Description**: Returns the top N and bottom N performing articles for a specified product type, ranked by units sold or revenue.

**Requirements**:
- Must support filtering by product type (name or number)
- Must support date range filtering (start and end dates)
- Must support sales channel filtering (online vs retail)
- Must support two ranking metrics: units sold (default) and revenue
- Must include articles with zero sales when `includeZero=true` (default)
- Must return configurable limit (default: 500, max: 10000)
- Must attach presigned image URLs to all results
- Must handle missing images gracefully

**Input Parameters**:

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| productTypeName | string | conditional | - | Must exist in articles table |
| productTypeNo | number | conditional | - | Must be valid product type |
| startDate | string | optional | - | ISO format YYYY-MM-DD |
| endDate | string | optional | - | ISO format YYYY-MM-DD |
| salesChannelId | number | optional | - | 1 (online) or 2 (retail) |
| metric | string | optional | "units" | "units" or "revenue" |
| limit | number | optional | 500 | 1-10000 |
| includeZero | boolean | optional | true | true or false |

**Output Schema**:

```typescript
{
  top: Array<{
    articleId: number;
    prodName: string;
    productTypeName: string;
    unitsSold: number;
    revenue: number;
    imageKey: string;
    imageUrl: string;
  }>;
  bottom: Array<{
    // Same structure as top
  }>;
}
```

**Performance Requirements**:
- Response time: < 2 seconds for 500 items
- Response time: < 5 seconds for 1000 items
- Support concurrent requests: 100+ simultaneous users

**Error Handling**:
- 400: Invalid parameters (missing product type, invalid dates)
- 500: Database query failure, S3 connection failure

### 3.2 Image Access

#### FR-2: Image URL Generation

**Description**: Generate presigned URLs for article images stored in SeaweedFS.

**Requirements**:
- Follow folder structure: `{first_2_digits}/{article_id}.jpg`
- URLs must be valid for 1 hour (configurable)
- Handle missing images without failing entire request
- Support batch URL generation for efficiency

**Image Path Convention**:
- Article ID: 108775015 → Path: `10/108775015.jpg`
- Article ID: 118458003 → Path: `11/118458003.jpg`

### 3.3 Health Monitoring

#### FR-3: Health Check Endpoints

**Endpoints**:
- `GET /health`: System-wide health
- `GET /analytics/health`: Analytics module health

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-14T13:00:00.000Z",
  "uptime": 3600.5
}
```

---

## 4. Data Model

### 4.1 Database Schema

#### Articles Table

```sql
CREATE TABLE articles (
  article_id INTEGER PRIMARY KEY,
  product_code INTEGER NOT NULL,
  prod_name VARCHAR(255) NOT NULL,
  product_type_no INTEGER NOT NULL,
  product_type_name VARCHAR(100) NOT NULL,
  product_group_name VARCHAR(100),
  graphical_appearance_no INTEGER,
  graphical_appearance_name VARCHAR(100),
  colour_group_code INTEGER,
  colour_group_name VARCHAR(100),
  perceived_colour_value_id INTEGER,
  perceived_colour_value_name VARCHAR(100),
  perceived_colour_master_id INTEGER,
  perceived_colour_master_name VARCHAR(100),
  department_no INTEGER,
  department_name VARCHAR(100),
  index_code VARCHAR(10),
  index_name VARCHAR(100),
  index_group_no INTEGER,
  index_group_name VARCHAR(100),
  section_no INTEGER,
  section_name VARCHAR(100),
  garment_group_no INTEGER,
  garment_group_name VARCHAR(100),
  detail_desc TEXT
);
```

#### Customers Table

```sql
CREATE TABLE customers (
  customer_id VARCHAR(50) PRIMARY KEY,
  fn VARCHAR(255),
  active BOOLEAN,
  club_member_status VARCHAR(50),
  fashion_news_frequency VARCHAR(50),
  age INTEGER,
  postal_code VARCHAR(20)
);
```

#### Transactions Table

```sql
CREATE TABLE transactions_train (
  t_dat DATE NOT NULL,
  customer_id VARCHAR(50) NOT NULL REFERENCES customers(customer_id),
  article_id INTEGER NOT NULL REFERENCES articles(article_id),
  price NUMERIC(10,2) NOT NULL,
  sales_channel_id INTEGER NOT NULL
);

-- Performance indexes
CREATE INDEX idx_transactions_article_id ON transactions_train(article_id);
CREATE INDEX idx_transactions_t_dat ON transactions_train(t_dat);
CREATE INDEX idx_transactions_sales_channel ON transactions_train(sales_channel_id);
CREATE INDEX idx_transactions_customer_id ON transactions_train(customer_id);
```

### 4.2 Analytics Query Logic

The top/bottom sellers query uses a complex SQL pattern with CTEs:

1. **filtered_articles**: Select articles matching product type
2. **agg**: Aggregate transactions per article (count units, sum revenue)
3. **ranked**: Assign descending and ascending ranks using RANK() window function
4. **Final SELECT**: UNION top N (rdesc <= limit) and bottom N (rasc <= limit)

**Key Behaviors**:
- RANK() assigns same rank to ties (e.g., 5 articles with 100 units all rank #1)
- includeZero=true uses LEFT JOIN (includes articles with no transactions)
- includeZero=false uses INNER JOIN (excludes articles with no transactions)
- Secondary sort by units_sold/revenue ensures stable ranking

---

## 5. Non-Functional Requirements

### 5.1 Performance

- API response time: 95th percentile < 2s
- Database query optimization via indexes
- Connection pooling (max 10 connections)
- Efficient batch image URL generation

### 5.2 Scalability

- Horizontal scaling via stateless API design
- Database read replicas for high query load
- CDN for image delivery (future)
- Caching layer (Redis, future)

### 5.3 Security

- Environment-based configuration (no hardcoded secrets)
- Presigned URLs for temporary image access
- CORS configuration for trusted origins
- Input validation and sanitization
- SQL injection prevention via parameterized queries

### 5.4 Maintainability

- Comprehensive inline code documentation
- TypeScript for type safety
- Modular architecture (controller/service/repository pattern)
- Automated testing (unit + integration)
- Database migrations via Drizzle Kit

### 5.5 Reliability

- Graceful shutdown on SIGTERM/SIGINT
- Database connection error handling
- Health check endpoints for monitoring
- Logging with structured format (Pino)

---

## 6. API Specifications

### 6.1 Base URL

- Development: `http://localhost:3000`
- Production: TBD

### 6.2 Authentication

- Current: None (local development)
- Future: API key or JWT-based authentication

### 6.3 Rate Limiting

- Current: None
- Future: 1000 requests/minute per client

### 6.4 Versioning

- Current: v1 (implicit)
- Future: URL-based versioning `/v1/analytics/...`

---

## 7. Deployment Strategy

### 7.1 Development Environment

```bash
# Local development with hot reload
pnpm dev:api

# Infrastructure services via Docker Compose
cd infra && docker-compose up -d
```

### 7.2 Production Environment (Future)

- **API**: Containerized deployment (Kubernetes or AWS ECS)
- **Database**: Managed PostgreSQL (AWS RDS, Azure Database)
- **Storage**: Managed S3 (AWS S3, MinIO cluster)
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK stack or CloudWatch

---

## 8. Testing Strategy

### 8.1 Unit Tests

- Repository functions (mock database)
- Service functions (mock repository + S3)
- Controller validation logic

### 8.2 Integration Tests

- End-to-end API endpoint tests
- Database query correctness
- S3 presigned URL generation

### 8.3 Performance Tests

- Load testing with k6 or Artillery
- Query optimization validation
- Concurrent user simulation

---

## 9. Future Enhancements

### Phase 2 (Q2 2026)

- [ ] Web frontend with React + UI5
- [ ] Real-time dashboard with WebSockets
- [ ] Export to CSV/Excel functionality
- [ ] Advanced filtering (color, department, price range)
- [ ] Comparison between time periods

### Phase 3 (Q3 2026)

- [ ] Machine learning trend predictions
- [ ] Recommendation engine
- [ ] Customer segmentation analytics
- [ ] Inventory optimization suggestions

### Phase 4 (Q4 2026)

- [ ] Multi-tenant support
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Data warehouse integration

---

## 10. Success Metrics

### Technical Metrics

- API uptime: 99.9%
- Query response time: < 2s (95th percentile)
- Test coverage: > 80%
- Zero critical security vulnerabilities

### Business Metrics

- User adoption rate
- Query volume per day
- Time saved vs manual analysis
- Decision accuracy improvement

---

## 11. Risks and Mitigation

### Risk 1: Large Dataset Performance

**Impact**: High  
**Probability**: Medium  
**Mitigation**:
- Implement materialized views for pre-aggregated data
- Add database indexes on frequently queried columns
- Consider partitioning transactions table by date

### Risk 2: Image Storage Costs

**Impact**: Medium  
**Probability**: Medium  
**Mitigation**:
- Implement image CDN with caching
- Compress images to optimal size
- Lazy load images in frontend

### Risk 3: Data Quality Issues

**Impact**: High  
**Probability**: Low  
**Mitigation**:
- Add data validation on ingestion
- Implement data quality monitoring
- Regular data audits

---

## 12. Open Questions

1. Should we support real-time data or batch updates?
2. What is the desired data retention policy?
3. Should we implement caching (Redis) for frequent queries?
4. Do we need multi-language support for product names?
5. Should zero-sales products be ranked separately?

---

## 13. Approval

| Stakeholder | Role | Status | Date |
|-------------|------|--------|------|
| Product Owner | Approval | Pending | - |
| Tech Lead | Review | Pending | - |
| Engineering | Implementation | In Progress | 2026-01-14 |

---

**Document Control**

- **Author**: Development Team
- **Reviewers**: TBD
- **Next Review**: 2026-02-01