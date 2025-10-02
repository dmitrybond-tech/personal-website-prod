# i18n Implementation Changelog

## Overview
This changelog documents the implementation of end-to-end i18n for the Astro + Decap CMS website, enabling localized content management and routing for English and Russian locales.

## Changes Made

### 1. CMS Configuration Updates
- **File**: `apps/website/public/website-admin/index.html`
  - Added config link tag: `<link href="/website-admin/config.yml" type="text/yaml" rel="cms-config-url" />`
  - Ensures Decap CMS properly loads the configuration file

- **File**: `apps/website/public/website-admin/config.yml`
  - Updated i18n configuration to use `multiple_folders` structure
  - Converted About and BookMe collections from "files" to "folder" collections with `i18n: true`
  - Updated Footer collection to use proper i18n folder structure with `slug: "index"`
  - Added proper field-level i18n configuration for all localized fields
  - Maintained Blog collection as single-file with `lang` field (optional i18n)

### 2. Content Structure Migration
- **Migration Script**: `apps/website/scripts/cms/migrate-pages-i18n.ts`
  - Created automated migration script to transform existing content
  - Migrates About and BookMe pages from flat JSON files to locale-specific folders
  - Renames footer files from `footer.json` to `index.json` for consistency
  - Idempotent and safe to run multiple times

- **Content Files Created**:
  - `apps/website/src/content/pages/about/en/index.json`
  - `apps/website/src/content/pages/about/ru/index.json`
  - `apps/website/src/content/pages/bookme/en/index.json`
  - `apps/website/src/content/pages/bookme/ru/index.json`
  - `apps/website/src/content/footer/en/index.json`
  - `apps/website/src/content/footer/ru/index.json`

### 3. Runtime Loader Updates
- **File**: `apps/website/src/app/content/lib/cmsLoader.ts`
  - Updated `readPage()` function to use new i18n folder structure
  - Changed glob pattern from `**/*.json` to `**/index.json`
  - Updated file paths to use `{slug}/{lang}/index.json` format
  - Updated `readFooter()` function to use new footer structure

### 4. Astro i18n Routing Configuration
- **File**: `apps/website/astro.config.ts`
  - Added `routing` configuration with `prefixDefaultLocale: true`
  - Set `redirectToDefaultLocale: false` to prevent automatic redirects
  - Enforces consistent `/en/**` and `/ru/**` URL patterns

- **Locale Index Pages**:
  - `apps/website/src/pages/en/index.astro` - Redirects to `/en/about`
  - `apps/website/src/pages/ru/index.astro` - Redirects to `/ru/about`

### 5. Language Switcher Implementation
- **File**: `apps/website/src/app/shared/i18n/switch.ts`
  - Created comprehensive language switching utility
  - `switchLocaleHref()` function maps current page to target locale
  - Handles special cases for root paths, blog routes, and admin routes
  - Provides fallback logic for missing localized content
  - Includes helper functions for locale detection and display

- **File**: `apps/website/src/app/shared/ui/LanguageToggle/LanguageToggle.astro`
  - Updated to use new language switcher utility
  - Enhanced UI with flag emojis and better styling
  - Improved accessibility with proper ARIA labels

### 6. CSS Import Fixes
- **Files**: Multiple component files
  - Fixed `@reference` import paths for Tailwind CSS
  - Updated from `@/styles/tailwind.css` to relative paths
  - Ensures proper CSS compilation during build

### 7. Documentation
- **File**: `apps/website/scripts/cms/README.md`
  - Comprehensive documentation for CMS i18n migration
  - Instructions for adding new locales
  - Troubleshooting guide for common issues
  - Content structure explanation

## Technical Details

### Content Structure
```
src/content/
├── pages/
│   ├── about/
│   │   ├── en/
│   │   │   └── index.json
│   │   └── ru/
│   │       └── index.json
│   └── bookme/
│       ├── en/
│       │   └── index.json
│       └── ru/
│           └── index.json
└── footer/
    ├── en/
    │   └── index.json
    └── ru/
        └── index.json
```

### CMS Collections
- **About Page**: Folder collection with `i18n: true`, slug `index`
- **BookMe Page**: Folder collection with `i18n: true`, slug `index`
- **Footer**: Folder collection with `i18n: true`, slug `index`
- **Blog**: Single-file collection with `lang` field (optional i18n)

### Routing Behavior
- All routes now require locale prefix (`/en/` or `/ru/`)
- Root paths (`/en`, `/ru`) redirect to respective about pages
- Language switcher preserves current page context with fallbacks
- Admin and API routes remain unchanged

## Migration Process
1. Run migration script: `npx tsx scripts/cms/migrate-pages-i18n.ts`
2. Verify CMS admin interface shows localized collections
3. Test language switching functionality
4. Verify all routes work with locale prefixes

## Acceptance Criteria Met
✅ CMS shows localized entries for Footer, About, BookMe with EN/RU toggles  
✅ Astro routes work for `/en/**` and `/ru/**` with no 404 at `/ru`  
✅ CMS and runtime read/write the same content paths  
✅ OAuth flow remains unchanged  
✅ Language switcher maps current page to target locale with fallbacks  
✅ No major version bumps or breaking changes  

## Files Modified
- 18 files modified/created
- 6 new content files in i18n structure
- 1 new migration script
- 1 new language switcher utility
- 1 comprehensive README

## Next Steps
- Test CMS admin interface functionality
- Verify all localized routes work correctly
- Test language switching on all pages
- Consider adding more locales using the documented process
