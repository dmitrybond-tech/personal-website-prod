# Decap Admin Config Fix - Change Log

## Overview
Fixed Decap admin configuration loading to work reliably regardless of i18n prefixes and OAuth hash redirects by implementing manual initialization with absolute config paths and middleware redirects.

## Changes

### 1. Custom Admin Index with Manual Init
**File:** `apps/website/public/website-admin/index.html`

- Replaced auto-initialized Decap setup with manual initialization
- Added `window.CMS_MANUAL_INIT = true` to prevent automatic config loading
- Set `window.CMS_CONFIG_PATH = '/website-admin/config.yml'` for absolute config path
- Updated to use `decap-cms@^3` from CDN for version flexibility
- Added manual `window.CMS.init()` call after script loading
- Improved HTML structure with proper meta tags and noindex directive

### 2. Middleware Config Path Redirect
**File:** `apps/website/src/middleware.ts`

- Added regex-based redirect for localized config requests: `/<locale>/website-admin/config.yml` → `/website-admin/config.yml`
- Implemented 302 redirect for XHR-friendly behavior
- Positioned redirect logic after OAuth exclusions but before admin protection
- Removed previous `?config=` query parameter redirect logic (superseded by manual init)

### 3. Documentation Update
**File:** `apps/website/README.md`

- Updated i18n Admin Configuration section to reflect new approach
- Documented manual initialization with `CMS_MANUAL_INIT` and `CMS_CONFIG_PATH`
- Explained middleware redirect behavior for localized config paths
- Clarified that OAuth endpoints remain unchanged

## Technical Details

### Problem Solved
- Decap admin could fail to load config when accessed via i18n-prefixed routes (`/en/website-admin`, `/ru/website-admin`)
- Hash-based redirects after OAuth login could cause relative config requests to fail
- Previous `?config=` redirect approach was less robust against hash navigation

### Solution Approach
- **Manual Initialization:** Forces Decap to use absolute config path regardless of current URL
- **Middleware Redirect:** Handles XHR requests for config from localized paths
- **Preserved OAuth Flow:** No changes to existing `/oauth` endpoints or authentication

### Acceptance Criteria Met
- ✅ `GET /website-admin/config.yml` returns YAML (200 OK)
- ✅ Admin accessible via `/en/website-admin` and `/ru/website-admin` without config errors
- ✅ Network panel shows config fetched from absolute path or via 302 redirect
- ✅ No redirect loops, admin authorization preserved, OAuth flow unchanged

## Files Modified
1. `apps/website/public/website-admin/index.html` - Custom admin page with manual init
2. `apps/website/src/middleware.ts` - Added config path redirect, removed old logic
3. `apps/website/README.md` - Updated documentation

## Dependencies
- No new runtime dependencies added
- Uses existing Decap CMS v3 from CDN
- Maintains compatibility with existing OAuth backend
