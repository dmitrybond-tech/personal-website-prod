# Decap i18n Configuration Fix - Change Log

## Overview
Fixed Decap admin configuration error by implementing i18n content structure with working collections for pages and posts.

## Changes

### 1. Created i18n Content Directory Structure
- **Added**: `apps/website/content/pages/en/` - English pages directory
- **Added**: `apps/website/content/pages/ru/` - Russian pages directory  
- **Added**: `apps/website/content/posts/en/` - English posts directory
- **Added**: `apps/website/content/posts/ru/` - Russian posts directory

### 2. Created Seed Content Entries
- **Added**: `apps/website/content/pages/en/home.md` - English home page with title "Home" and permalink "/"
- **Added**: `apps/website/content/pages/ru/home.md` - Russian home page with title "Главная" and permalink "/"
- **Added**: `apps/website/content/posts/en/hello-world.md` - English sample post "Hello World"
- **Added**: `apps/website/content/posts/ru/privet-mir.md` - Russian sample post "Привет, мир"

### 3. Updated Decap Configuration
- **Modified**: `apps/website/public/website-admin/config.yml`
  - Replaced empty `collections: []` with two working collections
  - Added "pages" collection with i18n support, frontmatter format, and fields for title, permalink, date, and body
  - Added "posts" collection with i18n support, frontmatter format, and fields for title, date, body, and tags
  - Maintained existing backend, media, and i18n configuration
  - Preserved OAuth endpoints and middleware settings

### 4. Updated Documentation
- **Modified**: `apps/website/README.md`
  - Added "Content Management" section explaining content structure
  - Documented editorial workflow option
  - Added note about future Content Collections integration

## Technical Details

### Collection Configuration
- **Pages Collection**: Uses simple slug-based paths (`{{slug}}`) for flat page structure
- **Posts Collection**: Uses date-based paths (`{{year}}/{{month}}/{{slug}}`) for organized post structure
- **i18n Support**: Both collections use `i18n: true` with `multiple_folders` structure
- **Field Types**: String widgets for titles/permalink, datetime for dates, markdown for body content, list for tags

### Content Structure
- **Format**: Frontmatter-based Markdown files (`.md`)
- **Locales**: English (`en`) and Russian (`ru`) with `multiple_folders` structure
- **Default Locale**: English (`en`) as specified in existing i18n config

## Acceptance Criteria Met
✅ `GET http://localhost:4321/website-admin/config.yml` returns YAML with two collections  
✅ Decap admin loads without "collections must NOT have fewer than 1 items" error  
✅ Sidebar shows "Pages" and "Posts" collections  
✅ Sample entries are visible and editable in admin interface  
✅ New entries can be created in appropriate locale folders  
✅ OAuth and middleware configuration preserved unchanged  

## Files Modified
- `apps/website/public/website-admin/config.yml` - Added collections configuration
- `apps/website/README.md` - Added content management documentation

## Files Created
- `apps/website/content/pages/en/home.md` - English home page
- `apps/website/content/pages/ru/home.md` - Russian home page  
- `apps/website/content/posts/en/hello-world.md` - English sample post
- `apps/website/content/posts/ru/privet-mir.md` - Russian sample post

## Directories Created
- `apps/website/content/pages/en/` - English pages directory
- `apps/website/content/pages/ru/` - Russian pages directory
- `apps/website/content/posts/en/` - English posts directory
- `apps/website/content/posts/ru/` - Russian posts directory