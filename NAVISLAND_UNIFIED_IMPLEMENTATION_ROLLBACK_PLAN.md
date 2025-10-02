# NavIsland Unified Implementation - Rollback Plan

## Quick Rollback (≤10 lines)

If issues arise with the unified NavIsland implementation, follow these steps to rollback to the previous version:

### 1. Restore AppShell.astro
```bash
# Backup current version first
cp apps/website/src/app/layouts/AppShell.astro apps/website/src/app/layouts/AppShell.astro.backup

# Restore previous docking behavior
git checkout HEAD~1 -- apps/website/src/app/layouts/AppShell.astro
```

### 2. Restore NavIsland.astro  
```bash
# Restore previous styling
git checkout HEAD~1 -- apps/website/src/app/widgets/navisland/NavIsland.astro
```

### 3. Verify Rollback
```bash
# Test that docking behavior is restored
npm run dev
# Navigate to any page and verify NavIsland moves from center to top on scroll
```

## Detailed Rollback Steps

### Step 1: Identify the Issue
- Check browser console for JavaScript errors
- Verify NavIsland positioning and clickability
- Test on different screen sizes and browsers

### Step 2: Quick Fix Attempts
1. **Clear browser cache** - Hard refresh (Ctrl+F5) to ensure new CSS is loaded
2. **Check CSS variables** - Verify `--nav-gap` and other variables are properly set
3. **Inspect element** - Use browser dev tools to check if styles are applied correctly

### Step 3: Full Rollback (if needed)
1. **Backup current state**:
   ```bash
   cp apps/website/src/app/layouts/AppShell.astro apps/website/src/app/layouts/AppShell.astro.unified
   cp apps/website/src/app/widgets/navisland/NavIsland.astro apps/website/src/app/widgets/navisland/NavIsland.astro.unified
   ```

2. **Restore previous versions**:
   ```bash
   git checkout HEAD~1 -- apps/website/src/app/layouts/AppShell.astro
   git checkout HEAD~1 -- apps/website/src/app/widgets/navisland/NavIsland.astro
   ```

3. **Verify restoration**:
   ```bash
   npm run dev
   # Test that previous docking behavior is restored
   ```

### Step 4: Partial Rollback (if only specific issues)
If only certain aspects need to be reverted:

1. **Restore docking behavior only**:
   - Add back `--nav-dock-offset` CSS variable
   - Restore `transform: translateY()` in `.nav-float-wrap`
   - Add back scroll listener for docking

2. **Restore previous styling only**:
   - Revert shadow from `0 8px 24px` to `0 6px 20px`
   - Restore previous tab opacity and transitions
   - Revert active state colors

## Rollback Verification Checklist

After rollback, verify these items:

- [ ] NavIsland starts in center of viewport
- [ ] NavIsland moves to top when scrolling down
- [ ] NavIsland returns to center when scrolling to top
- [ ] All navigation tabs are clickable
- [ ] Locale switcher works correctly
- [ ] Active tab highlighting works
- [ ] Responsive behavior is correct
- [ ] No JavaScript errors in console
- [ ] All pages load correctly

## Emergency Contacts

If rollback doesn't resolve issues:
1. Check git history for the exact commit hash of the previous working version
2. Use `git revert` to create a proper revert commit
3. Test thoroughly before deploying

## Prevention for Future

To prevent similar issues:
1. Always test changes in development environment first
2. Use feature flags for major UI changes
3. Keep rollback plan updated with each major change
4. Document any breaking changes clearly
