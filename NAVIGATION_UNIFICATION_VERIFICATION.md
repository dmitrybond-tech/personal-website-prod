# Navigation Unification - Verification List

## Test URLs to Verify

### Core Navigation Pages
1. **http://localhost:4321/en/about**
   - ✅ Should show single NavIsland with About tab active
   - ✅ Should have English locale switcher
   - ✅ Should have stable header height

2. **http://localhost:4321/ru/about**
   - ✅ Should show single NavIsland with About tab active
   - ✅ Should have Russian locale switcher
   - ✅ Should have stable header height

3. **http://localhost:4321/en/bookme**
   - ✅ Should show single NavIsland with Book Me tab active
   - ✅ Should have English locale switcher
   - ✅ Should have stable header height

4. **http://localhost:4321/ru/bookme**
   - ✅ Should show single NavIsland with Book Me tab active
   - ✅ Should have Russian locale switcher
   - ✅ Should have stable header height

5. **http://localhost:4321/en/blog**
   - ✅ Should show single NavIsland with Blog tab active
   - ✅ Should have English locale switcher
   - ✅ Should have stable header height

6. **http://localhost:4321/ru/blog**
   - ✅ Should show single NavIsland with Blog tab active
   - ✅ Should have Russian locale switcher
   - ✅ Should have stable header height

### Locale Switching Tests
7. **http://localhost:4321/en/blog/some-slug**
   - ✅ Should fallback to /ru/blog when switching to Russian
   - ✅ Should preserve /en/blog when switching to English

8. **http://localhost:4321/en** (bare locale)
   - ✅ Should redirect to /en/about
   - ✅ Should show single NavIsland

9. **http://localhost:4321/ru** (bare locale)
   - ✅ Should redirect to /ru/about
   - ✅ Should show single NavIsland

### Edge Cases
10. **http://localhost:4321/** (root)
    - ✅ Should redirect to /en/about (default locale)

## Verification Checklist

### Navigation Structure
- [ ] Only one NavIsland renders on every page
- [ ] No duplicate navigation elements
- [ ] Brand link works correctly
- [ ] Active tab highlighting works
- [ ] All navigation links are functional

### Locale Switching
- [ ] switchLocaleHref works for all page types
- [ ] Language switcher preserves current page when possible
- [ ] Blog posts fallback to blog index
- [ ] Root paths redirect to about page
- [ ] No 404s on locale switching

### Header Height Stability
- [ ] No scroll "slide-down" effect
- [ ] Header height is stable on page load
- [ ] No infinite recalculation loops
- [ ] --navbar-h CSS variable updates correctly

### Accessibility
- [ ] Proper ARIA roles on navigation
- [ ] aria-current="page" on active tabs
- [ ] aria-label on locale switcher
- [ ] Keyboard navigation works
- [ ] Focus states are visible

### Responsive Design
- [ ] Navigation works on mobile
- [ ] Navigation works on tablet
- [ ] Navigation works on desktop
- [ ] No layout shifts on resize

### Performance
- [ ] No unnecessary re-renders
- [ ] rAF throttling prevents excessive updates
- [ ] ResizeObserver is properly managed
- [ ] No memory leaks

## Expected Behavior

### switchLocaleHref Function
- `/en/about` ↔ `/ru/about`
- `/en/bookme` ↔ `/ru/bookme`
- `/en/blog` ↔ `/ru/blog`
- `/en/blog/{slug}` → `/ru/blog` (fallback)
- `/en` → `/ru/about`
- `/ru` → `/en/about`

### Header Height
- Initial measurement: ~72px (or actual header height)
- Updates only when header height changes
- No continuous recalculation
- Stable during scroll and resize

### Navigation Rendering
- Single NavIsland in AppShell header
- No static nav in Navbar component
- Brand link in Navbar component only
- All navigation tabs in NavIsland component
