# Book Me Page Implementation - Unified Diff

## Summary
Implementation of the "Book Me" page with three contrast tiles above a Cal.com inline embed, featuring CMS-editable content via Markdown frontmatter with environment variable fallback.

## File Changes

### 1. New Markdown Content Files

```diff
+ apps/website/src/content/en/bookme.md
+ ---
+ title: "Book a meeting"
+ subtitle: "Pick a slot that suits you"
+ description: "Short intro about the call."
+ cta: "Schedule now"
+ defaultTileSlug: "intro-30m"
+ tiles:
+   - slug: "intro-30m"
+     label: "Intro 30m"
+     caption: "Quick sync / intro"
+     icon: "fa-regular fa-clock"
+   - slug: "mentoring-60m"
+     label: "Mentoring 60m"
+     caption: "Mentoring / guidance"
+     icon: "fa-regular fa-hourglass"
+   - slug: "tech-90m"
+     label: "Tech 90m"
+     caption: "Deep dive / workshop"
+     icon: "fa-regular fa-calendar"
+ ---
+ 
+ # Book a Meeting
+ 
+ Choose your preferred meeting type and schedule a time that works for you.
```

```diff
+ apps/website/src/content/ru/bookme.md
+ ---
+ title: "Записаться на встречу"
+ subtitle: "Выберите удобный слот"
+ description: "Короткое описание цели созвона."
+ cta: "Забронировать"
+ defaultTileSlug: "intro-30m"
+ tiles:
+   - slug: "intro-30m"
+     label: "Знакомство 30 мин"
+     caption: "Короткий созвон / интро"
+     icon: "fa-regular fa-clock"
+   - slug: "mentoring-60m"
+     label: "Менторинг 60 мин"
+     caption: "Наставничество / обсуждение"
+     icon: "fa-regular fa-hourglass"
+   - slug: "tech-90m"
+     label: "Тех. сессия 90 мин"
+     caption: "Глубокое обсуждение / воркшоп"
+     icon: "fa-regular fa-calendar"
+ ---
+ 
+ # Записаться на встречу
+ 
+ Выберите подходящий тип встречи и запланируйте удобное время.
```

### 2. Updated Decap CMS Configuration

```diff
--- a/apps/website/public/website-admin/config.yml
+++ b/apps/website/public/website-admin/config.yml
@@ -259,3 +259,48 @@ collections:
           - { label: "Icon", name: "icon", widget: "string", required: false }
       - { label: "Footer Note", name: "footer_note", widget: "text", required: false }
+
+  - name: "en_bookme_content"
+    label: "Book Me Page (EN)"
+    folder: "apps/website/src/content"
+    create: false
+    format: "frontmatter"
+    extension: "md"
+    slug: "bookme"
+    path: "en/bookme"
+    fields:
+      - { label: "Title", name: "title", widget: "string" }
+      - { label: "Subtitle", name: "subtitle", widget: "string" }
+      - { label: "Description", name: "description", widget: "text" }
+      - { label: "CTA", name: "cta", widget: "string" }
+      - { label: "Default Tile Slug", name: "defaultTileSlug", widget: "string" }
+      - label: "Tiles"
+        name: "tiles"
+        widget: "list"
+        fields:
+          - { label: "Slug", name: "slug", widget: "string" }
+          - { label: "Label", name: "label", widget: "string", required: false }
+          - { label: "Caption", name: "caption", widget: "string", required: false }
+          - { label: "Icon", name: "icon", widget: "string", required: false }
+      - { label: "Body", name: "body", widget: "markdown", required: false }
+
+  - name: "ru_bookme_content"
+    label: "Book Me Page (RU)"
+    folder: "apps/website/src/content"
+    create: false
+    format: "frontmatter"
+    extension: "md"
+    slug: "bookme"
+    path: "ru/bookme"
+    fields:
+      - { label: "Title", name: "title", widget: "string" }
+      - { label: "Subtitle", name: "subtitle", widget: "string" }
+      - { label: "Description", name: "description", widget: "text" }
+      - { label: "CTA", name: "cta", widget: "string" }
+      - { label: "Default Tile Slug", name: "defaultTileSlug", widget: "string" }
+      - label: "Tiles"
+        name: "tiles"
+        widget: "list"
+        fields:
+          - { label: "Slug", name: "slug", widget: "string" }
+          - { label: "Label", name: "label", widget: "string", required: false }
+          - { label: "Caption", name: "caption", widget: "string", required: false }
+          - { label: "Icon", name: "icon", widget: "string", required: false }
+      - { label: "Body", name: "body", widget: "markdown", required: false }
```

### 3. New CAL Environment Helper

```diff
+ apps/website/src/shared/lib/cal/env.ts
+ export const CAL_ENV = {
+   USERNAME: import.meta.env.PUBLIC_CAL_USERNAME as string,
+   BASE: import.meta.env.PUBLIC_CAL_EMBED_LINK as string,
+   EVENTS: (import.meta.env.PUBLIC_CAL_EVENTS as string) || ''
+ };
+ 
+ export type EnvEvent = { slug: string; label: string };
+ 
+ export function parseEnvEvents(s: string): EnvEvent[] {
+   return s
+     .split(',')
+     .map(x => x.trim())
+     .filter(Boolean)
+     .map(pair => {
+       const [slug, label] = pair.split('|').map(y => (y ?? '').trim());
+       return slug ? { slug, label: label || slug } : null;
+     })
+     .filter(Boolean) as EnvEvent[];
+ }
+ 
+ export function makeCalLink(username: string, slug: string) {
+   // Cal inline embed accepts "username/event-type" as calLink
+   return `${username}/${slug}`;
+ }
```

### 4. Enhanced Embed Utility

```diff
--- a/apps/website/src/shared/cal/renderInline.ts
+++ b/apps/website/src/shared/cal/renderInline.ts
@@ -1,15 +1,77 @@
 // apps/website/src/shared/cal/renderInline.ts
 import { applyCalTheme } from './applyCalTheme';
 
 console.debug('[cal] renderInline loaded');
 
+let current = '';
+let calScriptLoaded = false;
+
+async function ensureScript() {
+  if (calScriptLoaded) return;
+  if (!document.querySelector('script[data-cal-embed]')) {
+    await new Promise<void>((resolve) => {
+      const s = document.createElement('script');
+      s.src = 'https://app.cal.com/embed/embed.js';
+      s.async = true;
+      s.setAttribute('data-cal-embed', '1');
+      s.onload = () => resolve();
+      document.head.appendChild(s);
+    });
+  }
+  // @ts-ignore
+  window.Cal?.('init', { origin: 'https://app.cal.com' });
+  calScriptLoaded = true;
+}
+
+function theme(): 'light' | 'dark' {
+  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
+}
+
+function brandColor(): string | undefined {
+  const v = getComputedStyle(document.documentElement).getPropertyValue('--brand-color')?.trim();
+  return v || undefined;
+}
+
+function mount(calLink: string) {
+  const el = document.querySelector('.calendar-placeholder');
+  if (!el) return;
+  el.innerHTML = '';
+  // @ts-ignore
+  window.Cal('inline', {
+    elementOrSelector: el,
+    calLink,
+    layout: 'week_view',
+    theme: theme(),
+    ...(brandColor() ? { styles: { branding: { brandColor: brandColor() } } } : {})
+  });
+}
+
+export async function initCalEmbed(calLink: string): Promise<void> {
+  current = calLink;
+  await ensureScript();
+  mount(current);
+  // observe theme toggles
+  const mo = new MutationObserver(() => mount(current));
+  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
+}
+
+export function updateCalLink(calLink: string): void {
+  current = calLink;
+  mount(current);
+}
+
+// Legacy function for backward compatibility
 export function renderInline(calLink: string) {
   const host = document.getElementById('cal-inline');
   if (!host) return;
   
   // Чистим предыдущее содержимое, чтобы не плодить iframe'ы
   host.innerHTML = '';
   
   if (typeof window !== 'undefined' && window.Cal) {
     window.Cal('inline', { elementOrSelector: host, calLink });
     // Сразу применяем текущую тему к новому встраиванию
     applyCalTheme();
   }
 }
```

### 5. New BookingTiles React Component

```diff
+ apps/website/src/features/bookme/BookingTiles.tsx
+ import { useEffect, useState } from 'react';
+ import { CAL_ENV, makeCalLink } from '@/shared/lib/cal/env';
+ import { initCalEmbed, updateCalLink } from '@/shared/lib/cal/renderInline';
+ 
+ type Tile = { slug: string; label: string; caption?: string; icon?: string };
+ 
+ interface Props {
+   tiles: Tile[];
+   initialSlug: string;
+ }
+ 
+ export default function BookingTiles({ tiles, initialSlug }: Props) {
+   const [active, setActive] = useState<string>(initialSlug);
+ 
+   useEffect(() => {
+     if (!active) return;
+     initCalEmbed(makeCalLink(CAL_ENV.USERNAME, active));
+   }, []);
+ 
+   const onSelect = (slug: string) => {
+     setActive(slug);
+     updateCalLink(makeCalLink(CAL_ENV.USERNAME, slug));
+   };
+ 
+   return (
+     <div role="tablist" aria-label="Meeting duration" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
+       {tiles.map((tile) => (
+         <button
+           key={tile.slug}
+           role="tab"
+           aria-pressed={active === tile.slug}
+           onClick={() => onSelect(tile.slug)}
+           className={`rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
+             active === tile.slug 
+               ? 'ring-2 ring-offset-2 ring-[var(--cv-accent)] border-[var(--cv-accent)] bg-[var(--cv-surface-elevated)]' 
+               : 'opacity-90 hover:opacity-100 border-[var(--cv-border)] bg-[var(--cv-surface-elevated)] hover:shadow-md'
+           }`}
+         >
+           <div className="flex items-start gap-3">
+             {tile.icon && (
+               <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[var(--cv-muted)]">
+                 <i className={`${tile.icon} text-lg`}></i>
+               </div>
+             )}
+             <div className="flex-1 min-w-0">
+               <div className="font-medium text-[var(--cv-foreground)]">{tile.label}</div>
+               {tile.caption && (
+                 <div className="text-sm text-[var(--cv-muted)] mt-1">{tile.caption}</div>
+               )}
+             </div>
+           </div>
+         </button>
+       ))}
+     </div>
+   );
+ }
```

### 6. Updated BookMeSection Component

```diff
--- a/apps/website/src/app/entities/sections/ui/BookMeSection.astro
+++ b/apps/website/src/app/entities/sections/ui/BookMeSection.astro
@@ -1,18 +1,56 @@
 ---
-import { bookmeData } from '@content/en/bookme.ts';
-import { bookmeData as ruBookmeData } from '@content/ru/bookme.ts';
-import { BookingTiles } from '@features/bookme';
+import BookingTiles from '@/features/bookme/BookingTiles.tsx';
+import { CAL_ENV, parseEnvEvents, makeCalLink } from '@/shared/lib/cal/env';
 
 interface Props {
   locale: 'en' | 'ru';
   showServices?: boolean; // по умолчанию false для BookMe
 }
 
 const { locale, showServices = false } = Astro.props as Props;
-const data = locale === 'ru' ? ruBookmeData : bookmeData;
+
+// Try to load Markdown content first, fallback to TypeScript data
+let frontmatter: any = {};
+try {
+  const mdFiles = await Astro.glob(`/src/content/${locale}/bookme.md`);
+  if (mdFiles && mdFiles.length > 0) {
+    frontmatter = mdFiles[0].frontmatter || {};
+  }
+} catch (error) {
+  console.warn('Failed to load Markdown content, falling back to TypeScript data');
+}
+
+// Fallback to existing TypeScript data if frontmatter is empty
+if (!frontmatter.title) {
+  const { bookmeData } = await import(`@content/${locale}/bookme.ts`);
+  frontmatter = {
+    title: bookmeData.title,
+    subtitle: bookmeData.subtitle,
+    description: bookmeData.description,
+    cta: bookmeData.cta.label,
+    defaultTileSlug: 'intro-30m',
+    tiles: []
+  };
+}
+
+// Merge tiles: frontmatter tiles first; fill missing labels from env
+const envEvents = parseEnvEvents(CAL_ENV.EVENTS);
+let tiles = (frontmatter.tiles ?? []).map((t: any) => {
+  const found = envEvents.find(e => e.slug === t.slug);
+  return { 
+    slug: t.slug, 
+    label: t.label ?? found?.label ?? t.slug, 
+    caption: t.caption, 
+    icon: t.icon 
+  };
+});
+
+if (!tiles?.length) {
+  tiles = envEvents.map(e => ({ slug: e.slug, label: e.label }));
+}
+
+const initialSlug = frontmatter.defaultTileSlug ?? tiles?.[0]?.slug ?? envEvents?.[0]?.slug;
+const initialCalLink = initialSlug ? makeCalLink(CAL_ENV.USERNAME, initialSlug) : '';
 ---
 
-<section id="bookme" class="bookme-section">
-  <div class="bookme-container">
-    <div class="bookme-header">
-      <h2 class="bookme-title">{data.title}</h2>
-      <p class="bookme-subtitle">{data.subtitle}</p>
-      <p class="bookme-description">{data.description}</p>
-    </div>
-
-    <div class="bookme-content">
-      {showServices && (
-        <div class="features-grid">
-          {data.features.map((feature) => (
-            <div class="feature-card">
-              <div class="feature-icon">
-                <i class={`fa ${feature.icon}`}></i>
-              </div>
-              <h3 class="feature-title">{feature.title}</h3>
-              <p class="feature-description">{feature.description}</p>
-            </div>
-          ))}
-        </div>
-      )}
-
-      <BookingTiles locale={locale} />
-
-      <div class="calendar-section">
-        <div class="calendar-header">
-          <h3>{locale === 'ru' ? 'Доступность' : 'Availability'}</h3>
-          <div class="availability-info">
-            <span><strong>{locale === 'ru' ? 'Часовой пояс:' : 'Timezone:'}</strong> {data.availability.timezone}</span>
-            <span><strong>{locale === 'ru' ? 'Часы:' : 'Hours:'}</strong> {data.availability.workingHours}</span>
-            <span><strong>{locale === 'Дни:' : 'Days:'}</strong> {data.availability.days}</span>
-          </div>
-        </div>
-        
-        <div class="calendar-placeholder">
-          <div class="calendar-content">
-            <i class="fa fa-calendar-alt calendar-icon"></i>
-            <h4>{locale === 'ru' ? 'Интеграция календаря' : 'Calendar Integration'}</h4>
-            <p>{locale === 'ru' ? 'Виджет календаря будет интегрирован здесь' : 'Calendar widget will be integrated here'}</p>
-            <a href="#calendar" class="cta-button">
-              {data.cta.label}
-            </a>
-          </div>
-        </div>
-      </div>
-    </div>
-  </div>
-</section>
+<section id="bookme" class="mx-auto w-full max-w-[var(--cv-content-max-w)] px-4 sm:px-6">
+  <div class="mb-6">
+    {frontmatter.title && <h1 class="text-2xl md:text-3xl font-semibold">{frontmatter.title}</h1>}
+    {frontmatter.subtitle && <p class="mt-1 text-[color:var(--cv-muted)]">{frontmatter.subtitle}</p>}
+    {frontmatter.description && <p class="mt-3">{frontmatter.description}</p>}
+  </div>
+  
+  <BookingTiles client:load tiles={tiles} initialSlug={initialSlug} />
+  
+  <div class="calendar-placeholder mt-6 rounded-2xl bg-[var(--cv-surface-elevated)] shadow-sm p-3 md:p-4 min-h-[400px] flex items-center justify-center">
+    <div class="text-center text-[var(--cv-muted)]">
+      <i class="fa fa-calendar-alt text-4xl mb-4"></i>
+      <p>{locale === 'ru' ? 'Календарь загружается...' : 'Loading calendar...'}</p>
+    </div>
+  </div>
+</section>
 
-<style>
-  .bookme-section {
-    max-width: 1200px;
-    margin: 0 auto;
-    padding: 48px 24px;
-  }
-
-  .bookme-container {
-    background: rgba(255, 255, 255, 0.8);
-    backdrop-filter: blur(10px);
-    border: 1px solid rgba(0, 0, 0, 0.1);
-    border-radius: 16px;
-    padding: 40px;
-    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
-  }
-
-  .bookme-header {
-    text-align: center;
-    margin-bottom: 40px;
-  }
-
-  .bookme-title {
-    font-size: 2.5rem;
-    font-weight: 700;
-    margin: 0 0 16px 0;
-    color: #1a1a1a;
-  }
-
-  .bookme-subtitle {
-    font-size: 1.25rem;
-    color: #666;
-    margin: 0 0 12px 0;
-  }
-
-  .bookme-description {
-    font-size: 1.1rem;
-    color: #444;
-    margin: 0;
-    max-width: 600px;
-    margin-left: auto;
-    margin-right: auto;
-    line-height: 1.6;
-  }
-
-  .bookme-content {
-    display: flex;
-    flex-direction: column;
-    gap: 40px;
-  }
-
-  .features-grid {
-    display: grid;
-    grid-template-columns: repeat(auto-fit, minmax(300px, 1.1fr));
-    gap: 24px;
-  }
-
-  .feature-card {
-    background: rgba(255, 255, 255, 0.6);
-    border: 1px solid rgba(0, 0, 0, 0.05);
-    border-radius: 12px;
-    padding: 24px;
-    text-align: center;
-    transition: transform 0.2s, box-shadow 0.2s;
-  }
-
-  .feature-card:hover {
-    transform: translateY(-4px);
-    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
-  }
-
-  .feature-icon {
-    width: 60px;
-    height: 60px;
-    background: linear-gradient(135deg, #007bff, #0056b3);
-    border-radius: 12px;
-    display: flex;
-    align-items: center;
-    justify-content: center;
-    margin: 0 auto 16px;
-    color: white;
-    font-size: 24px;
-  }
-
-  .feature-title {
-    font-size: 1.25rem;
-    font-weight: 600;
-    margin: 0 0 12px 0;
-    color: #1a1a1a;
-  }
-
-  .feature-description {
-    color: #666;
-    line-height: 1.5;
-    margin: 0;
-  }
-
-  .calendar-section {
-    background: rgba(248, 249, 250, 0.8);
-    border-radius: 12px;
-    padding: 32px;
-    border: 1px solid rgba(0, 0, 0, 0.05);
-  }
-
-  .calendar-header {
-    text-align: center;
-    margin-bottom: 24px;
-  }
-
-  .calendar-header h3 {
-    font-size: 1.5rem;
-    font-weight: 600;
-    margin: 0 0 16px 0;
-    color: #1a1a1a;
-  }
-
-  .availability-info {
-    display: flex;
-    justify-content: center;
-    gap: 24px;
-    flex-wrap: wrap;
-  }
-
-  .availability-info span {
-    color: #666;
-    font-size: 0.9rem;
-  }
-
-  .calendar-placeholder {
-    background: white;
-    border: 2px dashed #ddd;
-    border-radius: 8px;
-    padding: 40px;
-    text-align: center;
-  }
-
-  .calendar-content {
-    display: flex;
-    flex-direction: column;
-    align-items: center;
-    gap: 16px;
-  }
-
-  .calendar-icon {
-    font-size: 48px;
-    color: #007bff;
-    margin-bottom: 16px;
-  }
-
-  .calendar-content h4 {
-    font-size: 1.25rem;
-    font-weight: 600;
-    margin: 0;
-    color: #1a1a1a;
-  }
-
-  .calendar-content p {
-    color: #666;
-    margin: 0;
-  }
-
-  .cta-button {
-    background: linear-gradient(135deg, #007bff, #0056b3);
-    color: white;
-    padding: 16px 32px;
-    border-radius: 8px;
-    text-decoration: none;
-    font-weight: 600;
-    transition: transform 0.2s, box-shadow 0.2s;
-    display: inline-block;
-    margin-top: 16px;
-  }
-
-  .cta-button:hover {
-    transform: translateY(-2px);
-    box-shadow: 0 8px 24px rgba(0, 123, 255, 0.3);
-  }
-
-  /* Dark theme */
-  :global(.dark) .bookme-container {
-    background: rgba(30, 30, 30, 0.8);
-    border-color: rgba(255, 255, 255, 0.1);
-  }
-
-  :global(.dark) .bookme-title {
-    color: #ffffff;
-  }
-
-  :global(.dark) .bookme-subtitle {
-    color: #ccc;
-  }
-
-  :global(.dark) .bookme-description {
-    color: #ddd;
-  }
-
-  :global(.dark) .feature-card {
-    background: rgba(40, 40, 40, 0.6);
-    border-color: rgba(255, 255, 255, 0.1);
-  }
-
-  :global(.dark) .feature-title {
-    color: #ffffff;
-  }
-
-  :global(.dark) .feature-description {
-    color: #ccc;
-  }
-
-  :global(.dark) .calendar-section {
-    background: rgba(40, 40, 40, 0.8);
-    border-color: rgba(255, 255, 255, 0.1);
-  }
-
-  :global(.dark) .calendar-header h3 {
-    color: #ffffff;
-  }
-
-  :global(.dark) .availability-info span {
-    color: #aaa;
-  }
-
-  :global(.dark) .calendar-placeholder {
-    background: rgba(50, 50, 50, 0.8);
-    border-color: rgba(255, 255, 255, 0.2);
-  }
-
-  :global(.dark) .calendar-content h4 {
-    color: #ffffff;
-  }
-
-  :global(.dark) .calendar-content p {
-    color: #ccc;
-  }
-
-  @media (max-width: 768px) {
-    .bookme-section {
-      padding: 24px 16px;
-    }
-
-    .bookme-container {
-      padding: 24px;
-    }
-
-    .bookme-title {
-      font-size: 2rem;
-    }
-
-    .features-grid {
-      grid-template-columns: 1fr;
-    }
-
-    .availability-info {
-      flex-direction: column;
-      gap: 8px;
-    }
-
-    .calendar-placeholder {
-      padding: 24px;
-    }
-  }
-</style>
```

## Summary of Changes

1. **Content Model**: Created localized Markdown files with frontmatter for CMS editing
2. **CMS Integration**: Updated Decap CMS config to support Book Me page content
3. **Environment Helper**: Created centralized CAL environment variable access
4. **Embed Enhancement**: Added theme sync and link update functionality
5. **React Component**: Built accessible BookingTiles component with proper semantics
6. **Section Update**: Refactored BookMeSection to use frontmatter with env fallback

## Key Features

- ✅ Three contrast tiles above Cal.com embed
- ✅ CMS-editable labels with environment fallback
- ✅ Tile switching without page reload
- ✅ Theme synchronization (light/dark)
- ✅ Accessible segmented control
- ✅ Responsive design with container width constraints
- ✅ Backward compatibility maintained
