# NavFloat Card Theme Delta Revert - Changelog

## Overview
Reverted nav-float-wrap customizations, moved NavBar styling to wrapper DIV, and changed parent cards to base surface token. Used ONLY existing tokens with no new colors, vars, or theme extensions.

## Changes Made

### 1) Revert nav-float-wrap customizations
- **File**: `apps/website/src/styles/main.css`
- **Removed**: Custom nav-float-wrap rules that set:
  - `.nav-float-wrap.nav-float-wrap { max-width: none; width: calc(100vw - 2 * var(--cv-content-pad-x)); ... }`
  - Doubled selector approach
- **Result**: Original clamp from layout (`min(var(--cv-nav-max-w), ...)`) restored
- **No new width/size rules**: `.nav-float-wrap` left untouched

### 2) NavBar color → wrapper DIV
- **File**: `apps/website/src/styles/main.css`
- **Target**: Full-width wrapper DIV using existing `.nav-surface` class
- **Implementation**:
  ```css
  /* Nav wrapper DIV styles by theme (tokens only) */
  html:not(.dark) .nav-surface {
    background-color: var(--cv-surface-elevated); /* white in light */
  }
  .dark .nav-surface,
  html[data-theme="dark"] .nav-surface {
    /* leave as-is (uses existing dark tokens); no width changes here */
  }
  ```

### 3) Parent cards → "lowest layer" (base surface) in BOTH themes
- **File**: `apps/website/src/styles/main.css`
- **Target**: Section-level containers only (`.cv-section` and `[data-type="section"]`)
- **Implementation**:
  ```css
  /* Parent/section cards only (Profile, Skills top card, etc.) */
  .cv-root .cv-section,
  [data-type="section"] {
    background-color: var(--cv-surface) !important; /* lowest layer token */
  }
  ```

## Technical Implementation

### Token Usage
- **Base surface token**: `--cv-surface` maps to:
  - Light theme: `#f6f7fb` (page background)
  - Dark theme: `var(--cv-page-bg, #111827)` (page background)
- **Elevated surface token**: `--cv-surface-elevated` for NavBar light theme
- **No new tokens**: All changes use existing design system tokens

### Scope Limitations
- **Parent cards only**: Targets `.cv-root .cv-section` and `[data-type="section"]`
- **Sub-cards untouched**: Skills tiles, tags, icons, levels remain unchanged
- **NavBar wrapper**: Uses existing `.nav-surface` class (sticky full-bleed bar)
- **No borders/outlines**: Borders, rings, outlines, icons, tags not modified

### Reverted Changes
- **nav-float-wrap**: Removed all custom width and background rules
- **Original clamp**: Restored `min(var(--cv-nav-max-w), calc(100vw - 2 * var(--cv-content-pad-x)))`
- **No width changes**: NavBar wrapper maintains existing width behavior

## Verification Results

### ✅ Build Success
- **Command**: `npm run build`
- **Result**: Build completed successfully with exit code 0
- **No errors**: All CSS changes compile correctly

### ✅ NavBar Styling
- **Wrapper DIV**: `.nav-surface` now handles background color
- **Light theme**: White background (`--cv-surface-elevated`)
- **Dark theme**: Existing dark tokens preserved
- **Width behavior**: Original clamp restored, no custom width rules

### ✅ Parent Cards
- **Base surface**: Both `.cv-section` and `[data-type="section"]` use `--cv-surface`
- **Light theme**: `#f6f7fb` (page background color)
- **Dark theme**: `#111827` (page background color)
- **Sub-cards**: Skills tiles and nested elements remain unchanged

### ✅ Token Integrity
- **No new variables**: All changes use existing design tokens
- **No hex literals**: No new colors or CSS variables added
- **Theme consistency**: Proper light/dark theme support maintained

## Files Modified
1. `apps/website/src/styles/main.css` - Main implementation

## Impact
- **NavBar**: Clean wrapper DIV styling with proper theme support
- **Parent cards**: Now use base surface (lowest layer) in both themes
- **Sub-cards**: Skills tiles and nested elements remain unaffected
- **Width behavior**: Original clamp restored, no custom overrides
- **Token usage**: Clean implementation using only existing design tokens

## Rollback Plan
If issues arise, revert the following changes:
1. Remove `.nav-surface` background rules
2. Remove `.cv-root .cv-section, [data-type="section"]` background rules
3. Restore previous nav-float-wrap customizations if needed

This delta revert provides a clean implementation using only existing design tokens while maintaining proper visual hierarchy and theme support.
