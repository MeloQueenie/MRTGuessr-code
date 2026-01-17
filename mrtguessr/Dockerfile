# Multi-stage build for TanStack Start with Nitro
# Stage 1: Build the application
FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and config files
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production runtime
FROM node:24-alpine AS runner

# Set working directory
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 tanstack

# Copy built application from builder
COPY --from=builder --chown=tanstack:nodejs /app/.output ./.output
COPY --from=builder --chown=tanstack:nodejs /app/package.json ./package.json

# Switch to non-root user
USER tanstack

# Expose port (adjust if your app uses a different port)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", ".output/server/index.mjs"]
