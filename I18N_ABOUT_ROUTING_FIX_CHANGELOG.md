# I18N About Routing Fix - Changelog

## Problem Description

The i18n About pages were experiencing a redirect loop on `/en/about` due to improper error handling when content was missing. Additionally, Tailwind v4 compatibility issues were preventing the dev server from starting.

## Root Cause

1. **Redirect Loop**: When `aboutPageData` was falsy, the code redirected to `/en/about`, but if `/en/about` itself had no content, it would redirect to itself, creating an infinite loop (`ERR_TOO_MANY_REDIRECTS`).

2. **Tailwind @apply Error**: The `@apply relative left-7` rule inside a media query is not supported in Tailwind v4, causing build errors.

## Solution Implemented

### 1. Fixed Redirect Loop
- **File**: `src/pages/[lang]/about.astro`
- **Change**: Replaced `return Astro.redirect('/en/about')` with `return new Response('Not Found', { status: 404 })`
- **Rationale**: When content is missing, return a proper 404 response instead of redirecting, preventing the loop
- **Added**: Console warning to explain why 404 is returned

### 2. Fixed Tailwind @apply Error  
- **File**: `src/features/about/ui/AboutShell.astro`
- **Change**: Removed `@apply relative left-7` from CSS media query and added `xl:relative xl:left-7` to HTML class attribute
- **Rationale**: Tailwind v4 doesn't support `@apply` inside media queries; utility classes should be used directly in HTML

### 3. Content Collection Status
- **Status**: Content files already exist and are properly structured
- **Files**: `src/content/aboutPage/en/about.mdx` and `src/content/aboutPage/ru/about.mdx`
- **Schema**: Both files comply with the aboutPage collection schema

## Impact

### Positive Changes
- ✅ Eliminated redirect loop on `/en/about` and `/ru/about`
- ✅ Fixed Tailwind v4 compatibility issues
- ✅ About pages now render properly from content collection
- ✅ Proper 404 handling when content is missing
- ✅ Dev server starts without errors

### Unchanged
- ✅ Blog functionality remains untouched
- ✅ Footer functionality remains untouched  
- ✅ Middleware i18n redirects still work (`/about` → `/en/about`)
- ✅ Non-About routes remain unaffected

## Technical Details

### Before Fix
```javascript
if (!aboutPageData) {
  return Astro.redirect('/en/about'); // Creates loop if /en/about has no content
}
```

### After Fix
```javascript
if (!aboutPageData) {
  console.warn(`About page content not found for locale: ${locale}. Returning 404 to prevent redirect loop.`);
  return new Response('Not Found', { status: 404 });
}
```

### CSS Fix
```css
/* Before - Not supported in Tailwind v4 */
@media (min-width: 1280px) {
  .cv-root {
    @apply relative left-7;
  }
}

/* After - Moved to HTML class */
<section class="cv-root xl:relative xl:left-7">
```

## Testing Results

- ✅ `/en/about` - Renders properly with content
- ✅ `/ru/about` - Renders properly with content  
- ✅ `/about` - Redirects to `/en/about` via middleware
- ✅ Missing content scenarios - Returns 404 instead of loop
- ✅ Dev server - Starts without Tailwind errors
- ✅ Content sync - Shows aboutPage collection with 2 entries

## Files Modified

1. `apps/website/src/pages/[lang]/about.astro` - Fixed redirect logic
2. `apps/website/src/features/about/ui/AboutShell.astro` - Fixed Tailwind compatibility

## Files Unchanged

- All blog-related files
- All footer-related files  
- Middleware configuration
- Content collection files (already properly configured)
