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

# Copy dependencies from builder stage (includes compiled better-sqlite3.node)
COPY --from=builder /app/node_modules ./node_modules

# Copy server source code
COPY server/src ./src
COPY server/package*.json ./

# Create SQLite data directory — run as root so the volume mount is writable
RUN mkdir -p /app/data

EXPOSE 5000

# Use dumb-init to handle PID 1 and signal forwarding properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
