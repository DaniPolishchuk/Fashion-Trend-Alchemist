# Build stage
FROM node:18-alpine AS builder

# Add ARGs to receive build-time variables for Vite
ARG VITE_FILER_BASE_URL
ARG VITE_FILER_BUCKET
ARG VITE_FILER_GENERATED_BUCKET

# Install pnpm 10
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy package.json files for required packages
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/types ./packages/types
COPY apps/web ./apps/web

# Convert ARGs to ENV so Vite can access them during build
ENV VITE_FILER_BASE_URL=$VITE_FILER_BASE_URL
ENV VITE_FILER_BUCKET=$VITE_FILER_BUCKET
ENV VITE_FILER_GENERATED_BUCKET=$VITE_FILER_GENERATED_BUCKET

# Build types package first, then web (Vite will inject VITE_* env vars)
RUN pnpm --filter @fashion/types build && \
    pnpm --filter @fashion/web build

# Production stage - serve with nginx
FROM nginx:alpine AS production

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/nginx.conf

# Copy built static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
