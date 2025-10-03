# CardGridIsland Integration Notes

## Section → CardGridIsland Mapping

The following section types are mapped to CardGridIsland:
- `skills` → CardGridIsland with `variant="skills"`
- `cards` → CardGridIsland with `variant="default"`
- `projects` → CardGridIsland with `variant="default"`
- `favorites` → CardGridIsland with `variant="default"`

## Data Structure Support

### Groups Structure (from CMS)
```yaml
sections:
  - type: skills
    data:
      title: "Skills"
      groups:
        - title: "I already know"
          items:
            - name: "React"
              icon: "simple-icons:react"
              url: "https://react.dev"
              level: 5
              description: "Hooks, Suspense, RSC basics"
```

### Direct Items Structure
```yaml
sections:
  - type: cards
    data:
      title: "Technologies"
      items:
        - name: "React"
          icon: "simple-icons:react"
          description: "Frontend framework"
```

## Props Contract for CardGridIsland

```typescript
interface CardGridIslandProps {
  items: CardProps[];
  variant?: 'default' | 'skills';
  hydrate?: 'load' | 'visible';
}

interface CardProps {
  id: string;
  name: string;
  title?: string; // fallback for name
  subtitle?: string;
  description?: string;
  icon?: string;
  url?: string;
  tags?: string[];
  level?: 1 | 2 | 3 | 4 | 5;
  tooltip?: string; // for 'skills' variant
  [key: string]: any; // passthrough for CMS fields
}
```

## Icon Fields and Fallbacks

- **Icon rendering**: Uses `@iconify/react` with graceful handling of undefined icons
- **Icon field**: `icon` property supports any Iconify icon name (e.g., `"simple-icons:react"`)
- **Fallback**: If icon is undefined, the icon element is not rendered (no broken images)
- **Accessibility**: Icons have `aria-hidden="true"` for screen readers

## Hydration Strategy

- **Above-the-fold content**: Uses `client:load` for immediate hydration
- **Below-the-fold content**: Uses `client:visible` for performance optimization
- **SSR skeleton**: Provides loading state with gray blocks and pulse animation
- **No FOUC**: Skeleton matches final layout dimensions

## Container and Spacing

- **Container**: Uses `.site-container` class for consistent max-width and padding
- **Grid**: Responsive grid with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Gap**: Consistent `gap-4` spacing between cards
- **Dark mode**: Full support with `dark:` variants for all colors and borders
