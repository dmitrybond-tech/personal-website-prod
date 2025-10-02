# Tailwind v4 Refactor - Rollback Plan

## Quick Rollback (5 minutes)

### 1. Remove New Tailwind CSS File
```powershell
cd apps/website
Remove-Item src/styles/tailwind.css -Force
```

### 2. Revert main.css Changes
```powershell
# Remove the @reference line from main.css
# Line 225: Remove "@reference "@/styles/tailwind.css";"
```

### 3. Revert Astro Component Changes
Remove `@reference "@/styles/tailwind.css";` from:
- `src/features/about/devscard/ui/AboutShell.astro` (line 46)
- `src/features/about/devscard/ui/Description.astro` (line 40)  
- `src/features/about/devscard/ui/SidebarItem.astro` (line 21)

### 4. Restore Original Tailwind Setup
Create `src/styles/tailwind.css` with v3 syntax:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@theme {
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  /* ... rest of original theme ... */
}
```

### 5. Clean Caches and Restart
```powershell
Remove-Item .astro -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules\.vite -Recurse -Force -ErrorAction SilentlyContinue
npm run dev
```

## Complete Rollback (if needed)

### Revert to Previous Package Versions
```powershell
cd apps/website
npm uninstall @tailwindcss/vite @tailwindcss/postcss
npm install @astrojs/tailwind@6.0.2
```

### Update astro.config.ts
```typescript
// Remove tailwindcss import and plugin
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import auth from 'auth-astro';
// Remove: import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // ... other config
  integrations: [
    auth(),
    // Add back: tailwind(),
  ],
  vite: {
    // Remove tailwindcss() from plugins array
    plugins: [],
    // ... rest of config
  },
});
```

### Update PostCSS Config
```javascript
// postcss.config.cjs
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
};
```

## Verification After Rollback
- Dev server starts without errors
- Tailwind utilities apply correctly
- @apply directives work (may show warnings but function)
- All existing functionality preserved

## Time Estimate
- **Quick Rollback**: 5 minutes
- **Complete Rollback**: 15 minutes
- **Testing**: 5 minutes
- **Total**: 10-25 minutes depending on approach
