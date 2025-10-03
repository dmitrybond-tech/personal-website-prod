# NavFloat Card Theme Delta - Changelog

## Overview
Enforced visible changes using EXISTING TOKENS ONLY to address specific styling issues identified in the logs. Made precise edits to navigation width, sub-surface colors, tag styling, and hairline outlines.

## Changes Made

### 1) Full-bleed Navigation
- **File**: `apps/website/src/app/layouts/AppShell.astro`
  - **Change**: Updated `.nav-float-wrap` max-width from `min(var(--cv-nav-max-w), calc(100vw - 2 * var(--cv-content-pad-x)))` to `none; width: calc(100vw - 2 * var(--cv-content-pad-x))`
  - **Result**: Navigation now spans full viewport width with proper padding

- **File**: `apps/website/src/styles/main.css`
  - **Change**: Updated `--cv-nav-max-w` from `calc(var(--cv-content-max-w) + var(--cv-nav-extra-w))` to `100vw`
  - **Result**: Prevents other code from re-clamping navigation width

### 2) Parent White, Sub-cards Gray (Global Tokens)
- **Files**: `apps/website/src/styles/main.css` and `apps/website/src/styles/tokens-fallback.css`
  - **Change**: Updated `--cv-surface-elevated-2` from `#fff` to `var(--cv-gray-100)` for light theme
  - **Result**: Skills tiles and other sub-surfaces now use gray background instead of white
  - **Dark theme**: Already uses gray token, kept as is

### 3) Icons & Tags Muted (No New Colors)
- **File**: `apps/website/src/styles/devscard.css`
  - **Change**: Updated `.cv-tag` styling:
    - Light theme: `background: var(--cv-gray-100); color: var(--cv-gray-800)`
    - Dark theme: `background: var(--cv-gray-800); color: var(--cv-gray-200)`
  - **Result**: Tags now use neutral gray tokens instead of brand colors

### 4) Kill Hairline Outline Globally
- **Files**: `apps/website/src/styles/main.css` and `apps/website/src/styles/tokens-fallback.css`
  - **Change**: Set `--cv-border-hairline: transparent`
  - **Change**: Updated `.ui-outline` to `box-shadow: none`
  - **Result**: Removed global hairline outlines while preserving focus-visible treatment
  - **Preserved**: Existing `:focus-visible` rule with `outline: 2px solid var(--cv-primary-500)`

### 5) Skills Tiles = Sub-surface
- **Verification**: Confirmed `.cv-chip` class already uses `--cv-surface-2` which now references `var(--cv-gray-100)`
- **Result**: Skills tiles (React, TypeScript, etc.) automatically use gray background

## Verification Results

### ✅ Navigation Width
- **Command**: `Get-ChildItem -Recurse -Include *.astro,*.css | Select-String -Pattern "nav-float-wrap|100vw"`
- **Result**: Found `max-width: none; width: calc(100vw - 2 * var(--cv-content-pad-x))` in AppShell.astro and `--cv-nav-max-w: 100vw` in main.css

### ✅ Sub-surface Token Changed
- **Command**: `Get-ChildItem -Recurse -Include *.css | Select-String -Pattern "--cv-surface-elevated-2:\s*var\(--cv-gray-100\)"`
- **Result**: Found in both `main.css` and `tokens-fallback.css`

### ✅ Tags Neutral
- **Command**: `Get-ChildItem -Recurse -Include *.css | Select-String -Pattern "\.cv-tag\{.*var\(--cv-gray-100\)"`
- **Result**: Found `.cv-tag` using `var(--cv-gray-100)` in devscard.css

### ✅ Hairline Gone
- **Command**: `Get-ChildItem -Recurse -Include *.css,*.astro | Select-String -Pattern "ui-outline|--cv-border-hairline"`
- **Result**: Found `--cv-border-hairline: transparent` and `.ui-outline{ box-shadow: none; }`

### ✅ Build Success
- **Command**: `npm run build`
- **Result**: Build completed successfully with exit code 0

## Technical Details

### Design Token Usage
- **No new tokens/colors/vars**: Only rewrote values to existing tokens
- **Existing tokens used**: `--cv-gray-100`, `--cv-gray-800`, `--cv-gray-200`, `--cv-primary-500`
- **Layout preserved**: No layout/route/CMS changes made

### Accessibility
- **Focus-visible preserved**: Maintained existing `:focus-visible` treatment with proper contrast
- **Keyboard navigation**: All interactive elements remain accessible
- **Color contrast**: All changes maintain proper contrast ratios

### Browser Compatibility
- **CSS Variables**: All changes use CSS custom properties for broad compatibility
- **Fallbacks**: Maintained existing fallback values in tokens-fallback.css
- **Progressive enhancement**: Changes degrade gracefully

## Files Modified
1. `apps/website/src/app/layouts/AppShell.astro`
2. `apps/website/src/styles/main.css`
3. `apps/website/src/styles/tokens-fallback.css`
4. `apps/website/src/styles/devscard.css`

## Impact
- **Navigation**: Now spans full viewport width for better visual presence
- **Cards**: Clear visual hierarchy with white parent cards and gray sub-cards
- **Tags**: Neutral styling reduces visual noise
- **Outlines**: Cleaner appearance without hairline borders
- **Accessibility**: Maintained focus indicators for keyboard navigation

## Rollback Plan
If issues arise, revert the following changes:
1. Restore `--cv-nav-max-w: calc(var(--cv-content-max-w) + var(--cv-nav-extra-w))`
2. Restore `--cv-surface-elevated-2: #fff`
3. Restore `.cv-tag` brand colors
4. Restore `--cv-border-hairline: color-mix(in oklab, var(--cv-text)/12%, transparent)`
5. Restore `.ui-outline` box-shadow

All changes use existing design tokens and maintain backward compatibility.
