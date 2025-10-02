# Navigation Unification - Rollback Plan

## Quick Rollback (≤10 lines)

If issues arise, restore the old static nav and revert the height script:

1. **Restore Navbar.astro**: Copy the old static nav code back from git history
2. **Revert AppShell.astro**: Replace rAF script with simple ResizeObserver
3. **Revert switch.ts**: Restore the complex switchLocaleHref function
4. **Test**: Verify duplicate navs render and height loop returns

## Detailed Rollback Steps

### 1. Restore Static Navigation
```bash
git checkout HEAD~1 -- apps/website/src/app/widgets/navbar/ui/Navbar.astro
```

### 2. Revert Height Script
```bash
git checkout HEAD~1 -- apps/website/src/app/layouts/AppShell.astro
```

### 3. Restore Complex Locale Switching
```bash
git checkout HEAD~1 -- apps/website/src/app/shared/i18n/switch.ts
```

### 4. Verify Rollback
- Check that duplicate navigation appears
- Verify scroll "slide-down" effect returns
- Confirm complex locale switching logic restored

## Rollback Triggers

Rollback if:
- Navigation doesn't render on any page
- Locale switching breaks completely
- Header height causes layout issues
- Performance degrades significantly
- Accessibility is compromised

## Alternative: Partial Rollback

If only specific issues occur:

1. **Height loop returns**: Revert only AppShell.astro script
2. **Locale switching breaks**: Revert only switch.ts
3. **Navigation missing**: Revert only Navbar.astro

## Post-Rollback Actions

1. Document the specific issue encountered
2. Identify root cause of the problem
3. Plan targeted fix for the issue
4. Test fix in isolation before re-applying changes
