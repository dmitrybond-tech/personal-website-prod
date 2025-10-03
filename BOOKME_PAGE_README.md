# Book Me Page Implementation

## Overview

The Book Me page has been implemented with three contrast tiles (duration toggles) above a Cal.com inline embed. Tile labels are CMS-editable via Markdown frontmatter with fallback to the `PUBLIC_CAL_EVENTS` environment variable.

## Content Management

### Editing Tile Labels via CMS

Tile labels can be edited through the Decap CMS admin interface:

1. **Access CMS**: Navigate to `/admin` on your site
2. **Find Collections**: Look for "Book Me Page (EN)" or "Book Me Page (RU)"
3. **Edit Content**: Update the `tiles` array with custom labels, captions, and icons
4. **Save Changes**: Content updates automatically on the live site

### Fallback Behavior

If frontmatter labels are missing or empty, the system automatically falls back to labels defined in the `PUBLIC_CAL_EVENTS` environment variable:

```bash
# Example environment configuration
PUBLIC_CAL_EVENTS=tech-90m|Tech 90m,intro-30m|Intro 30m,mentoring-60m|Mentoring 60m
```

## Environment Configuration

### Required Variables

```bash
# Cal.com username for embed links
PUBLIC_CAL_USERNAME=dmitrybond

# Base Cal.com profile link
PUBLIC_CAL_EMBED_LINK=https://cal.com/dmitrybond

# Comma-separated list of event types (format: slug|label)
PUBLIC_CAL_EVENTS=tech-90m|Tech 90m,intro-30m|Intro 30m,mentoring-60m|Mentoring 60m
```

### Webhook Configuration (Unchanged)

The existing webhook configuration remains intact:

```bash
# Webhook secret for Cal.com verification
CAL_WEBHOOK_SECRET=****

# Debug settings
CAL_DEBUG=1
CAL_DUMP_WEBHOOKS_DIR=var/webhooks
```

## Technical Implementation

### File Structure

```
apps/website/src/
├── content/
│   ├── en/bookme.md          # English content with frontmatter
│   └── ru/bookme.md          # Russian content with frontmatter
├── shared/lib/cal/
│   ├── env.ts                # Environment variable helpers
│   └── renderInline.ts       # Enhanced embed utility
├── features/bookme/
│   └── BookingTiles.tsx      # React component for tiles
└── app/entities/sections/ui/
    └── BookMeSection.astro   # Updated section component
```

### Key Features

1. **CMS Integration**: Decap CMS collections for editing Book Me content
2. **Environment Fallback**: Automatic fallback to env variables when frontmatter is missing
3. **Theme Sync**: Calendar automatically updates when switching light/dark themes
4. **Accessibility**: Proper ARIA roles and keyboard navigation support
5. **Responsive Design**: Mobile-first approach with proper container constraints

### Component Props

#### BookingTiles.tsx
```typescript
interface Props {
  tiles: Array<{
    slug: string;
    label: string;
    caption?: string;
    icon?: string;
  }>;
  initialSlug: string;
}
```

## Usage

### Route Access

The Book Me page is accessible at:
- English: `/en/bookme`
- Russian: `/ru/bookme`

### Tile Interaction

1. **Initial Load**: Calendar loads with the default tile (defined in frontmatter or first available)
2. **Tile Selection**: Clicking a tile switches the calendar to that event type without page reload
3. **Theme Updates**: Calendar automatically adapts to theme changes

## Styling

The implementation uses:
- **Container**: Respects `--cv-content-max-w` CSS custom property (~1040px)
- **Tiles**: Grid layout (1 column mobile, 3 columns desktop)
- **Calendar**: Rounded container with loading state and proper spacing
- **Colors**: CSS custom properties for theme consistency

## Backward Compatibility

- ✅ Existing webhook handler unchanged (`/api/cal/webhook.ts`)
- ✅ Legacy `renderInline()` function preserved
- ✅ TypeScript content files remain as fallback
- ✅ Environment configuration respected
- ✅ Navigation and footer unchanged

## Troubleshooting

### Common Issues

1. **Calendar not loading**: Check `PUBLIC_CAL_USERNAME` and `PUBLIC_CAL_EMBED_LINK` environment variables
2. **Tiles not appearing**: Verify `PUBLIC_CAL_EVENTS` format is correct (slug|label,slug|label)
3. **CMS not working**: Ensure Decap CMS collections are properly configured in `config.yml`

### Debug Mode

Enable debug mode to troubleshoot webhook issues:
```bash
CAL_DEBUG=1
CAL_DUMP_WEBHOOKS_DIR=var/webhooks
```

## Future Enhancements

Potential improvements for future iterations:
- Custom event type icons in CMS
- Advanced calendar customization options
- Integration with additional booking providers
- Enhanced analytics and tracking
