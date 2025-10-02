# Tailwind v4 Refactor - Change Log

## Version: Tailwind v4.1.13 Migration
**Date**: Current  
**Scope**: apps/website only  
**Impact**: Low - surgical changes only

## Changes Made

### 1. Created New Tailwind v4 Configuration
- **File**: `apps/website/src/styles/tailwind.css` (NEW)
- **Lines**: 1-44
- **Change**: Converted from v3 `@tailwind` directives to v4 `@import "tailwindcss"`
- **Rationale**: Official v4 syntax for Astro integration

### 2. Added @theme Block for Design Tokens
- **File**: `apps/website/src/styles/tailwind.css`
- **Lines**: 3-39
- **Change**: Mapped cv-root CSS variables to Tailwind design tokens
- **Rationale**: Expose custom colors (primary-50..950, gray-50..950) as Tailwind utilities

### 3. Fixed @apply Scope Issues
- **Files**: 4 files with @apply usage
- **Change**: Added `@reference "@/styles/tailwind.css"` to each @apply block
- **Rationale**: v4 requires @reference to resolve utility classes in @apply

#### Files Modified:
- `apps/website/src/styles/main.css` (line 225)
- `apps/website/src/features/about/devscard/ui/AboutShell.astro` (line 46)
- `apps/website/src/features/about/devscard/ui/Description.astro` (line 40)
- `apps/website/src/features/about/devscard/ui/SidebarItem.astro` (line 21)

## Technical Details

### Tailwind Version Detected
- **Exact Version**: 4.1.13
- **Vite Plugin**: @tailwindcss/vite@4.1.13 (already installed)
- **PostCSS Plugin**: @tailwindcss/postcss@4.1.13 (already installed)

### PostCSS Configuration
- **Status**: Kept existing `postcss.config.cjs`
- **Content**: `{ plugins: { "@tailwindcss/postcss": {} } }`
- **Rationale**: Already correct for v4

### @theme Block Content (Final Form)
```css
@theme {
  /* Colors: map cv-root variables to Tailwind tokens */
  --color-primary-50: var(--cv-primary-50);
  --color-primary-100: var(--cv-primary-100);
  /* ... (primary-200 through primary-950) ... */
  
  /* Gray colors from cv-root */
  --color-gray-50: var(--cv-gray-50);
  --color-gray-100: var(--cv-gray-100);
  /* ... (gray-200 through gray-950) ... */
  
  /* Spacing: ensure 0 exists and add custom spacing */
  --spacing-0: 0px;
  --spacing-18: 4.5rem;
  
  /* Font family */
  --font-sans: "Inter var", system-ui, -apple-system, sans-serif;
  
  /* Custom animation */
  --animate-show: show 225ms ease-in-out;
}
```

### @reference Lines Added
- `apps/website/src/styles/main.css` - Line 225
- `apps/website/src/features/about/devscard/ui/AboutShell.astro` - Line 46
- `apps/website/src/features/about/devscard/ui/Description.astro` - Line 40
- `apps/website/src/features/about/devscard/ui/SidebarItem.astro` - Line 21

## Safelist Additions
- **Status**: None required
- **Rationale**: No dynamic class generation detected in codebase

## Verification Results
- ✅ Dev server starts without errors
- ✅ No "Cannot apply unknown utility class" errors
- ✅ Utilities like `bg-primary-600`, `text-primary-50`, `top-0`, `inset-0` work
- ✅ Dark mode continues to function with class-based switching
- ✅ All existing cv-root CSS variables preserved
- ✅ No changes to routes, components, or Cal.com integration
