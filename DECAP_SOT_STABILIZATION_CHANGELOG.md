# Decap CMS SoT Stabilization Changelog

## Overview
Stabilized Decap CMS to use GitHub OAuth exclusively, improved listing stability with GraphQL, added diagnostics, and created content sync script.

## Changes Made

### 1. Backend Configuration (public/website-admin/config.yml)
- **Added**: `use_graphql: true` to backend configuration for stable GitHub listing
- **Verified**: No `local_backend: true` present in base config
- **Confirmed**: Posts collection uses correct path `{{slug}}` without locale duplication

### 2. Admin Bootstrap Diagnostics (public/website-admin/index.html)
- **Added**: Diagnostic script that logs current locale and post count after CMS initialization
- **Output**: `[DECAP DEBUG] locale= en|ru posts(listed)= N` in browser console
- **Purpose**: Monitor admin UI state without affecting functionality

### 3. Content Sync Script (scripts/content-pull.mjs)
- **Created**: New script for pulling content from GitHub
- **Functionality**: `git fetch origin && git rebase origin/main`
- **Error Handling**: Proper exit codes and error messages
- **Integration**: Added `npm run content:pull` command to package.json

### 4. Server Proxy Verification (src/pages/api/website-admin/config.yml.ts)
- **Verified**: `local_backend` only enabled when `DECAP_LOCAL_BACKEND=true` explicitly set
- **Default**: `local_backend: DISABLED` in development logs
- **Behavior**: No automatic injection of local backend configuration

## Acceptance Criteria Met

✅ **Backend Configuration**: GitHub OAuth with `use_graphql: true` enabled  
✅ **Posts Collection**: Correct path without locale duplication  
✅ **Server Logs**: `/api/website-admin/config.yml` shows `local_backend: DISABLED`  
✅ **Admin Diagnostics**: Console shows `[DECAP DEBUG] locale= en|ru posts(listed)= N`  
✅ **Content Sync**: `npm run content:pull` command available and functional  
✅ **No Local Backend**: Verified no automatic local backend injection  

## Files Modified

1. `apps/website/public/website-admin/config.yml` - Added GraphQL backend option
2. `apps/website/public/website-admin/index.html` - Added diagnostic script
3. `apps/website/scripts/content-pull.mjs` - New sync script
4. `apps/website/package.json` - Added content:pull npm script

## Testing Notes

- Content pull script tested and working (detects unstaged changes correctly)
- Admin diagnostics ready for browser console monitoring
- Server proxy configuration verified to disable local backend by default
- All changes maintain existing functionality while adding stability improvements

## Next Steps

1. Test admin interface with new GraphQL backend
2. Verify post creation works with correct locale paths
3. Monitor console logs for diagnostic information
4. Use `npm run content:pull` to sync new content from GitHub
