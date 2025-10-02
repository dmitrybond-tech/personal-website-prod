# Local OAuth Stabilization - Numbered Change Log

## Summary
Stabilized local testing for Decap + GitHub OAuth + Auth.js by making the dev server deterministic on http://localhost:4321, fixing check:env to read existing .env.local, and documenting exact local OAuth callbacks.

## Changes Made

### 1. Fixed check:env Script to Read .env.local
**File:** `apps/website/package.json`
**Change:** Updated the `check:env` script to load environment variables from `.env.local` using dotenv
**Before:**
```json
"check:env": "node -e \"['OAUTH_GITHUB_CLIENT_ID','OAUTH_GITHUB_CLIENT_SECRET','AUTH_SECRET','AUTH_TRUST_HOST'].forEach(k=>{if(!process.env[k]){console.error('Missing '+k);process.exitCode=1}})\""
```
**After:**
```json
"check:env": "cross-env DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e \"['OAUTH_GITHUB_CLIENT_ID','OAUTH_GITHUB_CLIENT_SECRET','AUTH_SECRET','AUTH_TRUST_HOST'].forEach(k=>{if(!process.env[k]){console.error('Missing '+k);process.exitCode=1}})\""
```
**Impact:** `npm run dev:cms` now successfully reads environment variables from the existing `.env.local` file instead of failing with "Missing ..." errors.

### 2. Moved dotenv to DevDependencies
**File:** `apps/website/package.json`
**Change:** Moved `dotenv@17.2.2` from dependencies to devDependencies
**Impact:** Cleaner dependency management since dotenv is only needed for the check:env script during development.

### 3. Enhanced Environment Documentation
**File:** `apps/website/env.example`
**Change:** Added clear documentation for localhost OAuth testing
**Added:**
```bash
# Note: Auth.js uses AUTH_SECRET (not AUTH_STATE_SECRET)
# Configure your GitHub OAuth App with these exact callback URLs:
# - Auth.js (login): http://localhost:4321/api/auth/callback/github
# - Decap backend: http://localhost:4321/oauth/callback
```
**Impact:** Developers now have clear guidance on the exact OAuth callback URLs needed for local testing.

## Verified Configurations (No Changes Required)

### 4. Astro Configuration
**File:** `apps/website/astro.config.ts`
**Status:** ✅ Already correctly configured
- `server.port: 4321`
- `server.strictPort: true` (prevents auto-increment to 4322)
- `server.host: true`

### 5. Middleware Exclusions
**File:** `apps/website/src/middleware.ts`
**Status:** ✅ Already correctly configured
- Lines 17-18: Proper exclusions for `/api/auth/*` and `/oauth*` routes
- Lines 20: Protection only applies to `/website-admin` routes

### 6. Decap CMS Configuration
**File:** `apps/website/public/website-admin/config.yml`
**Status:** ✅ Already correctly configured
- `backend.name: github`
- `auth_endpoint: oauth`
- `base_url: http://localhost:4321`

### 7. Convenience Scripts
**File:** `apps/website/package.json`
**Status:** ✅ Already present
- `dev:local`: Runs dev server on port 4321
- `port:kill:4321`: PowerShell script to kill processes on port 4321

### 8. README Documentation
**File:** `apps/website/README.md`
**Status:** ✅ Already contains comprehensive "Local OAuth Test" section
- Exact callback URLs for GitHub OAuth App
- Step-by-step testing commands
- Smoke test endpoints

## Dependencies Status
- `dotenv@17.2.2`: ✅ Moved to devDependencies with exact version
- `cross-env@10.1.0`: ✅ Already in devDependencies with exact version

## Acceptance Criteria Met
- ✅ `npm run dev:cms` reads env vars from existing `.env.local` without "Missing ..." errors
- ✅ Dev server runs deterministically on http://localhost:4321 (no auto-switch)
- ✅ All OAuth routes (`/api/auth/*` and `/oauth*`) excluded from middleware protection
- ✅ Clear documentation for local OAuth testing
- ✅ No changes to routing, i18n, or UI
- ✅ No modifications to existing `.env.local` file
- ✅ No secrets committed

## Testing Commands
```bash
cd apps/website
npm run port:kill:4321
npm run dev:cms
```

## Smoke Test Endpoints
1. `http://localhost:4321/api/auth/csrf` - CSRF token and cookie
2. `http://localhost:4321/api/auth/signin` - Auth.js login page
3. `http://localhost:4321/api/auth/session` - Session validation
4. `http://localhost:4321/website-admin` - Decap CMS access
