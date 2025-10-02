# Tailwind v4 Refactor - Verification Notes

## Post-Run Summary

### Tailwind Version Detected
- **Exact Version**: 4.1.13
- **Package**: `tailwindcss@4.1.13`
- **Vite Plugin**: `@tailwindcss/vite@4.1.13` (already installed)
- **PostCSS Plugin**: `@tailwindcss/postcss@4.1.13` (already installed)

### PostCSS Configuration Status
- **File**: `apps/website/postcss.config.cjs`
- **Status**: Kept existing configuration
- **Content**: `{ plugins: { "@tailwindcss/postcss": {} } }`
- **Rationale**: Already correct for Tailwind v4

### @reference Lines Added
The following files now have `@reference "@/styles/tailwind.css";` at the top of their @apply blocks:

1. **apps/website/src/styles/main.css** (line 225)
   - Context: `@layer components` block
   - Usage: `.nav-surface { @apply sticky top-0 z-50 w-full; }`

2. **apps/website/src/features/about/devscard/ui/AboutShell.astro** (line 46)
   - Context: `<style>` block
   - Usage: `.cv-root { @apply flex justify-center xl:relative xl:left-7; }`

3. **apps/website/src/features/about/devscard/ui/Description.astro** (line 40)
   - Context: `<style is:global>` block
   - Usage: `.description ul { @apply list-disc pl-5; }`

4. **apps/website/src/features/about/devscard/ui/SidebarItem.astro** (line 21)
   - Context: `<style>` block
   - Usage: `[aria-current='page'] { @apply bg-primary-600 text-white; }`

### @theme Block Content (Final Form)
```css
@theme {
  /* Colors: map cv-root variables to Tailwind tokens */
  --color-primary-50: var(--cv-primary-50);
  --color-primary-100: var(--cv-primary-100);
  --color-primary-200: var(--cv-primary-200);
  --color-primary-300: var(--cv-primary-300);
  --color-primary-400: var(--cv-primary-400);
  --color-primary-500: var(--cv-primary-500);
  --color-primary-600: var(--cv-primary-600);
  --color-primary-700: var(--cv-primary-700);
  --color-primary-800: var(--cv-primary-800);
  --color-primary-900: var(--cv-primary-900);
  --color-primary-950: var(--cv-primary-950);

  /* Gray colors from cv-root */
  --color-gray-50: var(--cv-gray-50);
  --color-gray-100: var(--cv-gray-100);
  --color-gray-200: var(--cv-gray-200);
  --color-gray-300: var(--cv-gray-300);
  --color-gray-400: var(--cv-gray-400);
  --color-gray-500: var(--cv-gray-500);
  --color-gray-600: var(--cv-gray-600);
  --color-gray-700: var(--cv-gray-700);
  --color-gray-800: var(--cv-gray-800);
  --color-gray-900: var(--cv-gray-900);
  --color-gray-950: var(--cv-gray-950);
  
  /* Spacing: ensure 0 exists and add custom spacing */
  --spacing-0: 0px;
  --spacing-18: 4.5rem;
  
  /* Font family */
  --font-sans: "Inter var", system-ui, -apple-system, sans-serif;
  
  /* Custom animation */
  --animate-show: show 225ms ease-in-out;
}
```

## Files to Eyeball in Dev Tools

### 1. Check Utility Classes Apply
Open browser dev tools and inspect these elements:

**Navigation Bar**:
- Element: `.nav-surface`
- Expected: `position: sticky; top: 0; z-index: 50; width: 100%`
- Verify: `bg-primary-600` classes work in SidebarItem.astro

**About Page Components**:
- Element: `.cv-root` 
- Expected: `display: flex; justify-content: center; position: relative; left: 1.75rem` (on xl screens)
- Element: `.description ul`
- Expected: `list-style-type: disc; padding-left: 1.25rem`

### 2. Verify Color Tokens Work
Test these utility classes in browser console or by temporarily adding them to elements:
- `bg-primary-600` → Should use `var(--cv-primary-600)` (#4f46e5)
- `text-primary-50` → Should use `var(--cv-primary-50)` (#eef2ff)
- `text-gray-400` → Should use `var(--cv-gray-400)` (#9ca3af)
- `hover:bg-primary-700` → Should use `var(--cv-primary-700)` (#4338ca)

### 3. Check Spacing Utilities
- `top-0` → Should resolve to `top: 0px`
- `inset-0` → Should resolve to `top: 0px; right: 0px; bottom: 0px; left: 0px`
- `p-6` → Should resolve to `padding: 1.5rem`
- `rounded-xl` → Should resolve to `border-radius: 0.75rem`

### 4. Verify Dark Mode
- Toggle dark mode (if theme switcher exists)
- Check that `html.dark` class is applied
- Verify cv-root variables update correctly
- Confirm Tailwind utilities respect dark mode variants

### 5. Check for Console Errors
- Open browser console
- Look for any Tailwind compilation errors
- Verify no "Cannot apply unknown utility class" messages
- Check for any CSS parsing errors

## Success Criteria
- ✅ Dev server starts without Tailwind errors
- ✅ No "Cannot apply unknown utility class" errors in console
- ✅ Global utilities like `top-0`, `inset-0`, `p-6`, `rounded-xl` apply correctly
- ✅ cv-root colors available as Tailwind tokens (e.g., `bg-primary-600` uses `var(--cv-primary-600)`)
- ✅ Dark mode continues to work with class-based switching
- ✅ All existing functionality preserved
- ✅ No changes to routes, page structure, or Cal.com integration
