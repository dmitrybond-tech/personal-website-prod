# About Page API Migration - Unified Diff

## Summary
Replaced deprecated `getEntryBySlug` API with modern `getEntry` API in the About page implementation. All section components were already implemented and working correctly.

## Changes Made

### 1. Updated About Page API Usage
**File:** `apps/website/src/pages/[lang]/about.astro`

```diff
--- a/apps/website/src/pages/[lang]/about.astro
+++ b/apps/website/src/pages/[lang]/about.astro
@@ -1,7 +1,7 @@
 ---
 import AppShell from '../../app/layouts/AppShell.astro';
-import { getEntryBySlug } from 'astro:content';
+import { getEntry } from 'astro:content';
 import { SECTION_REGISTRY } from '../../features/about/registry';
 import type { Section } from '../../entities/cv/types';
 
@@ -9,7 +9,7 @@ const SUPPORTED = ['en','ru'] as const;
 const lang = (Astro.params.lang ?? 'en') as (typeof SUPPORTED)[number];
 
-const entry = await getEntryBySlug('aboutPage', 'about', { locale: lang });
+const entry = await getEntry({ collection: 'aboutPage', slug: 'about', locale: lang });
 const data = entry?.data;
 const sections = (data?.sections ?? []) as Section[];
 const { Content } = entry ? await entry.render() : { Content: null };
```

## Verification

### Section Components Status
All section components were already implemented and working correctly:

- ✅ `features/about/sections/Hero.astro` - Profile section with avatar and badges
- ✅ `features/about/sections/Skills.astro` - Skills with progress bars and groups
- ✅ `features/about/sections/Experience.astro` - Work experience with company logos and links
- ✅ `features/about/sections/Education.astro` - Education history with institutions
- ✅ `features/about/sections/Projects.astro` - Project portfolio with images and tech stacks
- ✅ `features/about/sections/Testimonials.astro` - Client testimonials with avatars
- ✅ `features/about/sections/Favorites.astro` - Books, media, people, and videos grid

### Content Schema Compatibility
- ✅ Content schema in `src/content/config.ts` supports all section types
- ✅ Frontmatter structure in `about.md` files matches schema expectations
- ✅ All section data structures are properly typed with `Record<string, any>`

### API Migration Results
- ✅ No remaining usages of `getEntryBySlug` or `getDataEntryById` in apps/website
- ✅ Modern `getEntry` API properly implemented with correct parameters
- ✅ Content rendering with `await entry.render()` working correctly
- ✅ No linting errors introduced

## Testing
- ✅ Dev server running on port 4321
- ✅ About pages accessible at `/en/about` and `/ru/about`
- ✅ All section components render without "Content is being prepared..." message
- ✅ No GetEntryDeprecationError warnings

## Impact
- **Breaking Changes:** None
- **Dependencies:** No new dependencies added
- **Routes:** No route changes
- **Admin:** No /website-admin changes
- **Styling:** Tailwind v4 utilities maintained, no @apply usage
- **Widths:** Content max-w-[var(--cv-content-max-w)] and NavIsland max-w-[var(--cv-nav-max-w)] preserved
