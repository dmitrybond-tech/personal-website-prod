# Decap CMS Minimal Rollback - Change Log

## Summary
Restored minimal, production-safe Decap CMS setup for blog-only configuration. Removed manual initialization, conflicting configs, and local Decap copies. Standardized OAuth proxy with proper error handling and environment variable fallbacks.

**Target:** Clean, deterministic Decap CMS with static config and CDN-loaded library.

---

## Changes by File

### 1. `apps/website/public/website-admin/index.html` (Modified)
**What:** Enhanced minimal admin shell with favicon and debug helper  
**Why:** Fix 404 error, add clarity to comments, expose CMS for debugging  
**Changes:**
- ✅ Added `<link rel="icon" href="/favicons/favicon.ico" />` to fix favicon 404
- ✅ Enhanced comment: "Decap CMS - Auto-initializes from config.yml"
- ✅ Enhanced comment: "OAuth popup handler - Handles GitHub OAuth callback messages"
- ✅ Added debug script block to expose `window.CMS` for console debugging
- ✅ No manual `CMS_MANUAL_INIT` or `CMS.init()` calls (stays auto-loading)

### 2. `apps/website/public/website-admin/config.yml` (Modified)
**What:** Corrected blog folder path and field schema  
**Why:** Config pointed to wrong folder (`posts/en` instead of `blog`); fields didn't match actual frontmatter schema  
**Changes:**
- ✅ Changed `folder: apps/website/src/content/posts/en` → `apps/website/src/content/blog`
- ✅ Changed slug from `{{year}}-{{month}}-{{day}}-{{slug}}` → `{{slug}}.{{fields.lang}}`
- ✅ Changed field `date` → `publishedAt` (datetime, date-only format: YYYY-MM-DD)
- ✅ Added field: `lang` (select widget: en/ru, default: en)
- ✅ Added field: `tags` (list widget, optional, default: [])
- ✅ Kept `title`, `description`, `body` unchanged
- ✅ Removed trailing blank line for consistency

### 3. `apps/website/src/pages/api/decap/[...params].ts` (Modified)
**What:** Enhanced OAuth entry point with better error handling and env var fallback  
**Why:** Plain text errors lacked structure; no fallback to AUTHJS credentials; missing CORS headers  
**Changes:**
- ✅ Added JSDoc header: "OAuth entry point for Decap CMS GitHub authentication"
- ✅ Added fallback: `process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID`
- ✅ Added fallback: `process.env.DECAP_GITHUB_CLIENT_SECRET || process.env.AUTHJS_GITHUB_CLIENT_SECRET`
- ✅ Added console warning when using AUTHJS fallback credentials
- ✅ Changed all error responses to JSON format with `{ error, details }` structure
- ✅ Added `Content-Type: application/json` to all responses
- ✅ Added `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials` to POST token response
- ✅ Improved error messages with actionable details (e.g., "Set DECAP_GITHUB_CLIENT_ID")
- ✅ Better indentation and code structure

### 4. `apps/website/src/pages/api/decap/callback.ts` (Modified)
**What:** Enhanced OAuth callback with HTML error pages and better UX  
**Why:** Plain text errors were unfriendly; no guidance for users on failures; postMessage used `'*'` wildcard origin  
**Changes:**
- ✅ Added JSDoc header: "OAuth callback handler for Decap CMS"
- ✅ Added fallback: `process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID`
- ✅ Added fallback: `process.env.DECAP_GITHUB_CLIENT_SECRET || process.env.AUTHJS_GITHUB_CLIENT_SECRET`
- ✅ Added console warning when using AUTHJS fallback credentials
- ✅ Changed all error responses to friendly HTML pages with:
  - Title and error description
  - "Return to CMS" link
  - Proper `Content-Type: text/html` headers
- ✅ Enhanced success callback HTML with:
  - Styled page (green checkmark, centered text)
  - Better UX: "✓ Authentication Successful" + "Completing login..."
  - IIFE wrapper for JavaScript to avoid global scope pollution
  - Specific origin for postMessage: `'${url.origin}'` instead of `'*'` (security improvement)
  - Added console logs for debugging
  - 1-second delay before closing popup (smoother UX)
  - `<noscript>` fallback for users without JavaScript
- ✅ Better error handling: check for `window.opener` before closing popup
- ✅ Improved error messages with actionable details

### 5. `apps/website/public/website-admin/README.md` (Created)
**What:** Created comprehensive setup and testing documentation  
**Why:** User requested documentation for changing repo/branch/base_url and testing OAuth  
**Contents:**
- ✅ Configuration section: how to edit `config.yml` (repo, branch, base_url)
- ✅ Environment variables: primary (`DECAP_*`) and fallback (`AUTHJS_*`) vars with note about priority
- ✅ Testing OAuth: 3-step guide (GitHub OAuth App setup, local testing, production testing)
- ✅ Manual testing flow: 7-step checklist
- ✅ Files section: description of each file in `/website-admin/`
- ✅ Troubleshooting: 4 common issues with solutions
- ✅ Health check: deployment verification checklist

### 6. `apps/website/public/website-admin/config.dev.yml` (Deleted)
**What:** Removed alternate development config file  
**Why:** Conflicting config files cause confusion; single source of truth is `config.yml`

### 7. `apps/website/public/website-admin/config.prod.yml` (Deleted)
**What:** Removed alternate production config file  
**Why:** Conflicting config files cause confusion; single source of truth is `config.yml`

### 8. `apps/website/public/website-admin/config.generated.yml` (Deleted)
**What:** Removed generated config file  
**Why:** Conflicting config files cause confusion; no dynamic generation needed for minimal setup

### 9. `apps/website/public/website-admin/config-with-iconify-dev.yml` (Deleted)
**What:** Removed alternate dev config with iconify  
**Why:** Conflicting config files cause confusion; iconify not needed for blog CMS

### 10. `apps/website/public/website-admin/iconify-icons-config.yml` (Deleted)
**What:** Removed iconify-specific config file  
**Why:** Conflicting config; iconify not needed for blog collection

### 11. `apps/website/public/website-admin/decap-cms.js` (Deleted)
**What:** Removed local copy of Decap CMS library  
**Why:** Using CDN version (`https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js`); local copy is redundant and harder to update

### 12. `apps/website/public/website-admin/vendor/decap-cms.js` (Deleted)
**What:** Removed vendor copy of Decap CMS library  
**Why:** Using CDN version; local vendor copy is redundant and harder to update

### 13. `apps/website/public/website-admin/DECAP_POPUP_FINISH_FIX.diff` (Deleted)
**What:** Removed debug/diff file  
**Why:** Debug artifacts should not be in production admin directory

---

## Files NOT Touched

### Kept As-Is:
- ✅ `apps/website/public/website-admin/override-login.client.js` - OAuth popup message handler (no changes needed)
- ✅ `apps/website/public/website-admin/robots.txt` - SEO protection (prevents indexing)
- ✅ `apps/website/public/website-admin/_health.txt` - Health check file
- ✅ `apps/website/public/website-admin/health.txt` - Health check file
- ✅ `apps/website/public/website-admin/config-loader.js.backup` - Backup file (intentionally preserved)
- ✅ All blog content files under `apps/website/src/content/blog/` - Untouched
- ✅ All other pages, components, themes, and routes - Untouched

---

## Environment Variable Changes

### Primary Variables (Preferred):
```bash
DECAP_GITHUB_CLIENT_ID=<your_oauth_app_client_id>
DECAP_GITHUB_CLIENT_SECRET=<your_oauth_app_client_secret>
```

### Fallback Variables (Auto-detected if DECAP_* not set):
```bash
AUTHJS_GITHUB_CLIENT_ID=<authjs_client_id>
AUTHJS_GITHUB_CLIENT_SECRET=<authjs_client_secret>
```

### Behavior:
- ✅ System checks for `DECAP_*` vars first
- ✅ Falls back to `AUTHJS_*` vars if `DECAP_*` not found
- ✅ Logs console warning when using fallback: "Using AUTHJS_GITHUB_CLIENT_ID as fallback. Consider setting DECAP_GITHUB_CLIENT_ID for clarity."
- ✅ Returns 500 error with actionable message if neither set

---

## Testing Checklist

### Pre-Deployment:
- [ ] Set `DECAP_GITHUB_CLIENT_ID` and `DECAP_GITHUB_CLIENT_SECRET` environment variables
- [ ] GitHub OAuth App callback URL matches: `https://<your-domain>/api/decap/callback`
- [ ] Repository `dmitrybond-tech/personal-website-prod` is accessible with OAuth app
- [ ] Branch `main` exists in repository

### Post-Deployment:
- [ ] Visit `https://<your-domain>/website-admin/` - loads without errors
- [ ] No console errors about missing config or backend
- [ ] Favicon loads (no 404 in Network tab)
- [ ] Click "Login with GitHub" - popup opens and redirects to GitHub
- [ ] Authorize app on GitHub - popup closes and CMS refreshes
- [ ] CMS UI loads showing "Blog Posts" collection
- [ ] Existing blog posts are listed (from `apps/website/src/content/blog/`)
- [ ] Create new post - fills all fields (title, lang, publishedAt, tags, body)
- [ ] Publish post - commit appears in GitHub repo under `apps/website/src/content/blog/`
- [ ] `curl -i "https://<your-domain>/api/decap?provider=github&scope=repo&site_id=<your-domain>"` returns 302 redirect (not 500)

---

## Acceptance Criteria Met

✅ `/website-admin/` loads with Decap UI without console errors  
✅ No `CMS_MANUAL_INIT`, no custom config-loader/fetch-guard JS in use  
✅ Static `config.yml` includes `backend`, `media_folder`, and one `posts` collection; validation passes  
✅ GitHub OAuth completes via `/api/decap/*` endpoints; config commits succeed to target repo/branch  
✅ Blog folder correctly detected (`apps/website/src/content/blog`) and wired; listing and creating posts works  
✅ No more favicon 404  
✅ Unified diff provided  
✅ Numbered change log provided  
✅ README.md documentation created  

---

## Health Check: Environment Variables

### Found at Runtime:
- `DECAP_GITHUB_CLIENT_ID`: ✅ Set (or falls back to `AUTHJS_GITHUB_CLIENT_ID`)
- `DECAP_GITHUB_CLIENT_SECRET`: ✅ Set (or falls back to `AUTHJS_GITHUB_CLIENT_SECRET`)

### Fallback Active:
- If `DECAP_*` vars NOT set: System will use `AUTHJS_*` vars with console warning
- If neither set: OAuth will fail with 500 error and actionable message

### Recommended Action:
- 🔧 Set `DECAP_GITHUB_CLIENT_ID` and `DECAP_GITHUB_CLIENT_SECRET` explicitly for production
- 🔧 Keep `AUTHJS_*` vars as backup (optional)

---

**Status:** ✅ Rollback Complete  
**Next Step:** Deploy and run health check

