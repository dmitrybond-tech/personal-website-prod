# GitHub Source-of-Truth Stabilization Changelog

## Goal
Stabilize GitHub as the single source-of-truth for Decap CMS by disabling local_backend, ensuring direct commits to main, cleaning up absolute FS paths, and adding visibility logging.

## Changes Made

### 1. Disabled local_backend Injection (Hard Default)
**File:** `apps/website/src/pages/api/website-admin/config.yml.ts`

- Changed local_backend injection logic to be **hard disabled by default**
- Only enables local_backend if `DECAP_LOCAL_BACKEND=TRUE` (case-insensitive) is explicitly set
- Added explicit logging showing `local_backend: DISABLED` or `ENABLED` with environment variable status
- Ensures Decap CMS always goes to GitHub OAuth unless explicitly overridden

**Before:**
```typescript
// Inject local_backend in dev when DECAP_LOCAL_BACKEND=true
if (DEV && process.env.DECAP_LOCAL_BACKEND === 'true') {
  yml = 'local_backend: true\n' + yml;
  console.log('[API config] DEV: injected local_backend: true');
}
```

**After:**
```typescript
// ЖЁСТКО: local_backend включаем только если явно DECAP_LOCAL_BACKEND=TRUE (в любом регистре)
const USE_LOCAL = DEV && /^true$/i.test(process.env.DECAP_LOCAL_BACKEND ?? '');
if (USE_LOCAL) {
  yml = 'local_backend: true\n' + yml;
}

if (DEV) {
  console.log(`[API config] local_backend: ${USE_LOCAL ? 'ENABLED' : 'DISABLED'} (env: ${process.env.DECAP_LOCAL_BACKEND ?? 'unset'})`);
  console.log('[API config] 200 OK from', p, '| bytes =', yml.length);
}
```

### 2. Updated Decap Config for Direct Main Commits
**File:** `apps/website/public/website-admin/config.yml`

- Added `publish_mode: simple` to enable direct commits to main branch
- Removed commented editorial workflow configuration
- Ensures Decap CMS publishes directly to main without PR workflow

**Before:**
```yaml
# Uncomment to force PR workflow:
# publish_mode: editorial_workflow
```

**After:**
```yaml
publish_mode: simple   # ← НЕ editorial_workflow
```

### 3. Enhanced Blog Content Visibility Logging
**Files:** 
- `apps/website/src/pages/en/blog/index.astro`
- `apps/website/src/pages/ru/blog/index.astro`

- Added detailed dev logging to show both post count and individual slugs
- Helps verify that Astro correctly indexes content from GitHub after git pull
- Shows which files are visible to the content system

**Before:**
```typescript
if (import.meta.env.DEV) console.log('[BLOG]', lang, 'posts:', posts.length);
```

**After:**
```typescript
if (import.meta.env.DEV) {
  console.log('[BLOG]', lang, 'posts:', posts.length, 'slugs:', posts.map(p => p.slug));
}
```

### 4. Verified OAuth Route Configuration
**Verified Files:**
- `apps/website/src/middleware.ts`
- No conflicting `/oauth/index.ts` files found
- Only OAuth API endpoints exist: `/api/oauth/whoami.ts` and `/api/oauth/health.ts`

- Confirmed middleware properly bypasses `/oauth` routes for astro-decap-cms-oauth package
- No route conflicts that would interfere with GitHub OAuth flow

### 5. Verified Asset Path Configuration
**Verified Files:**
- `apps/website/astro.config.ts` - has `devToolbar: { enabled: false }` as required
- CSS imports use proper relative paths (`import "../styles/main.css"`, `import "@/styles/main.css"`)
- Script imports use proper Astro patterns (`import ... ?url`)
- No absolute FS paths found in website assets

## Expected Behavior

### Server Logs
After restart, `/api/website-admin/config.yml` should show:
```
[API config] local_backend: DISABLED (env: unset)
```

### Admin Flow
1. Visit `/website-admin` → redirects to GitHub OAuth
2. After OAuth → Decap CMS loads with GitHub backend
3. Publishing creates direct commits to `dmitrybond-tech/personal-website-dev` in `apps/website/src/content/posts/{en|ru}/{slug}.md`

### Content Visibility
After `git pull`, blog index pages should show:
```
[BLOG] en posts: X slugs: ['slug1', 'slug2', ...]
[BLOG] ru posts: Y slugs: ['slug1', 'slug2', ...]
```

### No Vite Errors
- No `The request url "C:\...main.css" is outside of Vite serving allow list` errors
- CSS loads correctly with proper styling
- All assets use relative paths or proper Astro resolution

## Verification Steps

1. **Restart dev server** and check logs for `local_backend: DISABLED`
2. **Visit `/website-admin`** and verify GitHub OAuth redirect
3. **Publish test content** via Decap CMS and verify commit appears in GitHub
4. **Run `git pull`** and check blog index logs show new content
5. **Check browser console** for absence of Vite FS path errors

## Files Modified
- `apps/website/src/pages/api/website-admin/config.yml.ts`
- `apps/website/public/website-admin/config.yml`
- `apps/website/src/pages/en/blog/index.astro`
- `apps/website/src/pages/ru/blog/index.astro`

## Files Verified (No Changes Needed)
- `apps/website/src/middleware.ts` - OAuth routes properly configured
- `apps/website/astro.config.ts` - DevToolbar disabled, proper asset paths
- CSS imports - All use proper relative paths
- Script imports - All use proper Astro patterns
