# Astro Redirect v5 Compatibility Changelog

## Summary
Replaced invalid `astro:redirect` usage with server-side redirects compatible with Astro v5 and Node adapter.

## Problem
- Importing from `astro:redirect` throws: "Cannot find module 'astro:redirect'"
- `Astro.redirect()` usage was also incompatible with Astro v5
- Index pages were failing to redirect properly

## Solution
Implemented server-side redirects using `Response` objects with 302 status codes, compatible with Astro v5.

## Changes Made

### 1. Fixed `/en/index.astro`
**Before:**
```astro
---
import { redirect } from 'astro:redirect';

export const prerender = true;

// Redirect to the English about page
return redirect('/en/about', 302);
---
```

**After:**
```astro
---
const target = new URL('/en/about', Astro.request.url).toString();
return new Response(null, { status: 302, headers: { Location: target } });
---
```

### 2. Fixed `/ru/index.astro`
**Before:**
```astro
---
import { redirect } from 'astro:redirect';

export const prerender = true;

// Redirect to the Russian about page
return redirect('/ru/about', 302);
---
```

**After:**
```astro
---
const target = new URL('/ru/about', Astro.request.url).toString();
return new Response(null, { status: 302, headers: { Location: target } });
---
```

### 3. Fixed `/index.astro` (root)
**Before:**
```astro
---
return Astro.redirect('/en/about');
---
<html><body>
  <!-- Client fallback content -->
  <noscript>
    <meta http-equiv="refresh" content="0;url=/en/about" />
    <p><a href="/en/about">Go to English</a> | <a href="/ru/about">Перейти на русский</a></p>
  </noscript>
</body></html>
```

**After:**
```astro
---
const target = new URL('/en/about', Astro.request.url).toString();
return new Response(null, { status: 302, headers: { Location: target } });
---
```

## Redirect Behavior
- `/` → `/en/about` (302 redirect)
- `/en` → `/en/about` (302 redirect)
- `/ru` → `/ru/about` (302 redirect)

## Verification
- ✅ No `astro:redirect` imports remain in code files
- ✅ All index pages use server-side redirects
- ✅ Redirects work with Astro v5 + Node adapter
- ✅ No changes to About page rendering logic
- ✅ No changes to Blog, Footer, or i18n middleware
- ✅ Compatible with both dev and build modes

## Files Modified
- `apps/website/src/pages/en/index.astro`
- `apps/website/src/pages/ru/index.astro`
- `apps/website/src/pages/index.astro`

## Technical Notes
- Uses `new URL()` to construct absolute URLs from relative paths
- Server-side redirects work in both development and production
- No additional dependencies required
- Maintains SEO-friendly 302 redirects
- Compatible with static output (if needed in future, can add config redirects as fallback)
