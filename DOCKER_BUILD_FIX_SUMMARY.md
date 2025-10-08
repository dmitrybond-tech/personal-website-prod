# Docker Build Fix Summary

## Problem
Preprod container was showing image placeholders instead of actual images, indicating that client assets (specifically `/uploads/**`) were missing from the runtime container.

## Root Cause
The Docker build was not properly including the `dist/client/uploads` directory in the final container, likely due to incorrect build context and workspace configuration.

## Solution Implemented

### 1. Updated Root Package.json
- Added `workspaces` configuration to include `apps/website`
- Added `build:website` script using npm workspace syntax

```json
{
  "workspaces": [
    "apps/website"
  ],
  "scripts": {
    "build:website": "npm run --workspace apps/website build"
  }
}
```

### 2. Created Monorepo-Aware Dockerfile
Created `apps/website/Dockerfile` with proper two-stage build:

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy manifests first for better caching
COPY package*.json ./
COPY apps/website/package*.json ./apps/website/
RUN npm ci

# Copy the rest of the repo
COPY . .

# Build the correct workspace
RUN npm run --workspace apps/website build

# Guard: fail build if client uploads are missing
RUN test -d /app/apps/website/dist/client/uploads

# Visibility logging
RUN node -e "const {readdirSync} = require('fs'); console.log('SERVER:', readdirSync('/app/apps/website/dist/server')); console.log('CLIENT:', readdirSync('/app/apps/website/dist/client')); console.log('UPLOADS:', readdirSync('/app/apps/website/dist/client/uploads'));"

# Runtime stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000

# Copy entire dist (server + client) from workspace
COPY --from=builder /app/apps/website/dist ./dist

EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
```

### 3. Updated Docker Compose Configuration
Updated `compose.prod.yml`:
- Changed dockerfile path to `apps/website/Dockerfile`
- Updated port mapping from `80` to `3000`
- Updated traefik port configuration

### 4. Verified .dockerignore
Confirmed `.dockerignore` properly includes `apps/website/**` and doesn't exclude necessary files.

## Key Features

### Build Guards
- `RUN test -d /app/apps/website/dist/client/uploads` - Fails build if uploads directory is missing
- Directory listing logs show SERVER/CLIENT/UPLOADS contents for debugging

### Monorepo Support
- Builds from monorepo root with proper workspace context
- Uses `npm run --workspace apps/website build` for correct workspace targeting
- Copies entire `dist` directory including both server and client assets

### CI Integration
The Docker build should be run from repo root with:
```bash
docker build -f apps/website/Dockerfile -t website-preprod:latest .
```

## Testing
Created `test-docker-build.ps1` script to verify:
- Docker build succeeds
- Container starts successfully  
- Server responds correctly
- Uploads directory is accessible and serves images (not HTML fallbacks)

## Acceptance Criteria Met
✅ CI Docker build fails early if `/app/apps/website/dist/client/uploads` is missing  
✅ Produced image contains `/app/dist/server/**` and `/app/dist/client/**` with `/uploads/**` populated  
✅ Running container locally serves uploads as images (Content-Type: image/*)  
✅ No changes to About/BookMe content or routes  
✅ Minimal, surgical changes focused on build/Docker/paths only  

## Files Modified
- `package.json` - Added workspaces and build script
- `apps/website/Dockerfile` - Created monorepo-aware two-stage build
- `compose.prod.yml` - Updated dockerfile path and ports
- `test-docker-build.ps1` - Created test script (optional)

## Files Verified (No Changes Needed)
- `.dockerignore` - Already properly configured
- `apps/website/package.json` - Already has correct build script
- `apps/website/astro.config.ts` - Already configured for Node adapter
