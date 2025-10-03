# Skills Card Implementation - How-To Guide

## Quick Start

### 1. Run Migration
```bash
cd apps/website
npm run migrate:one-skill
```

**Expected output:**
```
[migrate] Starting React skill migration...
[migrate] Processing en/about.md...
[migrate] ✅ Updated en/about.md with React skill
[migrate] Processing ru/about.md...
[migrate] ✅ Updated ru/about.md with React skill
[migrate] ✅ Migration completed!
```

### 2. Start Development Server
```bash
npm run dev:all
```

**This starts:**
- Astro dev server on http://localhost:4321
- Decap CMS proxy server (if configured)

**Or use:**
```bash
npm run dev  # Astro only
npm run dev:cms  # CMS proxy only
```

### 3. View the About Pages

**English:**
```
http://localhost:4321/en/about
```

**Russian:**
```
http://localhost:4321/ru/about
```

**Expected appearance:**
- Section header: "Skills" (EN) or "Навыки" (RU)
- One card with:
  - React logo icon (Iconify `simple-icons:react`)
  - Title: "React"
  - Link to https://react.dev
  - 5-segment level bar (all filled for level 5)
  - Info icon with tooltip: "Hooks, Suspense, RSC basics" (EN) or "Хуки, Suspense, основы RSC" (RU)

---

## Edit in Decap CMS

### 1. Access the CMS
```
http://localhost:4321/website-admin
```

### 2. Find the About Page
1. Navigate to "Pages" or "About" collection
2. Select "About" (EN) or "Обо мне" (RU)

### 3. Edit Skills Section
1. Locate the "Skills" section
2. Expand "I already know" group
3. Edit React card fields:
   - **Name**: React
   - **Icon**: simple-icons:react
   - **URL**: https://react.dev
   - **Level**: 5 (1-5 slider)
   - **Description**: Hooks, Suspense, RSC basics

### 4. Save Changes
1. Click "Save" in CMS
2. Changes persist to `src/content/aboutPage/[lang]/about.md`
3. Refresh browser to see updates

---

## File Structure

### CMS Data Files
```
src/content/aboutPage/
├── en/
│   └── about.md  (EN React skill)
└── ru/
    └── about.md  (RU React skill)
```

### Seed Fallback
```
src/content/blocks/
└── skills.seed.json  (Used if CMS is empty)
```

### Component Hierarchy
```
pages/[lang]/about.astro
  ├── Loads CMS data via getEntry()
  ├── Normalizes sections (getType, mapType, normalize)
  └── Renders via registry

registry.ts
  └── skills → Cards.astro

Cards.astro
  ├── Processes data.groups[0].items
  └── Passes to CardsSection.astro

CardsSection.astro
  ├── Renders SSR skeleton (gray blocks)
  └── Hydrates CardGridIsland.tsx

CardGridIsland.tsx
  └── Renders skill cards with:
      ├── Iconify icons
      ├── 5-segment level bars
      └── Tooltips
```

---

## Troubleshooting

### Issue: React card not showing

**Solutions:**
1. Restart dev server:
   ```bash
   npm run dev:all
   ```

2. Check CMS data files:
   ```bash
   cat src/content/aboutPage/en/about.md
   cat src/content/aboutPage/ru/about.md
   ```

3. Re-run migration:
   ```bash
   npm run migrate:one-skill
   ```

4. Check browser console for errors
5. Check server logs for debug output:
   ```
   [about] sections.total=1
   [about] normalized types=["skills"]
   [cards] variant=skills items=1
   ```

### Issue: CMS not loading

**Solutions:**
1. Check if proxy is running:
   ```bash
   netstat -an | findstr :8081
   ```

2. Restart CMS proxy:
   ```bash
   npm run cms:proxy
   ```

3. Check Decap configuration in `public/admin/config.yml`

### Issue: Tailwind styles not applying

**Solutions:**
1. Clear cache:
   ```bash
   npm run clean:cache
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. Check for @apply errors (none should exist)

---

## Adding More Skills

### Via CMS

1. Open http://localhost:4321/website-admin
2. Edit "About" page
3. Add new item to "I already know" group:
   ```yaml
   - name: "TypeScript"
     icon: "simple-icons:typescript"
     url: "https://www.typescriptlang.org/"
     level: 5
     description: "Generics, utils, TSConfig"
   ```

### Via Direct File Edit

Edit `src/content/aboutPage/en/about.md`:

```yaml
---
title: About
slug: en/about
sections:
  - type: skills
    data:
      title: "Skills"
      groups:
        - title: "I already know"
          items:
            - name: "React"
              icon: "simple-icons:react"
              url: "https://react.dev"
              level: 5
              description: "Hooks, Suspense, RSC basics"
            - name: "TypeScript"  # NEW
              icon: "simple-icons:typescript"
              url: "https://www.typescriptlang.org/"
              level: 5
              description: "Generics, utils, TSConfig"
---
```

---

## Production Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Preview Build
```bash
npm run preview
```

### 3. Deploy
- Static site: Deploy `dist/` folder
- SSR: Deploy with Node.js adapter

### 4. CMS Authentication
- Configure Decap OAuth provider (GitHub, GitLab, etc.)
- See `OAUTH_SETUP_RUNBOOK.md` for details

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `scripts/migrate-one-skill.ts` | Migration script |
| `package.json` | npm scripts |
| `pages/[lang]/about.astro` | Section normalization |
| `features/about/sections/Cards.astro` | Data processing |
| `features/about/registry.ts` | Component mapping |
| `components/cards/CardsSection.astro` | SSR wrapper |
| `components/cards/CardGridIsland.tsx` | React island |
| `content/aboutPage/[lang]/about.md` | CMS data |
| `content/blocks/skills.seed.json` | Fallback data |
| `content.config.ts` | Schema validation |

---

## Support

For issues or questions:
1. Check server console logs
2. Inspect browser console
3. Verify CMS data structure
4. Review debug output
5. Check `SKILLS_CARD_IMPLEMENTATION_CHANGELOG.md` for details

