# AppShell Implementation - Change Log

## Overview
Successfully implemented a global AppShell component that renders the Navbar on every page, including blog list and posts. Created BlogLayout.astro for blog-specific styling and updated all pages to use the new layout system.

## Numbered Change Log

### 1. Created `src/app/layouts/AppShell.astro`
- **Purpose**: Global layout component that imports main.css once and renders Navbar on every page
- **Features**:
  - Imports `@/styles/main.css` exactly once
  - Renders `<header data-app-navbar><Navbar/></header>` and `<main><slot/></main>`
  - Adds ResizeObserver script that sets CSS variable `--navbar-h` based on header height
  - Supports variants: 'default', 'bookme', 'about', 'blog'
  - Includes all meta tags, theme initialization, and locale switching logic
  - Maintains existing BaseLayout functionality

### 2. Created `src/app/layouts/BlogLayout.astro`
- **Purpose**: Blog-specific layout that wraps content with prose classes
- **Features**:
  - Imports AppShell and wraps `<slot/>` inside `<AppShell>`
  - Applies prose classes for blog content styling
  - Sets variant="blog" for proper page styling
  - Maintains responsive design with max-width container

### 3. Updated `src/pages/en/blog/[slug].astro`
- **Changes**:
  - Replaced `BaseLayout` import with `BlogLayout`
  - Removed duplicate `Navbar` import (now handled by AppShell)
  - Updated to use `BlogLayout` component
  - Fixed field reference from `post.data.summary` to `post.data.description`
  - Removed redundant `<main>` and container classes (handled by BlogLayout)

### 4. Updated `src/pages/ru/blog/[slug].astro`
- **Changes**:
  - Replaced `BaseLayout` import with `BlogLayout`
  - Removed duplicate `Navbar` import (now handled by AppShell)
  - Updated to use `BlogLayout` component
  - Fixed field reference from `post.data.summary` to `post.data.description`
  - Removed redundant `<main>` and container classes (handled by BlogLayout)

### 5. Updated `src/pages/en/blog/index.astro`
- **Changes**:
  - Replaced `BaseLayout` import with `AppShell`
  - Updated to use `AppShell` with `variant="blog"`
  - Maintains existing content and styling

### 6. Updated `src/pages/ru/blog/index.astro`
- **Changes**:
  - Replaced `BaseLayout` import with `AppShell`
  - Updated to use `AppShell` with `variant="blog"`
  - Maintains existing content and styling

### 7. Updated `src/pages/en/about.astro`
- **Changes**:
  - Replaced `BaseLayout` import with `AppShell`
  - Removed duplicate `Navbar` import (now handled by AppShell)
  - Updated to use `AppShell` with `variant="about"`
  - Maintains existing AboutShell and CmsOptional components

### 8. Updated `src/pages/ru/about.astro`
- **Changes**:
  - Replaced `BaseLayout` import with `AppShell`
  - Removed duplicate `Navbar` import (now handled by AppShell)
  - Updated to use `AppShell` with `variant="about"`
  - Maintains existing AboutShell and CmsOptional components

### 9. Updated `src/pages/en/bookme.astro`
- **Changes**:
  - Replaced `BaseLayout` import with `AppShell`
  - Removed duplicate `Navbar` import (now handled by AppShell)
  - Updated to use `AppShell` with `variant="bookme"`
  - Maintains existing booking functionality

### 10. Updated `src/pages/ru/bookme.astro`
- **Changes**:
  - Replaced `BaseLayout` import with `AppShell`
  - Removed duplicate `Navbar` import (now handled by AppShell)
  - Updated to use `AppShell` with `variant="bookme"`
  - Maintains existing booking functionality

### 11. Updated `src/app/widgets/navbar/ui/Navbar.astro`
- **Changes**:
  - Removed duplicate navbar height sync script
  - Script moved to AppShell for global access
  - Maintains existing navbar styling and functionality

## Where AppShell is Imported

### Direct AppShell Usage:
- `src/pages/en/blog/index.astro`
- `src/pages/ru/blog/index.astro`
- `src/pages/en/about.astro`
- `src/pages/ru/about.astro`
- `src/pages/en/bookme.astro`
- `src/pages/ru/bookme.astro`

### BlogLayout Usage (which imports AppShell):
- `src/pages/en/blog/[slug].astro`
- `src/pages/ru/blog/[slug].astro`

## Frontmatter Changes

No frontmatter changes were needed as the blog posts already have the correct structure. The existing content collection schema in `src/content.config.ts` already defines the required fields:
- `title: z.string()`
- `lang: z.enum(["en", "ru"])`
- `publishedAt: z.coerce.date()`
- `description: z.string().optional()`
- `tags: z.array(z.string()).default([])`
- `cover: image().optional()`

## Verification Checklist

### ✅ DOM Header Presence
- All pages now render `<header data-app-navbar>` with Navbar component
- Navbar includes brand, navigation links, and language toggle
- Consistent across all page types (about, bookme, blog)

### ✅ --navbar-h CSS Variable Applied
- Global ResizeObserver script in AppShell sets `--navbar-h` on document root
- Variable updates automatically when navbar height changes
- Available globally for sticky sidebar positioning

### ✅ Dark Mode Working
- Theme initialization script preserved in AppShell
- Supports both `data-theme` and `class="dark"` approaches
- Maintains existing theme switching functionality

### ✅ Global CSS Import
- `@/styles/main.css` imported exactly once in AppShell
- No duplicate CSS imports across pages
- Maintains all existing styling and functionality

### ✅ No Route/Basepath Changes
- All existing URLs continue to work
- No changes to routing or base paths
- Maintains existing page structure and navigation

## Technical Notes

- **Build Issues**: Some existing build warnings remain (unrelated to our changes):
  - Missing `@/styles/tailwind.css` import in devscard components
  - `auth-astro/config` resolution issue
- **Content Collections**: Blog posts use existing content collection system
- **Styling**: Maintains all existing Tailwind v4 and custom CSS
- **Performance**: Single CSS import and global navbar script improve performance
- **Maintainability**: Centralized layout logic makes future updates easier

## Acceptance Criteria Met

✅ Blog list and individual posts render the same Navbar as the rest of the site  
✅ The CSS variable `--navbar-h` is present globally (root) and updates with Navbar height changes  
✅ No route/basepath changes; all pages continue to work  
✅ Global CSS is imported once (in AppShell)  
✅ Minimal, surgical edits with no major package/version changes  
✅ Existing blog rendering logic preserved  
✅ Clean separation of concerns with AppShell and BlogLayout components
