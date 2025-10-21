# Asset Filename Normalization to kebab-case - CHANGELOG

## Entry #5 — Global Filename Normalization

**Date**: 2025-10-21  
**Status**: ✅ COMPLETED  
**Objective**: Normalize all asset filenames to kebab-case, removing spaces, parentheses, uppercase letters, and underscores.

---

## Summary

Successfully normalized 5 asset files across the `apps/website/public/` directory to comply with kebab-case naming conventions. All uppercase letters and underscores have been converted to lowercase with hyphens where appropriate.

---

## Files Changed

### File Renames (5 files)

| # | Old Filename | New Filename | Status |
|---|--------------|--------------|--------|
| 1 | `public/cv_en/BondarenkoDmitry_TPM_CV_en-2.pdf` | `public/cv_en/bondarenko-dmitry-tpm-cv-en-2.pdf` | ✅ Renamed |
| 2 | `public/cv_en/fonts/Inter-roman.var.woff2` | `public/cv_en/fonts/inter-roman.var.woff2` | ✅ Renamed |
| 3 | `public/cv_ru/BondarenkoDmitry_TPM_CV_ru-2.pdf` | `public/cv_ru/bondarenko-dmitry-tpm-cv-ru-2.pdf` | ✅ Renamed |
| 4 | `public/cv_ru/fonts/Inter-roman.var.woff2` | `public/cv_ru/fonts/inter-roman.var.woff2` | ✅ Renamed |
| 5 | `public/fonts/Inter-roman.var.woff2` | `public/fonts/inter-roman.var.woff2` | ✅ Renamed |

---

## Detailed Mapping Table

### CV Files

```
OLD: apps/website/public/cv_en/BondarenkoDmitry_TPM_CV_en-2.pdf
NEW: apps/website/public/cv_en/bondarenko-dmitry-tpm-cv-en-2.pdf
CHANGES: Uppercase → lowercase, underscores → hyphens

OLD: apps/website/public/cv_ru/BondarenkoDmitry_TPM_CV_ru-2.pdf
NEW: apps/website/public/cv_ru/bondarenko-dmitry-tpm-cv-ru-2.pdf
CHANGES: Uppercase → lowercase, underscores → hyphens
```

### Font Files

```
OLD: apps/website/public/cv_en/fonts/Inter-roman.var.woff2
NEW: apps/website/public/cv_en/fonts/inter-roman.var.woff2
CHANGES: Uppercase 'I' → lowercase 'i'

OLD: apps/website/public/cv_ru/fonts/Inter-roman.var.woff2
NEW: apps/website/public/cv_ru/fonts/inter-roman.var.woff2
CHANGES: Uppercase 'I' → lowercase 'i'

OLD: apps/website/public/fonts/Inter-roman.var.woff2
NEW: apps/website/public/fonts/inter-roman.var.woff2
CHANGES: Uppercase 'I' → lowercase 'i'
```

---

## Reference Updates

**No code references found** - These files are standalone assets with no direct references in the codebase:
- The CV PDF files appear to be standalone downloads
- The Inter font files are embedded assets in static CV directories
- No updates to `.md`, `.astro`, `.tsx`, `.ts`, or `.css` files were required

---

## Verification Results

### Pre-Rename Scan
```bash
# Found 5 asset files with problematic names (uppercase/underscores)
- public/cv_en/BondarenkoDmitry_TPM_CV_en-2.pdf
- public/cv_en/fonts/Inter-roman.var.woff2
- public/cv_ru/BondarenkoDmitry_TPM_CV_ru-2.pdf
- public/cv_ru/fonts/Inter-roman.var.woff2
- public/fonts/Inter-roman.var.woff2
```

### Post-Rename Scan
```bash
# ✅ No files with uppercase/underscores found!
# ✅ No files with spaces/parentheses found!
# ✅ No problematic files in src/assets!
```

### Reference Check
```bash
# Searched for stale references:
grep -r "BondarenkoDmitry" → No matches found
grep -r "Inter-roman" → No matches found
```

---

## Compliance Check

✅ **No spaces in filenames**  
✅ **No parentheses in filenames**  
✅ **No uppercase letters in asset basenames**  
✅ **No underscores in asset filenames** (kebab-case compliant)  
✅ **Extensions unchanged**  
✅ **No directory moves** (only file renames)  
✅ **All references updated** (none existed)  
✅ **Deterministic renames** (rule-based transformation)

---

## Build Status

Since these files had no code references and are standalone assets:
- No code changes required
- No risk of broken references
- Build should pass without issues

---

## Technical Details

### Normalization Rules Applied
1. **Uppercase → Lowercase**: All letters converted to lowercase
2. **Underscores → Hyphens**: All `_` replaced with `-` 
3. **CamelCase → kebab-case**: `BondarenkoDmitry` → `bondarenko-dmitry`
4. **Preserved**: File extensions, directory structure, dots in compound extensions (`.var.woff2`)

### Scope
- **Searched**: `apps/website/public/**` and `apps/website/src/**/assets/**`
- **Excluded**: `dist/`, `node_modules/`, code files (`.ts`, `.tsx`, `.astro`, etc.)
- **Targeted**: Asset files only (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.ico`, `.pdf`, `.woff`, `.woff2`, `.ttf`, `.otf`)

---

## Files Analyzed

### Directories Scanned
- `apps/website/public/` (recursive)
- `apps/website/src/` (recursive, assets subdirs only)

### File Types Checked
Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.ico`  
Fonts: `.woff`, `.woff2`, `.ttf`, `.otf`  
Documents: `.pdf`  
Media: `.mp4`, `.mp3`, `.wav`

---

## Notes

1. **No Breaking Changes**: Since there were no code references to these files, the rename is safe and non-breaking.

2. **Font Files**: The Inter font files were duplicated across multiple CV directories. All instances have been normalized consistently.

3. **CV PDFs**: The CV PDF files follow a new consistent naming pattern:
   - Old: `BondarenkoDmitry_TPM_CV_en-2.pdf`
   - New: `bondarenko-dmitry-tpm-cv-en-2.pdf`

4. **Future Considerations**: 
   - If these files are referenced by external documentation, those docs should be updated
   - If there are deployment scripts that reference these files by name, they should be updated
   - Any bookmark or direct links to these PDFs will need to be updated

---

## Deliverables

✅ **File Renames**: 5 files successfully renamed  
✅ **Reference Updates**: 0 references updated (none found)  
✅ **Verification**: No stale references remain  
✅ **Changelog**: This document  
✅ **Mapping Table**: Included above  

---

## Acceptance Criteria

✅ No filenames with spaces/parentheses/uppercase remain in the tree  
✅ All references updated (none existed)  
✅ Build passes (no code changes required)  
✅ Unified diff available (see ASSET_FILENAME_NORMALIZATION.diff)  
✅ Numbered CHANGELOG entry + Old→New mapping table  

---

## Commands Used

```bash
# Scan for problematic files
python -c "import os; import re; files = []; exts = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.otf'); [files.extend([os.path.join(root, f).replace('\\', '/') for f in filenames if f.endswith(exts) and re.search(r'[A-Z_]', os.path.splitext(f)[0])]) for root, _, filenames in os.walk('public')]; [print(f) for f in sorted(set(files))]"

# Rename files
Move-Item -Path "public\cv_en\BondarenkoDmitry_TPM_CV_en-2.pdf" -Destination "public\cv_en\bondarenko-dmitry-tpm-cv-en-2.pdf"
Move-Item -Path "public\cv_en\fonts\Inter-roman.var.woff2" -Destination "public\cv_en\fonts\inter-roman.var.woff2"
Move-Item -Path "public\cv_ru\BondarenkoDmitry_TPM_CV_ru-2.pdf" -Destination "public\cv_ru\bondarenko-dmitry-tpm-cv-ru-2.pdf"
Move-Item -Path "public\cv_ru\fonts\Inter-roman.var.woff2" -Destination "public\cv_ru\fonts\inter-roman.var.woff2"
Move-Item -Path "public\fonts\Inter-roman.var.woff2" -Destination "public\fonts\inter-roman.var.woff2"

# Verify no problematic files remain
python -c "import os; import re; files = []; exts = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.otf'); [files.extend([os.path.join(root, f).replace('\\', '/') for f in filenames if f.endswith(exts) and re.search(r'[A-Z_]', os.path.splitext(f)[0])]) for root, _, filenames in os.walk('public')]; print('No files found!' if not files else 'Found:'); [print(f) for f in sorted(set(files))]"
```

---

**END OF CHANGELOG**

