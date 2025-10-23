# syntax=docker/dockerfile:1.5
# -------- build stage --------
FROM node:22-alpine AS builder

# Install toolchain for native modules and common libs for canvas/sharp
RUN apk add --no-cache --virtual .build-deps python3 make g++ libc6-compat git \
    pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev \
    && ln -sf /usr/bin/python3 /usr/bin/python
    
# Set working directory to monorepo root
WORKDIR /app

# Guarantee correct environment for iconify script in monorepo
ENV NODE_PATH=/app/node_modules

# Accept and export build args for PUBLIC_* variables
ARG PUBLIC_SITE_URL=""
ARG PUBLIC_ENV=""
ARG PUBLIC_CAL_USERNAME=""
ARG PUBLIC_CAL_EMBED_LINK=""
ARG PUBLIC_CAL_EVENTS=""
ARG PUBLIC_DECAP_CMS_VERSION=""
ARG DEBUG_CAL=0

# OAuth Environment Variables for Production
ARG DECAP_GITHUB_CLIENT_ID=""
ARG DECAP_GITHUB_CLIENT_SECRET=""
ARG AUTHJS_GITHUB_CLIENT_ID=""
ARG AUTHJS_GITHUB_CLIENT_SECRET=""
    
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_ENV=$PUBLIC_ENV \
    PUBLIC_CAL_USERNAME=$PUBLIC_CAL_USERNAME \
    PUBLIC_CAL_EMBED_LINK=$PUBLIC_CAL_EMBED_LINK \
    PUBLIC_CAL_EVENTS=$PUBLIC_CAL_EVENTS \
    PUBLIC_DECAP_CMS_VERSION=$PUBLIC_DECAP_CMS_VERSION \
    DEBUG_CAL=$DEBUG_CAL \
    DECAP_GITHUB_CLIENT_ID=$DECAP_GITHUB_CLIENT_ID \
    DECAP_GITHUB_CLIENT_SECRET=$DECAP_GITHUB_CLIENT_SECRET \
    AUTHJS_GITHUB_CLIENT_ID=$AUTHJS_GITHUB_CLIENT_ID \
    AUTHJS_GITHUB_CLIENT_SECRET=$AUTHJS_GITHUB_CLIENT_SECRET
    
# Copy only manifests first for better caching
COPY package*.json ./
COPY apps/website/package*.json ./apps/website/

# Debug: show what we copied
RUN echo "=== ROOT PACKAGE.JSON ===" && cat package.json && echo "=== WEBSITE PACKAGE.JSON ===" && cat apps/website/package.json

RUN npm config set registry https://registry.npmjs.org

# Install dependencies with better error handling
RUN echo "Installing dependencies..." && \
    npm ci --no-audit --no-fund --verbose || \
    (echo "npm ci failed, trying npm install..." && \
     npm install --no-audit --no-fund --verbose) || \
    (echo "npm install failed, trying with legacy peer deps..." && \
     npm install --no-audit --no-fund --legacy-peer-deps --verbose)

# Copy the rest of the repo (needed for public/src)
COPY . .

# Debug: show workspace structure and node version
RUN echo "=== NODE VERSION ===" && node --version && \
    echo "=== NPM VERSION ===" && npm --version && \
    echo "=== ENVIRONMENT VARIABLES ===" && \
    echo "PUBLIC_SITE_URL: $PUBLIC_SITE_URL" && \
    echo "PUBLIC_ENV: $PUBLIC_ENV" && \
    echo "NODE_ENV: $NODE_ENV" && \
    echo "=== WORKSPACE STRUCTURE ===" && ls -la && \
    echo "=== APPS STRUCTURE ===" && ls -la apps/ && \
    echo "=== WEBSITE STRUCTURE ===" && ls -la apps/website/

# Make sure we build the correct workspace with better error handling
RUN echo "Building website..." && \
    cd apps/website && \
    echo "Current directory: $(pwd)" && \
    echo "Available scripts:" && npm run --silent 2>/dev/null || echo "No scripts available" && \
    echo "Running prebuild..." && \
    (npm run prebuild || echo "Prebuild failed, continuing...") && \
    echo "Running build..." && \
    npm run build && \
    echo "Build completed successfully" && \
    echo "Checking dist directory..." && \
    ls -la dist/ && \
    echo "Checking server directory..." && \
    ls -la dist/server/ && \
    echo "Checking client directory..." && \
    ls -la dist/client/

# Ensure public assets are available at runtime under /app/dist/public
# Astro SSR/hybrid build outputs client assets under /app/dist/client
# but Caddy expects them under /app/dist/public
RUN mkdir -p /app/apps/website/dist/public && \
    cp -r /app/apps/website/public/* /app/apps/website/dist/public/

# 1) uploads действительно собраны (fail-fast если отсутствует)
RUN set -e; \
    echo "[sanity] dist/client listing:" && ls -lah /app/apps/website/dist/client | head -n 200; \
    if [ ! -d "/app/apps/website/dist/client/uploads" ]; then \
      echo "ERROR: dist/client/uploads is missing. Check .dockerignore / LFS / public/"; \
      exit 1; \
    fi

# 2) Check for LFS pointers (non-fatal if found)
RUN if grep -R "git-lfs.github.com/spec/v1" -n /app/apps/website/dist/client/uploads 2>/dev/null; then \
      echo "WARNING: LFS pointers found in dist - this may cause issues"; \
    else \
      echo "✓ No LFS pointers found in dist"; \
    fi

# 3) (диагностично) показать типы файлов в логах CI
RUN apk add --no-cache file >/dev/null 2>&1 || true; \
    find /app/apps/website/dist/client/uploads -type f | head -n 12 | xargs -I{} file -b {}

# 4) Verify public assets are copied to dist/public for Caddy static serving
RUN echo "[sanity] dist/public listing:" && ls -lah /app/apps/website/dist/public | head -n 200; \
    if [ ! -d "/app/apps/website/dist/public/uploads" ]; then \
      echo "ERROR: dist/public/uploads is missing. Check public asset copying."; \
      exit 1; \
    fi; \
    if [ ! -d "/app/apps/website/dist/public/uploads/logos" ]; then \
      echo "ERROR: logos directory not found in dist/public/uploads/"; \
      exit 1; \
    fi; \
    echo "✓ Public assets copied successfully"

# Visibility in CI logs - show directory structure
RUN node -e "const {readdirSync} = require('fs'); console.log('SERVER:', readdirSync('/app/apps/website/dist/server')); console.log('CLIENT:', readdirSync('/app/apps/website/dist/client')); console.log('UPLOADS:', readdirSync('/app/apps/website/dist/client/uploads'));"
    
# -------- runtime stage --------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
    
# Labels and ENV for git revision tracking
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_BUILD_SHA=$GIT_SHA
    
# Copy the entire dist (server + client + public) from the builder
COPY --from=builder /app/apps/website/dist ./dist

# Verify public assets are available for Caddy static serving
RUN echo "[runtime] Verifying public assets:" && \
    ls -la /app/dist/public/uploads/logos/ | head -n 10 && \
    if [ -d "/app/dist/public/uploads/logos" ]; then \
      echo "✓ logos directory found in runtime"; \
    else \
      echo "WARNING: logos directory not found in runtime"; \
    fi

# Copy node_modules from builder (includes express, compression as runtime deps)
COPY --from=builder /app/node_modules ./node_modules
    
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/_healthz || exit 1
CMD ["node", "./dist/server/server.mjs"]
