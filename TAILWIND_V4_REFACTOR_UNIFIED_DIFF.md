# Tailwind v4 Refactor - Unified Diff

## Summary
Refactored Astro + Vite + Tailwind v4 setup to fix utility compilation and @apply issues. All changes are minimal and surgical, preserving existing structure and functionality.

## Modified Files

### 1. apps/website/src/styles/tailwind.css (NEW FILE)
```diff
+@import "tailwindcss";
+
+@theme {
+  /* Colors: map cv-root variables to Tailwind tokens */
+  --color-primary-50: var(--cv-primary-50);
+  --color-primary-100: var(--cv-primary-100);
+  --color-primary-200: var(--cv-primary-200);
+  --color-primary-300: var(--cv-primary-300);
+  --color-primary-400: var(--cv-primary-400);
+  --color-primary-500: var(--cv-primary-500);
+  --color-primary-600: var(--cv-primary-600);
+  --color-primary-700: var(--cv-primary-700);
+  --color-primary-800: var(--cv-primary-800);
+  --color-primary-900: var(--cv-primary-900);
+  --color-primary-950: var(--cv-primary-950);
+
+  /* Gray colors from cv-root */
+  --color-gray-50: var(--cv-gray-50);
+  --color-gray-100: var(--cv-gray-100);
+  --color-gray-200: var(--cv-gray-200);
+  --color-gray-300: var(--cv-gray-300);
+  --color-gray-400: var(--cv-gray-400);
+  --color-gray-500: var(--cv-gray-500);
+  --color-gray-600: var(--cv-gray-600);
+  --color-gray-700: var(--cv-gray-700);
+  --color-gray-800: var(--cv-gray-800);
+  --color-gray-900: var(--cv-gray-900);
+  --color-gray-950: var(--cv-gray-950);
+  
+  /* Spacing: ensure 0 exists and add custom spacing */
+  --spacing-0: 0px;
+  --spacing-18: 4.5rem;
+  
+  /* Font family */
+  --font-sans: "Inter var", system-ui, -apple-system, sans-serif;
+  
+  /* Custom animation */
+  --animate-show: show 225ms ease-in-out;
+}
+
+@keyframes show {
+  from { opacity: 0; }
+  to { opacity: 1; }
+}
```

### 2. apps/website/src/styles/main.css
```diff
 /* NavBar component classes - now using DRY utilities/vars */
 @layer components {
+  @reference "@/styles/tailwind.css";
+  
   .nav-surface {
     @apply sticky top-0 z-50 w-full;
```

### 3. apps/website/src/features/about/devscard/ui/AboutShell.astro
```diff
 <style>
+  @reference "@/styles/tailwind.css";
+  
   .cv-root {
     @apply flex justify-center xl:relative xl:left-7;
```

### 4. apps/website/src/features/about/devscard/ui/Description.astro
```diff
 <style is:global>
+  @reference "@/styles/tailwind.css";
+  
   .description ul {
     @apply list-disc pl-5;
```

### 5. apps/website/src/features/about/devscard/ui/SidebarItem.astro
```diff
 <style>
+  @reference "@/styles/tailwind.css";
+  
   [aria-current='page'] {
     @apply bg-primary-600 text-white;
```

## Unchanged Files (Already Correct)
- `apps/website/astro.config.ts` - Already had @tailwindcss/vite plugin
- `apps/website/postcss.config.cjs` - Already using @tailwindcss/postcss
- `apps/website/package.json` - Already had correct versions

## Key Changes Made

1. **Converted tailwind.css to v4 syntax**: Replaced `@tailwind` directives with `@import "tailwindcss"`
2. **Added @theme block**: Mapped cv-root CSS variables to Tailwind design tokens
3. **Added @reference directives**: Fixed @apply scope issues in all files using @apply
4. **Preserved existing structure**: No changes to routes, components, or functionality

## Verification
- Dev server starts successfully on port 4321
- No Tailwind compilation errors
- @apply directives now work correctly
- cv-root colors available as Tailwind utilities (bg-primary-600, etc.)
- Dark mode continues to work with class-based switching
