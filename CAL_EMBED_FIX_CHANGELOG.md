# Cal.com Embed Fix Changelog

## Summary
Fixed Cal.com embed issues in PreProd environment where inline embeds failed due to malformed username/slug format and incorrect static asset path references.

## Changes Made

### 1. Cal.com Embed Fix
- **Created** `apps/website/src/lib/cal.ts` with utility functions:
  - `parseCalEvents()` - parses 'slug|Title,slug2|Title2' format
  - `makeCalDataLink()` - builds proper 'username/slug' format for data-cal-link
  - `extractUsernameFromBase()` - extracts username from Cal.com base URL
  - `buildCalOverlayUrl()` - builds full Cal.com overlay URLs

- **Updated** `apps/website/src/widgets/cal/CalBooking.astro`:
  - Import and use new utility functions
  - Fixed `data-cal-link` to use proper `username/slug` format instead of full URL
  - Updated JavaScript to build correct overlay URLs while maintaining proper data-cal-link format

### 2. Static Asset Path Fixes
- **Fixed** incorrect asset path references:
  - `apps/website/src/content/en/main.ts`: `/assets/my-image.jpeg` → `/my-image.jpeg`
  - `apps/website/src/content/ru/main.ts`: `/assets/my-image.jpeg` → `/my-image.jpeg`
  - `apps/website/src/features/about/devscard/locales/en/config.ts`: `/src/assets/devscard/my-image.jpeg` → `/devscard/my-image.jpeg`
  - `apps/website/src/features/about/devscard/locales/ru/config.ts`: `/src/assets/my-image.jpeg` → `/my-image.jpeg`

### 3. Dockerfile Build Args
- **Updated** `Dockerfile` to accept `DEBUG_CAL` build argument:
  - Added `ARG DEBUG_CAL=0`
  - Added `ENV DEBUG_CAL=$DEBUG_CAL`

### 4. Optional Diagnostics (DEBUG_CAL mode)
- **Created** `apps/website/src/lib/cal-diagnostics.ts` with diagnostic utilities
- **Created** `apps/website/src/pages/__diag/cal.astro` - Cal.com configuration diagnostics page
- **Created** `apps/website/src/pages/__diag/public-urls.astro` - Static asset URL testing page
- **Updated** `apps/website/src/layouts/BaseLayout.astro` to inject diagnostic script when `DEBUG_CAL=1`

## Technical Details

### Cal.com Embed Format
- **Before**: `data-cal-link="https://cal.com/dmitrybond/intro-30m"`
- **After**: `data-cal-link="dmitrybond/intro-30m"`

### Static Asset Paths
- **Before**: `/assets/my-image.jpeg` (404 in PreProd)
- **After**: `/my-image.jpeg` (resolves to `public/my-image.jpeg`)

### Environment Variables
- All existing `PUBLIC_*` variables are preserved
- Added `DEBUG_CAL` for optional diagnostics
- Build-time environment variables are properly passed through Dockerfile

## Files Modified
- `apps/website/src/lib/cal.ts` (new)
- `apps/website/src/lib/cal-diagnostics.ts` (new)
- `apps/website/src/widgets/cal/CalBooking.astro`
- `apps/website/src/content/en/main.ts`
- `apps/website/src/content/ru/main.ts`
- `apps/website/src/features/about/devscard/locales/en/config.ts`
- `apps/website/src/features/about/devscard/locales/ru/config.ts`
- `apps/website/src/layouts/BaseLayout.astro`
- `apps/website/src/pages/__diag/cal.astro` (new)
- `apps/website/src/pages/__diag/public-urls.astro` (new)
- `Dockerfile`

## Files Not Modified
- No infrastructure files (Caddy, compose files, etc.)
- No CI workflows (none found)
- No package.json or dependency changes
- No content text changes
