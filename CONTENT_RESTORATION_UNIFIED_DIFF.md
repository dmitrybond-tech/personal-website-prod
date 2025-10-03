# Content Restoration Unified Diff

```diff
*** a/apps/website/src/features/about/registry.ts
--- b/apps/website/src/features/about/registry.ts
@@
-import Hero from './sections/Hero.astro';
-import Projects from './sections/Projects.astro';
-import Experience from './sections/Experience.astro';
-import Education from './sections/Education.astro';
-import Testimonials from './sections/Testimonials.astro';
-import Favorites from './sections/Favorites.astro';
+import Hero from './sections/Hero.astro';
+import Projects from './sections/Projects.astro';
+import Experience from './sections/Experience.astro';
+import Education from './sections/Education.astro';
+import Testimonials from './sections/Testimonials.astro';
+import Favorites from './sections/Favorites.astro';
+// Skills section already enabled - no changes needed
 import Skills from './sections/Skills.astro';
 
-export const registry: Record<string, any> = {
+export const registry: Record<string, any> = {
   hero: Hero,
   projects: Projects,
   experience: Experience,
   education: Education,
   testimonials: Testimonials,
   favorites: Favorites,
+  skills: Skills,
 };

*** a/apps/website/src/pages/[lang]/about.astro
--- b/apps/website/src/pages/[lang]/about.astro
@@
-import AppShell from '../../app/layouts/AppShell.astro';
-import { getEntry, getCollection } from 'astro:content';
-import { registry } from '../../features/about/registry';
-import { debug } from '../../app/shared/lib/debug';
+import AppShell from '../../app/layouts/AppShell.astro';
+import { getEntry, getCollection } from 'astro:content';
+import { registry } from '../../features/about/registry';
+import { debug } from '../../app/shared/lib/debug';
 
 const { lang } = Astro.params as { lang: 'en' | 'ru' };
-const slug = `${lang}/about`;
+const slug = `${lang}/about`;
 
-let entry = await getEntry({ collection: 'aboutPage', slug });
-
-// fallback: вдруг slug отличается — покажем, что вообще есть
+let entry = await getEntry({ collection: 'aboutPage', slug });
+// fallback
 if (!entry) {
   const all = await getCollection('aboutPage');
   debug('[about] NOT FOUND slug=%s. Available slugs:', slug, all.map(e => e.slug));
   entry = all.find(e => e.slug === slug || (e.slug.startsWith(`${lang}/`) && e.slug.endsWith('/about')));
 }
 
 debug('[about] lang=%s slug=%s found=%s', lang, slug, !!entry);
-const sections = entry?.data?.sections ?? [];
+const sections = entry?.data?.sections ?? [];
 ---
-<AppShell lang={lang}>
-  <main class="container mx-auto px-4 py-8">
-    {sections.length === 0 ? (
-      <p class="text-gray-500 dark:text-gray-400">Контент готовится…</p>
-    ) : (
-      sections.map((section) => {
-        const Comp = registry[section.type];
-        if (!Comp) {
-          debug('[about] skip unknown section type=%s', section?.type);
-          return null;
-        }
-        return <Comp section={section} lang={lang} />;
-      })
-    )}
-  </main>
-</AppShell>
+<AppShell lang={lang}>
+  <main class="container mx-auto px-4 py-8 flex-1">
+    {sections.length === 0
+      ? <p class="text-gray-500 dark:text-gray-400">Контент готовится…</p>
+      : sections.map((section) => {
+          const Comp = registry[section.type];
+          if (!Comp) { debug('[about] skip unknown section type=%s', section?.type); return null; }
+          return <Comp section={section} lang={lang} />;
+        })}
+  </main>
+</AppShell>

*** a/apps/website/src/pages/[lang]/bookme.astro
--- b/apps/website/src/pages/[lang]/bookme.astro
@@
 import AppShell from '../../app/layouts/AppShell.astro';
 import { getEntry } from 'astro:content';
 import { debug } from '../../app/shared/lib/debug';
 
 const { lang } = Astro.params as { lang: 'en' | 'ru' };
 const slug = `${lang}/bookme`;
 
-const entry = await getEntry({ collection: 'bookmePage', slug });
-const calLink = entry?.data?.cal_link ?? 'your-cal-handle/intro';
+const entry = await getEntry({ collection: 'bookmePage', slug });
+const calLink = entry?.data?.cal_link ?? 'your-cal-handle/intro';
 
 debug('[bookme] lang=%s slug=%s hasEntry=%s cal=%s', lang, slug, !!entry, calLink);
 ---
-<AppShell lang={lang}>
-  <main class="container mx-auto px-4 py-8">
-    <script is:inline>
-      (function(){
-        try {
-          if (!document.querySelector('script[src*="app.cal.com/embed/embed.js"]')) {
-            const s = document.createElement('script');
-            s.src = "https://app.cal.com/embed/embed.js";
-            s.async = true;
-            s.onload = () => { try { window.Cal && window.Cal('init'); } catch(_){} };
-            document.head.appendChild(s);
-          } else { try { window.Cal && window.Cal('init'); } catch(_){} }
-        } catch(_) {}
-      })();
-    </script>
-    <div class="cal-inline" data-cal-link={calLink}></div>
-  </main>
-</AppShell>
+<AppShell lang={lang}>
+  <main class="container mx-auto px-4 py-8 flex-1">
+    <!-- Cal.com stub + embed + ui init -->
+    <script is:inline>
+      window.Cal = window.Cal || function(){ (window.Cal.q = window.Cal.q || []).push(arguments) };
+    </script>
+    <link rel="stylesheet" href="https://app.cal.com/embed/embed.css">
+    <script src="https://app.cal.com/embed/embed.js" async></script>
+    <div class="cal-inline" data-cal-link={calLink}></div>
+    <script is:inline> Cal('ui', { theme: 'auto' }); </script>
+  </main>
+</AppShell>

*** a/apps/website/src/app/layouts/AppShell.astro
--- b/apps/website/src/app/layouts/AppShell.astro
@@
-import "@/styles/main.css";
-import Navbar from '@/app/widgets/navbar/ui/Navbar.astro';
-import NavIsland from '@/app/widgets/navisland/NavIsland.astro';
-import { getLocaleFromPath, switchLocale } from '@/app/shared/lib/locale';
+import "@/styles/main.css";
+import Navbar from '@/app/widgets/navbar/ui/Navbar.astro';
+import NavIsland from '@/app/widgets/navisland/NavIsland.astro';
+import Footer from '@/app/widgets/footer/ui/Footer.astro';
+import { getLocaleFromPath, switchLocale } from '@/app/shared/lib/locale';
@@
-// Build body classes
-const bodyClasses = [
-  'min-h-screen antialiased',
-  isBookme ? 'page-bookme' : '',
-  isAbout ? 'page-about' : '',
-  isBlog ? 'page-blog' : '',
-  pageClass
-].filter(Boolean).join(' ');
+// Build body classes
+const bodyClasses = [
+  'min-h-screen flex flex-col antialiased',
+  isBookme ? 'page-bookme' : '',
+  isAbout ? 'page-about' : '',
+  isBlog ? 'page-blog' : '',
+  pageClass
+].filter(Boolean).join(' ');
@@
-  <body class={bodyClasses}>
-    <header data-app-navbar>
-      <div class="nav-float-wrap">
-        <NavIsland locale={locale} />
-      </div>
-    </header>
-    
-    <main class="cv-container">
-      <slot />
-    </main>
+  <body class={bodyClasses}>
+    <header data-app-navbar>
+      <div class="nav-float-wrap">
+        <NavIsland locale={locale} />
+      </div>
+    </header>
+    
+    <slot />
+    
+    <Footer />
```

*** a/apps/website/src/app/shared/lib/debug.ts
--- b/apps/website/src/app/shared/lib/debug.ts
@@
-export function debug(...args: any[]) {
-  if (import.meta.env.DEV) console.log(...args);
-}
+export function debug(...args:any[]){ if (import.meta.env.DEV) console.log(...args) }
```
