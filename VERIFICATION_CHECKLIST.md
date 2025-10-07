# Verification Checklist

## PreProd Deployment Verification

### 1. Cal.com Embed Functionality
- [ ] **Inspect rendered page**: The embed container has `data-cal-link="dmitrybond/<slug>"` format
  - Check browser dev tools for the Cal.com embed container
  - Verify `data-cal-link` attribute shows `dmitrybond/intro-30m` (not full URL)
  - Confirm no malformed URLs like `cal.com.dmitrybond.intro30`

- [ ] **Test event switching**: Click different event tiles to verify:
  - `data-cal-link` updates to correct `username/slug` format
  - Cal.com embed loads the correct event type
  - URL parameters update correctly (`?event=<slug>`)

- [ ] **Verify environment variables**: Check that all Cal.com env vars are properly set:
  - `PUBLIC_CAL_USERNAME=dmitrybond`
  - `PUBLIC_CAL_EMBED_LINK=https://cal.com/dmitrybond`
  - `PUBLIC_CAL_EVENTS=intro-30m|Intro 30m,tech-90m|Tech 90m,quick-15m|Quick 15m`

### 2. Static Asset Path Verification
- [ ] **Test direct URLs**: Verify these URLs return 200 in PreProd:
  - `/my-image.jpeg` (should serve from `public/my-image.jpeg`)
  - `/devscard/my-image.jpeg` (should serve from `public/devscard/my-image.jpeg`)
  - `/uploads/logos/datacom-group-ltd-logo.png` (should serve from `public/uploads/logos/...`)
  - `/uploads/placeholders/avatar.svg` (should serve from `public/uploads/placeholders/...`)
  - `/favorites/books/book-1.jpeg` (should serve from `public/favorites/books/...`)

- [ ] **Check for 404s**: Ensure no assets are returning 404 due to incorrect `/assets/` paths

### 3. DEBUG_CAL Diagnostics (Optional)
- [ ] **With DEBUG_CAL=0**: Verify diagnostic pages are NOT accessible:
  - `/__diag/cal` should redirect to 404
  - `/__diag/public-urls` should redirect to 404
  - No diagnostic logs in browser console

- [ ] **With DEBUG_CAL=1**: Verify diagnostic features work:
  - `/__diag/cal` shows parsed events and computed data-cal-link examples
  - `/__diag/public-urls` tests static asset URLs and shows results
  - Browser console shows `🔍 Cal.com Debug Info:` with environment variables
  - `window.__APP_PUBLIC` object is available in browser console

### 4. Build and Deployment
- [ ] **Docker build**: Verify build completes successfully with new build args
- [ ] **Environment variables**: Confirm all `PUBLIC_*` variables are available at build time
- [ ] **Image labels**: Verify `org.opencontainers.image.revision=$GITHUB_SHA` is preserved
- [ ] **No regressions**: Ensure existing functionality still works:
  - Navigation and routing
  - Theme switching
  - Locale switching
  - Other Cal.com components (if any)

### 5. Browser Testing
- [ ] **Chrome/Edge**: Test Cal.com embed functionality
- [ ] **Firefox**: Test Cal.com embed functionality  
- [ ] **Mobile**: Test responsive behavior of Cal.com booking component
- [ ] **Console errors**: Check for any JavaScript errors related to Cal.com

## Expected Results

### Cal.com Embed
- Embed loads successfully with proper `dmitrybond/<slug>` format
- Event switching works without page reload
- No malformed URLs or missing username issues

### Static Assets
- All image references resolve correctly
- No 404 errors for assets that exist in `public/` directory
- Proper fallback behavior for missing assets

### Diagnostics
- Debug mode works when enabled
- Debug mode is completely disabled when not enabled
- Diagnostic pages provide useful troubleshooting information

## Rollback Plan
If issues are found:
1. Revert the Cal.com component changes
2. Revert static asset path changes
3. Remove diagnostic files
4. Revert Dockerfile changes
5. Redeploy with previous configuration

## Success Criteria
- ✅ Cal.com embed works in PreProd exactly like local
- ✅ `data-cal-link` uses proper `username/slug` format
- ✅ Static assets resolve correctly from `public/` directory
- ✅ No malformed Cal.com URLs
- ✅ Build-time environment variables are properly available
- ✅ Optional diagnostics work when enabled
