# Skills Section Implementation

## Overview

The Skills section has been implemented as a fully data-driven component that integrates with Decap CMS and supports internationalization (EN/RU). It provides a visual representation of skills similar to DevsCard's #skills section.

## Features

- **Data-driven**: Fully controlled via Decap CMS
- **i18n Support**: English and Russian localization
- **Dark Mode**: Automatic theme support
- **Interactive Elements**: Tooltips with keyboard navigation
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Components

### 1. SkillsSection.astro
Main container component that renders the skills section with proper layout constraints (990-1040px width).

### 2. SkillItem.astro
Individual skill item component that handles:
- Icon display using Iconify
- Skill level bars (1-5 scale)
- Tooltips with descriptions
- Different display modes (leveled skills, learning skills, language skills)

### 3. SkillBarIsland.tsx
React island component for interactive skill level bars with 5-segment visualization.

## CMS Configuration

The skills section is configured in `public/website-admin/config.yml` with the following structure:

```yaml
- label: "Data"
  name: "data"
  widget: "object"
  fields:
    - label: "Groups"
      name: "groups"
      widget: "list"
      fields:
        - { label: "Title", name: "title", widget: "string" }
        - label: "Items"
          name: "items"
          widget: "list"
          fields:
            - { label: "Name", name: "name", widget: "string" }
            - { label: "Icon", name: "icon", widget: "string", required: false }
            - { label: "URL", name: "url", widget: "string", required: false }
            - { label: "Level (1-5)", name: "level", widget: "number", min: 1, max: 5, required: false }
            - label: "Description"
              name: "description"
              widget: "object"
              fields:
                - { label: "English", name: "en", widget: "text", required: false }
                - { label: "Russian", name: "ru", widget: "text", required: false }
```

## Data Structure

### Skill Groups
The skills are organized into three main groups:

1. **"I already know"** - Skills with proficiency levels (1-5)
2. **"I want to learn"** - Skills without levels (displayed as chips)
3. **"I speak"** - Languages with flag icons (displayed as pills)

### Skill Items
Each skill item can have:
- `name`: Skill name (required)
- `icon`: Iconify icon name (optional)
- `url`: External link (optional)
- `level`: Proficiency level 1-5 (optional)
- `description`: Localized descriptions (optional)

## Usage

### In CMS
1. Navigate to the About page in Decap CMS
2. Add a new section with type "skills"
3. Configure the groups and items as needed
4. Set localized titles and descriptions

### In Code
The skills section is automatically loaded and rendered when present in the about page content. It uses the `loadSkillsData()` function to fetch data from CMS with fallback to local data.

## Styling

The component uses Tailwind CSS classes with dark mode support:
- Content width: `max-w-[1040px]` (990-1040px range)
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Dark mode: Uses `dark:` prefixes for theme switching
- Hover effects: Subtle shadows and transitions

## Accessibility

- **Keyboard Navigation**: Tab through skill items and tooltip triggers
- **Screen Readers**: Proper ARIA labels and roles
- **Tooltips**: `aria-describedby` and `role="tooltip"`
- **Focus Management**: ESC key closes tooltips
- **Semantic HTML**: Proper heading hierarchy and landmarks

## Development

### Fallback Data
If CMS data is not available, the component falls back to example data in `src/content/blocks/skills.example.json`.

### Testing
- Test both `/en/about` and `/ru/about` routes
- Verify tooltip functionality
- Check dark mode appearance
- Test responsive behavior

## Dependencies

- `@iconify/react`: For React-based icon rendering
- `iconify-icon`: For Astro-based icon rendering
- Tailwind CSS: For styling and dark mode

## File Structure

```
src/
├── components/skills/
│   ├── SkillsSection.astro
│   ├── SkillItem.astro
│   └── SkillBarIsland.tsx
├── lib/cms/
│   └── skills.ts
├── content/blocks/
│   └── skills.example.json
└── features/about/sections/
    └── Skills.astro (updated)
```
