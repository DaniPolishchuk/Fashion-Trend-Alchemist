# Technical Architecture: Fashion Trend Alchemist

## Project Summary

**Fashion Trend Alchemist** is an AI-powered fashion analytics platform built as a **pnpm monorepo**. It analyzes historical product/sales data to identify trends and uses **inverse design** capabilities powered by SAP AI Core's RPT-1 model to predict optimal design attributes for future best-sellers. The platform also generates product visualizations using a custom image generation API.

---

## High-Level Technical Overview

### What the System Does

The Fashion Trend Alchemist solves a unique problem in fashion retail: instead of predicting how well existing products will sell, it works backwards to generate the _design attributes_ of products that would sell well. This "inverse design" approach combines historical sales analysis with AI-powered attribute prediction and visualization.

The system ingests the H&M fashion dataset containing ~105,000 articles with attributes (color, pattern, style, fabric) and ~31 million sales transactions. Users define a "context cohort" by selecting product types and time periods, then the system identifies top and bottom performers based on sales velocity. A Vision LLM extracts detailed design attributes from product images, and finally, SAP AI Core's RPT-1 model predicts optimal attribute combinations for new designs targeting a specific success level.

### Architecture Philosophy

The application follows a **modern full-stack TypeScript architecture** with strict type safety across all layers. The pnpm monorepo structure allows shared code (types, database schemas, configuration) to be consumed by both frontend and backend without duplication. This ensures that API contracts, database models, and validation schemas stay synchronized.

The backend uses **Fastify** for its exceptional JSON serialization performance and plugin architecture. Routes are organized into modular files by domain (projects, enrichment, RPT-1, collections), with business logic extracted into dedicated service modules. This separation keeps route handlers thin and testable.

The frontend is a **React single-page application** built with Vite for fast development iteration. SAP UI5 Web Components provide enterprise-grade UI elements with SAP's design language, while TanStack Query manages server state with built-in caching, deduplication, and background refetching.

### Data Flow Architecture

Data flows through the system in distinct phases:

**Phase 1 - Context Definition**: Users browse a hierarchical product taxonomy and select target product types. They configure filters (season, color family, pattern) to narrow the cohort. The system calculates "velocity scores" for each matching article - a metric combining sales volume with availability period to measure sales performance fairly.

**Phase 2 - Data Enrichment**: The top 25 and bottom 25 articles by velocity are locked into the project context. A Vision LLM (GPT-4.1) processes each article's product image to extract structured attributes based on an LLM-generated ontology schema. This enrichment runs in parallel with configurable concurrency, reporting progress via Server-Sent Events. The Vision LLM also detects potential product type mismatches (e.g., an image labeled "skirt" that actually shows pants).

**Phase 3 - Inverse Design**: Users configure which attributes to "lock" (fixed values) and which to let the AI predict. The enriched context data, along with velocity scores, feeds into SAP AI Core's RPT-1 model. RPT-1 analyzes patterns between attribute combinations and success scores, then predicts optimal values for the unlocked attributes to achieve a target success level.

**Phase 4 - Visualization**: The system generates three product images (front view, back view, model/lifestyle) using Z-Image Turbo. An LLM first generates structured prompt components ensuring visual consistency across views - all three images share an identical product description. Images upload to SeaweedFS/S3 storage, and the system generates marketing sales copy in parallel.

### External Service Integration

The system integrates with multiple AI services, each accessed via OAuth2 authentication with 11-hour token caching:

- **LiteLLM Proxy**: Routes requests to GPT-4.1 for ontology generation, attribute extraction (Vision), prompt generation, and sales text creation
- **SAP AI Core**: Hosts the RPT-1 model for statistical attribute prediction based on context patterns
- **Z-Image Turbo**: Generates fashion product images from text prompts with consistent quality

### Database Design

PostgreSQL stores both static reference data (H&M articles, transactions, customers) and dynamic application state (projects, enriched attributes, generated designs). The schema uses JSONB columns extensively for flexible, schema-less data like ontology definitions, enriched attributes, and multi-image status tracking.

Key performance optimizations include composite indexes on frequently filtered columns, a covering index for filter queries, and functional indexes for date-based filtering. An optional Redis layer provides 15-30x faster response times for repeated queries.

### Caching Strategy

The system implements multi-level caching:

- **Redis (Backend)**: Caches filter options (15 min TTL), product listings (5 min TTL), and taxonomy data. Cache keys are generated from query parameter hashes for efficient invalidation.
- **TanStack Query (Frontend)**: Manages client-side cache with configurable stale times. Queries deduplicate automatically, and background refetching keeps data fresh without blocking the UI.
- **OAuth Token Cache**: External API tokens cache for 11 hours (tokens valid for 12 hours) to minimize authentication overhead.

### Real-Time Communication

Long-running operations use different real-time strategies:

- **Enrichment Progress**: Server-Sent Events (SSE) stream progress updates as each article is processed. The frontend displays a progress bar with current article ID.
- **Image Generation**: The frontend polls the image status endpoint every 5 seconds until all three views complete. Each view has independent status tracking (pending → generating → completed/failed).

### Error Handling and Resilience

The system implements retry logic with exponential backoff for external API calls. Vision LLM enrichment retries failed items up to 3 times. Image generation retries once per view. If prompt generation via LLM fails twice, the system falls back to template-based prompt generation using the same category and model profile logic.

Failed enrichment items are tracked individually, allowing users to retry specific failures without reprocessing successful items. Project-level status tracks overall enrichment state (idle, running, completed, failed).

---

## Tech Stack

| Layer               | Technology                                                           |
| ------------------- | -------------------------------------------------------------------- |
| **Frontend**        | React 18, Vite 6, TypeScript, SAP UI5 Web Components, TanStack Query |
| **Backend**         | Node.js 18+, Fastify 5, TypeScript (ESM)                             |
| **Database**        | PostgreSQL 16 (cloud-hosted)                                         |
| **ORM**             | Drizzle ORM 0.29.5                                                   |
| **Caching**         | Redis (ioredis)                                                      |
| **AI/ML**           | GPT-4.1 via LiteLLM proxy, SAP AI Core RPT-1, Z-Image Turbo          |
| **Storage**         | S3/SeaweedFS for generated images                                    |
| **Package Manager** | pnpm 8+ with workspaces                                              |

---

## Monorepo Structure

```
fashion-trend-alchemist/
├── apps/
│   ├── api-lite/          # Fastify REST API server
│   │   ├── src/
│   │   │   ├── main.ts            # Entry point, core endpoints
│   │   │   ├── routes/            # Modular route handlers
│   │   │   │   ├── projects.ts
│   │   │   │   ├── enrichment.ts
│   │   │   │   ├── rpt1.ts
│   │   │   │   ├── collections.ts
│   │   │   │   └── ...
│   │   │   └── services/          # Business logic services
│   │   │       ├── cache.ts           # Redis caching
│   │   │       ├── enrichment.ts      # Vision LLM processing
│   │   │       ├── imageGeneration.ts # Z-Image API integration
│   │   │       ├── promptGeneration.ts # LLM prompt assembly
│   │   │       ├── salesTextGeneration.ts
│   │   │       └── s3.ts              # Object storage
│   └── web/               # React SPA frontend
│       └── src/
│           ├── pages/             # Route-based pages
│           ├── components/        # Reusable UI components
│           ├── services/api/      # API client layer
│           └── hooks/             # Custom React hooks
├── packages/
│   ├── db/                # Database layer
│   │   └── src/
│   │       ├── client.ts          # PostgreSQL connection (pg)
│   │       ├── schema/            # Drizzle table schemas
│   │       └── queries/           # Query functions
│   ├── types/             # Shared TypeScript types + Zod schemas
│   └── config/            # Environment configuration
└── pnpm-workspace.yaml    # Workspace definition
```

---

## Key Data Flows

### 1. Product Selection → Context Building → Enrichment

- User selects product types from taxonomy
- Configures filters (season, attributes)
- System calculates velocity scores (sales/availability)
- Locks context and creates project

### 2. Vision LLM Enrichment Pipeline

- Processes product images in parallel (configurable concurrency)
- Extracts ontology attributes via GPT-4.1 Vision
- Detects product type mismatches with confidence scores

### 3. RPT-1 Inverse Design Flow

- User locks specific attributes, marks others for AI prediction
- Builds context rows from enriched data + velocity scores
- Calls SAP AI Core RPT-1 API for attribute prediction
- Generates 3 product images (front/back/lifestyle) via Z-Image Turbo

### 4. Image Generation Pipeline

- Prompt generation via LLM (component-based for consistency)
- Sequential generation: front → back → model views
- Upload to SeaweedFS/S3
- Async status updates to database

---

## Database Schema (Core Tables)

| Table                   | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `articles`              | Product catalog with attributes (color, pattern, style, etc.)      |
| `transactions_train`    | Historical sales data (article_id, date, price)                    |
| `customers`             | Customer demographics                                              |
| `projects`              | User projects with scope, ontology schema, enrichment tracking     |
| `project_context_items` | Per-project article data with velocity scores, enriched attributes |
| `generated_designs`     | AI-generated designs with images, prompts, sales text              |
| `collections`           | User-curated design collections                                    |

---

## External Integrations

| Service           | Purpose                                                 | Authentication            |
| ----------------- | ------------------------------------------------------- | ------------------------- |
| **LiteLLM Proxy** | Vision LLM (GPT-4.1) for attribute extraction & prompts | API Key                   |
| **SAP AI Core**   | RPT-1 model for attribute prediction                    | OAuth2 Client Credentials |
| **Z-Image Turbo** | Fashion image generation                                | OAuth2 Client Credentials |
| **SeaweedFS/S3**  | Object storage for generated images                     | AWS S3 credentials        |
| **Redis**         | Optional caching layer                                  | Connection URL            |

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph SAPTech ["SAP Technologies"]
        direction TB
        subgraph SAPBTP ["SAP Business Technology Platform"]
            SAPAI["SAP AI Core<br/>RPT-1 Model<br/>(Attribute Prediction)"]
            Kyma["SAP BTP Kyma Runtime"]
            ZImage["Z-Image Turbo<br/>(Image Generation)"]
            XSUAA["SAP XSUAA<br/>(Authentication)"]
            Approuter["SAP Approuter<br/>(Reverse Proxy)"]
            Kyma --> ZImage
        end
        UI5["SAP UI5<br/>Web Components"]
    end

    subgraph Client ["Frontend (React 18 + Vite 6)"]
        UI5 --> Pages
        Pages["Pages<br/>Home | ProductSelection<br/>ContextBuilder | ProjectHub<br/>DesignDetail"]
        APIClient["TanStack Query<br/>(State & Cache)"]
        Pages --> APIClient
    end

    subgraph API ["Backend (Fastify 5 / Node.js 18+)"]
        direction TB
        Main["main.ts<br/>Core Endpoints"]

        subgraph Routes ["Route Modules"]
            R1["projects.ts"]
            R2["enrichment.ts"]
            R3["rpt1.ts"]
            R4["collections.ts"]
            R5["context-items.ts"]
            R6["design-name.ts"]
        end

        subgraph Services ["Service Layer"]
            S1["cache.ts"]
            S2["enrichment.ts<br/>(Vision LLM)"]
            S3["promptGeneration.ts"]
            S4["imageGeneration.ts"]
            S5["s3.ts"]
            S6["salesTextGeneration.ts"]
        end

        Main --> Routes
        Routes --> Services
    end

    subgraph Data ["Data & Storage Layer"]
        DB[("PostgreSQL 16<br/>Drizzle ORM")]
        Redis[("Redis<br/>Optional Cache")]
        S3Store[("SeaweedFS / S3<br/>Image Storage")]
    end

    subgraph Packages ["Shared Packages (pnpm workspace)"]
        PKG_DB["@fashion/db<br/>Schema + Queries"]
        PKG_Types["@fashion/types<br/>Zod Schemas"]
        PKG_Config["@fashion/config<br/>Environment"]
    end

    subgraph External ["External AI Services (Non-SAP)"]
        direction TB
        LiteLLM["LiteLLM Proxy"]
        GPT["GPT-4.1 Vision/Text<br/>(Enrichment, Prompts,<br/>Sales Text, Names)"]
        LiteLLM --> GPT
    end

    %% Production routing through SAP Approuter
    Approuter -->|"JWT Auth"| XSUAA
    Approuter -->|"Proxy"| API

    %% Client to API - REST and SSE
    APIClient <-->|"REST API<br/>Port 3001"| Main
    APIClient -.->|"SSE<br/>(Enrichment Progress)"| R2

    %% Direct image loading from frontend to S3
    Client -.->|"Direct Image URLs"| S3Store

    %% API to Data
    Services -->|"Drizzle ORM"| DB
    S1 <-->|"ioredis"| Redis
    S5 <-->|"S3 Client"| S3Store

    %% API to External (OAuth2 / API Keys)
    S2 -->|"API Key"| LiteLLM
    S3 -->|"API Key"| LiteLLM
    S6 -->|"API Key"| LiteLLM
    R3 -->|"OAuth2"| SAPAI
    S4 -->|"OAuth2"| ZImage

    %% Packages usage
    Client -.->|"workspace import"| PKG_Types
    API -.->|"workspace import"| Packages
    PKG_DB -->|"pg client"| DB

    %% Styles - SAP Gold (#F0AB00) and SAP Blue (#0070F2)
    classDef saptech fill:#0070F2,stroke:#00358E,color:#fff,stroke-width:2px
    classDef sapbtp fill:#00358E,stroke:#0070F2,color:#fff,stroke-width:2px
    classDef frontend fill:#61DAFB,stroke:#333,color:#000
    classDef backend fill:#3178C6,stroke:#333,color:#fff
    classDef database fill:#336791,stroke:#333,color:#fff
    classDef external fill:#FF6B35,stroke:#333,color:#fff
    classDef packages fill:#4CAF50,stroke:#333,color:#fff

    class SAPTech,UI5 saptech
    class SAPBTP,SAPAI,Kyma,ZImage,XSUAA,Approuter sapbtp
    class Client frontend
    class API,Routes,Services backend
    class DB,Redis,S3Store database
    class LiteLLM,GPT,External external
    class PKG_DB,PKG_Types,PKG_Config packages
```

### SAP Technologies Used

| Technology | Purpose | Layer |
|------------|---------|-------|
| **SAP UI5 Web Components** | Enterprise UI component library with SAP Fiori design | Frontend |
| **SAP AI Core** | ML platform hosting RPT-1 model for attribute prediction | AI/ML |
| **SAP BTP Kyma Runtime** | Kubernetes-based runtime for Z-Image Turbo microservice | Infrastructure |
| **SAP XSUAA** | OAuth2 authentication service (production) | Security |
| **SAP Approuter** | Reverse proxy handling auth and routing (production) | Infrastructure |
```

---

## Detailed Component Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant API as Fastify API
    participant DB as PostgreSQL
    participant LLM as LiteLLM (GPT-4.1)
    participant RPT as SAP AI Core (RPT-1)
    participant IMG as Z-Image Turbo
    participant S3 as SeaweedFS

    rect rgb(230, 245, 255)
        Note over U,DB: 1. Project Setup Flow
        U->>FE: Select Product Types
        FE->>API: GET /api/taxonomy
        API->>DB: Query distinct product types
        DB-->>API: Product taxonomy
        API-->>FE: Taxonomy tree

        U->>FE: Configure Filters & Lock Context
        FE->>API: POST /api/projects/:id/lock-context
        API->>DB: Calculate velocity scores
        API->>DB: Store project_context_items
        API-->>FE: Project created
    end

    rect rgb(255, 245, 230)
        Note over U,S3: 2. Enrichment Flow
        U->>FE: Start Enrichment
        FE->>API: POST /api/projects/:id/start-enrichment

        loop For each context item (parallel)
            API->>S3: Fetch product image
            S3-->>API: Base64 image
            API->>LLM: Vision API (extract attributes)
            LLM-->>API: JSON attributes + mismatch score
            API->>DB: Update enriched_attributes
        end

        API-->>FE: SSE progress updates
    end

    rect rgb(245, 255, 230)
        Note over U,S3: 3. Design Generation Flow (RPT-1)
        U->>FE: Configure locked/AI attributes
        FE->>API: POST /api/projects/:id/rpt1-predict

        API->>DB: Fetch enriched context rows
        API->>RPT: POST /predict (OAuth2)
        RPT-->>API: Predicted attributes

        API->>DB: Create generated_design record
        API-->>FE: Design ID (async image gen started)

        par Async Image Generation
            API->>LLM: Generate prompts (front/back/model)
            LLM-->>API: Structured prompts

            loop For each view
                API->>IMG: POST /generate (prompt)
                IMG-->>API: Image buffer
                API->>S3: Upload image
                S3-->>API: Image URL
                API->>DB: Update generated_images
            end
        and Async Sales Text
            API->>LLM: Generate sales copy
            LLM-->>API: Marketing text
            API->>DB: Update sales_text
        end
    end

    U->>FE: View Generated Design
    FE->>API: GET /api/projects/:id/generated-designs/:designId
    API->>DB: Fetch design with images
    DB-->>API: Design data
    API-->>FE: Design + image URLs
    FE->>S3: Load images directly
```

---

## Key Architectural Patterns

### 1. Monorepo with Workspace Packages

Shared code via `@fashion/db`, `@fashion/types`, `@fashion/config` using pnpm workspace protocol.

### 2. Layered API Architecture

Routes → Services → Database with clear separation of concerns.

### 3. Async Background Processing

Image/text generation runs asynchronously after returning design ID to client.

### 4. Component-Based Prompt Generation

LLM generates reusable prompt components (productDescription, viewPrefix, etc.) ensuring visual consistency across image views.

### 5. OAuth2 Token Caching

11-hour token cache for external APIs to minimize auth overhead.

### 6. SSE for Progress Tracking

Server-Sent Events for real-time enrichment progress updates.

### 7. Optimistic UI with Status Polling

Frontend polls for async operation completion (image generation).

---

## Environment Variables

Key configuration (see `.env.example` for full list):

```bash
# Database
PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

# API Server
API_PORT=3001
API_HOST=0.0.0.0

# Redis (optional)
REDIS_URL=redis://localhost:6379

# LLM Integration
LITELLM_PROXY_URL, LITELLM_API_KEY, VISION_LLM_MODEL

# SAP AI Core (RPT-1)
AI_API_URL, AUTH_URL, CLIENT_ID, CLIENT_SECRET, RESOURCE_GROUP

# Image Generation
IMAGE_GEN_TOKEN_URL, IMAGE_GEN_CLIENT_ID, IMAGE_GEN_CLIENT_SECRET, IMAGE_GEN_API_URL

# S3/SeaweedFS
S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET
```

---

## Development Commands

```bash
# Start both API and web app
pnpm run dev

# Start individually
cd apps/api-lite && pnpm run dev  # Port 3001
cd apps/web && pnpm run dev       # Port 5173

# Build all packages
pnpm build

# Database operations
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Apply migrations
pnpm db:studio     # Open Drizzle Studio GUI

# Format code
pnpm format
```
