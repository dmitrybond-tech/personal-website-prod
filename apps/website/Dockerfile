# syntax=docker/dockerfile:1.5
# -------- build stage --------
FROM node:18-alpine AS builder

# Install toolchain for native modules and common libs for canvas/sharp
RUN apk add --no-cache --virtual .build-deps python3 make g++ libc6-compat git \
    pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev \
    && ln -sf /usr/bin/python3 /usr/bin/python
    
# Set working directory to monorepo root
WORKDIR /app

# Guarantee correct environment for iconify script in monorepo
ENV NODE_PATH=/app/node_modules

# Accept and export build args
ARG PUBLIC_CAL_USERNAME
ARG PUBLIC_CAL_EMBED_LINK
ARG PUBLIC_CAL_EVENTS
ARG PUBLIC_SITE_URL
ARG PUBLIC_ENV
ARG PUBLIC_DECAP_CMS_VERSION
ARG DEBUG_CAL=0
    
ENV PUBLIC_CAL_USERNAME=$PUBLIC_CAL_USERNAME \
    PUBLIC_CAL_EMBED_LINK=$PUBLIC_CAL_EMBED_LINK \
    PUBLIC_CAL_EVENTS=$PUBLIC_CAL_EVENTS \
    PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_ENV=$PUBLIC_ENV \
    PUBLIC_DECAP_CMS_VERSION=$PUBLIC_DECAP_CMS_VERSION \
    DEBUG_CAL=$DEBUG_CAL

# Copy only manifests first for better caching
COPY package*.json ./
RUN mkdir -p apps/website
COPY apps/website/package*.json ./apps/website/

# Detect and print build environment
RUN set -eux; \
  echo "=== BUILD ENVIRONMENT DETECTION ==="; \
  echo "Node version: $(node -v)"; \
  echo "NPM version: $(npm -v)"; \
  echo "Node major: $(node -v | cut -d'.' -f1 | cut -d'v' -f2)"; \
  if grep -q '"workspaces"' package.json; then \
    echo "✓ Root workspaces: ENABLED"; \
    grep '"workspaces"' package.json; \
  else \
    echo "✗ Root workspaces: DISABLED"; \
  fi; \
  if [ -f package-lock.json ]; then \
    echo "✓ Root lockfile: EXISTS"; \
  else \
    echo "✗ Root lockfile: MISSING"; \
  fi; \
  if [ -f apps/website/package-lock.json ]; then \
    echo "✓ App lockfile: EXISTS"; \
  else \
    echo "✗ App lockfile: MISSING"; \
  fi; \
  echo "=== APP BUILD SCRIPT ==="; \
  if grep -q '"build":' apps/website/package.json; then \
    grep '"build":' apps/website/package.json; \
  else \
    echo "⚠ No build script in app package.json"; \
  fi

# Configure npm registry
RUN npm config set registry https://registry.npmjs.org

## 1) Preinstall without scripts (cacheable)
RUN set -eux; \
  if grep -q '"workspaces"' package.json && [ -f package-lock.json ]; then \
    echo "=== INSTALL MODE: Root workspaces (no-scripts) ==="; \
    npm ci --no-audit --no-fund --ignore-scripts 2>&1 | tee /tmp/install.log || { \
      echo "Root ci failed, checking error..."; \
      cat /tmp/install.log; \
      echo "Falling back to app install"; \
      cd apps/website && npm ci --no-audit --no-fund --ignore-scripts; \
    }; \
  else \
    echo "=== INSTALL MODE: App-local (no-scripts) ==="; \
    cd apps/website && npm ci --no-audit --no-fund --ignore-scripts; \
  fi

# Copy the rest of the repo (needed for public/src)
COPY . .

# Debug: show workspace structure
RUN echo "=== WORKSPACE STRUCTURE ===" && ls -la && echo "=== APPS STRUCTURE ===" && ls -la apps/

## 2) Rebuild with scripts (after sources are present)
RUN set -eux; \
  echo "=== REBUILD WITH SCRIPTS ==="; \
  npm -v && node -v; \
  echo "Rebuilding root packages..."; \
  npm rebuild --foreground-scripts || true; \
  echo "Rebuilding workspace packages..."; \
  npm rebuild --workspace apps/website --foreground-scripts || true; \
  echo "✓ Rebuild complete"

## 3) Build with fallback
RUN set -eux; \
  echo "=== STARTING BUILD ==="; \
  (npm run --workspace apps/website build 2>&1 | tee /tmp/build.log) || { \
    echo "Workspace build failed, checking error..."; \
    cat /tmp/build.log; \
    echo "Falling back to app-local build"; \
    cd apps/website && npm run build 2>&1 | tee /tmp/build-app.log || { \
      echo "App-local build also failed"; \
      cat /tmp/build-app.log; \
      exit 1; \
    }; \
  } || exit 1; \
  echo "=== BUILD COMPLETE ==="

# Check build output (separate RUN to show even if build fails)
RUN echo "=== CHECKING BUILD OUTPUT ===" && \
  ls -la /app/apps/website/ || echo "apps/website dir missing" && \
  ls -la /app/apps/website/dist/ || echo "dist dir missing" && \
  (if [ -d /app/apps/website/dist/server ]; then \
    echo "=== SERVER STRUCTURE ===" && \
    ls -la /app/apps/website/dist/server/; \
  else \
    echo "=== server/ subdirectory missing ==="; \
  fi) && \
  if [ ! -f "/app/apps/website/dist/server/entry.mjs" ]; then \
    echo "ERROR: SSR entry.mjs missing. Build failed."; \
    exit 1; \
  fi && \
  echo "=== SSR BUILD SUCCESS ==="
    
# -------- runtime stage --------
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
    
# Labels and ENV for git revision tracking
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_BUILD_SHA=$GIT_SHA
    
# Copy the entire dist (server + client) and node_modules
COPY --from=builder /app/apps/website/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
    
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
