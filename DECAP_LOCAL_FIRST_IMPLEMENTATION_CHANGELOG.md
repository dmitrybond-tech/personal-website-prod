# Decap CMS Local-First Implementation Changelog

## Overview
Implemented local-first Decap CMS setup where CMS reads/writes posts directly to filesystem in DEV mode, with automatic git commit+push on save.

## Changes Made

### 1. Updated Package.json Scripts
**File:** `apps/website/package.json`
- Modified `dev:cms` script to enable `DECAP_LOCAL_BACKEND=true` and use `decap-cms-proxy-server`
- **Before:** Used content-autopull script
- **After:** Uses local backend with proxy server for direct filesystem access

```json
"dev:cms": "cross-env NODE_OPTIONS=--trace-warnings cross-env DECAP_LOCAL_BACKEND=true concurrently -k -n astro,proxy \"astro dev --host --port 4321 --strictPort\" \"npx decap-cms-proxy-server\""
```

### 2. Created Git Sync API Endpoint
**File:** `apps/website/src/pages/api/content/git-sync.ts` (NEW)
- **Purpose:** Handles automatic git commit+push when CMS saves content
- **Security:** Only works in DEV mode, returns 403 in production
- **Features:**
  - Accepts JSON with `paths` array and optional `message`
  - Normalizes and filters paths by allowlist:
    - `apps/website/src/content/posts/**`
    - `apps/website/public/uploads/**`
  - Finds repository root using `git rev-parse --show-toplevel`
  - Executes: `git add`, `git commit`, `git pull --rebase`, `git push`
  - Returns JSON with `{ added, committed, pushed }` status
  - Handles errors gracefully with 500 status

### 3. Enhanced Admin Interface
**File:** `apps/website/public/website-admin/index.html`
- **Added:** `postSave` event listener for automatic git sync
- **Added:** `postUnpublishedEntryPublished` event listener for future use
- **Features:**
  - Automatically detects if path already includes `apps/website/src/content/` prefix
  - Calls `/api/content/git-sync` endpoint after successful save
  - Logs success/failure to console for debugging
  - Handles both save and publish operations

### 4. Verified Collection Configuration
**File:** `apps/website/public/website-admin/config.yml`
- **Status:** Already correctly configured
- **Structure:** Matches filesystem layout with `{{locale}}/{{slug}}` path pattern
- **Fields:** Includes all required fields (title, date, draft, description, body)
- **i18n:** Properly configured for en/ru locales

### 5. Existing Infrastructure Verified
- **API Config Endpoint:** `apps/website/src/pages/api/website-admin/config.yml.ts` already supports `DECAP_LOCAL_BACKEND` injection
- **Migration Scripts:** `apps/website/scripts/migrate-posts.mjs` properly handles locale-based file organization
- **Middleware:** `apps/website/src/middleware.ts` already handles admin routing correctly

## Workflow

### Development Mode (DECAP_LOCAL_BACKEND=true)
1. **CMS Access:** Admin interface reads/writes directly to `apps/website/src/content/posts/{en,ru}/`
2. **Save Operation:** 
   - User saves post in CMS
   - File is written to filesystem immediately
   - `postSave` event triggers git sync
   - API endpoint commits and pushes changes to `origin/main`
3. **Feedback:** Console logs show sync status

### Reverse Sync (Manual)
- Use existing scripts: `npm run content:pull` and `npm run content:migrate`
- Pulls changes from GitHub and normalizes local files

## Security Considerations
- Git sync endpoint only works in development mode
- Path filtering prevents access to unauthorized directories
- Git operations are scoped to allowed paths only
- Error handling prevents sensitive information leakage

## Dependencies
- `decap-cms-proxy-server`: For local backend functionality
- `concurrently`: For running multiple processes
- `cross-env`: For environment variable management

## Testing
To test the complete workflow:
1. Run `npm run dev:cms` in `apps/website/`
2. Access admin at `http://localhost:4321/website-admin`
3. Create/edit a post and save
4. Check console logs for git sync status
5. Verify changes are committed and pushed to repository

## Rollback Plan
If issues arise:
1. Revert `package.json` script to previous version
2. Remove git sync API endpoint
3. Remove event listeners from admin interface
4. Use existing `content:pull`/`content:migrate` for manual sync
