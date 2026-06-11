# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools required for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY server/package*.json ./

# Install production dependencies only (compiles native modules here)
RUN npm ci --omit=dev

# ---- Runtime Stage ----
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies: dumb-init (PID 1 handler) + sqlite-libs (for better-sqlite3)
RUN apk add --no-cache dumb-init sqlite-libs

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy server source code
COPY server/src ./src
COPY server/package*.json ./

# Create directory for SQLite database with correct permissions
RUN mkdir -p /app/data && chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 5000

# Use dumb-init to handle PID 1 and signal forwarding properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
