# CMS Integration Changelog

## Overview
Integrated Decap CMS across the entire Astro site with a single admin UI at `/website-admin`, migrated current content from "About Me" and "Book Me" into CMS-managed files, and wired the runtime to read from CMS first with graceful fallback to existing components.

## Changes Made

### 1. Dependencies Added
- **decap-cms@3.8.4** - Core CMS functionality (already installed)
- **decap-server@3.3.1** - Local backend proxy for development
- **tsx@4.20.6** - TypeScript execution for migration scripts
- **concurrently@9.2.1** - Concurrent process management

### 2. Admin UI Setup
- **Created**: `public/website-admin/index.html` - Static admin interface
- **Created**: `public/website-admin/config.yml` - CMS configuration with GitHub backend
- **Created**: `public/website-admin/health.txt` - Health check endpoint

### 3. NPM Scripts Added
```json
{
  "cms:proxy": "decap-server",
  "cms:dev": "concurrently -k -n astro,proxy \"npm run dev -- --host --port 4321\" \"npm run cms:proxy\""
}
```

### 4. CMS Collections Defined
- **Blog Collection**: Manages existing `src/content/blog/*.md` files
- **About Collection**: Singleton files for EN/RU About pages
- **BookMe Collection**: Singleton files for EN/RU BookMe pages

### 5. Content Migration
- **Created**: `scripts/cms/seed-pages.ts` - Migration script
- **Generated**: `content/pages/about/{en,ru}.json` - About page data
- **Generated**: `content/pages/bookme/{en,ru}.json` - BookMe page data

### 6. Runtime Integration
- **Created**: `src/app/content/lib/cmsLoader.ts` - CMS data loader
- **Created**: `src/app/content/ui/CmsBlocks.astro` - About page block renderer
- **Created**: `src/app/content/ui/CmsBookMeEvents.astro` - BookMe events renderer
- **Updated**: `src/app/content/ui/CmsOptional.astro` - CMS-first with fallback

### 7. Rollback Support
- **Created**: `scripts/cms/rollback.ts` - Rollback script to disable CMS

## File Structure Changes

```
apps/website/
├── public/website-admin/           # NEW: Admin UI
│   ├── index.html
│   ├── config.yml
│   └── health.txt
├── content/pages/                  # NEW: CMS content
│   ├── about/
│   │   ├── en.json
│   │   └── ru.json
│   └── bookme/
│       ├── en.json
│       └── ru.json
├── scripts/cms/                    # NEW: CMS scripts
│   ├── seed-pages.ts
│   └── rollback.ts
└── src/app/content/
    ├── lib/
    │   └── cmsLoader.ts            # NEW: Data loader
    └── ui/
        ├── CmsBlocks.astro         # NEW: Block renderer
        ├── CmsBookMeEvents.astro   # NEW: Events renderer
        └── CmsOptional.astro       # UPDATED: CMS integration
```

## Usage Instructions

### Development
```bash
# Start CMS development environment
npm run cms:dev

# Access admin at: http://localhost:4321/website-admin/
```

### Content Management
- **Blog Posts**: Edit via CMS or directly in `src/content/blog/`
- **About Pages**: Edit via CMS at `/website-admin/` → About Page
- **BookMe Pages**: Edit via CMS at `/website-admin/` → BookMe Page

### Rollback
```bash
# Disable CMS integration
npx tsx scripts/cms/rollback.ts
```

## Technical Details

### CMS Data Flow
1. **CMS First**: Pages check for JSON files in `content/pages/`
2. **Fallback**: If no CMS data, use existing components
3. **Graceful**: No breaking changes to existing functionality

### Content Schema
- **About Pages**: Blocks with heading, text, and items types
- **BookMe Pages**: Title, intro, and events array
- **Blog Posts**: Standard frontmatter fields

### Backend Configuration
- **Development**: Local backend with `decap-server`
- **Production**: GitHub backend with OAuth
- **Media**: Uploads to `public/media/uploads/`

## Verification Checklist

- [x] Admin UI loads at `/website-admin/`
- [x] CMS shows Blog, About (EN/RU), BookMe (EN/RU) collections
- [x] Seed script creates JSON entries from existing content
- [x] `/en/about` and `/ru/about` render CMS content when available
- [x] `/en/bookme` and `/ru/bookme` render CMS content when available
- [x] Fallback to existing components when CMS data missing
- [x] No route/basepath changes
- [x] No major version bumps
- [x] All dependencies pinned exactly
- [x] `npm run cms:dev` works on Windows

## Security Considerations

- Admin UI is static and should be protected in production
- Consider implementing basic auth or IP allowlist
- GitHub OAuth required for production CMS access
- Media uploads should be validated and sanitized

## Future Enhancements

- Add preview templates for CMS content
- Implement OAuth endpoints for production
- Add more content types (portfolio, testimonials)
- Enhance media management capabilities
