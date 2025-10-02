# Content Visibility Fix - Numbered Change Log

## Overview
Fixed content visibility issues by removing OAuth collision, purging FS URLs, and enabling dev local_backend injection for immediate Decap CMS content updates.

## Changes Made

### 1. Remove /oauth Collision
**File:** `apps/website/src/pages/oauth/index.ts`
- **Action:** Deleted the file completely
- **Reason:** This custom OAuth route was conflicting with the `astro-decap-cms-oauth` integration
- **Impact:** OAuth flow now properly handled by the astro-decap-cms-oauth package with routes `/oauth` and `/oauth/callback`

### 2. Clean Absolute FS Paths in Assets
**File:** `apps/website/src/app/widgets/footer/ui/Footer.astro`
- **Action:** Replaced absolute CSS import with proper Astro import
- **Before:** `@import "/src/styles/tokens-fallback.css";` (absolute path causing Vite errors)
- **After:** Added `import '../../../../styles/tokens-fallback.css';` in frontmatter
- **Impact:** Eliminates Vite "outside of allow list" errors and ensures proper CSS loading

### 3. Implement Dev Local Backend Injection
**File:** `apps/website/src/pages/api/website-admin/config.yml.ts`
- **Action:** Added conditional local_backend injection for development
- **Logic:** When `DECAP_LOCAL_BACKEND=true` environment variable is set in dev mode, prepends `local_backend: true\n` to the config.yml response
- **Impact:** Enables immediate local file writing by Decap CMS without requiring git operations
- **Usage:** Set `DECAP_LOCAL_BACKEND=true` in .env.local and run `npx decap-server --port 8081`

### 4. Add Blog Post Count Diagnostics
**Files:** 
- `apps/website/src/pages/en/blog/index.astro`
- `apps/website/src/pages/ru/blog/index.astro`
- **Action:** Added dev-only console logging for post counts
- **Code:** `if (import.meta.env.DEV) console.log('[BLOG]', lang, 'posts:', posts.length);`
- **Impact:** Provides visibility into how many posts Astro is detecting for each language

## Technical Details

### OAuth Integration
- The `astro-decap-cms-oauth` package handles OAuth routes at `/oauth` and `/oauth/callback`
- Configuration in `astro.config.ts` shows proper integration setup
- Custom OAuth route was redundant and causing conflicts

### Asset Path Resolution
- Astro requires CSS imports to be in frontmatter, not in `<style>` blocks
- Absolute paths like `/src/styles/...` cause Vite security errors on Windows
- Proper relative imports resolve correctly through Astro's build system

### Local Backend Configuration
- Decap CMS supports local file writing with `local_backend: true`
- Requires separate `decap-server` process running on port 8081
- Files are written directly to `apps/website/src/content/posts/{lang}/...`
- Astro's file watcher detects changes immediately

### Development Workflow
1. Set `DECAP_LOCAL_BACKEND=true` in `.env.local`
2. Run `npx decap-server --port 8081` in separate terminal
3. Start Astro dev server: `npm run dev`
4. Access `/website-admin` - now uses local backend
5. Create/edit posts - appear immediately in file system and on blog pages

## Verification Steps

### OAuth Collision Fix
- [ ] No "/oauth" collision errors in dev server logs
- [ ] `/website-admin` loads without OAuth route conflicts
- [ ] OAuth flow works through astro-decap-cms-oauth integration

### FS Path Cleanup
- [ ] No Vite "outside of allow list" errors in console
- [ ] Footer styles load correctly (tokens-fallback.css)
- [ ] All CSS imports use proper Astro import syntax

### Local Backend Injection
- [ ] Without `DECAP_LOCAL_BACKEND=true`: config.yml returns original content
- [ ] With `DECAP_LOCAL_BACKEND=true`: config.yml includes `local_backend: true`
- [ ] Decap CMS can write files locally when decap-server is running
- [ ] Created posts appear immediately on blog pages without git pull

### Blog Diagnostics
- [ ] Dev console shows `[BLOG] en posts: X` and `[BLOG] ru posts: Y` on blog index pages
- [ ] Post counts reflect actual content in `src/content/posts/{lang}/` directories

## Environment Variables

### Required for Local Backend
```bash
# .env.local
DECAP_LOCAL_BACKEND=true
```

### Existing OAuth Variables (unchanged)
```bash
# .env.local
DECAP_GITHUB_CLIENT_ID=your_client_id
DECAP_GITHUB_CLIENT_SECRET=your_client_secret
```

## Dependencies

### Existing (unchanged)
- `astro-decap-cms-oauth: 0.5.1` - handles OAuth routes
- `decap-cms: 3.8.4` - CMS interface
- `decap-server: 3.3.1` - local backend server

### Usage Commands
```bash
# Start local backend server
npx decap-server --port 8081

# Start Astro dev server
npm run dev

# Or run both concurrently
npm run cms:dev
```

## Files Modified Summary
1. `apps/website/src/pages/oauth/index.ts` - DELETED
2. `apps/website/src/app/widgets/footer/ui/Footer.astro` - CSS import fix
3. `apps/website/src/pages/api/website-admin/config.yml.ts` - local_backend injection
4. `apps/website/src/pages/en/blog/index.astro` - dev logging
5. `apps/website/src/pages/ru/blog/index.astro` - dev logging

## Files Unchanged
- `apps/website/astro.config.ts` - OAuth integration config (already correct)
- `apps/website/public/website-admin/config.yml` - base config (injection handled by API)
- `.env.local` - OAuth credentials (unchanged as requested)
- GitHub OAuth keys and auth logic (unchanged as requested)
