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

# Accept and export build args for PUBLIC_* variables
ARG PUBLIC_SITE_URL=""
ARG PUBLIC_ENV=""
ARG PUBLIC_CAL_USERNAME=""
ARG PUBLIC_CAL_EMBED_LINK=""
ARG PUBLIC_CAL_EVENTS=""
ARG PUBLIC_DECAP_CMS_VERSION=""
ARG DEBUG_CAL=0
    
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_ENV=$PUBLIC_ENV \
    PUBLIC_CAL_USERNAME=$PUBLIC_CAL_USERNAME \
    PUBLIC_CAL_EMBED_LINK=$PUBLIC_CAL_EMBED_LINK \
    PUBLIC_CAL_EVENTS=$PUBLIC_CAL_EVENTS \
    PUBLIC_DECAP_CMS_VERSION=$PUBLIC_DECAP_CMS_VERSION \
    DEBUG_CAL=$DEBUG_CAL
    
# Copy only manifests first for better caching
COPY package*.json ./
COPY apps/website/package*.json ./apps/website/

# Debug: show what we copied
RUN echo "=== ROOT PACKAGE.JSON ===" && cat package.json && echo "=== WEBSITE PACKAGE.JSON ===" && cat apps/website/package.json

RUN npm config set registry https://registry.npmjs.org

# Workspace-aware install
# If root has workspaces + lockfile -> install at root, else install in app
RUN set -eux; \
  if grep -q '"workspaces"' package.json && [ -f package-lock.json ]; then \
    echo "Using root npm workspaces"; \
    npm ci --no-audit --no-fund; \
  else \
    echo "No root workspaces or lockfile, installing in apps/website"; \
    cd apps/website && npm ci --no-audit --no-fund; \
  fi

# Copy the rest of the repo (needed for public/src)
COPY . .

# Debug: show workspace structure
RUN echo "=== WORKSPACE STRUCTURE ===" && ls -la && echo "=== APPS STRUCTURE ===" && ls -la apps/

# Robust build: try workspace build, fallback to app-local build
RUN node -v && npm -v; \
  npm run --workspace apps/website build \
  || (echo "Workspace build failed, trying app-local build..." && cd apps/website && npm run build)

# Verify SSR build output (check entry.mjs exists)
RUN if [ ! -f "/app/apps/website/dist/server/entry.mjs" ]; then \
      echo "ERROR: SSR entry.mjs missing. Build failed."; \
      exit 1; \
    fi && \
    echo "=== SSR BUILD SUCCESS ===" && \
    ls -la /app/apps/website/dist/ && \
    echo "=== SERVER STRUCTURE ===" && \
    ls -la /app/apps/website/dist/server/
    
# -------- runtime stage --------
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
    
# Labels and ENV for git revision tracking
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_BUILD_SHA=$GIT_SHA
    
# Copy the entire dist (server + client) and node_modules from the apps/website workspace
COPY --from=builder /app/apps/website/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
    
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
