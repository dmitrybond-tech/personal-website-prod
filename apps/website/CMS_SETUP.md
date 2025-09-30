# CMS Integration Setup Guide

This guide explains how to set up and use the Git-based CMS integration with Decap CMS.

## Overview

The website now includes a plug-and-play Git CMS with admin interface at `/website-admin`. The CMS provides:

- **Pages**: Override any route content (e.g., `/en/about`, `/ru/privacy`)
- **Blog**: Create blog posts in English and Russian
- **Legal**: Manage legal documents and policies

## Local Development Setup

### Prerequisites

- Node.js and npm installed
- Git repository access
- PowerShell (for Windows)

### Running the CMS Locally

1. **Start the main development server:**
   ```powershell
   cd apps/website
   npm run dev
   ```

2. **Start the CMS proxy server (in a separate terminal):**
   ```powershell
   cd apps/website
   npx decap-cms-proxy-server@1.4.0
   ```

3. **Access the admin interface:**
   - Open `http://localhost:4321/website-admin`
   - The CMS will use the local proxy for Git operations

## CMS Features

### Content Collections

- **Pages**: Override existing page content by matching `lang` and `route`
- **Blog**: Create blog posts with tags, summaries, and full content
- **Legal**: Manage legal documents with version tracking

### Transparent Override System

The `CmsOptional` component provides transparent content override:

- If a CMS entry exists for a route, it renders the CMS content wrapped in `cv-root`
- If no CMS entry exists, it renders the original page content unchanged
- Zero layout shifts or DOM changes when CMS is not used

### Cal.com Integration

- Reliable inline embed using the new `CalEmbed` component
- Prevents duplicate script loading
- Works seamlessly with the CMS override system

## File Structure

```
apps/website/
├── src/
│   ├── content/
│   │   ├── config.ts              # Content collections schema
│   │   ├── pages/                 # Page overrides
│   │   ├── blog/                  # Blog posts
│   │   └── legal/                 # Legal documents
│   └── app/
│       ├── content/
│       │   ├── lib/content.ts     # Content facade functions
│       │   └── ui/CmsOptional.astro # Transparent CMS wrapper
│       └── integrations/
│           └── cal/CalEmbed.astro # Cal.com embed component
├── public/
│   └── website-admin/
│       ├── index.html             # CMS admin interface
│       └── config.yml             # CMS configuration
└── pages/
    ├── en/blog.astro              # Blog listing (EN)
    ├── ru/blog.astro              # Blog listing (RU)
    ├── en/blog/[slug].astro       # Blog detail (EN)
    ├── ru/blog/[slug].astro       # Blog detail (RU)
    ├── en/legal.astro             # Legal listing (EN)
    ├── ru/legal.astro             # Legal listing (RU)
    ├── en/legal/[slug].astro      # Legal detail (EN)
    └── ru/legal/[slug].astro      # Legal detail (RU)
```

## Usage Examples

### Creating a Page Override

1. Go to `/website-admin`
2. Navigate to "Pages" collection
3. Create new entry with:
   - **Title**: "About Me"
   - **Slug**: "about"
   - **Language**: "en"
   - **Route**: "/en/about"
   - **Updated At**: Current date
   - **Body**: Your markdown content

### Creating a Blog Post

1. Go to `/website-admin`
2. Navigate to "Blog" collection
3. Create new entry with:
   - **Title**: "My First Post"
   - **Slug**: "my-first-post"
   - **Language**: "en"
   - **Published At**: Current date
   - **Tags**: ["welcome", "introduction"]
   - **Body**: Your markdown content

## Content Facade API

The `content.ts` module provides these functions:

```typescript
// Get page override by route
getPageByRoute(lang: 'en' | 'ru', route: string)

// Blog functions
listBlog(lang: 'en' | 'ru')
getBlogBySlug(lang: 'en' | 'ru', slug: string)

// Legal functions
listLegal(lang: 'en' | 'ru')
getLegalBySlug(lang: 'en' | 'ru', slug: string)
```

## Styling Guidelines

- CMS content is wrapped in `cv-root` class for consistent styling
- Reuse existing DevsCard styles and tokens
- No new global CSS introduced
- Maintain pixel-perfect layout stability

## Troubleshooting

### CMS Admin Not Loading

1. Ensure both servers are running (main dev server + proxy)
2. Check browser console for errors
3. Verify Git repository access

### Content Not Appearing

1. Check that the route in CMS matches exactly (e.g., "/en/about")
2. Verify language setting matches the page locale
3. Ensure content is published (not draft)

### Cal.com Embed Issues

1. Verify the `link` prop is correct (e.g., "your-username/event-type")
2. Check browser console for script loading errors
3. Ensure no duplicate Cal.com scripts are loaded

## Production Deployment

The CMS works with any Git-based hosting:

- GitHub Pages
- Netlify
- Vercel
- GitLab Pages

No additional configuration needed beyond the standard Astro build process.
