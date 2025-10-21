# Astro Config Site Fix - Changelog

## Changes

- **Set site; ensure default base/assetsPrefix.**
  - Changed `site` from `process.env.PUBLIC_SITE_URL || 'http://localhost:4321'` to `'https://dmitrybond.tech'`
  - Confirmed `base` and `assetsPrefix` are not set (using Astro defaults)
  - No modifications to adapters or integrations
  - Assets will emit under `/_astro/*` using standard Astro pipeline
  - Canonical URLs will now correctly use `https://dmitrybond.tech`

## Files Modified

- `apps/website/astro.config.ts`

## Type Check

✅ No linter errors found

## Acceptance Criteria Met

✅ `site` is present and exactly `'https://dmitrybond.tech'`
✅ There is no `base` and no `assetsPrefix`
✅ Builds will emit assets under `/_astro/*`

