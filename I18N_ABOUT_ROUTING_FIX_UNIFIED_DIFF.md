# I18N About Routing Fix - Unified Diff

## Summary
Fixed redirect loop on `/en/about`, made i18n About pages render from the new content collection, and removed the Tailwind @apply error.

## Changes Made

### 1. Fixed Redirect Loop in `src/pages/[lang]/about.astro`

**File**: `apps/website/src/pages/[lang]/about.astro`

```diff
--- a/apps/website/src/pages/[lang]/about.astro
+++ b/apps/website/src/pages/[lang]/about.astro
@@ -17,7 +17,8 @@ const locale = lang as 'en' | 'ru';
 // Load About content for the specific locale only
 const aboutPageData = await getAboutPage(locale);
 
 if (!aboutPageData) {
-  return Astro.redirect('/en/about');
+  console.warn(`About page content not found for locale: ${locale}. Returning 404 to prevent redirect loop.`);
+  return new Response('Not Found', { status: 404 });
 }
 
 // Transform the data to the format expected by AboutShell
```

### 2. Fixed Tailwind @apply Error in `src/features/about/ui/AboutShell.astro`

**File**: `apps/website/src/features/about/ui/AboutShell.astro`

```diff
--- a/apps/website/src/features/about/ui/AboutShell.astro
+++ b/apps/website/src/features/about/ui/AboutShell.astro
@@ -51,7 +51,7 @@ function getSectionData(sectionKey: string) {
 ---
 
-<section class="cv-root">
+<section class="cv-root xl:relative xl:left-7">
   <div class="cv-layout mx-auto max-w-[var(--cv-max-w)] px-[var(--cv-gap)]
               grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-8
               overflow-visible">
@@ -140,11 +140,6 @@ function getSectionData(sectionKey: string) {
     overflow: visible !important;
   }
   
-  @media (min-width: 1280px) {
-    .cv-root {
-      @apply relative left-7;
-    }
-  }
-  
   .cv-layout {
     overflow: visible !important;
   }
```

### 3. Content Files Already Exist

The content files `src/content/aboutPage/en/about.mdx` and `src/content/aboutPage/ru/about.mdx` already exist with proper schema-compliant data, so no changes were needed.

## Root Cause Analysis

1. **Redirect Loop**: The original code redirected to `/en/about` when content was missing, but if `/en/about` itself had no content, it would redirect to itself, creating an infinite loop.

2. **Tailwind @apply Error**: Tailwind v4 doesn't support `@apply` inside media queries. The `@apply relative left-7` rule was moved to the HTML class attribute instead.

3. **Content Collection**: The aboutPage collection was properly configured and content files existed, but the redirect logic prevented proper rendering.

## Verification Steps

1. ✅ No `ERR_TOO_MANY_REDIRECTS` on `/en/about`
2. ✅ No Tailwind `Cannot apply unknown utility class left-7` errors  
3. ✅ Astro content sync shows the aboutPage collection with 2 localized entries
4. ✅ Blog/Footer unaffected
5. ✅ Middleware i18n redirects still work for bare `/about` → `/{DEFAULT_LOCALE}/about`

## Files Modified

- `apps/website/src/pages/[lang]/about.astro` - Fixed redirect loop
- `apps/website/src/features/about/ui/AboutShell.astro` - Fixed Tailwind @apply error

## Files Unchanged

- `apps/website/src/content/aboutPage/en/about.mdx` - Already exists with proper content
- `apps/website/src/content/aboutPage/ru/about.mdx` - Already exists with proper content
- Blog and Footer components - Left untouched as requested
