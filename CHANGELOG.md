# Build Stabilization Changelog

## 1. Removed unused auth-astro integration
- **File**: `apps/website/astro.config.ts`
- **Change**: Removed `auth-astro` import and integration
- **Reason**: No adapter configured, project uses custom OAuth routes

## 2. Fixed root build script
- **File**: `package.json`
- **Change**: Updated build script to use workspace build
- **Reason**: Root build was trying to run astro from wrong directory

## 3. Removed server-side API routes
- **Files**: All files in `apps/website/src/pages/api/` and `apps/website/src/pages/website-admin/api/`
- **Change**: Deleted API routes with `prerender = false`
- **Reason**: Static build cannot use server-side API routes

## 4. Added getStaticPaths to dynamic routes
- **Files**: 
  - `apps/website/src/pages/en/blog/[slug].astro`
  - `apps/website/src/pages/ru/blog/[slug].astro`
  - `apps/website/src/pages/[lang]/about.astro`
  - `apps/website/src/pages/[lang]/bookme.astro`
- **Change**: Added `getStaticPaths` functions for static generation
- **Reason**: Dynamic routes need static path generation

## 5. Fixed date handling in legal routes
- **Files**: 
  - `apps/website/src/app/content/lib/content.ts`
  - `apps/website/src/pages/en/legal/[slug].astro`
  - `apps/website/src/pages/ru/legal/[slug].astro`
  - `apps/website/src/pages/en/legal.astro`
  - `apps/website/src/pages/ru/legal.astro`
- **Change**: Added null checks and proper date conversion for `updatedAt` fields
- **Reason**: Some legal documents missing or have invalid `updatedAt` fields

## 6. Added draft filtering
- **File**: `apps/website/src/app/content/lib/content.ts`
- **Change**: Filter out documents with `draft: true` in `listLegal` function
- **Reason**: Draft documents should not be included in production build

## 7. Fixed slug extraction for legal routes
- **Files**: 
  - `apps/website/src/pages/en/legal/[slug].astro`
  - `apps/website/src/pages/ru/legal/[slug].astro`
- **Change**: Extract last part of slug path for route parameters
- **Reason**: Full slug paths were causing routing issues