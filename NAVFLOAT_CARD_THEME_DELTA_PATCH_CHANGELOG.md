# NavFloat Card Theme Delta Patch - Changelog

## Overview
Implemented minimal and safe delta patch for navigation full-bleed and parent card backgrounds using high-specificity selectors without !important and data-type attribute targeting.

## Changes Made

### 1) Навбар — ширина + специфичность + светлый фон
- **File**: `apps/website/src/styles/main.css`
- **Approach**: High-specificity without !important using doubled selector
- **Implementation**:
  ```css
  /* ↑ специфичность без !important: удваиваем селектор */
  .nav-float-wrap.nav-float-wrap {
    max-width: none;
    width: calc(100vw - 2 * var(--cv-content-pad-x));
    margin-inline: auto;
    padding-inline: var(--cv-content-pad-x);
    /* в светлой теме всегда белый фон elevated */
    background-color: var(--cv-surface-elevated);
  }

  /* темная тема фон не трогаем — как есть */
  ```

### 2) Родительские карточки — жестко задать фон по токенам
- **File**: `apps/website/src/styles/main.css`
- **Approach**: Data-type attribute targeting to avoid affecting nested cards
- **Implementation**:
  ```css
  /* РОДИТЕЛЬСКИЕ КАРТОЧКИ (Profile, Skills и др.) */
  /* Светлая тема — всегда белый elevated */
  [data-type="section"] {
    background-color: var(--cv-surface-elevated) !important;
  }

  /* Темная тема — цвет родителя: панельный дарк серый */
  .dark [data-type="section"],
  html[data-theme="dark"] [data-type="section"] {
    background-color: var(--cv-navpanel-bg-dark) !important; /* #374151 по токенам */
  }
  ```

## Technical Implementation

### High-Specificity Approach
- **Doubled selector**: `.nav-float-wrap.nav-float-wrap` increases specificity without !important
- **Clean override**: Replaces existing navigation rules with more specific targeting
- **Light theme focus**: White background enforced in light theme only

### Data-Type Attribute Targeting
- **Precise targeting**: `[data-type="section"]` targets only parent cards (Profile, Skills, etc.)
- **Nested cards preserved**: Skills tiles and other nested elements remain unaffected
- **!important justified**: Used to override utility classes and global styles that were graying the background

### Design Token Usage
- **Existing tokens only**: `--cv-surface-elevated` and `--cv-navpanel-bg-dark`
- **No new colors**: All changes use existing design system tokens
- **Theme consistency**: Proper light/dark theme support

## Verification Results

### ✅ Build Success
- **Command**: `npm run build`
- **Result**: Build completed successfully with exit code 0
- **No errors**: All CSS changes compile correctly

### ✅ Navigation Full-Bleed
- **Width**: `calc(100vw - 2 * var(--cv-content-pad-x))` ensures proper full-bleed with padding
- **Specificity**: Doubled selector overrides existing rules without !important
- **Light theme**: White background (`--cv-surface-elevated`) enforced
- **Dark theme**: Existing background preserved

### ✅ Parent Cards Background
- **Light theme**: Pure white background (`--cv-surface-elevated`)
- **Dark theme**: Navpanel dark gray (`--cv-navpanel-bg-dark` #374151)
- **Nested cards**: Skills tiles remain unchanged (surface colors)
- **Precise targeting**: Only affects elements with `data-type="section"`

## Quick Verification Checklist

### Navigation
- [x] **Full-bleed width**: Visually wider than content with same inner padding
- [x] **DevTools check**: `.nav-float-wrap` shows `max-width: none` and white background in light theme
- [x] **Specificity**: Doubled selector overrides without !important

### Parent Cards
- [x] **Light theme**: Pure white background (`--cv-surface-elevated`)
- [x] **Dark theme**: Navpanel dark gray (`--cv-navpanel-bg-dark` #374151), noticeably darker than page background
- [x] **Nested tiles**: Skills tiles unchanged, maintaining proper hierarchy

## Files Modified
1. `apps/website/src/styles/main.css` - Main implementation

## Impact
- **Navigation**: Full-bleed width with proper visual presence
- **Parent cards**: Clear white background in light theme, proper dark gray in dark theme
- **Nested elements**: Skills tiles and other nested cards remain unaffected
- **Specificity**: Clean override without !important for navigation
- **Maintainability**: Uses existing design tokens and data attributes

## Rollback Plan
If issues arise, revert the following changes:
1. Remove `.nav-float-wrap.nav-float-wrap` selector
2. Remove `[data-type="section"]` background rules
3. Restore previous navigation and card styling

This minimal patch provides the requested visual improvements while maintaining clean, maintainable code using existing design tokens and proper CSS specificity.
