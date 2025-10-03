# NavFloat Card Theme Delta Prompt - Changelog

## Overview
Implemented minimal and safe delta prompt changes: reverted nav-float-wrap customizations, moved navbar color to wrapper DIV, and set parent cards background with proper z-index and theme support. Only changed parent card backgrounds and navbar wrapper color.

## Changes Made

### 1) Откат ширины .nav-float-wrap и перенос цвета на wrapper-DIV
- **File**: `apps/website/src/styles/main.css`
- **Removed**: All custom .nav-float-wrap width rules including:
  - Doubled selector `.nav-float-wrap.nav-float-wrap`
  - `max-width: none; width: calc(...)` rules
- **Restored**: Original clamp from layout (`min(var(--cv-nav-max-w), calc(100vw - 2 * var(--cv-content-pad-x)))`)
- **Added**: Navbar color to wrapper DIV only:
  ```css
  /* Цвет полной обёртки навбара, НЕ .nav-float-wrap */
  html:not(.dark) .nav-surface {
    background-color: var(--cv-surface-elevated); /* белый в светлой теме */
  }
  /* Тёмную тему не трогаем: остаётся текущий набор токенов */
  ```

### 2) Родительские карточки: фон и поднятие над фоновыми слоями
- **File**: `apps/website/src/styles/main.css`
- **Target**: Only parent sections via `[data-type="section"]` (SectionCard)
- **Implementation**:
  ```css
  /* Только родительские секции (Profile, верхний Skills и пр.) */
  [data-type="section"] {
    /* Фон по токенам + лёгкое поднятие над фоновыми overlay, не конкурируя с navbar */
    background-color: var(--cv-surface);   /* базовый слой: f6f7fb в светлой, page-bg в тёмной */
    position: relative;
    z-index: 1; /* поднимаем над возможным полупрозрачным слоем из header */
  }

  /* Для тёмной темы дай явный контраст родителя, как просили ранее */
  .dark [data-type="section"],
  html[data-theme="dark"] [data-type="section"] {
    background-color: var(--cv-navpanel-bg-dark); /* #374151 по токену */
    border-color: transparent; /* убираем 1px окантовку только на родителях */
  }
  ```

### 3) (Опционально, если клики «упираются» в шапку)
- **File**: `apps/website/src/styles/main.css`
- **Added**: Pointer-events reset to prevent header overlap:
  ```css
  /* Если вдруг часть страницы по-прежнему «накрыта» невидимым слоем из header */
  header[data-app-navbar] { pointer-events: none; }
  header[data-app-navbar] .nav-surface,
  header[data-app-navbar] .nav-float-wrap,
  header[data-app-navbar] .navisland { pointer-events: auto; }
  ```

## Technical Implementation

### Scope Limitations
- **Parent cards only**: Targets `[data-type="section"]` (SectionCard components)
- **Sub-cards untouched**: Skills tiles, tags, icons, levels remain unchanged
- **Navbar wrapper**: Uses existing `.nav-surface` class (sticky full-bleed bar)
- **No width changes**: `.nav-float-wrap` restored to original clamp behavior

### Design Token Usage
- **Light theme parent cards**: `--cv-surface` (#f6f7fb - base layer)
- **Dark theme parent cards**: `--cv-navpanel-bg-dark` (#374151 - contrast)
- **Light theme navbar**: `--cv-surface-elevated` (white)
- **Dark theme navbar**: Existing dark tokens preserved

### Z-Index and Positioning
- **Parent cards**: `position: relative; z-index: 1` to lift above background overlays
- **Header overlap**: Pointer-events reset to prevent invisible layer blocking clicks
- **Visual hierarchy**: Cards "float" above background with existing shadows

## Verification Results

### ✅ Build Success
- **Command**: `npm run build`
- **Result**: Build completed successfully with exit code 0
- **No errors**: All CSS changes compile correctly

### ✅ Navbar Wrapper
- **Color**: `.nav-surface` handles background color in light theme
- **Width**: Original clamp restored, no custom width rules
- **Dark theme**: Existing dark tokens preserved

### ✅ Parent Cards
- **Light theme**: `--cv-surface` (#f6f7fb) with z-index: 1
- **Dark theme**: `--cv-navpanel-bg-dark` (#374151) with transparent border
- **Visual effect**: Cards "float" above background with existing shadows
- **Sub-cards**: Skills tiles and nested elements remain unchanged

### ✅ Header Overlap Prevention
- **Pointer-events**: Header wrapper disabled, navbar elements enabled
- **Clickability**: Content no longer blocked by invisible header layer
- **Z-index**: Parent cards lifted above background overlays

## Quick Self-Check

### DevTools Verification
- [x] **nav-float-wrap**: No custom `max-width: none/width: calc(...)` rules
- [x] **Original clamp**: Works as intended from layout
- [x] **Light theme**: Parent sections have `--cv-surface` (grayish) background
- [x] **Dark theme**: Parent sections have `--cv-navpanel-bg-dark` without borders
- [x] **Content visibility**: Sections visible and clickable (z-index: 1 + pointer-events)

## Files Modified
1. `apps/website/src/styles/main.css` - Main implementation

## Impact
- **Navbar**: Clean wrapper color with original width behavior
- **Parent cards**: Proper background colors with visual "floating" effect
- **Sub-cards**: Skills tiles and nested elements remain unchanged
- **Clickability**: Content no longer blocked by header overlap
- **Visual hierarchy**: Clear distinction between parent and sub-cards

## Rollback Plan
If issues arise, revert the following changes:
1. Remove `.nav-surface` background rules
2. Remove `[data-type="section"]` background and z-index rules
3. Remove pointer-events reset rules
4. Restore previous nav-float-wrap customizations if needed

This minimal and safe delta prompt provides the requested visual improvements while maintaining clean, maintainable code using only existing design tokens.
