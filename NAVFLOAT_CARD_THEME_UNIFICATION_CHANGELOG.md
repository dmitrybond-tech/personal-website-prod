# NavFloat Card Theme Unification Changelog

## Overview
Unified the site's navigation and card visuals using ONLY existing design tokens and Tailwind utilities. Promoted navigation from `.NavIsland` to `.NavFloat` in the Root App Bar and applied consistent card styling across all components.

## Changes Made

### 1. Navigation Component Migration
- **Created**: `apps/website/src/app/widgets/navfloat/NavFloat.astro`
  - New navigation component with identical functionality to NavIsland
  - Uses existing design tokens (`--cv-surface-elevated-2`, `--cv-border-hairline`, etc.)
  - Maintains floating/sticky behavior with proper z-index and backdrop
  - Preserves theme toggle and locale switching functionality

- **Updated**: `apps/website/src/app/layouts/AppShell.astro`
  - Replaced `NavIsland` import with `NavFloat`
  - Updated component usage in header section
  - Maintains existing floating wrapper structure

### 2. Card Visual Unification
- **Updated**: `apps/website/src/features/about/devscard/ui/SectionCard.astro`
  - Changed from `bg-white dark:bg-gray-800` to `bg-elev-1`
  - Uses existing `--cv-surface-elevated` token for consistent white/surface background

- **Updated**: `apps/website/src/features/about/devscard/ui/Tag.astro`
  - Added `text-muted` class to use existing `--cv-muted` token
  - Maintains existing `bg-gray-100 dark:bg-gray-700` for light-neutral sub-card styling

- **Updated**: `apps/website/src/features/about/devscard/ui/Icon.astro`
  - Changed default color from `'currentColor'` to `'var(--cv-muted)'`
  - Icons now use neutral gray token consistently

- **Updated**: `apps/website/src/features/about/devscard/ui/Typography.astro`
  - Updated typography variants to use `text-muted` class:
    - `tile-title`, `tile-subtitle`, `paragraph`, `label`, `value`, `skill`
  - Replaces hardcoded gray colors with existing design tokens

### 3. Accessible Focus Treatment
- **Updated**: `apps/website/src/styles/main.css`
  - Added global `*:focus-visible` rule using existing `--cv-primary-500` token
  - Provides accessible 2px outline with 2px offset
  - Works in both light and dark themes without introducing new colors

## Design Token Usage
All changes use ONLY existing tokens from the design system:
- `--cv-surface-elevated` for white/surface backgrounds
- `--cv-muted` for neutral gray text/icons
- `--cv-border-hairline` for subtle borders
- `--cv-primary-500` for focus indicators
- `--cv-text` for primary text color

## Verification
- ✅ Build passes without errors
- ✅ No linting errors introduced
- ✅ All existing functionality preserved
- ✅ Navigation works on all pages using AppShell
- ✅ Card styling consistent across components
- ✅ Focus-visible treatment accessible in both themes

## Files Modified
1. `apps/website/src/app/widgets/navfloat/NavFloat.astro` (new)
2. `apps/website/src/app/layouts/AppShell.astro`
3. `apps/website/src/features/about/devscard/ui/SectionCard.astro`
4. `apps/website/src/features/about/devscard/ui/Tag.astro`
5. `apps/website/src/features/about/devscard/ui/Icon.astro`
6. `apps/website/src/features/about/devscard/ui/Typography.astro`
7. `apps/website/src/styles/main.css`

## Acceptance Criteria Met
- ✅ `.NavFloat` is site-wide, floating/sticky with small top offset, fully clickable
- ✅ Top-level card inner area uses existing white/surface token (`bg-elev-1`)
- ✅ Icons/tags use existing neutral gray token (`text-muted`, `var(--cv-muted)`)
- ✅ Nested sub-cards use existing light-neutral surface token (already implemented)
- ✅ No 1px white outline anywhere (none found in codebase)
- ✅ Keyboard focus visible using existing ring/offset tokens in both themes
- ✅ No new tokens/colors/hex values introduced
- ✅ Build/lint pass, i18n/CMS unaffected
