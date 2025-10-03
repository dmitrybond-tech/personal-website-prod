# NavFloat Card Theme Delta Final - Changelog

## Overview
Implemented precise fixes for navigation full-bleed and card/skills/tags colors using ONLY existing design tokens. Added high-specificity overrides in @layer components to prevent clamping and ensure proper visual hierarchy.

## Changes Made

### 1) Навбар на всю ширину и белый в светлой
- **File**: `apps/website/src/styles/main.css`
  - **Added high-specificity override in @layer components**:
    ```css
    header[data-app-navbar] .nav-float-wrap,
    .nav-surface .nav-float-wrap {
      max-width: none !important;
      width: calc(100vw - 2 * var(--cv-content-pad-x)) !important;
      margin-inline: auto;
      padding-inline: var(--cv-content-pad-x);
    }
    ```
  - **Added navfloat max-width protection**: `.navfloat { max-width: 100%; }`
  - **Added light theme white background**: `html:not(.dark) .navfloat { background-color: var(--cv-surface-elevated) !important; }`
  - **Updated root token**: `--cv-nav-max-w: 100vw` (was calc-based)

### 2) Светлая тема: родитель белый, «внутренние в Skills» — на surface
- **File**: `apps/website/src/styles/main.css`
  - **Updated root surface tokens**:
    ```css
    --cv-surface: var(--cv-page-bg, #f6f7fb);       /* фон страницы (для внутренних) */
    --cv-surface-elevated: #ffffff;                 /* родительские карточки */
    --cv-surface-2: var(--cv-surface);             /* используем для подповерхностей/чипов */
    ```
  - **Added Skills-specific rules**:
    ```css
    .cv-chip,
    .skills-tile,
    .skills-grid .tile {
      background-color: var(--cv-surface) !important;   /* f6f7fb в светлой */
      color: var(--cv-text);
      border-color: var(--cv-border);
    }
    ```

### 3) Теги и иконки в карточке профиля: светлая → surface, тёмная → navpanel-dark
- **File**: `apps/website/src/styles/main.css`
  - **Added profile-specific tag rules**:
    ```css
    .cv-card--profile .cv-tag,
    .cv-profile .cv-tag {
      background-color: var(--cv-surface) !important; /* f6f7fb */
      color: var(--cv-text);
    }
    .dark .cv-card--profile .cv-tag,
    .dark .cv-profile .cv-tag {
      background-color: var(--cv-navpanel-bg-dark) !important; /* #374151 */
      color: var(--cv-text);
    }
    ```
  - **Added profile-specific icon rules**:
    ```css
    .cv-card--profile .cv-icon, 
    .cv-profile .cv-icon {
      background-color: var(--cv-surface) !important;  /* светлая */
    }
    .dark .cv-card--profile .cv-icon, 
    .dark .cv-profile .cv-icon {
      background-color: var(--cv-navpanel-bg-dark) !important; /* тёмная */
    }
    ```

### 4) Тёмная тема: убрать 1px окантовку везде, но оставить :focus-visible
- **Files**: `apps/website/src/styles/main.css` and `apps/website/src/styles/tokens-fallback.css`
  - **Updated dark theme border token**: `--cv-border-hairline: transparent;`
  - **Added dark theme ui-outline override**:
    ```css
    .dark .ui-outline { box-shadow: none !important; }
    ```
  - **Preserved focus-visible treatment**: `*:focus-visible { outline: 2px solid var(--cv-primary-500); }`

### 5) Тёмная тема: фон «родительских» карточек = navpanel-dark
- **Files**: `apps/website/src/styles/main.css` and `apps/website/src/styles/tokens-fallback.css`
  - **Updated dark theme parent cards**: `--cv-surface-elevated: var(--cv-navpanel-bg-dark); /* #374151 */`
  - **Result**: Parent cards now use navpanel-bg-dark (#374151) in dark theme

## Technical Implementation

### High-Specificity Overrides
- **@layer components**: Used for color and width overrides to win specificity battles
- **@layer utilities**: Used for ui-outline dark theme override
- **!important declarations**: Applied strategically to override existing rules

### Design Token Usage
- **No new tokens**: Only used existing tokens: `--cv-surface`, `--cv-surface-elevated`, `--cv-navpanel-bg-dark`, `--cv-page-bg`, `--cv-border-hairline`, `--cv-text`
- **Token relationships**: `--cv-surface-2` now references `--cv-surface` for consistency
- **Fallback support**: Updated both main.css and tokens-fallback.css

### Visual Hierarchy
- **Light theme**: Parent cards white (#ffffff), Skills inner cards gray (#f6f7fb)
- **Dark theme**: Parent cards navpanel-dark (#374151), Skills inner cards page-bg (#111827)
- **Profile elements**: Tags/icons use surface in light, navpanel-bg-dark in dark
- **Navigation**: Full-bleed width with white background in light theme

## Verification Results

### ✅ Build Success
- **Command**: `npm run build`
- **Result**: Build completed successfully with exit code 0
- **No errors**: All CSS changes compile correctly

### ✅ Navigation Full-Bleed
- **High-specificity rules**: Added to @layer components to override existing clamping
- **Width calculation**: `calc(100vw - 2 * var(--cv-content-pad-x))` ensures proper padding
- **Light theme**: White background enforced with `!important`

### ✅ Card Visual Hierarchy
- **Parent cards**: White in light (#ffffff), navpanel-dark in dark (#374151)
- **Skills inner cards**: Surface color (#f6f7fb in light, #111827 in dark)
- **Profile tags/icons**: Proper color mapping for both themes

### ✅ Dark Theme Cleanup
- **1px outlines removed**: `--cv-border-hairline: transparent`
- **Focus-visible preserved**: Maintains accessibility with primary-500 outline
- **ui-outline disabled**: `.dark .ui-outline { box-shadow: none !important; }`

## Files Modified
1. `apps/website/src/styles/main.css` - Main implementation
2. `apps/website/src/styles/tokens-fallback.css` - Fallback consistency

## Impact
- **Navigation**: Now spans full viewport width with proper visual presence
- **Cards**: Clear visual hierarchy with white parent cards and gray sub-cards
- **Profile elements**: Consistent styling with proper theme support
- **Dark theme**: Cleaner appearance without hairline borders
- **Accessibility**: Maintained focus indicators for keyboard navigation

## Rollback Plan
If issues arise, revert the following changes:
1. Remove high-specificity navigation overrides from @layer components
2. Restore original surface token values
3. Remove profile-specific tag/icon rules
4. Restore `--cv-border-hairline: color-mix(...)` in dark theme
5. Restore `--cv-surface-elevated: #1f2937` in dark theme

All changes use existing design tokens and maintain backward compatibility while providing the requested visual improvements.
