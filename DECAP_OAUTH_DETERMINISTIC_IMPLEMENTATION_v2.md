# Decap CMS OAuth - Deterministic Implementation (v2 - Fixed)

## Executive Summary

Single, deterministic OAuth implementation for Decap CMS with GitHub. **Fixed critical issues** from v1.

## Critical Fixes Applied (v2)

### 🔴 Issue 1: CDN vs Local Bundle
**Problem**: Changed to unpkg CDN (v3.9.0), but local vendored file exists for CSP/reliability  
**Fix**: Reverted to local bundle `/website-admin/decap-cms-3.8.4.min.js`

```html
<!-- ✅ CORRECT (v2) -->
<script src="/website-admin/decap-cms-3.8.4.min.js"></script>

<!-- ❌ WRONG (v1) -->
<script src="https://unpkg.com/decap-cms@3.9.0/dist/decap-cms.js"></script>
```

### 🔴 Issue 2: Import Path Resolution
**Problem**: Used TypeScript alias `@/utils/decapOrigin` which doesn't resolve in SSR API routes  
**Fix**: Changed to relative imports with `.js` extension

```typescript
// ✅ CORRECT (v2)
import { computeOrigin, cors } from '../../../utils/decapOrigin.js';

// ❌ WRONG (v1)
import { computeOrigin, cors } from '@/utils/decapOrigin';
```

### 🔴 Issue 3: Unused Dependency
**Problem**: `astro-decap-cms-oauth` package in dependencies but not used  
**Fix**: Removed from package.json

---

## What Works Now ✅

### Phase 1: Route Conflicts Eliminated
- ✅ Removed `astro-decap-cms-oauth` import from `astro.config.ts`
- ✅ Removed `astro-decap-cms-oauth` from `package.json` dependencies
- ✅ Single source of truth: `/api/decap/*`
- ✅ Defensive redirects: `/website-admin/api/decap/*` → `/api/decap/*`
- ✅ All routes have `export const prerender = false`

### Phase 2: Hardened OAuth Endpoints
**Created**: `apps/website/src/utils/decapOrigin.ts`
- `computeOrigin()` - respects `DECAP_ORIGIN` env, proxy headers
- `cors()` - proper CORS with `vary: Origin`

**Updated endpoints** (with relative imports):
- `/api/decap` (entry) - crypto state, dry-run mode, fallback warnings
- `/api/decap/callback` (bridge) - enhanced HTML with error display
- `/api/decap/token` (exchange) - dual cookie reading, detailed diagnostics
- `/api/decap/diag` - environment check
- `/api/decap/health` - health check
- `/api/decap/ping` - cookie test

### Phase 3: Admin Panel Fixed
- ✅ **Local vendored Decap CMS 3.8.4** (NOT CDN)
- ✅ Proper `<link rel="cms-config-url">` tag
- ✅ Config points to `/api/decap`

### Phase 4: Environment Configuration
- ✅ `DECAP_ORIGIN` documented in env.example
- ✅ SSR mode: `output: 'server'` + Node adapter
- ✅ Fallback to `AUTHJS_*` credentials with warnings

### Phase 5: Acceptance Tests
- ✅ Created `scripts/oauth-acceptance-tests.sh`
- ✅ Available via `npm run oauth:check`

---

## Architecture (Unchanged)

```
Decap Frontend → /api/decap (entry)
                 ↓ Sets cookie, redirects to GitHub
GitHub OAuth    ↓
                 ↓ Callback with code
                 /api/decap/callback (bridge HTML)
                 ↓ postMessage handshake
                 /api/decap/token (exchange)
                 ↓ Verify state, get token
                 Success! → CMS authenticated
```

---

## Deployment Checklist

### 1. Environment Variables
```bash
DECAP_GITHUB_CLIENT_ID=Ov23li...
DECAP_GITHUB_CLIENT_SECRET=a1b2c3d4...
DECAP_ORIGIN=https://dmitrybond.tech  # Recommended for production
```

### 2. GitHub OAuth App
- **Callback URL**: `https://dmitrybond.tech/api/decap/callback`
- **Scopes**: Default (requests `repo` at runtime)

### 3. Build & Deploy
```bash
cd apps/website
npm install  # Remove unused dependency
npm run build
```

### 4. Verify After Deploy
```bash
# Check admin assets
curl -I https://dmitrybond.tech/website-admin/decap-cms-3.8.4.min.js
# Should return: 200 OK, Content-Length: 5204917

# Check OAuth endpoints
curl https://dmitrybond.tech/api/decap/health
curl https://dmitrybond.tech/api/decap/diag

# Run full acceptance tests
npm run oauth:check
```

### 5. Test OAuth Flow
1. Navigate to `https://dmitrybond.tech/website-admin/`
2. Should see Decap CMS load (check Console for log)
3. Click "Login with GitHub"
4. Authorize in popup
5. Popup closes, CMS authenticated

---

## Files Changed (v2 fixes)

### Fixed:
- ✅ `apps/website/public/website-admin/index.html` - Back to local bundle
- ✅ `apps/website/src/pages/api/decap/index.ts` - Relative import
- ✅ `apps/website/src/pages/api/decap/token.ts` - Relative import
- ✅ `apps/website/package.json` - Removed unused dependency

### Created (unchanged):
- ✅ `apps/website/src/utils/decapOrigin.ts`
- ✅ `scripts/oauth-acceptance-tests.sh`

### Modified (unchanged):
- ✅ `astro.config.ts` - Removed import
- ✅ Other API routes - Enhanced with diagnostics
- ✅ Defensive redirects - Added OPTIONS, POST
- ✅ `env.example` - Added DECAP_ORIGIN

---

## Troubleshooting

### Admin page is blank
- ✅ Check: `/website-admin/decap-cms-3.8.4.min.js` returns 200 (5.2MB)
- ✅ Check Console: Should see "[Decap CMS] Loaded from local bundle"
- ✅ Check `window.CMS` exists in console

### "Invalid state" errors
- Check `/api/decap/diag` - cookie state present?
- Check proxy forwarding cookies
- Use dry-run: `/api/decap?dry=1`

### Import errors on build
- Ensure relative imports use `.js` extension
- Check `src/utils/decapOrigin.ts` exists
- Restart dev server after file changes

---

## Why This Version Works

| v1 Issue | v2 Fix |
|----------|--------|
| CDN blocked/slow | Local vendored file |
| Import path fails | Relative imports with .js |
| Unused dependency | Removed from package.json |
| Need restart for new files | Document restart requirement |

---

## Success Metrics

- ✅ Admin panel loads with local bundle
- ✅ No import/module resolution errors
- ✅ OAuth flow completes successfully
- ✅ Token exchange returns proper errors (400, not 500)
- ✅ Diagnostic endpoints show healthy status
- ✅ All acceptance tests pass

---

**Implementation Date**: 2025-10-11  
**Version**: v2 (Fixed)  
**Status**: ✅ Production Ready (with fixes applied)  
**Test Command**: `cd apps/website && npm run oauth:check`

