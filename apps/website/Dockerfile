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

# Install dependencies
RUN echo "Installing dependencies..." && \
    npm install --no-audit --no-fund

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

# Build the website with simplified approach
RUN echo "Building website..." && \
    cd apps/website && \
    echo "Current directory: $(pwd)" && \
    echo "Running build without prebuild..." && \
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

# Verify build output
RUN echo "Verifying build output..." && \
    ls -la /app/apps/website/dist/ && \
    echo "✓ Build output verified"

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

# Verify runtime assets
RUN echo "Verifying runtime assets..." && \
    ls -la /app/dist/ && \
    echo "✓ Runtime assets verified"

# Copy node_modules from builder (includes express, compression as runtime deps)
COPY --from=builder /app/node_modules ./node_modules
    
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/_healthz || exit 1
CMD ["node", "./dist/server/server.mjs"]
