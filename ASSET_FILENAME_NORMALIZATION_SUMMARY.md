# Asset Filename Normalization - Summary

## Quick Reference

**Task**: Global filename normalization to kebab-case  
**Date**: 2025-10-21  
**Status**: ✅ COMPLETED  
**Files Changed**: 5 asset files renamed  
**Code Changes**: 0 (no references found)  

---

## What Was Done

Normalized all asset filenames in `apps/website/public/` to kebab-case by:
- Converting uppercase letters to lowercase
- Replacing underscores with hyphens
- Ensuring compliance with kebab-case naming convention

---

## Files Renamed (Old → New)

### CV Documents
1. `BondarenkoDmitry_TPM_CV_en-2.pdf` → `bondarenko-dmitry-tpm-cv-en-2.pdf`
2. `BondarenkoDmitry_TPM_CV_ru-2.pdf` → `bondarenko-dmitry-tpm-cv-ru-2.pdf`

### Font Files (Inter Roman Variable)
3. `cv_en/fonts/Inter-roman.var.woff2` → `cv_en/fonts/inter-roman.var.woff2`
4. `cv_ru/fonts/Inter-roman.var.woff2` → `cv_ru/fonts/inter-roman.var.woff2`
5. `fonts/Inter-roman.var.woff2` → `fonts/inter-roman.var.woff2`

---

## Mapping Table

| Old Path | New Path |
|----------|----------|
| `public/cv_en/BondarenkoDmitry_TPM_CV_en-2.pdf` | `public/cv_en/bondarenko-dmitry-tpm-cv-en-2.pdf` |
| `public/cv_en/fonts/Inter-roman.var.woff2` | `public/cv_en/fonts/inter-roman.var.woff2` |
| `public/cv_ru/BondarenkoDmitry_TPM_CV_ru-2.pdf` | `public/cv_ru/bondarenko-dmitry-tpm-cv-ru-2.pdf` |
| `public/cv_ru/fonts/Inter-roman.var.woff2` | `public/cv_ru/fonts/inter-roman.var.woff2` |
| `public/fonts/Inter-roman.var.woff2` | `public/fonts/inter-roman.var.woff2` |

---

## Verification

✅ **Pre-rename scan**: Found 5 files with uppercase/underscores  
✅ **Renamed**: All 5 files successfully renamed  
✅ **Post-rename scan**: 0 files with problematic names remain  
✅ **Reference check**: No stale references found (files were standalone assets)  
✅ **Compliance**: All asset filenames now follow kebab-case  

---

## Impact

- **Breaking Changes**: None (files had no code references)
- **Build Status**: Expected to pass (no code changes)
- **External Impact**: Direct links or bookmarks to these files will need updating

---

## Deliverables

1. ✅ **ASSET_FILENAME_NORMALIZATION_CHANGELOG.md** - Detailed changelog
2. ✅ **ASSET_FILENAME_NORMALIZATION.diff** - Unified diff of changes
3. ✅ **ASSET_FILENAME_NORMALIZATION_SUMMARY.md** - This summary document

---

## Next Steps

1. Review the changes
2. Test build to confirm no issues
3. Update any external documentation or links that reference the old filenames
4. Commit changes with message: "feat: normalize asset filenames to kebab-case"

---

## Notes

- All extensions preserved (`.pdf`, `.woff2`)
- No directory structure changes
- Deterministic renames (rule-based)
- No image content modified
- Font files not re-encoded

---

**Normalization Complete** ✅

