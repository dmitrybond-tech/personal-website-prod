# Unified Diff: Content Width Unification & React Islands

## Files Modified

### 1. AppShell.astro - Unified Container
```diff
-    <slot />
+    <main id="site-container" class="site-container flex-1">
+      <slot />
+    </main>
```

### 2. main.css - CSS Variables & Container Styles
```diff
+  /* Unified site container variables */
+  --cv-content-max: 1040px;     /* default for about */
+  --cv-content-pad-x: 16px;
+
+  /* Unified site container */
+  .site-container {
+    width: 100%;
+    max-width: var(--cv-content-max);
+    margin-left: auto;
+    margin-right: auto;
+    padding-left: var(--cv-content-pad-x);
+    padding-right: var(--cv-content-pad-x);
+  }
+  
+  /* Content inside container doesn't overflow max-width */
+  #site-container *:where(img,video,canvas,svg) {
+    max-width: 100%;
+  }
```

### 3. CardGridIsland.tsx - React Island Component (NEW)
- TypeScript React component with Card type definitions
- Support for 'default' and 'skills' variants
- Tooltip functionality with ESC key handling
- 5-segment skill level visualization
- Debug logging for development

### 4. CardsSection.astro - SSR Wrapper (NEW)
- SSR skeleton with animate-pulse
- Island mounting with client:load/visible
- Configurable skeleton count based on items

### 5. Cards.astro - Registry Integration (NEW)
- Transforms section data to Card format
- Handles title, variant, hydrate props
- Fallback values for missing data

### 6. registry.ts - Added Cards Component
```diff
+import Cards from './sections/Cards.astro';
+  cards: Cards,
```

### 7. about.astro - Removed Local Container
```diff
-  <main class="container mx-auto px-4 py-8 flex-1">
+  <div class="py-8">
```

### 8. bookme.astro - Width Override
```diff
-  <main class="container mx-auto px-4 py-8 flex-1">
+  <div class="py-8" style="--cv-content-max: 990px;">
```

### 9. about.md - Added Test Cards Sections
- Two new cards sections: "Technologies & Tools" and "Skill Levels"
- Demonstrates both 'default' and 'skills' variants
- Shows client:load vs client:visible hydration

## Summary
- **9 files modified/created**
- **Unified container** with CSS variable control
- **React islands** with SSR skeletons
- **Registry integration** for cards system
- **Width control** via --cv-content-max variable