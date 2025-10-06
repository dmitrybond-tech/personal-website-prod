# Docker Build Changes - Monorepo-Friendly Setup

## Changes Made

### 1. Dockerfile (root)
- **Enhanced build toolchain**: Added comprehensive native module support including `pkgconfig`, `cairo-dev`, `pango-dev`, `jpeg-dev`, `giflib-dev` for canvas/sharp dependencies
- **Improved Python symlink**: Added explicit `ln -sf /usr/bin/python3 /usr/bin/python` for native module compatibility
- **Enhanced dependency installation**: Improved npm install command with better error handling and fallback
- **Added secret support**: Commented optional support for private npm registry via Docker secrets
- **Better diagnostics**: Added diagnostic logging before build (`node -v && npm -v && pwd && ls -la`)
- **Enhanced comments**: Improved documentation and structure for better maintainability
- **Git tracking**: Added proper git SHA tracking via `GIT_SHA` build arg and labels

### 2. .dockerignore
- **Optimized build context**: Ensured only necessary files are included in build context
- **Added clarification**: Added comment to explicitly keep `apps/website/**` included
- **Maintained existing exclusions**: Kept all existing exclusions for `.git`, `node_modules`, `dist`, `.env*`, and other app-specific artifacts

### 3. GitHub Actions Workflow (.github/workflows/deploy-preprod.yml)
- **Added diagnostic step**: New "Show workspace" step to prove which Dockerfile is used and verify file structure
- **Enhanced build args**: Added comprehensive build args for all PUBLIC_* variables:
  - `PUBLIC_SITE_URL`
  - `PUBLIC_ENV=preprod`
  - `PUBLIC_CAL_USERNAME`
  - `PUBLIC_CAL_EMBED_LINK`
  - `PUBLIC_CAL_EVENTS`
  - `PUBLIC_DECAP_CMS_VERSION`
- **Git SHA tracking**: Added `GIT_SHA=${{ github.sha }}` for proper image labeling
- **Maintained existing structure**: Kept all existing workflow steps and deployment logic intact

## Technical Details

### Build Process
1. **Multi-stage build**: Build stage installs dependencies and compiles the website, runtime stage creates minimal production image
2. **Monorepo isolation**: Only builds `apps/website` without touching other apps in the monorepo
3. **Native module support**: Comprehensive Alpine toolchain for canvas/sharp and other native dependencies
4. **Cache optimization**: Uses Docker BuildKit cache mounts for npm dependencies

### Runtime Configuration
- **Node SSR**: Runs `node dist/server/entry.mjs` on port 3000
- **Production environment**: `NODE_ENV=production`
- **Git tracking**: Proper labeling with commit SHA for traceability
- **Minimal footprint**: Only includes necessary runtime artifacts

### CI/CD Integration
- **BuildKit enabled**: Uses `# syntax=docker/dockerfile:1.5` for advanced features
- **Registry caching**: Leverages GitHub Container Registry for build caching
- **Environment variables**: Proper build arg passing from GitHub repository variables
- **Diagnostic logging**: Comprehensive logging for troubleshooting build issues

## Compatibility
- **Node 20-alpine**: Maintains existing base image with option to pin digests later
- **BuildKit required**: Uses advanced Docker features for optimal builds
- **No app changes**: All modifications are infrastructure-only, no application code changes
- **Backward compatible**: Maintains existing deployment and runtime behavior
