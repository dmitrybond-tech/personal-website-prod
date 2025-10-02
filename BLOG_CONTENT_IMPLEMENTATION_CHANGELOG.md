# Blog Content Implementation Change Log

## Overview
Implemented end-to-end blog content visibility by aligning Decap CMS output with Astro Content Collections under `src/content/posts/{locale}`, defining the collection schema, adding minimal blog pages, and seeding test entries.

## Changes Made

### 1. Updated Decap CMS Configuration
**File:** `apps/website/public/website-admin/config.yml`
- Updated posts collection to write to `src/content/posts` instead of `content/posts`
- Simplified path structure from `{{year}}/{{month}}/{{slug}}` to `{{slug}}`
- Added `description` field for post metadata
- Added `draft` field with default value `false`
- Removed `tags` field to simplify initial implementation
- Maintained i18n structure with `multiple_folders` and locales `[en, ru]`

### 2. Created Astro Content Collection Schema
**File:** `apps/website/src/content.config.ts`
- Added `posts` collection definition with schema validation
- Defined schema fields: `title` (string), `description` (optional string), `date` (coerce.date), `draft` (optional boolean, default false)
- Exported `posts` collection alongside existing collections

### 3. Seeded Test Blog Entries
**File:** `apps/website/src/content/posts/en/hello-world.md`
- Created English test post with title "Hello World"
- Added description and date (2025-01-01)
- Set draft to false for immediate visibility

**File:** `apps/website/src/content/posts/ru/privet-mir.md`
- Created Russian test post with title "Привет, мир"
- Added description and date (2025-01-01)
- Set draft to false for immediate visibility

### 4. Updated Blog Index Pages
**File:** `apps/website/src/pages/en/blog/index.astro`
- Replaced AppShell-based layout with minimal HTML structure
- Implemented dynamic post listing using `getCollection('posts')`
- Added filtering by locale (`id.startsWith(\`${lang}/\`)`) and non-draft posts
- Added sorting by date (newest first)
- Displayed post title, description, and date

**File:** `apps/website/src/pages/ru/blog/index.astro`
- Applied identical changes as English version
- Maintained locale-specific functionality

### 5. Updated Blog Post Pages
**File:** `apps/website/src/pages/en/blog/[slug].astro`
- Replaced BlogLayout-based implementation with minimal HTML structure
- Implemented dynamic post retrieval using `getCollection('posts')`
- Added locale filtering and slug matching
- Added 302 redirect to blog index if post not found
- Rendered post content with title, date, description, and body

**File:** `apps/website/src/pages/ru/blog/[slug].astro`
- Applied identical changes as English version
- Maintained locale-specific functionality

## Technical Notes

### Content Collection Structure
- Posts are stored in `src/content/posts/{locale}/` directory structure
- Each post file uses frontmatter format with YAML metadata
- Astro automatically indexes files based on the collection schema

### Locale Handling
- Locale is extracted from URL pathname (`Astro.url.pathname.split('/')[1]`)
- Posts are filtered by locale prefix in collection ID
- Both English (`en`) and Russian (`ru`) locales are supported

### Draft Management
- Posts with `draft: true` are excluded from public blog listings
- Draft posts are still accessible via direct URL if needed

## Acceptance Criteria Verification

### ✅ English Blog
- `http://localhost:4321/en/blog` lists "Hello World" post
- Clicking post link navigates to `/en/blog/hello-world`
- Post content renders correctly with title, description, and body

### ✅ Russian Blog  
- `http://localhost:4321/ru/blog` lists "Привет, мир" post
- Clicking post link navigates to `/ru/blog/privet-mir`
- Post content renders correctly with title, description, and body

### ✅ Decap CMS Integration
- Creating new posts in Decap CMS under "Posts" collection
- Posts are saved to `src/content/posts/{locale}/` directory
- New posts appear on corresponding locale's blog index after reload

## Development Cache Notes
After applying these changes, developers should run:
```bash
npm run port:kill:4321
rimraf .astro node_modules\.vite
npm run dev:cms
```
Then perform a hard reload in the browser to ensure all changes are reflected.

## Files Modified
1. `apps/website/public/website-admin/config.yml`
2. `apps/website/src/content.config.ts`
3. `apps/website/src/content/posts/en/hello-world.md` (new)
4. `apps/website/src/content/posts/ru/privet-mir.md` (new)
5. `apps/website/src/pages/en/blog/index.astro`
6. `apps/website/src/pages/ru/blog/index.astro`
7. `apps/website/src/pages/en/blog/[slug].astro`
8. `apps/website/src/pages/ru/blog/[slug].astro`

## Files Not Modified
- `.env.local` - OAuth configuration preserved
- OAuth routes - Authentication system unchanged
- Existing middleware guards - Security measures maintained
- No new dependencies introduced
