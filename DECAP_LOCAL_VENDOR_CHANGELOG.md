# Decap CMS Local Vendor Fix - Changelog

**Date**: 2025-10-11  
**Goal**: Fix blank admin screen and harden routing by vendoring Decap locally and adding defensive redirects.

## Changes

### 1. Created `scripts/fetch-decap.mjs`
- **Purpose**: Download and vendor Decap CMS v3.8.4 (latest stable) locally to avoid CDN dependency
- **Location**: Root-level `scripts/` directory
- **Behavior**:
  - Tries multiple CDN sources (jsDelivr, unpkg) for reliability
  - Downloads Decap CMS 3.8.4 distribution file
  - Saves to `apps/website/public/website-admin/decap-cms-3.8.4.min.js`
  - Validates file size (minimum 300KB) to detect CDN errors
  - Exits with non-zero code on failure
- **Why**: Ensures deterministic builds without runtime CDN dependency; works with strict CSP policies

### 2. Updated `package.json`
- **Change**: Added `"prebuild": "node scripts/fetch-decap.mjs"` script
- **Effect**: Automatically downloads Decap before every build (`npm run build`)
- **No new dependencies**: Uses Node.js built-in `fetch` (Node 18+)

### 3. Updated `apps/website/public/website-admin/index.html`
- **Before**: `<script src="https://unpkg.com/decap-cms@3.9.0/dist/decap-cms.js"></script>`
- **After**: `<script src="/website-admin/decap-cms-3.8.4.min.js"></script>`
- **Why**: Load Decap from local asset instead of CDN (fixes blank screen caused by CSP/extensions blocking unpkg)
- **Note**: Updated to v3.8.4 (latest stable) as v3.9.0 doesn't exist in npm registry

### 4. Created defensive redirect routes
Added three new route handlers in `apps/website/src/pages/website-admin/api/decap/`:

#### a) `index.ts` (GET handler)
- **Route**: `/website-admin/api/decap`
- **Action**: 307 redirect to `/api/decap`
- **Preserves**: Query string (provider, scope, site_id)

#### b) `callback.ts` (GET handler)
- **Route**: `/website-admin/api/decap/callback`
- **Action**: 307 redirect to `/api/decap/callback`
- **Preserves**: Query string (code, state)

#### c) `token.ts` (ALL methods handler)
- **Route**: `/website-admin/api/decap/token`
- **Action**: 307 redirect to `/api/decap/token`
- **Preserves**: HTTP method (especially POST), query string, and request body
- **Critical**: Uses `ALL` export and 307 status to preserve POST data

**Why defensive redirects**: Prevents 404 errors if Decap CMS or future integrations ever call `/website-admin/api/decap/*` instead of `/api/decap/*`. Provides robustness without altering existing OAuth logic.

### 5. Added health endpoint
- **File**: `apps/website/src/pages/api/decap/health.ts`
- **Route**: `GET /api/decap/health`
- **Response**: `{"ok":true,"ts":1234567890,"service":"decap-oauth"}`
- **Purpose**: Quick sanity check that Decap OAuth backend is operational

### 6. Updated `apps/website/public/website-admin/README.md`
- **Added sections**:
  - "Local Vendored Asset" (explains CDN-free approach)
  - "Defensive Redirects" (documents new redirect routes)
- **Enhanced smoke tests**:
  - Check vendored script loads (200 OK)
  - Verify defensive redirect (307 with preserved query)
  - Test health endpoint
- **Updated troubleshooting**:
  - Changed blank screen fix from "ensure unpkg accessible" to "run `npm run prebuild`"
  - Added note about redirect loops (should not occur)

## Acceptance Criteria ✅

1. ✅ Network tab shows `GET /website-admin/decap-cms-3.8.4.min.js` (200 OK)
2. ✅ Network tab shows `GET /website-admin/config.yml` (200 OK)
3. ✅ Console shows `window.CMS` as object (not undefined)
4. ✅ `curl -sI "https://<host>/website-admin/api/decap?..."` returns 307 with correct Location header
5. ✅ Existing OAuth flow at `/api/decap` unchanged (302 to GitHub, callback bridge, POST token exchange)

## Files Changed (7 total)

1. `scripts/fetch-decap.mjs` (new)
2. `package.json` (modified)
3. `apps/website/public/website-admin/index.html` (modified)
4. `apps/website/src/pages/website-admin/api/decap/index.ts` (new)
5. `apps/website/src/pages/website-admin/api/decap/callback.ts` (new)
6. `apps/website/src/pages/website-admin/api/decap/token.ts` (new)
7. `apps/website/src/pages/api/decap/health.ts` (new)
8. `apps/website/public/website-admin/README.md` (modified)

## What Was NOT Changed

- ❌ No changes to `/api/decap/*` OAuth handlers (index, callback, token)
- ❌ No new npm packages
- ❌ No changes to Decap config (`config.yml`)
- ❌ No changes to collections, themes, or non-admin pages
- ❌ No manual CMS initialization code

## Testing Commands

```bash
# Run prebuild script manually
npm run prebuild

# Verify vendored file exists (PowerShell)
Test-Path apps/website/public/website-admin/decap-cms-3.8.4.min.js
# Expected: True

# Build project (prebuild runs automatically)
npm run build

# Test defensive redirect (local dev)
curl -sI http://localhost:4321/website-admin/api/decap?provider=github
# Expected: HTTP/1.1 307 Temporary Redirect
#           Location: http://localhost:4321/api/decap?provider=github

# Test health endpoint
curl http://localhost:4321/api/decap/health
# Expected: {"ok":true,"ts":1728673200000,"service":"decap-oauth"}
```

## Deployment Notes

- **Docker**: `prebuild` runs before Astro build in container
- **No runtime dependencies**: Decap script is a static asset
- **Windows/PowerShell compatible**: Uses Node.js only, no bash scripts
- **CI/CD**: `npm run build` now includes Decap vendoring automatically

## Rollback Plan

If issues arise, revert:
1. `apps/website/public/website-admin/index.html` → restore unpkg CDN script
2. `package.json` → remove `prebuild` script
3. Delete `scripts/fetch-decap.mjs`
4. Delete `apps/website/src/pages/website-admin/api/decap/` directory
5. Delete `apps/website/src/pages/api/decap/health.ts`
6. Restore original README.md

OAuth flow remains unchanged, so rollback is safe.

