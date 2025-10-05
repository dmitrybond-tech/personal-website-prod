# Multi-stage build for apps/website
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY apps/website/package*.json ./
COPY apps/website/.npmrc* .npmrc 2>/dev/null || true

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY apps/website/ ./

# Run CMS config swap for production (ignore errors)
RUN node scripts/cms-config-swap.mjs prod || true

# Build the application
RUN npm run build

# Runtime stage
FROM caddy:2.8-alpine AS runtime

# Copy built application from build stage
COPY --from=build /app/dist /srv

# Copy Caddyfile
COPY Caddyfile.app /etc/caddy/Caddyfile

# Expose port 80
EXPOSE 80

# Start Caddy server
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
