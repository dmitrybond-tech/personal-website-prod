# Changelog

## [SSG Migration] - 2024-01-15

### Added
1. **Static Site Generation (SSG) Configuration**
   - Changed `astro.config.ts` from `output: 'server'` to `output: 'static'`
   - Removed `@astrojs/node` adapter dependency
   - Removed `adapter: node({ mode: 'standalone' })` configuration

2. **Dynamic Route Null-Guards**
   - Added null-check in `/en/legal/[slug].astro` to prevent crashes when entry is undefined
   - Added null-check in `/ru/legal/[slug].astro` to prevent crashes when entry is undefined
   - Both routes already had `getStaticPaths()` implemented for pre-rendering

3. **404 Pages**
   - Created `/en/404.astro` with English 404 page
   - Created `/ru/404.astro` with Russian 404 page
   - Both pages use existing BaseLayout and Navbar components

4. **Static Caddy Configuration**
   - Created `infra/caddy/Caddyfile.ssg.example` with static file serving configuration
   - Configured gzip compression (no Brotli due to QUIC/H3 issues)
   - Set up proper cache headers for `/_astro/*` assets (1 year cache)
   - Added security headers (HSTS, X-Frame-Options, etc.)
   - Configured fallback to 404 page for missing routes

5. **CI/CD Workflow**
   - Created `.github/workflows/deploy-ssg.yml` for automated deployment
   - Uses pinned Node.js 22.12.0 and PNPM 9.12.0 versions
   - Implements atomic deployment with backup creation
   - Sets proper file ownership and permissions

6. **Local Deployment Script**
   - Created `scripts/deploy-ssg.ps1` for Windows PowerShell deployment
   - Supports SSH key authentication
   - Implements atomic file swapping with rsync

7. **Deployment Documentation**
   - Created `DEPLOYMENT_SSG.md` with comprehensive deployment guide
   - Includes rollback procedures and troubleshooting
   - Documents verification steps and performance benefits

8. **Verification Script**
   - Created `scripts/verify-ssg.ps1` for automated testing
   - Tests all major routes and expected responses
   - Validates 404 handling and redirects

### Changed
1. **Build Output**
   - Build now produces static files in `dist/` directory instead of server bundle
   - All dynamic routes are pre-rendered at build time
   - Assets are hashed and optimized for static serving

2. **Server Architecture**
   - Moved from Node.js SSR to static file serving
   - No runtime dependencies required on server
   - Reduced server resource usage and attack surface

### Removed
1. **Node.js Adapter**
   - Removed `@astrojs/node` import and configuration
   - No longer requires Node.js runtime on server

### Technical Details
- **Package Manager**: Uses existing NPM (no PNPM lockfile detected)
- **Build Command**: `npm run build` (unchanged)
- **Output Directory**: `apps/website/dist/` (unchanged)
- **Server Path**: `/srv/www/dmitrybond.tech` (as specified)
- **URL Structure**: Preserved all existing routes and locales
- **Content Collections**: All existing legal and blog content preserved

### Migration Benefits
- **Performance**: Faster page loads with pre-rendered content
- **Reliability**: No server-side rendering failures
- **Scalability**: Static files can be served by CDN
- **Security**: Reduced attack surface with no server-side processing
- **Maintenance**: Simpler deployment and rollback procedures
