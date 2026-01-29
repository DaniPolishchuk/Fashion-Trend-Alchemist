# Build stage
FROM node:18-alpine AS builder

# Install pnpm 10
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy package.json files for all packages
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/db/package.json ./packages/db/
COPY apps/api-lite/package.json ./apps/api-lite/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/config ./packages/config
COPY packages/types ./packages/types
COPY packages/db ./packages/db
COPY apps/api-lite ./apps/api-lite

# Copy LLM prompt files (needed at runtime)
COPY attributeSetSystemPromt.txt ./
COPY attributeSetExamples.json ./

# Build all packages in order
RUN pnpm --filter @fashion/config build && \
    pnpm --filter @fashion/types build && \
    pnpm --filter @fashion/db build && \
    pnpm --filter @fashion/api-lite build

# Production stage
FROM node:18-alpine AS production

# Install pnpm 10
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/db/package.json ./packages/db/
COPY apps/api-lite/package.json ./apps/api-lite/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/apps/api-lite/dist ./apps/api-lite/dist

# Copy LLM prompt files
COPY --from=builder /app/attributeSetSystemPromt.txt ./
COPY --from=builder /app/attributeSetExamples.json ./

# Set environment
ENV NODE_ENV=production
ENV API_PORT=3001
ENV API_HOST=0.0.0.0

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
WORKDIR /app/apps/api-lite
CMD ["node", "dist/main.js"]
