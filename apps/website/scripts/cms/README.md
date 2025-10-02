# CMS i18n Migration

This directory contains scripts for managing the CMS i18n migration and future locale additions.

## Migration Script

### `migrate-pages-i18n.ts`

This script migrates existing About and BookMe pages from the old file-based structure to the new i18n folder structure.

**What it does:**
- Migrates `src/content/pages/about/{en,ru}.json` → `src/content/pages/about/{en,ru}/index.json`
- Migrates `src/content/pages/bookme/{en,ru}.json` → `src/content/pages/bookme/{en,ru}/index.json`
- Renames `src/content/footer/{en,ru}/footer.json` → `src/content/footer/{en,ru}/index.json`
- Transforms data structure to match new CMS field definitions

**Usage:**
```bash
npx tsx scripts/cms/migrate-pages-i18n.ts
```

**Idempotent:** Safe to run multiple times.

## Adding a New Locale

To add a new locale (e.g., `fr` for French):

### 1. Update CMS Configuration

Edit `public/website-admin/config.yml`:

```yaml
i18n:
  structure: multiple_folders
  locales: [en, ru, fr]  # Add new locale
  default_locale: en
```

### 2. Update Astro Configuration

Edit `astro.config.ts`:

```typescript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'ru', 'fr'],  // Add new locale
  routing: {
    prefixDefaultLocale: true,
    redirectToDefaultLocale: false
  }
}
```

### 3. Create Content Structure

Create the new locale folders and files:

```bash
# Create directories
mkdir -p src/content/pages/about/fr
mkdir -p src/content/pages/bookme/fr
mkdir -p src/content/footer/fr

# Create index files (copy from existing locale and translate)
cp src/content/pages/about/en/index.json src/content/pages/about/fr/index.json
cp src/content/pages/bookme/en/index.json src/content/pages/bookme/fr/index.json
cp src/content/footer/en/index.json src/content/footer/fr/index.json
```

### 4. Update TypeScript Types

Update `src/app/content/lib/cmsLoader.ts`:

```typescript
// Change all 'en' | 'ru' to 'en' | 'ru' | 'fr'
export async function readPage(lang: 'en' | 'ru' | 'fr', slug: 'about' | 'bookme'): Promise<PageData | null>
```

### 5. Update Language Switcher

Update `src/app/shared/i18n/switch.ts`:

```typescript
export type Locale = 'en' | 'ru' | 'fr';

export function getLocaleDisplayName(locale: Locale): string {
  return locale === 'en' ? 'English' : 
         locale === 'ru' ? 'Русский' : 
         'Français';
}

export function getLocaleFlag(locale: Locale): string {
  return locale === 'en' ? '🇺🇸' : 
         locale === 'ru' ? '🇷🇺' : 
         '🇫🇷';
}
```

### 6. Create Locale Index Page

Create `src/pages/fr/index.astro`:

```astro
---
import { redirect } from 'astro:redirect';

export const prerender = true;

return redirect('/fr/about', 302);
---
```

### 7. Update Existing Pages

Update all existing pages to handle the new locale in their locale detection logic.

## Content Structure

The new i18n structure follows this pattern:

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

## CMS Collections

The CMS now uses folder collections with `i18n: true` for proper multi-locale support:

- **About Page**: `src/content/pages/about/{locale}/index.json`
- **BookMe Page**: `src/content/pages/bookme/{locale}/index.json`
- **Footer**: `src/content/footer/{locale}/index.json`
- **Blog**: Remains single-file with `lang` field (optional i18n)

## Troubleshooting

### CMS Shows Empty Collections

1. Ensure the config link is present in `public/website-admin/index.html`:
   ```html
   <link href="/website-admin/config.yml" type="text/yaml" rel="cms-config-url" />
   ```

2. Check that content files exist in the correct structure
3. Verify YAML syntax in `config.yml`
4. Check browser console for errors

### 404 on Locale Routes

1. Ensure locale index pages exist (`src/pages/{locale}/index.astro`)
2. Check Astro i18n configuration
3. Verify routing configuration

### Language Switcher Issues

1. Check that `switchLocaleHref` function handles all route patterns
2. Verify fallback logic for missing localized content
3. Test with different current paths
