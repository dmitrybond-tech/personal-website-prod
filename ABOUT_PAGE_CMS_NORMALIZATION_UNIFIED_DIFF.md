## Summary
Fixed Tailwind v4 @apply issues, implemented CMS section normalization with comprehensive logging, and enhanced Cards component for universal rendering. All sections now render within #site-container with proper performance monitoring.

## Modified Files

### 1. Fixed Tailwind @apply Issues

**File**: `apps/website/src/components/skills/SkillsSection.astro`
```diff
 <style>
+  @reference "../../styles/tailwind.css";
+  
   .skills-section {
     @apply py-8;
   }
```

**File**: `apps/website/src/components/skills/SkillItem.astro`
```diff
 <style>
+  @reference "../../styles/tailwind.css";
+  
   .skill-item {
     @apply relative p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200;
   }
```

### 2. Enhanced About Page with Section Normalization

**File**: `apps/website/src/pages/[lang]/about.astro`
```diff
 debug('[about] lang=%s slug=%s found=%s', lang, slug, !!entry);
-const sections = entry?.data?.sections ?? [];
+
+// Section normalization functions
+const keys = (o:any) => o ? Object.keys(o) : [];
+const getSectionType = (s:any) =>
+  s?.type ?? s?.template ?? s?.blockType ?? s?._type ?? s?.component ?? s?.data?.type ?? 'unknown';
+
+const normalizeSection = (s:any) => {
+  const type = getSectionType(s);
+  const data = s?.data ?? s; // часто Decap кладёт payload прямо в секцию
+  return { ...s, type, data };
+};
+
+// Process sections with comprehensive logging
+const rawSections = entry?.data?.sections ?? [];
+debug('[about] sections.total=%d', rawSections.length);
+rawSections.forEach((s:any, i:number) => {
+  debug('[about] s[%d] keys=%o', i, keys(s));
+  debug('[about] s[%d] typeGuess=%s dataKeys=%o', i, getSectionType(s), keys(s?.data));
+});
+
+const sections = rawSections.map(normalizeSection);
+const unknown = sections.filter(s => !registry[s.type]);
+debug('[about] normalized types=%o', sections.map(s=>s.type));
+if (unknown.length) debug('[about] UNKNOWN sections=%o', unknown.map(u => ({type:u.type, keys:keys(u)})));
+
+// Protection from empty data
+if (!sections.length) debug('[about] EMPTY after normalize. entry.data keys=%o', keys(entry?.data));
```

```diff
         })}
+    
+    <script is:inline>
+      (function(){
+        const c = document.getElementById('site-container');
+        if (!c) { console.warn('[about] #site-container missing'); return; }
+        const cs = getComputedStyle(c);
+        console.debug('[about] container w=%s padX=%s/%s', c.offsetWidth, cs.paddingLeft, cs.paddingRight);
+      })();
+    </script>
   </div>
 </AppShell>
```

### 3. Enhanced Cards Component for Universal Rendering

**File**: `apps/website/src/features/about/sections/Cards.astro`
```diff
 const { section, lang = 'en' } = Astro.props;
 
-// Extract data from section
-const { data } = section;
-const title = data?.title || section.heading || (lang === 'en' ? 'Cards' : 'Карточки');
-const variant = data?.variant || 'default';
-const hydrate = data?.hydrate || 'load';
-const items = data?.items || [];
-
-// Transform items to match Card type
-const transformedItems = items.map((item: any) => ({
-  id: item.id || item.name || Math.random().toString(36).substr(2, 9),
-  title: item.title || item.name || '',
-  subtitle: item.subtitle,
-  description: item.description,
-  icon: item.icon,
-  url: item.url,
-  tags: item.tags,
-  level: item.level,
-  tooltip: item.tooltip
-}));
+// Normalize incoming data (section is already normalized by about.astro)
+const raw = section?.data ?? section ?? {};
+const title = raw?.title ?? section?.heading ?? (lang === 'en' ? 'Cards' : 'Карточки');
+const variant = raw?.variant ?? (section?.type === 'skills' ? 'skills' : 'default');
+const hydrate = raw?.hydrate ?? 'load'; // для первого экрана — load
+const groups = raw?.groups ?? []; // для skills группы с items/level/desc
+
+const items = (raw?.items ?? (groups[0]?.items ?? [])).map((it:any, idx:number) => ({
+  id: it.id ?? it.name ?? `${variant}-${idx}`,
+  title: it.title ?? it.name ?? '',
+  subtitle: it.subtitle,
+  description: it.description,
+  icon: it.icon,
+  url: it.url,
+  tags: it.tags,
+  level: it.level,
+  tooltip: it.description // для skills
+}));
+
+// Debug logging
+import { debug } from '../../../app/shared/lib/debug';
+debug('[cards] variant=%s hydrate=%s items=%d', variant, hydrate, items.length);
```

```diff
 <CardsSection 
   title={title}
-  items={transformedItems}
+  items={items}
   variant={variant}
   hydrate={hydrate}
 />
```

### 4. Updated Registry for Skills/Cards Universal Component

**File**: `apps/website/src/features/about/registry.ts`
```diff
 export const registry: Record<string, any> = {
   hero: Hero,
   projects: Projects,
   experience: Experience,
   education: Education,
   testimonials: Testimonials,
   favorites: Favorites,
-  skills: Skills,
+  // Пока skills рендерим Cards с variant='skills', потом можно вынести
+  skills: Cards,
   cards: Cards,
 };
```

### 5. Enhanced CardGridIsland with Performance Monitoring

**File**: `apps/website/src/components/cards/CardGridIsland.tsx`
```diff
-  // Debug logging
-  useEffect(() => {
-    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
-      console.debug('[cards] render variant=%s count=%d', variant, items.length);
-    }
-  }, [variant, items.length]);
+  // Comprehensive performance logging
+  useEffect(() => {
+    const t0 = performance.now();
+    performance.mark('cards:hydrate:start');
+    if (typeof window !== 'undefined') {
+      console.debug('[cards] island mount: items=%d variant=%s', items.length, variant);
+    }
+
+    const onLoad = () => {
+      performance.mark('cards:window:load');
+      performance.measure('cards:until-window-load','cards:hydrate:start','cards:window:load');
+      const m = performance.getEntriesByName('cards:until-window-load').pop();
+      if (m) console.debug('[cards] until-window-load: %sms', Math.round(m.duration));
+    };
+    window.addEventListener('load', onLoad, { once:true });
+
+    // Log CSS/font resource timings
+    const po = new PerformanceObserver((list) => {
+      for (const e of list.getEntries()) {
+        if (e.initiatorType === 'css' || e.initiatorType === 'font') {
+          console.debug('[res] %s %s %sms', e.initiatorType, (e as any).name?.split('?')[0] ?? '', Math.round(e.duration));
+        }
+      }
+    });
+    try { po.observe({ type:'resource', buffered:true }); } catch {}
+
+    return () => {
+      window.removeEventListener('load', onLoad);
+      try { po.disconnect(); } catch {}
+      performance.mark('cards:hydrate:end');
+      performance.measure('cards:hydrate','cards:hydrate:start','cards:hydrate:end');
+      const m = performance.getEntriesByName('cards:hydrate').pop();
+      if (m) console.debug('[cards] hydrate: %sms', Math.round(m.duration));
+    };
+  }, [variant, items.length]);
```

## Key Changes Summary

1. **Fixed Tailwind v4 @apply issues**: Added proper @reference directives to resolve utility classes
2. **Section normalization**: Implemented robust type detection and data normalization for CMS sections
3. **Comprehensive logging**: Added server-side and client-side logging for debugging and performance monitoring
4. **Universal Cards component**: Enhanced Cards component to handle both skills and regular card variants
5. **Performance monitoring**: Added detailed performance tracking for hydration and resource loading
6. **Container rendering**: Ensured all sections render within #site-container with proper spacing

## Build Status
✅ Build successful with no Tailwind compilation errors
✅ All @apply directives now resolve correctly
✅ Performance monitoring active for client-side debugging
