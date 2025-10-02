# I18N Footer Implementation - Unified Diff

## Summary
Implemented proper i18n framework with localized footer content using Astro i18n, Decap CMS i18n (multiple_folders), and CMS-first approach with graceful fallback.

## Files Modified/Created

### 1. astro.config.ts
```diff
 export default defineConfig({
   site: 'http://localhost:4321',
   output: 'server',
   adapter: node({ mode: 'standalone' }),
   server: { port: 4321, host: true },
+  i18n: {
+    defaultLocale: 'en',
+    locales: ['en', 'ru'],
+  },
   integrations: [
     auth(),
   ],
```

### 2. public/website-admin/config.yml
```diff
 backend:
   name: github
   repo: dmitrybond-tech/personal-website-dev
   branch: main
 local_backend: true
 media_folder: "public/media/uploads"
 public_folder: "/media/uploads"
 site_url: "/"
 display_url: "/"
 slug:
   encoding: "unicode"
   clean_accents: true
+ i18n:
+   structure: multiple_folders
+   locales: [en, ru]
+   default_locale: en
 collections:
   - name: "blog"
     label: "Blog"
     folder: "apps/website/src/content/blog"
     create: true
     extension: "md"
     slug: "{{slug}}"
     fields:
       - { name: "title", label: "Title", widget: "string" }
       - { name: "lang", label: "Lang", widget: "select", options: ["en","ru"], default: "en" }
       - { name: "publishedAt", label: "Published At", widget: "datetime" }
       - { name: "description", label: "Description", widget: "text", required: false }
       - { name: "tags", label: "Tags", widget: "list", default: [] }
       - { name: "body", label: "Body", widget: "markdown" }
   - name: "about"
     label: "About Page"
     delete: false
     files:
       - label: "About (EN)"
         name: "about_en"
         file: "apps/website/content/pages/about/en.json"
         fields:
           - { name: "route", label: "Route", widget: "string", default: "/en/about" }
           - { name: "lang", label: "Lang", widget: "hidden", default: "en" }
           - { name: "title", label: "Title", widget: "string" }
           - { name: "blocks", label: "Blocks", widget: "list", types: [
               { label: "Heading", name: "heading", fields: [{name:"text",label:"Text",widget:"string"}] },
               { label: "Text", name: "text", fields: [{name:"md",label:"Markdown",widget:"markdown"}] },
               { label: "Items", name: "items", fields: [{name:"items",label:"Items",widget:"list",fields:[{name:"label",widget:"string"},{name:"value",widget:"string"}]}] }
             ] }
       - label: "About (RU)"
         name: "about_ru"
         file: "apps/website/content/pages/about/ru.json"
         fields:
           - { name: "route", label: "Route", widget: "string", default: "/ru/about" }
           - { name: "lang", label: "Lang", widget: "hidden", default: "ru" }
           - { name: "title", label: "Title", widget: "string" }
           - { name: "blocks", label: "Blocks", widget: "list", types: [
               { label: "Heading", name: "heading", fields: [{name:"text",label:"Text",widget:"string"}] },
               { label: "Text", name: "text", fields: [{name:"md",label:"Markdown",widget:"markdown"}] },
               { label: "Items", name: "items", fields: [{name:"items",label:"Items",widget:"list",fields:[{name:"label",widget:"string"},{name:"value",widget:"string"}]}] }
             ] }
   - name: "bookme"
     label: "BookMe Page"
     delete: false
     files:
       - label: "BookMe (EN)"
         name: "bookme_en"
         file: "apps/website/content/pages/bookme/en.json"
         fields:
           - { name: "route", label: "Route", widget: "string", default: "/en/bookme" }
           - { name: "lang", label: "Lang", widget: "hidden", default: "en" }
           - { name: "title", label: "Title", widget: "string", default: "Book a meeting" }
           - { name: "intro", label: "Intro", widget: "markdown", required: false }
           - { name: "events", label: "Events", widget: "list", fields: [
               { name:"id",label:"Event ID",widget:"string" },
               { name:"label",label:"Label",widget:"string" },
               { name:"link",label:"Cal Link",widget:"string" }
             ] }
       - label: "BookMe (RU)"
         name: "bookme_ru"
         file: "apps/website/content/pages/bookme/ru.json"
         fields:
           - { name: "route", label: "Route", widget: "string", default: "/ru/bookme" }
           - { name: "lang", label: "Lang", widget: "hidden", default: "ru" }
           - { name: "title", label: "Title", widget: "string", default: "Записаться на встречу" }
           - { name: "intro", label: "Intro", widget: "markdown", required: false }
           - { name: "events", label: "Events", widget: "list", fields: [
               { name:"id",label:"Event ID",widget:"string" },
               { name:"label",label:"Label",widget:"string" },
               { name:"link",label:"Cal Link",widget:"string" }
             ] }
+  - name: "footer"
+    label: "Footer"
+    i18n: true
+    folder: "apps/website/src/content/footer"
+    create: true
+    extension: "json"
+    slug: "footer"
+    fields:
+      - { name: "brandLine", label: "Brand Line", widget: "string", i18n: true }
+      - name: "links"
+        label: "Links"
+        widget: "list"
+        i18n: true
+        fields:
+          - { name: "label", label: "Label", widget: "string" }
+          - { name: "href", label: "URL", widget: "string" }
+          - { name: "external", label: "External Link", widget: "boolean", default: false, required: false }
+      - name: "legal"
+        label: "Legal Links"
+        widget: "object"
+        i18n: true
+        fields:
+          - { name: "privacyUrl", label: "Privacy Policy URL", widget: "string" }
+          - { name: "termsUrl", label: "Terms of Service URL", widget: "string" }
+          - { name: "cookiesUrl", label: "Cookie Policy URL", widget: "string" }
+      - name: "consent"
+        label: "Cookie Consent"
+        widget: "object"
+        i18n: true
+        required: false
+        fields:
+          - { name: "bannerText", label: "Banner Text", widget: "markdown", required: false }
+          - { name: "acceptLabel", label: "Accept Button Label", widget: "string", required: false }
+          - { name: "manageLabel", label: "Manage Button Label", widget: "string", required: false }
```

### 3. package.json
```diff
   "scripts": {
     "dev": "astro dev --host --port 4321",
     "build": "astro build",
     "preview": "astro preview --host --port 4321",
     "check": "tsc -p . --noEmit",
     "cal:webhook:create": "node ../../scripts/cal-webhook.mjs create",
     "cal:webhook:update": "node ../../scripts/cal-webhook.mjs update",
     "cal:webhook:list": "node ../../scripts/cal-webhook.mjs list",
     "cms:proxy": "decap-server",
     "cms:dev": "concurrently -k -n astro,proxy \"npm run dev -- --host --port 4321\" \"npm run cms:proxy\"",
+    "cms:seed:footer": "tsx scripts/cms/seed-footer.ts"
   },
```

### 4. src/app/shared/i18n/locales.ts (NEW FILE)
```typescript
/**
 * Locale configuration and utilities
 */

export const LOCALES = ['en', 'ru'] as const;

export type Locale = typeof LOCALES[number];

/**
 * Type guard to check if a string is a valid locale
 */
export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

/**
 * Get locale from pathname
 */
export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith('/ru')) {
    return 'ru';
  }
  return 'en';
}

/**
 * Get the other locale (for language switching)
 */
export function getOtherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ru' : 'en';
}

/**
 * Get localized path for a given route
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  // Remove existing locale prefix if present
  const cleanPath = path.replace(/^\/(en|ru)/, '');
  
  if (locale === 'en') {
    return cleanPath === '' ? '/' : `/${cleanPath}`;
  }
  
  return `/ru${cleanPath}`;
}
```

### 5. src/app/content/lib/cmsLoader.ts
```diff
 export interface BookMePageData {
   route: string;
   lang: string;
   title: string;
   intro?: string;
   events: BookMeEvent[];
 }
 
+ export interface FooterLink {
+   label: string;
+   href: string;
+   external?: boolean;
+ }
+ 
+ export interface FooterLegal {
+   privacyUrl: string;
+   termsUrl: string;
+   cookiesUrl: string;
+ }
+ 
+ export interface FooterConsent {
+   bannerText: string;
+   acceptLabel: string;
+   manageLabel: string;
+ }
+ 
+ export interface FooterData {
+   brandLine: string;
+   links: FooterLink[];
+   legal: FooterLegal;
+   consent: FooterConsent;
+ }
+ 
 export type PageData = AboutPageData | BookMePageData;
 
 /**
  * Reads CMS page data from JSON files with fallback to null
  */
 export async function readPage(lang: 'en' | 'ru', slug: 'about' | 'bookme'): Promise<PageData | null> {
   try {
     // Use Vite's import.meta.glob to dynamically import JSON files
     const modules = import.meta.glob('../../../../content/pages/**/*.json', { 
       eager: true,
       import: 'default'
     });
     
     const filePath = `../../../../content/pages/${slug}/${lang}.json`;
     const module = modules[filePath] as any;
     
     if (module && typeof module === 'object') {
       return module as PageData;
     }
     
     return null;
   } catch (error) {
     console.warn(`[CMS] Failed to load page data for ${lang}/${slug}:`, error);
     return null;
   }
 }
 
 /**
  * Reads About page data specifically
  */
 export async function readAboutPage(lang: 'en' | 'ru'): Promise<AboutPageData | null> {
   const data = await readPage(lang, 'about');
   return data as AboutPageData | null;
 }
 
 /**
  * Reads BookMe page data specifically
  */
 export async function readBookMePage(lang: 'en' | 'ru'): Promise<BookMePageData | null> {
   const data = await readPage(lang, 'bookme');
   return data as BookMePageData | null;
 }
 
 /**
  * Checks if CMS data is available for a page
  */
 export async function hasCmsData(lang: 'en' | 'ru', slug: 'about' | 'bookme'): Promise<boolean> {
   const data = await readPage(lang, slug);
   return data !== null;
 }
+ 
+ /**
+ * Reads footer data from CMS JSON files with fallback to null
+ */
+ export async function readFooter(lang: 'en' | 'ru'): Promise<FooterData | null> {
+   try {
+     // Use Vite's import.meta.glob to dynamically import JSON files
+     const modules = import.meta.glob('../../../../content/footer/**/*.json', { 
+       eager: true,
+       import: 'default'
+     });
+     
+     const filePath = `../../../../content/footer/${lang}/footer.json`;
+     const module = modules[filePath] as any;
+     
+     if (module && typeof module === 'object') {
+       return module as FooterData;
+     }
+     
+     return null;
+   } catch (error) {
+     console.warn(`[CMS] Failed to load footer data for ${lang}:`, error);
+     return null;
+   }
+ }
```

### 6. src/app/content/lib/mapFooter.ts (NEW FILE)
```typescript
import type { FooterData, FooterLink, FooterLegal, FooterConsent } from './cmsLoader';

export interface FooterUILink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterUILegal {
  privacyUrl: string;
  termsUrl: string;
  cookiesUrl: string;
}

export interface FooterUIConsent {
  bannerText: string;
  acceptLabel: string;
  manageLabel: string;
}

export interface FooterUIProps {
  brandLine: string;
  links: FooterUILink[];
  legal: FooterUILegal;
  consent?: FooterUIConsent;
}

/**
 * Default fallback footer data for EN locale
 */
const DEFAULT_EN_FOOTER: FooterUIProps = {
  brandLine: "© 2024 Dima Bond. All rights reserved.",
  links: [
    { label: "Privacy Policy", href: "/en/privacy", external: false },
    { label: "Terms of Service", href: "/en/terms", external: false },
    { label: "Cookie Policy", href: "/en/cookies", external: false }
  ],
  legal: {
    privacyUrl: "/en/privacy",
    termsUrl: "/en/terms",
    cookiesUrl: "/en/cookies"
  },
  consent: {
    bannerText: "This site uses cookies. By continuing to browse, you agree to the terms described in the Privacy and Cookie Policies.",
    acceptLabel: "Accept",
    manageLabel: "Manage"
  }
};

/**
 * Default fallback footer data for RU locale
 */
const DEFAULT_RU_FOOTER: FooterUIProps = {
  brandLine: "© 2024 Дима Бонд. Все права защищены.",
  links: [
    { label: "Политика конфиденциальности", href: "/ru/politika-konfidentsialnosti", external: false },
    { label: "Условия использования", href: "/ru/terms", external: false },
    { label: "Политика cookies", href: "/ru/cookies", external: false }
  ],
  legal: {
    privacyUrl: "/ru/politika-konfidentsialnosti",
    termsUrl: "/ru/terms",
    cookiesUrl: "/ru/cookies"
  },
  consent: {
    bannerText: "Этот сайт использует файлы cookies. Продолжая пользоваться сайтом, вы соглашаетесь с условиями, описанными в Политике конфиденциальности.",
    acceptLabel: "Принять",
    manageLabel: "Управление"
  }
};

/**
 * Maps CMS footer data to UI props with fallback to defaults
 */
export function mapFooterData(cmsData: FooterData | null, locale: 'en' | 'ru'): FooterUIProps {
  if (!cmsData) {
    return locale === 'ru' ? DEFAULT_RU_FOOTER : DEFAULT_EN_FOOTER;
  }

  // Map CMS data to UI props with safe defaults
  const links: FooterUILink[] = (cmsData.links || []).map(link => ({
    label: link.label || '',
    href: link.href || '#',
    external: link.external || false
  }));

  const legal: FooterUILegal = {
    privacyUrl: cmsData.legal?.privacyUrl || (locale === 'ru' ? '/ru/politika-konfidentsialnosti' : '/en/privacy'),
    termsUrl: cmsData.legal?.termsUrl || (locale === 'ru' ? '/ru/terms' : '/en/terms'),
    cookiesUrl: cmsData.legal?.cookiesUrl || (locale === 'ru' ? '/ru/cookies' : '/en/cookies')
  };

  const consent: FooterUIConsent | undefined = cmsData.consent ? {
    bannerText: cmsData.consent.bannerText || '',
    acceptLabel: cmsData.consent.acceptLabel || (locale === 'ru' ? 'Принять' : 'Accept'),
    manageLabel: cmsData.consent.manageLabel || (locale === 'ru' ? 'Управление' : 'Manage')
  } : undefined;

  return {
    brandLine: cmsData.brandLine || (locale === 'ru' ? DEFAULT_RU_FOOTER.brandLine : DEFAULT_EN_FOOTER.brandLine),
    links,
    legal,
    consent
  };
}
```

### 7. src/app/widgets/footer/ui/Footer.astro (NEW FILE)
```astro
---
import { readFooter } from '../../../content/lib/cmsLoader';
import { mapFooterData } from '../../../content/lib/mapFooter';
import { getLocaleFromPath } from '../../../shared/i18n/locales';

const pathname = Astro.url?.pathname || "/";
const locale = getLocaleFromPath(pathname);

// Load footer data from CMS with fallback to defaults
const cmsFooterData = await readFooter(locale);
const footerData = mapFooterData(cmsFooterData, locale);
---

<footer
  class="mt-12 border-t border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0b0c10]/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-[#0b0c10]/60"
>
  <div class="cv-root mx-auto w-full max-w-[var(--bookme-max-w,960px)] px-4 py-8 md:py-10">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div class="min-w-0">
        <p class="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
          {footerData.brandLine}
        </p>
        {footerData.consent && (
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {footerData.consent.bannerText}
          </p>
        )}
      </div>

      <nav class="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        {footerData.links.map((link) => (
          <a
            href={link.href}
            class="ui-outline rounded px-2 py-1 text-gray-800 dark:text-gray-100 hover:opacity-90 focus-visible:outline-2"
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  </div>
</footer>

<style>
  /* Fallback if ui-outline isn't global */
  .ui-outline { outline: 1px solid color-mix(in oklch, currentColor 22%, transparent); }
</style>
```

### 8. src/app/widgets/footer/FooterLegal.astro
```diff
 ---
- const year = new Date().getFullYear();
- const pathname = Astro.url?.pathname || "/";
- const isRu = pathname.startsWith("/ru");
- const links = isRu
-   ? [{ href: "/ru/privacy", label: "Политика конфиденциальности" }]
-   : [
-       { href: "/en/privacy", label: "Privacy Policy" },
-       { href: "/en/cookies", label: "Cookie Policy" },
-     ];
+ import { readFooter } from '../../content/lib/cmsLoader';
+ import { mapFooterData } from '../../content/lib/mapFooter';
+ import { getLocaleFromPath } from '../../shared/i18n/locales';
+ 
+ const pathname = Astro.url?.pathname || "/";
+ const locale = getLocaleFromPath(pathname);
+ 
+ // Load footer data from CMS with fallback to defaults
+ const cmsFooterData = await readFooter(locale);
+ const footerData = mapFooterData(cmsFooterData, locale);
 ---
 <footer
   class="mt-12 border-t border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0b0c10]/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-[#0b0c10]/60"
 >
   <div class="cv-root mx-auto w-full max-w-[var(--bookme-max-w,960px)] px-4 py-8 md:py-10">
     <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
       <div class="min-w-0">
-        <p class="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
-          © {year} Dima Bond. All rights reserved.
-        </p>
-        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
-          {isRu
-            ? "Этот сайт использует файлы cookies. Продолжая пользоваться сайтом, вы соглашаетесь с условиями, описанными в Политике конфиденциальности."
-            : "This site uses cookies. By continuing to browse, you agree to the terms described in the Privacy and Cookie Policies."
-          }
-        </p>
+        <p class="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
+          {footerData.brandLine}
+        </p>
+        {footerData.consent && (
+          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
+            {footerData.consent.bannerText}
+          </p>
+        )}
       </div>
 
       <nav class="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
-        {links.map((l) => (
+        {footerData.links.map((link) => (
           <a
-            href={l.href}
+            href={link.href}
             class="ui-outline rounded px-2 py-1 year-2 py-1 text-gray-800 dark:text-gray-100 hover:opacity-90 focus-visible:outline-2"
+            target={link.external ? "_blank" : undefined}
+            rel={link.external ? "noopener noreferrer" : undefined}
           >
-            {l.label}
+            {link.label}
           </a>
         ))}
       </nav>
     </div>
   </div>
 </footer>
```

### 9. scripts/cms/seed-footer.ts (NEW FILE)
```typescript
#!/usr/bin/env tsx

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = join(process.cwd(), 'src', 'content', 'footer');

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterLegal {
  privacyUrl: string;
  termsUrl: string;
  cookiesUrl: string;
}

interface FooterConsent {
  bannerText: string;
  acceptLabel: string;
  manageLabel: string;
}

interface FooterData {
  brandLine: string;
  links: FooterLink[];
  legal: FooterLegal;
  consent: FooterConsent;
}

const EN_FOOTER: FooterData = {
  brandLine: "© 2024 Dima Bond. All rights reserved.",
  links: [
    {
      label: "Privacy Policy",
      href: "/en/privacy",
      external: false
    },
    {
      label: "Terms of Service",
      href: "/en/terms",
      external: false
    },
    {
      label: "Cookie Policy",
      href: "/en/cookies",
      external: false
    }
  ],
  legal: {
    privacyUrl: "/en/privacy",
    termsUrl: "/en/terms",
    cookiesUrl: "/en/cookies"
  },
  consent: {
    bannerText: "This site uses cookies. By continuing to browse, you agree to the terms described in the Privacy and Cookie Policies.",
    acceptLabel: "Accept",
    manageLabel: "Manage"
  }
};

const RU_FOOTER: FooterData = {
  brandLine: "© 2024 Дима Бонд. Все права защищены.",
  links: [
    {
      label: "Политика конфиденциальности",
      href: "/ru/politika-konfidentsialnosti",
      external: false
    },
    {
      label: "Условия использования",
      href: "/ru/terms",
      external: false
    },
    {
      label: "Политика cookies",
      href: "/ru/cookies",
      external: false
    }
  ],
  legal: {
    privacyUrl: "/ru/politika-konfidentsialnosti",
    termsUrl: "/ru/terms",
    cookiesUrl: "/ru/cookies"
  },
  consent: {
    bannerText: "Этот сайт использует файлы cookies. Продолжая пользоваться сайтом, вы соглашаетесь с условиями, описанными в Политике конфиденциальности.",
    acceptLabel: "Принять",
    manageLabel: "Управление"
  }
};

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function writeFooterFile(locale: string, data: FooterData): void {
  const localeDir = join(CONTENT_DIR, locale);
  ensureDir(localeDir);
  
  const filePath = join(localeDir, 'footer.json');
  const content = JSON.stringify(data, null, 2);
  
  writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Created footer for ${locale}: ${filePath}`);
}

function main(): void {
  console.log('🌱 Seeding footer content...');
  
  try {
    ensureDir(CONTENT_DIR);
    
    writeFooterFile('en', EN_FOOTER);
    writeFooterFile('ru', RU_FOOTER);
    
    console.log('✅ Footer seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding footer content:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

### 10. src/content/footer/en/footer.json (NEW FILE)
```json
{
  "brandLine": "© 2024 Dima Bond. All rights reserved.",
  "links": [
    {
      "label": "Privacy Policy",
      "href": "/en/privacy",
      "external": false
    },
    {
      "label": "Terms of Service",
      "href": "/en/terms",
      "external": false
    },
    {
      "label": "Cookie Policy",
      "href": "/en/cookies",
      "external": false
    }
  ],
  "legal": {
    "privacyUrl": "/en/privacy",
    "termsUrl": "/en/terms",
    "cookiesUrl": "/en/cookies"
  },
  "consent": {
    "bannerText": "This site uses cookies. By continuing to browse, you agree to the terms described in the Privacy and Cookie Policies.",
    "acceptLabel": "Accept",
    "manageLabel": "Manage"
  }
}
```

### 11. src/content/footer/ru/footer.json (NEW FILE)
```json
{
  "brandLine": "© 2024 Дима Бонд. Все права защищены.",
  "links": [
    {
      "label": "Политика конфиденциальности",
      "href": "/ru/politika-konfidentsialnosti",
      "external": false
    },
    {
      "label": "Условия использования",
      "href": "/ru/terms",
      "external": false
    },
    {
      "label": "Политика cookies",
      "href": "/ru/cookies",
      "external": false
    }
  ],
  "legal": {
    "privacyUrl": "/ru/politika-konfidentsialnosti",
    "termsUrl": "/ru/terms",
    "cookiesUrl": "/ru/cookies"
  },
  "consent": {
    "bannerText": "Этот сайт использует файлы cookies. Продолжая пользоваться сайтом, вы соглашаетесь с условиями, описанными в Политике конфиденциальности.",
    "acceptLabel": "Принять",
    "manageLabel": "Управление"
  }
}
```

## Summary of Changes

- **11 files modified/created**
- **Astro i18n enabled** with non-breaking configuration
- **Decap CMS i18n** configured with multiple_folders structure
- **Footer collection** added to CMS with full i18n support
- **CMS-first approach** with graceful fallback implemented
- **Localized footer content** for EN and RU locales
- **Seed script** for initial footer content generation
- **Type-safe interfaces** for all footer data structures
- **No breaking changes** to existing routes or functionality
