## Collection Mocks Implementation

### Overview

The collections feature currently uses **mock data** to demonstrate the UI/UX for the home page collections grid. This mock implementation needs to be replaced with actual user-generated collections functionality when the real collections feature is implemented.

### Mock Data Components

#### 1. Database Seed Script (`packages/db/src/seeds/collections.seed.ts`)

**Location**: `packages/db/src/seeds/collections.seed.ts`
**Purpose**: Creates sample collections with mock generated designs for testing

**Key Mock Elements**:

- **Hardcoded User ID**: `'00000000-0000-0000-0000-000000000000'` - All mock collections are assigned to this fake user
- **Mock Collections Data**: Array of 6 predefined collections:
  - "Summer 2024 Essentials" (8 items)
  - "Urban Streetwear Collection" (12 items)
  - "Minimalist Classics" (5 items)
  - "Bohemian Vibes" (3 items)
  - "Athletic Performance" (10 items)
  - "Evening Elegance" (6 items)
- **Placeholder Images**: Uses `https://via.placeholder.com/400x600/7E57C2/FFFFFF?text=Design` for all generated design images
- **Mock Generated Designs**: Creates fake designs with hardcoded attributes (style, color, material, size)
- **Mock Project Creation**: Creates a "Mock Project for Collections" if no projects exist

**What to Remove/Change**:

- Remove the entire seed script when real collections are implemented
- Remove hardcoded user ID constant
- Remove mock collections array
- Remove placeholder image URLs
- Remove mock project creation logic

#### 2. API Route (`apps/api-lite/src/routes/collections.ts`)

**Location**: `apps/api-lite/src/routes/collections.ts`
**Purpose**: Serves mock collections data to the frontend

**Key Mock Elements**:

- **Hardcoded User ID**: Same `'00000000-0000-0000-0000-000000000000'` used to filter collections
- **Mock Data Query**: Queries seeded mock data instead of user-specific collections

**What to Remove/Change**:

- Replace hardcoded user ID with actual user authentication/session management
- Update query to filter by authenticated user's ID instead of hardcoded value
- The SQL queries and response structure can remain the same, just need real user context

#### 3. Frontend Implementation (`apps/web/src/pages/Home.tsx`)

**Location**: `apps/web/src/pages/Home.tsx`
**Purpose**: Displays collections in a responsive grid layout

**Mock Elements**:

- **Static "Created 2 days ago" text**: Hardcoded creation time display
- **Console.log click handler**: Collections are clickable but only log to console
- **Mock image error handling**: Shows product icon fallback for broken placeholder images

**What to Remove/Change**:

- Replace hardcoded "Created 2 days ago" with actual `createdAt` timestamp formatting
- Implement real collection detail navigation instead of console.log
- Update click handlers to navigate to actual collection detail pages
- The grid layout and image thumbnail logic can remain as-is

#### 4. Database Schema (Keep - Already Production Ready)

**Location**: `packages/db/src/schema/collections.ts`
**Status**: ✅ **Production Ready - No Changes Needed**

The database schema is already properly designed for production:

- `collections` table with proper user relationships
- `collection_items` junction table for many-to-many design relationships
- Proper foreign key constraints and UUIDs

#### 5. Type Definitions (Keep - Already Production Ready)

**Location**: `packages/types/src/collections.ts`
**Status**: ✅ **Production Ready - No Changes Needed**

The TypeScript types are already properly structured for real data.

### Implementation Replacement Checklist

When implementing real collections functionality, the following changes are needed:

**Backend Changes**:

- [ ] Remove `packages/db/src/seeds/collections.seed.ts` entirely
- [ ] Update `apps/api-lite/src/routes/collections.ts` to use authenticated user ID instead of hardcoded value
- [ ] Add user authentication/session management to API routes
- [ ] Add collection CRUD endpoints (create, update, delete collections)
- [ ] Add collection item management endpoints (add/remove designs from collections)

**Frontend Changes**:

- [ ] Replace console.log click handlers in `Home.tsx` with real navigation
- [ ] Add collection creation UI (modal or separate page)
- [ ] Add collection detail/management pages
- [ ] Replace hardcoded "Created 2 days ago" with dynamic date formatting using `createdAt`
- [ ] Add collection editing/deletion functionality
- [ ] Add drag-and-drop or selection UI for adding designs to collections

**Database Changes**:

- [ ] Remove all seeded mock data (run database reset/migration)
- [ ] No schema changes needed - existing structure is production-ready

**Testing Changes**:

- [ ] Remove references to mock collections in any tests
- [ ] Add tests for real collection functionality

### Current Mock Data Flow

1. **Seeding**: `collections.seed.ts` creates 6 mock collections with 44 total mock designs
2. **API**: `collections.ts` route serves mock data filtered by hardcoded user ID
3. **Frontend**: `Home.tsx` displays collections grid with placeholder interactions
4. **Images**: All designs use the same placeholder image URL

### Notes for Real Implementation

- The collections feature is designed to group user-generated designs from the RPT-1 AI generation process
- Collections will be created after users generate designs in projects (Phase 3/4 of the roadmap)
- The mock data demonstrates the intended UX but doesn't reflect the actual user workflow
- Real collections will be populated with designs generated through the "Transmute" process in ProjectHub
