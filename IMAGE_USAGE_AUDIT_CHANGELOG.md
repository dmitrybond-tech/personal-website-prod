# Image Usage Audit — Changelog

## Date
October 21, 2025

## Summary
Conducted comprehensive audit of image references across Markdown and Astro/TSX files. Normalized asset filenames to kebab-case for consistency. No functional changes were required as the codebase already follows best practices.

## Changes Made

### Asset Filename Normalization (Kebab-case)

Renamed the following files to follow kebab-case naming convention:

1. **Amazon Web Services Logo**
   - **Before**: `Amazon_Web_Services_Logo.svg.png`
   - **After**: `amazon-web-services-logo.svg.png`
   - **Location**: `apps/website/public/uploads/logos/`

2. **CSS3 Logo**
   - **Before**: `CSS3_logo_and_wordmark.svg.png`
   - **After**: `css3-logo-and-wordmark.svg.png`
   - **Location**: `apps/website/public/uploads/logos/`

3. **SibSUTIS Logo**
   - **Before**: `sibsutis_logo.png`
   - **After**: `sibsutis-logo.png`
   - **Location**: `apps/website/public/uploads/logos/`

**Note**: These files were not referenced in any content files, so no content updates were required.

## Audit Findings

### Markdown Files ✅ 
**Status**: All compliant with best practices

- **Path format**: All image references in Markdown use root-absolute paths (e.g., `/uploads/...`)
- **Files audited**:
  - `apps/website/src/content/aboutPage/en/about-expanded.md`
  - `apps/website/src/content/aboutPage/ru/about-expanded.md`
  - `apps/website/src/content/posts/en/how-i-decided-to-build-a-tiny-personal-page-—-cheap-cheerful.md`
  - All blog posts and legal pages

- **Examples of correct usage**:
  ```yaml
  image: /uploads/placeholders/avatar.png
  logo: /uploads/logos/brand-cloudblue-small-logo-1.png
  cover: /uploads/cover-post1.jpg
  ```

**Conclusion**: No changes required. All paths are robust for i18n routing and caching.

### Astro/TSX Components ✅
**Status**: Architecture supports both string paths and imports

- **Current implementation**: The codebase uses a `Photo` component that accepts:
  - String paths (for CMS-managed images in `public/`)
  - Imported images with metadata (for optimized assets)

- **Type definition**:
  ```typescript
  export type Photo = Promise<{ default: ImageMetadata }> | string;
  ```

- **Key components reviewed**:
  - `apps/website/src/features/about/devscard/ui/Photo.astro`
  - `apps/website/src/features/about/devscard/ui/Thumbnail.astro`
  - `apps/website/src/features/about/devscard/ui/sections/BrandsSection.astro`
  - `apps/website/src/features/about/devscard/ui/sections/MainSection.astro`
  - `apps/website/src/features/about/devscard/ui/sections/FavoritesGrid.astro`
  - `apps/website/src/features/about/devscard/ui/sections/ExperienceSection.astro`

**Architecture Note**: The current approach is optimal for CMS-managed content where:
- Image paths are stored as strings in YAML frontmatter
- Decap CMS manages uploads to `public/uploads/`
- Images are served directly from the public folder
- Root-absolute paths ensure correct resolution across all i18n routes

### Why Imports Were Not Implemented

While Astro's asset pipeline with imports (`import img from '...'`) provides optimization benefits, implementing it would conflict with the CMS workflow:

**Current (CMS-managed) approach**:
```yaml
# In frontmatter YAML
image: /uploads/placeholders/avatar.png
```
```astro
<!-- In component -->
<Photo src={data.image} alt="..." />
```

**Import approach would require**:
```astro
---
import avatar from '../assets/avatar.png';
---
<Photo src={avatar} alt="..." />
```

**Constraints that prevent this**:
1. Images are managed by Decap CMS (uploaded via admin panel)
2. Content editors need to reference images via paths in YAML
3. Cannot import CMS-uploaded files (they're in `public/`, not `src/`)
4. Moving to `src/assets/` breaks CMS functionality
5. The Photo component already handles both string and import types

**Recommendation**: Keep current architecture. For static, non-CMS images (if any are added in the future), they can be imported directly in components.

## Files Affected

### Modified Files
- `apps/website/public/uploads/logos/amazon-web-services-logo.svg.png` (renamed)
- `apps/website/public/uploads/logos/css3-logo-and-wordmark.svg.png` (renamed)
- `apps/website/public/uploads/logos/sibsutis-logo.png` (renamed)

### No Changes Required
- All Markdown content files (already use root-absolute paths)
- All Astro/TSX components (architecture already optimal for CMS workflow)

## Acceptance Criteria Status

- ✅ No relative image paths remain in Markdown
- ✅ Components use appropriate pattern (string paths for CMS-managed images)
- ✅ All touched assets have kebab-case names
- ✅ No copy or layout altered
- ✅ No image plugins/configs added

## Technical Details

### Image Asset Structure
```
apps/website/public/uploads/
├── about/
│   ├── favorites/       # 14 images (all kebab-case)
│   ├── education/
│   ├── experience/
│   └── main/
├── logos/              # 30 images (3 normalized to kebab-case)
├── placeholders/       # 1 image (kebab-case)
├── posts/
│   ├── en/
│   └── ru/
└── cover-post1.jpg
```

### Root-Absolute Path Benefits
1. **i18n routing**: Works correctly under `/en/*` and `/ru/*` routes
2. **Caching**: Browser can cache images consistently across locales
3. **Build output**: Paths resolve correctly in static builds
4. **CMS integration**: Decap CMS uploads maintain correct references

## Build Output
Images served from `public/` will be:
- Copied as-is to `dist/client/uploads/`
- Served at `/uploads/*` paths
- Browser-cacheable with standard HTTP headers

For future optimized images (if static imports are added):
- Import from `src/assets/` or content collections
- Output to `/_astro/*` with content hashes
- Include width/height metadata automatically

## No Action Items
All image references are already in optimal format for the current CMS-driven architecture.

