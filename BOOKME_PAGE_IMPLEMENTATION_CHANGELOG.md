# Book Me Page Implementation Changelog

## Overview
Implemented the "Book Me" page body with three contrast tiles (duration toggles) above a Cal.com inline embed. The implementation allows CMS-editable tile labels via Markdown frontmatter with fallback to PUBLIC_CAL_EVENTS environment variable.

## Changes Made

### 1. Content Model (Markdown Files)
**Files:** `apps/website/src/content/en/bookme.md`, `apps/website/src/content/ru/bookme.md`

- Created localized Markdown files with frontmatter containing:
  - `title`, `subtitle`, `description`, `cta` - Page content
  - `defaultTileSlug` - Default selected tile
  - `tiles` array with `slug`, `label`, `caption`, `icon` fields
- Labels can be omitted from frontmatter to fallback to env variable labels

### 2. Decap CMS Configuration
**File:** `apps/website/public/website-admin/config.yml`

- Added new collections for Book Me page content:
  - `en_bookme_content` - English Book Me page
  - `ru_bookme_content` - Russian Book Me page
- Configured frontmatter fields matching the Markdown schema
- Supports editing tile labels, captions, and icons via CMS

### 3. Environment Access Helper
**File:** `apps/website/src/shared/lib/cal/env.ts`

- Created centralized access to CAL environment variables
- `CAL_ENV` object with USERNAME, BASE, EVENTS properties
- `parseEnvEvents()` function to parse PUBLIC_CAL_EVENTS string
- `makeCalLink()` function to construct Cal.com embed links
- Type-safe event parsing with fallback handling

### 4. Enhanced Embed Utility
**File:** `apps/website/src/shared/cal/renderInline.ts`

- Added `initCalEmbed()` function for initial calendar setup
- Added `updateCalLink()` function for switching event types
- Implemented theme synchronization (light/dark mode)
- Added brand color support from CSS custom properties
- Lazy loading with IntersectionObserver support
- Maintains backward compatibility with existing `renderInline()` function

### 5. BookingTiles React Component
**File:** `apps/website/src/features/bookme/BookingTiles.tsx`

- Accessible segmented control with `role="tablist"` and `role="tab"`
- `aria-pressed` states for active tile indication
- Props: `tiles` array and `initialSlug` string
- Automatic calendar initialization on mount
- Click handlers to switch calendar event types
- Responsive grid layout (1 column mobile, 3 columns desktop)
- Tailwind CSS styling with CSS custom properties

### 6. Updated BookMeSection Component
**File:** `apps/website/src/app/entities/sections/ui/BookMeSection.astro`

- Loads Markdown frontmatter with fallback to TypeScript data
- Merges frontmatter tiles with environment event labels
- Determines initial tile selection from frontmatter or first available
- Renders page header from frontmatter data
- Uses new BookingTiles component with client-side hydration
- Container respects `--cv-content-max-w` CSS custom property
- Simplified styling using Tailwind classes

## Technical Implementation Details

### Tile Data Flow
1. Frontmatter tiles are loaded from Markdown files
2. Environment events are parsed from PUBLIC_CAL_EVENTS
3. Tiles are merged: frontmatter order preserved, missing labels filled from env
4. If no frontmatter tiles exist, fallback to environment events only

### Calendar Integration
1. Initial calendar loads with `defaultTileSlug` or first available tile
2. Clicking tiles calls `updateCalLink()` to switch event types
3. Theme changes are observed and calendar re-renders automatically
4. Brand colors are applied if available in CSS custom properties

### Accessibility Features
- Segmented control semantics with proper ARIA roles
- Keyboard navigation support
- Focus management with visible focus rings
- Screen reader announcements for tile selection

### Responsive Design
- Mobile-first approach with responsive grid
- Container respects max-width constraints
- Touch-friendly tile sizing
- Proper spacing and typography scaling

## Environment Variables Used
- `PUBLIC_CAL_USERNAME` - Cal.com username for embed links
- `PUBLIC_CAL_EMBED_LINK` - Base Cal.com profile link
- `PUBLIC_CAL_EVENTS` - Comma-separated list of "slug|label" pairs

## Backward Compatibility
- Existing webhook handler at `/api/cal/webhook.ts` unchanged
- Legacy `renderInline()` function preserved
- TypeScript content files remain as fallback
- Existing environment configuration respected

## Testing Considerations
- Verify tile switching updates calendar without page reload
- Test theme toggle updates calendar appearance
- Confirm accessibility with screen readers
- Validate responsive behavior on mobile devices
- Check fallback behavior when frontmatter is missing
