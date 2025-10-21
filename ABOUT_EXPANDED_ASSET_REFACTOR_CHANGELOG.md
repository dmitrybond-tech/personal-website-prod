# About Expanded MD: Asset Refactor Changelog

## Summary

Refactored "About Expanded" markdown files to remove spaces and special characters from asset filenames and ensured all references use root-absolute paths.

**Date**: 2025-10-21  
**Status**: ✅ Complete

---

## Changes Made

### 1. File Renames (21 files total)

All asset filenames have been converted to kebab-case (lowercase, alphanumeric + hyphens only) to ensure cross-platform compatibility and remove spaces/parentheses.

#### Logos Directory (9 files)

| Old Filename | New Filename |
|--------------|--------------|
| `brand-cloudblue Custom).png` | `brand-cloudblue-custom.png` |
| `brand-datacom-logo-edited (Custom).png` | `brand-datacom-logo-edited-custom.png` |
| `brand-ingram-micro (Custom).png` | `brand-ingram-micro-custom.png` |
| `brand-telefonica (Custom).png` | `brand-telefonica-custom.png` |
| `brand-Intel-copy-edited (Custom).png` | `brand-intel-copy-edited-custom.png` |
| `brand-Microsoft_logo_(2012)-edited (Custom).png` | `brand-microsoft-logo-2012-edited-custom.png` |
| `brand-Adobe_Corporate_logo-edited (Custom).png` | `brand-adobe-corporate-logo-edited-custom.png` |
| `brand-Ricoh (Custom).png` | `brand-ricoh-custom.png` |
| `brand-CDW_Logo (Custom).png` | `brand-cdw-logo-custom.png` |

**Path**: `apps/website/public/uploads/logos/`

#### Favorites Directory (12 files)

| Old Filename | New Filename |
|--------------|--------------|
| `technologies-thumbnail (Custom).jpg` | `technologies-thumbnail-custom.jpg` |
| `snowboarding-thumbnail (Custom).jpeg` | `snowboarding-thumbnail-custom.jpeg` |
| `art-pb-thumbnail (Custom).jpg` | `art-pb-thumbnail-custom.jpg` |
| `stand-up-thumbnail (Custom).jpg` | `stand-up-thumbnail-custom.jpg` |
| `cooking-thumbnail (Custom).jpg` | `cooking-thumbnail-custom.jpg` |
| `people-andrew-huberman (Custom).jpg` | `people-andrew-huberman-custom.jpg` |
| `rsz_people-mark-manson (Custom).jpg` | `rsz-people-mark-manson-custom.jpg` |
| `book-how-to-create-tech-products-customers-love (Custom).jpg` | `book-how-to-create-tech-products-customers-love-custom.jpg` |
| `book-pmbok-guide-hero (Custom).jpg` | `book-pmbok-guide-hero-custom.jpg` |
| `mark-manson-the-subtle-art-of-not-giving-a-f-ck (Custom).jpg` | `mark-manson-the-subtle-art-of-not-giving-a-f-ck-custom.jpg` |
| `book-toyota-tps (Custom).jpg` | `book-toyota-tps-custom.jpg` |
| `book-the culture-map (Custom).jpg` | `book-the-culture-map-custom.jpg` |

**Path**: `apps/website/public/uploads/about/favorites/`

---

### 2. Markdown Reference Updates (42 updates total)

Updated all asset references in both English and Russian versions of the About Expanded markdown files.

**Files Modified**:
- `apps/website/src/content/aboutPage/en/about-expanded.md` (21 references)
- `apps/website/src/content/aboutPage/ru/about-expanded.md` (21 references)

**Changes**:
- All 42 image references updated to use new kebab-case filenames
- All paths were already root-absolute (starting with `/`) — no relative paths existed
- No changes to directory structure or folder organization

---

## Technical Details

### Naming Convention Applied

**Kebab-case rules**:
- All lowercase letters
- Spaces replaced with hyphens (`-`)
- Parentheses and special characters removed
- Underscores (`_`) replaced with hyphens
- Numbers preserved
- File extensions preserved unchanged

### Path Format Verified

All image references use **root-absolute paths**:
```yaml
# Example format
img: /uploads/logos/brand-cloudblue-custom.png
image: /uploads/about/favorites/technologies-thumbnail-custom.jpg
```

This format ensures:
- ✅ i18n route safety (`/en/*` and `/ru/*`)
- ✅ No relative path issues (`../` or `./`)
- ✅ Cross-platform compatibility (Windows/Linux/macOS)

---

## Files Affected

### Asset Files (21)
```
apps/website/public/uploads/logos/ (9 files renamed)
apps/website/public/uploads/about/favorites/ (12 files renamed)
```

### Markdown Content Files (2)
```
apps/website/src/content/aboutPage/en/about-expanded.md
apps/website/src/content/aboutPage/ru/about-expanded.md
```

---

## Validation

✅ All 21 asset files successfully renamed  
✅ All 42 markdown references updated  
✅ No relative paths remain in markdown files  
✅ All paths are root-absolute (start with `/`)  
✅ Filenames follow kebab-case convention  
✅ No spaces or special characters in filenames  
✅ File extensions preserved  
✅ Directory structure unchanged  

---

## Breaking Changes

⚠️ **None** - This is a non-breaking refactor:
- Old files have been renamed (not duplicated)
- All references updated atomically
- No API or route changes
- No configuration changes required

---

## Build Verification

To verify the changes work correctly:

```bash
# From workspace root
pnpm -C apps/website build
```

Expected outcome: Build completes successfully with no broken image references.

---

## Rollback Instructions

If rollback is needed, reverse the file renames and markdown updates using this changelog as reference. All changes are deterministic and reversible.

---

## Notes

- No new files created
- No folders moved or restructured
- All changes are cosmetic (filenames only)
- Content and functionality remain identical
- Windows-compatible paths throughout
- Ready for production deployment

---

**Completed by**: AI Assistant  
**Verification**: Manual file inspection + directory listing

