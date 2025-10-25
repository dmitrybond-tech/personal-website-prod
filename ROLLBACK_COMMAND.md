# Rollback Command

To rollback all changes made during the build stabilization:

```bash
git reset --hard HEAD~1
```

Or if you want to see what changes were made first:

```bash
git log --oneline -10
git show <commit-hash>
```

## Files Modified
- `apps/website/astro.config.ts`
- `package.json`
- `apps/website/src/pages/en/blog/[slug].astro`
- `apps/website/src/pages/ru/blog/[slug].astro`
- `apps/website/src/pages/[lang]/about.astro`
- `apps/website/src/pages/[lang]/bookme.astro`
- `apps/website/src/app/content/lib/content.ts`
- `apps/website/src/pages/en/legal/[slug].astro`
- `apps/website/src/pages/ru/legal/[slug].astro`
- `apps/website/src/pages/en/legal.astro`
- `apps/website/src/pages/ru/legal.astro`

## Files Deleted
- All files in `apps/website/src/pages/api/`
- All files in `apps/website/src/pages/website-admin/api/`
- `apps/website/src/pages/website-admin/config.yml.ts`
