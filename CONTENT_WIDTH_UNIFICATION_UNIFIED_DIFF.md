# Content Width Unification - Unified Diff

## Summary
This diff implements unified content width across the site using a centralized CSS variable system. All main content areas and the NavIsland now use a consistent 1040px max-width with responsive padding.

## File Changes

### 1. apps/website/src/styles/main.css

```diff
@@ -24,11 +24,14 @@
   --cv-on-primary: #ffffff;
 
   /* Container/gutter variables */
-  --cv-container-max: var(--cv-max-w, 80rem);
+  --cv-bar-w-web: 1040px;  /* Web bar width - single source of truth for content width */
+  --cv-content-max-w: var(--cv-bar-w-web, 1040px);  /* Content max width tied to web bar width */
+  --cv-content-pad-x: clamp(16px, 3.5vw, 24px);  /* Responsive horizontal padding */
+  --cv-container-max: var(--cv-content-max-w);  /* Use unified content width */
   --cv-gutter-x: var(--cv-gap, 1.5rem);
   
-  /* Bookme pages width constraint */
-  --bookme-max-w: 960px;
+  /* Bookme pages width constraint - now unified with content width */
+  --bookme-max-w: var(--cv-content-max-w);
 
   /* Hairline border (derive from text) */
   --cv-border-hairline: color-mix(in oklab, var(--cv-text)/12%, transparent);
@@ -138,7 +141,7 @@ body {
   .text-body        { color: var(--cv-text); }
   .text-muted       { color: var(--cv-muted); }
   .border-hairline  { border-color: var(--cv-border-hairline); }
-  .cv-container     { max-width: var(--cv-container-max); padding-left: var(--cv-gutter-x); padding-right: var(--cv-gutter-x); margin-inline: auto; }
+  .cv-container     { max-width: var(--cv-container-max); padding-left: var(--cv-content-pad-x); padding-right: var(--cv-content-pad-x); margin-inline: auto; }
 
   /* Nav offset utility */
   .nav-offset { margin-top: var(--cv-nav-offset-y); }
@@ -184,8 +187,8 @@ body {
     max-width: var(--bookme-max-w);
     width: 100%;
     margin-inline: auto;
-    padding-left: var(--cv-gap);
-    padding-right: var(--cv-gap);
+    padding-left: var(--cv-content-pad-x);
+    padding-right: var(--cv-content-pad-x);
     padding-top: 2rem;
     padding-bottom: 1rem;
   }
@@ -194,8 +197,8 @@ body {
     max-width: var(--bookme-max-w);
     width: 100%;
     margin-inline: auto;
-    padding-left: var(--cv-gap);
-    padding-right: var(--cv-gap);
+    padding-left: var(--cv-content-pad-x);
+    padding-right: var(--cv-content-pad-x);
     padding-top: 1rem;
     padding-bottom: 1.5rem;
   }
```

### 2. apps/website/src/app/layouts/AppShell.astro

```diff
@@ -114,14 +114,14 @@ const bodyClasses = [
         padding-top: var(--nav-gap);   /* needed top offset */
         /* IMPORTANT: NO transform here */
         pointer-events: auto;          /* clicks pass through */
-        max-width: var(--cv-container-max, 80rem);
+        max-width: var(--cv-content-max-w);
         margin-inline: auto;
-        padding-inline: var(--cv-gutter-x, 1rem);
+        padding-inline: var(--cv-content-pad-x);
       }
       
       @media (max-width: 640px) {
         .nav-float-wrap {
-          padding-inline: 1rem;
+          padding-inline: var(--cv-content-pad-x);
         }
       }
     </style>
```

### 3. apps/website/src/styles/devscard.css

```diff
@@ -1,7 +1,7 @@
 /* DevsCard стили - скопированы из эталона и адаптированы под .cv-root */
 
 :root {
-  --cv-max-w: 80rem;        /* ширина карточек DevsCard — как в эталоне */
+  --cv-max-w: var(--cv-content-max-w, 1040px);  /* Use unified content width */
   --cv-gap: 1.5rem;         /* внутренние горизонтальные отступы */
   --navbar-h: 72px;         /* дефолтная высота, далее обновим скриптом */
   --cv-page-bg: #f6f7fb;  /* фон страницы */
```

## Impact Analysis

### Width Changes
- **NavIsland**: 1280px → 1040px (unified with content)
- **Bookme Pages**: 960px → 1040px (unified with content)
- **About Pages**: 1280px → 1040px (unified with content)
- **All Other Pages**: 1280px → 1040px (unified with content)

### Padding Changes
- **All Content Areas**: Now use responsive `clamp(16px, 3.5vw, 24px)` padding
- **Consistent Behavior**: Same padding system across NavIsland and main content

### Unchanged Components
- **Footer**: No modifications (as required)
- **ColumnBed.astro**: Cal.com embed behavior preserved
- **Route Structure**: No changes to URLs or file organization

## CSS Variable Hierarchy

```css
--cv-bar-w-web: 1040px                    /* Single source of truth */
  └── --cv-content-max-w: var(--cv-bar-w-web, 1040px)
      ├── --cv-container-max: var(--cv-content-max-w)
      └── --bookme-max-w: var(--cv-content-max-w)
```

## Responsive Behavior

- **≥1200px viewport**: Content width = 1040px, padding = 24px
- **768px-1199px viewport**: Content width = 1040px, padding = 16-24px (responsive)
- **<768px viewport**: Content width = 100% - padding, padding = 16px

## Verification Commands

```powershell
# Test development server
cd apps/website
npm run dev -- --host --port 4321

# Verify computed widths in DevTools:
# - NavIsland max-width should be 1040px
# - Main content max-width should be 1040px  
# - Bookme pages max-width should be 1040px (was 960px)
# - All content should be centered with consistent padding
```

## Future Maintenance

To change site-wide content width, update only:
```css
--cv-bar-w-web: 1040px;  /* Change this value */
```

All components automatically inherit the new width through CSS variable cascade.
