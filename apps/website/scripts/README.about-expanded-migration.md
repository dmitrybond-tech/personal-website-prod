# About Expanded → TS Remap + Decap 2-Way Sync Migration

This migration moves the About page to use `about-expanded.md` as the single source of truth with TypeScript remapping and Decap CMS 2-way sync.

## Overview

- **Source**: `about-expanded.md` files in `src/content/aboutPage/{locale}/`
- **Adapter**: TypeScript remapping from new schema to existing component interfaces
- **CMS**: Decap CMS with local backend for 2-way sync
- **Output**: `admin/config.generated.yml` for Decap CMS integration

## Quick Start

### 1. Install Dependencies

```bash
pnpm add -D fast-glob@3.3.2 gray-matter@4.0.3 yaml@2.5.0 toml@3.0.0 yargs@17.7.2 zod@3.23.8
```

### 2. Generate Decap CMS Configuration

```bash
# Preview the generated config (dry-run mode)
node apps/website/scripts/decap-migrate.mjs --pretty --dry-run

# Apply the configuration
node apps/website/scripts/decap-migrate.mjs --apply --pretty
```

### 3. Start Decap CMS Proxy Server

```bash
npx decap-cms-proxy-server --port 8081
```

### 4. Open Admin Interface

```
http://localhost:4321/website-admin/?config=/admin/config.generated.yml
```

## Migration Script Usage

The `decap-migrate.mjs` script provides the following options:

```bash
# Basic usage (dry-run by default)
node apps/website/scripts/decap-migrate.mjs

# Apply changes
node apps/website/scripts/decap-migrate.mjs --apply

# Pretty print YAML output
node apps/website/scripts/decap-migrate.mjs --pretty

# Debug mode with verbose logging
node apps/website/scripts/decap-migrate.mjs --logLevel debug

# Custom paths
node apps/website/scripts/decap-migrate.mjs --root apps/website --contentDir src/content/aboutPage
```

## File Structure

```
apps/website/
├── src/
│   ├── content/aboutPage/
│   │   ├── en/about-expanded.md
│   │   └── ru/about-expanded.md
│   └── features/about/devscard/lib/
│       ├── aboutExpandedSchema.ts      # Zod schema and types
│       ├── aboutExpandedAdapter.ts     # Legacy format mapper
│       ├── loadAboutExpanded.ts        # Data loader
│       └── aboutExpandedAdapter.test.ts # Unit tests
├── admin/
│   └── config.generated.yml            # Generated Decap CMS config
└── scripts/
    └── decap-migrate.mjs               # Migration script
```

## About Expanded Schema

The `about-expanded.md` files use a structured YAML frontmatter format:

```yaml
---
title: About
slug: en/about
sections:
  - type: main
    data:
      title: Profile
      slug: profile
      icon: fa6-solid:user
      visible: true
      fullName: Mark Freeman
      role: Senior React Developer
      image: /devscard/my-image.jpeg
      description: |
        Lorem ipsum dolor sit amet, consectetur **adipiscing elit**.
      details:
        - label: Phone
          value: 605 475 6961
          url: tel:605 475 6961
        - label: Email
          value: mark.freeman.dev@gmail.com
          url: mailto:mark.freeman.dev@gmail.com
      tags:
        - name: Open for freelance
        - name: Available for mentoring
      action:
        label: Download CV
        url: /devscard/cv.pdf
        downloadedFileName: CV-Mark_Freeman.pdf
      links:
        - label: GitHub
          url: "#"
          icon: fa6-brands:github
          color: "#181717"
        - label: LinkedIn
          url: "#"
          icon: fa6-brands:linkedin
          color: "#0A66C2"

  - type: skills
    data:
      title: Skills
      slug: skills
      icon: fa6-solid:bars-progress
      visible: true
      skillSets:
        - title: I already know
          skills:
            - name: React
              icon: fa6-brands:react
              level: 5
              description: Expert level React developer
            - name: TypeScript
              icon: fa6-brands:typescript
              level: 4
              description: Strong TypeScript knowledge

  - type: experience
    data:
      title: Experience
      slug: experience
      icon: fa6-solid:briefcase
      visible: true
      items:
        - company: CloudBlue
          location: 'Enschede, the Netherlands'
          logo: /logos/cloudblue.svg
          website: https://cloudblue.com
          roles:
            - title: Delivery Manager
              period: Mar 2023 – Apr 2025
              description: Led partner enablement and post-launch support.
              bullets:
                - Led partner enablement and post-launch support
                - Managed delivery of integration projects
              technologies:
                - React
                - TypeScript
                - Node.js
                - AWS
              links:
                - label: Company Website
                  url: https://cloudblue.com

  - type: favorites
    data:
      title: Favorites
      slug: favorites
      icon: fa6-solid:star
      visible: true
      style:
        variant: tile
        cols:
          base: 2
          sm: 3
          lg: 6
      groups:
        - title: Books I read
          type: books
          style:
            limit: 5
          items:
            - title: The Pragmatic Programmer
              author: Andy Hunt, Dave Thomas
              url: https://www.goodreads.com/book/show/4099.The_Pragmatic_Programmer
              image: /devscard/favorites/books/book-1.jpeg
        - title: People I learn from
          type: people
          style:
            limit: 5
          items:
            - name: Kent C. Dodds
              url: https://kentcdodds.com/
              image: /devscard/favorites/people/person-1.jpg
---
```

## Decap CMS Features

The generated configuration provides:

- **Local Backend**: No Git integration required
- **Safe Operations**: `create: false`, `delete: false` by default
- **Rich Editing**: Full section support with nested objects
- **Media Management**: Image uploads to `/public/uploads/`
- **Validation**: Zod schema validation on data load
- **Type Safety**: TypeScript types for all fields

## Integration with About Page

To use the new data source in your About page:

```typescript
// Replace existing data loading
import { loadAboutExpanded } from '../features/about/devscard/lib/loadAboutExpanded';

// In your About page component
const data = await loadAboutExpanded(locale);
// data is now in the legacy format expected by existing components
```

## Testing

Run the unit tests for the adapter:

```bash
npm test -- aboutExpandedAdapter.test.ts
```

## Troubleshooting

### No about-expanded.md files found
The script will create sample files automatically when using `--apply` flag.

### Validation errors
Check that your `about-expanded.md` files match the expected schema structure.

### Decap CMS not loading
Ensure the proxy server is running on port 8081 and the config file exists at `admin/config.generated.yml`.

### TypeScript errors
Make sure all required dependencies are installed and the schema types are properly imported.

## Migration Checklist

- [ ] Install required dependencies
- [ ] Run migration script with `--apply`
- [ ] Start Decap CMS proxy server
- [ ] Verify admin interface loads
- [ ] Test editing functionality
- [ ] Update About page to use new data source
- [ ] Run unit tests
- [ ] Verify build passes
- [ ] Test both EN and RU locales
