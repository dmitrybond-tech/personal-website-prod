# Dev Port Stabilization & OAuth Environment Validation

## Summary

Enforced stable dev origin on `http://localhost:4321` with strict port enforcement, updated environment validation for separated Auth.js and Decap credentials, and added ASCII validation to prevent ByteString errors in OAuth callbacks.

## Changes

### 1. Port Stabilization

**File:** `apps/website/package.json`
- Added `--strictPort` flag to `dev:cms` and `dev:local` scripts
- Prevents automatic port switching to 4322/4323 when 4321 is occupied
- Ensures consistent OAuth callback URLs

**File:** `apps/website/astro.config.ts`
- Added `strictPort: true` to Vite server configuration
- Enforces port 4321 at the Vite level for additional safety

### 2. Environment Variable Validation Update

**File:** `apps/website/scripts/check-env.mjs` (new)
- Created dedicated environment validation script
- Validates new separated credential variables:
  - `AUTHJS_GITHUB_CLIENT_ID` / `AUTHJS_GITHUB_CLIENT_SECRET` (Auth.js)
  - `DECAP_GITHUB_CLIENT_ID` / `DECAP_GITHUB_CLIENT_SECRET` (Decap)
  - `AUTH_URL`, `AUTH_REDIRECT_URI`, `AUTH_SECRET`, `AUTH_TRUST_HOST`

**File:** `apps/website/package.json`
- Updated `check:env` script to use new validation file with `--env-file=.env.local`
- Replaced inline Node.js validation with maintainable script approach

### 3. ASCII Validation for URL Environment Variables

**File:** `apps/website/astro.config.ts`
- Added dev-only ASCII validation for `AUTH_URL` and `AUTH_REDIRECT_URI`
- Prevents ByteString errors by detecting non-ASCII characters (>127) in URLs
- Exits with clear error message if non-ASCII characters found
- Maintains existing OAuth callback logging for debugging

### 4. Safer OAuth Redirect Handling

**File:** `apps/website/src/middleware.ts`
- Enhanced callback URL encoding with `encodeURI()` for ASCII safety
- Ensures proper URL encoding of callback paths in Auth.js signin redirects
- Prevents encoding issues that could cause OAuth callback failures

### 5. Documentation Updates

**File:** `apps/website/README.md`
- Added "Two OAuth Apps & ASCII-only URLs" section
- Documented callback URLs for both Auth.js and Decap OAuth flows
- Added environment requirements emphasizing ASCII-only URLs
- Updated notes section with ByteString error prevention information

## Acceptance Criteria Met

✅ `npm run dev:cms` starts server on 4321 or fails immediately (no port switching)
✅ Environment validation checks new `AUTHJS_*` and `DECAP_*` variable names
✅ ASCII validation prevents ByteString errors in OAuth callbacks
✅ OAuth callback URLs are properly encoded for safety
✅ Documentation updated with clear OAuth setup requirements

## Technical Details

- **Port Enforcement:** Both CLI (`--strictPort`) and Vite (`strictPort: true`) levels
- **Environment Separation:** Maintains existing split between Auth.js and Decap credentials
- **ASCII Guard:** Runtime validation prevents non-ASCII characters in URL env vars
- **Error Prevention:** Proactive validation catches configuration issues before OAuth flows
- **No Breaking Changes:** Existing OAuth routes and middleware behavior preserved

## Files Modified

1. `apps/website/package.json` - Script updates and environment validation
2. `apps/website/astro.config.ts` - Vite strictPort and ASCII validation
3. `apps/website/scripts/check-env.mjs` - New environment validation script
4. `apps/website/src/middleware.ts` - Enhanced URL encoding
5. `apps/website/README.md` - OAuth documentation updates
