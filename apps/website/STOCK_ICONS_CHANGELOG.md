# Stock Icon Autofill for Skills - Changelog

## Overview
Implemented automatic stock icon resolution for skills with CDN fallback, prioritizing colorful brand icons from Iconify collections.

## Changes Made

### 1. Icon Resolution Script
- **Added**: `scripts/icons/resolve-stock-skill-icons.mjs`
  - Scans markdown frontmatter for skills
  - Maps skill names to appropriate Iconify icons
  - Priority: `logos:*` → `simple-icons:*` → `devicon:*` → `skill-icons:*` → `mdi:*` fallback
  - Excludes language flags from processing

### 2. Icon Resolver Utility
- **Added**: `src/shared/iconify/resolveIcon.ts`
  - Runtime utility for resolving skill icons
  - Uses generated mapping with fallback to generic icons
  - Normalizes skill names for consistent matching

### 3. Component Updates
- **Updated**: `LevelledSkill.astro` - Now uses icon resolver
- **Updated**: `Tag.astro` - Now uses icon resolver
- **Added**: `MarkdownSkillsSection.astro` - Renders skills from markdown content

### 4. CDN Optimization
- **Added**: Preconnect to `https://api.iconify.design` in `BaseLayout.astro`
- **Added**: Iconify web component script (v2.1.0) for faster loading

### 5. Build Integration
- **Added**: `npm run icons:resolve:stock` script
- **Generated**: `src/shared/iconify/skill-icons.resolved.json` mapping

### 6. Test Infrastructure
- **Added**: `test-icons.astro` page for testing icon resolution
- **Added**: `getMarkdownData.ts` utility for loading markdown skills

## Icon Mapping Examples
```json
{
  "python": "simple-icons:python",
  "react": "logos:react", 
  "aws": "logos:aws",
  "discovery": "simple-icons:discovery",
  "analytics": "simple-icons:googleanalytics"
}
```

## Usage
1. Run `npm run icons:resolve:stock` to generate icon mapping
2. Skills automatically resolve to appropriate stock icons
3. Language flags remain unchanged (excluded from processing)
4. CDN fallback ensures icons load even if mapping is incomplete

## Benefits
- ✅ Colorful brand icons for better visual appeal
- ✅ Automatic icon resolution reduces manual work
- ✅ CDN fallback ensures reliability
- ✅ No breaking changes to existing functionality
- ✅ Language flags preserved as-is
