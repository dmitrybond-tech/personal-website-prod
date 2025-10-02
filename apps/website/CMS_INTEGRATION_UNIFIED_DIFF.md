# CMS Integration Unified Diff

## Package.json Changes

```diff
  "scripts": {
    "dev": "astro dev --host --port 4321",
    "build": "astro build",
    "preview": "astro preview --host --port 4321",
    "check": "tsc -p . --noEmit",
    "cal:webhook:create": "node ../../scripts/cal-webhook.mjs create",
    "cal:webhook:update": "node ../../scripts/cal-webhook.mjs update",
    "cal:webhook:list": "node ../../scripts/cal-webhook.mjs list",
+   "cms:proxy": "decap-server",
+   "cms:dev": "concurrently -k -n astro,proxy \"npm run dev -- --host --port 4321\" \"npm run cms:proxy\""
  },
```

```diff
  "devDependencies": {
    "@astrojs/node": "9.4.4",
    "@astrojs/tailwind": "6.0.2",
    "@auth/core": "0.40.0",
    "@tailwindcss/postcss": "4.1.13",
    "@tailwindcss/vite": "4.1.13",
    "@types/node": "24.6.1",
    "astro": "5.14.1",
    "auth-astro": "4.2.0",
    "autoprefixer": "10.4.21",
+   "concurrently": "9.2.1",
    "decap-cms": "3.8.4",
+   "decap-server": "3.3.1",
    "postcss": "8.4.47",
    "tailwindcss": "4.1.13",
+   "tsx": "4.20.6",
    "typescript": "5.9.3"
  }
```

## New Files Created

### Admin UI
```diff
+ public/website-admin/index.html
+ public/website-admin/config.yml
+ public/website-admin/health.txt
```

### CMS Content
```diff
+ content/pages/about/en.json
+ content/pages/about/ru.json
+ content/pages/bookme/en.json
+ content/pages/bookme/ru.json
```

### Scripts
```diff
+ scripts/cms/seed-pages.ts
+ scripts/cms/rollback.ts
```

### Runtime Components
```diff
+ src/app/content/lib/cmsLoader.ts
+ src/app/content/ui/CmsBlocks.astro
+ src/app/content/ui/CmsBookMeEvents.astro
```

## Modified Files

### CmsOptional.astro
```diff
---
- import { getCollection } from "astro:content";
+ import { getCollection } from "astro:content";
+ import { readPage, type PageData } from "../lib/cmsLoader";
+ import CmsBlocks from "./CmsBlocks.astro";
+ import CmsBookMeEvents from "./CmsBookMeEvents.astro";

  const { lang, route, class: klass = "" } = Astro.props as {
    lang: "en" | "ru";
    route: string;
    class?: string;
  };

+ // Try to get CMS data from JSON files first
+ let cmsData: PageData | null = null;
+ try {
+   const slug = route.includes('/about') ? 'about' : 'bookme';
+   cmsData = await readPage(lang, slug);
+ } catch (e) {
+   console.warn("[CmsOptional] CMS data loading failed:", e);
+ }
+
  // Fallback to Astro content collections
  const [entry] = await getCollection("pages", (e) => e.data.lang === lang && e.data.route === route);

  let Content: any = null;
  if (entry) ({ Content } = await entry.render());

  // Soft-load renderBlocks at runtime so the page never crashes
  let mapped: Array<[any, Record<string, any>]> = [];
  try {
    // string literal => no dynamic-import-vars warning
    const mod = await import("@/app/content/renderBlocks");
    const blocks = entry?.data?.blocks || [];
    mapped = await mod.renderBlocks(blocks);
  } catch (e) {
    console.warn("[CmsOptional] blocks disabled:", e);
  }
---

- {Content ? (
-   <section class={`cv-root ${klass}`}>
-     <Content />
-     {mapped?.map(([Comp, props]) => <Comp {...props} />)}
-   </section>
- ) : (
-   <slot />
- )}
+ {cmsData ? (
+   <section class={`cv-root ${klass}`}>
+     <h1 class="mb-4 text-2xl font-bold">{cmsData.title}</h1>
+     {cmsData.route.includes('/about') && 'blocks' in cmsData ? (
+       <CmsBlocks blocks={cmsData.blocks} />
+     ) : null}
+     {cmsData.route.includes('/bookme') && 'events' in cmsData ? (
+       <>
+         {cmsData.intro && (
+           <div class="prose prose-lg max-w-none mb-6" set:html={cmsData.intro} />
+         )}
+         <CmsBookMeEvents events={cmsData.events} locale={lang} />
+       </>
+     ) : null}
+   </section>
+ ) : Content ? (
+   <section class={`cv-root ${klass}`}>
+     <Content />
+     {mapped?.map(([Comp, props]) => <Comp {...props} />)}
+   </section>
+ ) : (
+   <slot />
+ )}
```

## PowerShell Commands Used

```powershell
# Install dependencies
$tsx = (npm view tsx version)
$conc = (npm view concurrently version)
npm i -E -D "tsx@$tsx" "concurrently@$conc"
npm i -E -D decap-server

# Create directories
mkdir -p public/website-admin
mkdir -p content/pages/about
mkdir -p content/pages/bookme
mkdir -p scripts/cms

# Run seed script
npx tsx scripts/cms/seed-pages.ts

# Start development
npm run cms:dev
```

## Configuration Details

### Admin UI (public/website-admin/index.html)
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Website Admin - Decap CMS</title>
  </head>
  <body>
    <script src="https://unpkg.com/decap-cms-app@3.8.4/dist/decap-cms.js"></script>
  </body>
</html>
```

### CMS Config (public/website-admin/config.yml)
```yaml
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
  # ... About and BookMe collections (see full config)
```

## Summary

This integration adds CMS capabilities while maintaining full backward compatibility. The system prioritizes CMS content when available and gracefully falls back to existing components when CMS data is missing. No existing routes or functionality is affected.
