# PR: Refactor About Expanded Asset Filenames to Kebab-Case

## Summary

Refactored all asset filenames referenced in About Expanded pages to use kebab-case convention, removing spaces, parentheses, and uppercase letters. Updated all markdown references to match the new filenames.

## Motivation

- **Cross-platform compatibility**: Spaces and special characters in filenames can cause issues on different operating systems
- **URL safety**: Kebab-case ensures filenames are web-safe and don't require encoding
- **Consistency**: Aligns with modern web development best practices
- **i18n safety**: All paths are root-absolute (`/uploads/...`) to work correctly with i18n routes (`/en/*` and `/ru/*`)

## Changes

### Asset File Renames (21 files)

**Logos (9 files):**
- `brand-cloudblue Custom).png` → `brand-cloudblue-custom.png`
- `brand-datacom-logo-edited (Custom).png` → `brand-datacom-logo-edited-custom.png`
- `brand-ingram-micro (Custom).png` → `brand-ingram-micro-custom.png`
- `brand-telefonica (Custom).png` → `brand-telefonica-custom.png`
- `brand-Intel-copy-edited (Custom).png` → `brand-intel-copy-edited-custom.png`
- `brand-Microsoft_logo_(2012)-edited (Custom).png` → `brand-microsoft-logo-2012-edited-custom.png`
- `brand-Adobe_Corporate_logo-edited (Custom).png` → `brand-adobe-corporate-logo-edited-custom.png`
- `brand-Ricoh (Custom).png` → `brand-ricoh-custom.png`
- `brand-CDW_Logo (Custom).png` → `brand-cdw-logo-custom.png`

**Favorites (12 files):**
- `technologies-thumbnail (Custom).jpg` → `technologies-thumbnail-custom.jpg`
- `snowboarding-thumbnail (Custom).jpeg` → `snowboarding-thumbnail-custom.jpeg`
- `art-pb-thumbnail (Custom).jpg` → `art-pb-thumbnail-custom.jpg`
- `stand-up-thumbnail (Custom).jpg` → `stand-up-thumbnail-custom.jpg`
- `cooking-thumbnail (Custom).jpg` → `cooking-thumbnail-custom.jpg`
- `people-andrew-huberman (Custom).jpg` → `people-andrew-huberman-custom.jpg`
- `rsz_people-mark-manson (Custom).jpg` → `rsz-people-mark-manson-custom.jpg`
- `book-how-to-create-tech-products-customers-love (Custom).jpg` → `book-how-to-create-tech-products-customers-love-custom.jpg`
- `book-pmbok-guide-hero (Custom).jpg` → `book-pmbok-guide-hero-custom.jpg`
- `mark-manson-the-subtle-art-of-not-giving-a-f-ck (Custom).jpg` → `mark-manson-the-subtle-art-of-not-giving-a-f-ck-custom.jpg`
- `book-toyota-tps (Custom).jpg` → `book-toyota-tps-custom.jpg`
- `book-the culture-map (Custom).jpg` → `book-the-culture-map-custom.jpg`

### Markdown Content Updates (2 files)

- `apps/website/src/content/aboutPage/en/about-expanded.md` - 21 references updated
- `apps/website/src/content/aboutPage/ru/about-expanded.md` - 21 references updated

All image paths remain root-absolute (e.g., `/uploads/logos/...`) for i18n safety.

## Testing

- ✅ All files successfully renamed
- ✅ All markdown references updated
- ✅ Git recognizes changes as renames (not delete+add)
- ✅ No relative paths remain in markdown files
- ✅ All paths verified as root-absolute

**Build verification:**
```bash
pnpm -C apps/website build
```

## Breaking Changes

❌ **None** - This is a non-breaking change:
- Old files renamed (not duplicated)
- All references updated atomically
- No API changes
- No configuration changes

## Files Changed

- 21 asset files renamed (logos + favorites)
- 2 markdown files updated (en + ru)
- 1 changelog added
- 1 diff file added

**Total**: 25 files changed, 213 insertions(+), 44 deletions(-)

## Checklist

- [x] All asset filenames follow kebab-case convention
- [x] No spaces or special characters in filenames
- [x] All uppercase letters converted to lowercase
- [x] All markdown references updated
- [x] All paths are root-absolute
- [x] No relative paths remain
- [x] Git recognizes renames correctly
- [x] Changelog created with mapping table
- [x] Diff file generated
- [x] Ready for review

## Related Documentation

- `ABOUT_EXPANDED_ASSET_REFACTOR_CHANGELOG.md` - Complete changelog with mapping table
- `ABOUT_EXPANDED_ASSET_REFACTOR.diff` - Unified diff of markdown changes

---

**Ready for merge** ✅

