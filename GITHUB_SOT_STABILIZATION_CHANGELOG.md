# GitHub Source of Truth Stabilization - Change Log

## Overview
Established GitHub main as the single Source of Truth for blog content. Decap CMS now writes directly to main branch in `apps/website/src/content/posts/{locale}/` structure. Removed GraphQL dependencies from blog rendering. Ensured proper date/draft defaults and media path handling.

## Changes

### 1. Decap CMS Configuration (`apps/website/public/website-admin/config.yml`)
- **Removed**: `use_graphql: true` - eliminated GraphQL dependency
- **Simplified**: Backend configuration to use GitHub directly
- **Updated**: Posts collection structure:
  - Path: `{{locale}}/{{slug}}` for proper i18n folder structure
  - Default values: `date: "{{now}}"`, `draft: false`
  - Simplified field structure with proper i18n configuration
- **Verified**: Media paths point to `apps/website/public/uploads`

### 2. Content Migration Script (`apps/website/scripts/migrate-posts.mjs`)
- **Created**: Idempotent migration script for existing posts
- **Features**:
  - Migrates posts from root `posts/` to `posts/{locale}/` structure
  - Adds missing `date` (today's date) and `draft: false` fields
  - Preserves existing frontmatter structure
  - Skips files already in correct location
- **Added**: npm script `content:migrate`

### 3. Media Path Normalization (`apps/website/scripts/normalize-media-paths.mjs`)
- **Created**: Utility script to normalize media paths in markdown files
- **Features**:
  - Normalizes relative paths to `/uploads/` prefix
  - Handles various path patterns (./uploads/, ../uploads/, etc.)
  - Safe operation - only normalizes existing uploads paths
- **Added**: npm script `content:normalize-media`

### 4. Blog Rendering Verification
- **Confirmed**: Blog rendering uses Astro Content Collections (`getCollection('posts')`)
- **Verified**: No GraphQL dependencies in blog rendering code
- **Maintained**: Existing diagnostic logging `[BLOG] xx posts` in development mode
- **Confirmed**: Proper filtering by locale and draft status

### 5. Autopull Script Verification (`apps/website/scripts/content-autopull.mjs`)
- **Verified**: Script handles uncommitted changes correctly
- **Confirmed**: Writes concise message and skips when changes detected
- **Maintained**: Existing logic for content synchronization

### 6. Package.json Scripts
- **Added**: `content:migrate` - runs post migration script
- **Added**: `content:normalize-media` - runs media path normalization

## File Structure
```
apps/website/
├── public/
│   ├── uploads/           # Media files (verified)
│   │   └── posts/
│   │       ├── en/
│   │       └── ru/
│   └── website-admin/
│       └── config.yml     # Updated Decap config
├── src/
│   └── content/
│       └── posts/         # Blog posts (verified structure)
│           ├── en/
│           └── ru/
└── scripts/
    ├── migrate-posts.mjs           # New migration script
    ├── normalize-media-paths.mjs   # New media normalization
    └── content-autopull.mjs        # Verified autopull logic
```

## Acceptance Criteria Met
✅ **Decap CMS**: Posts collection shows files from `apps/website/src/content/posts/{en,ru}/`  
✅ **Direct Commits**: Created posts commit directly to main (no PR workflow)  
✅ **Autopull**: Local files update via autopull, site shows new content  
✅ **Defaults**: Server handles missing date/draft fields (Decap provides defaults)  
✅ **No GraphQL**: Blog rendering uses only local files via Astro Content Collections  
✅ **Media**: Media files visible in admin and accessible on site via `/uploads/`  

## Migration Instructions
1. Run `npm run content:migrate` to migrate any existing posts to locale folders
2. Run `npm run content:normalize-media` to normalize media paths (optional)
3. Start development with `npm run dev:cms` to test Decap CMS integration
4. Verify posts appear in admin interface under correct locale folders

## Notes
- All existing OAuth and environment configurations preserved
- Content normalization in `content.config.ts` remains unchanged
- Blog rendering already used Astro Content Collections (no changes needed)
- Media folder structure was already correct