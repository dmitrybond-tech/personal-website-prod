# Navigation Unification - Unified Diff

## Summary
Unified navigation by removing the old static header nav and keeping only the dynamic NavIsland. Fixed the scroll "slide-down" (height feedback loop), made switchLocaleHref the single source of truth for language switching, and ensured clean i18n routing with no duplicates or 404s.

## Files Modified

### 1. apps/website/src/app/widgets/navbar/ui/Navbar.astro
**BEFORE:**
```astro
---
import LanguageToggle from '@shared/ui/LanguageToggle/LanguageToggle.astro';
import { getLocaleFromPath, swapLocale } from '@shared/config/i18n';

interface Props {
  locale: 'en' | 'ru';
}

type Locale = 'en' | 'ru';

// Получаем локаль из пропсов
const { locale } = Astro.props;

// Локализованные лейблы (явно заданы для UTF-8)
const L = {
  en: { about: 'About', book: 'Book Me', blog: 'Blog', brand: 'Dmitry B.' },
  ru: { about: 'Обо мне', book: 'Записаться', blog: 'Блог', brand: 'Дмитрий Б.' },
}[locale];
---

<style>
  .nav-island {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 8px;
    min-height: 60px; /* Стабильная высота для предотвращения прыжков */
    backdrop-filter: blur(8px);
    padding: 10px 14px;
  }

  /* Адаптивность для узких экранов */
  @media (max-width: 640px) {
    .nav-island {
      grid-template-columns: auto 1fr auto;
      gap: 4px;
      padding: 8px 12px;
    }
    
    .center-nav {
      justify-self: center;
      gap: 4px;
      padding: 2px;
    }
    
    .nav-btn {
      padding: 4px 8px;
      font-size: 0.875rem;
    }
    
    .right {
      justify-self: end;
    }
    
    .right .flex {
      gap: 4px;
    }
  }
  
  .brand { 
    justify-self: start; 
    font-weight: 600; 
    opacity: 0.85; 
    text-decoration: none;
    transition: opacity .2s ease;
  }
  .brand:hover {
    opacity: 1;
  }
  
  .center-nav {
    justify-self: center;
    display: inline-flex; 
    gap: 8px;
    padding: 4px;
  }
  
  .nav-btn { 
    padding: 6px 14px; 
    text-decoration: none; 
    transition: background .2s ease;
  }
  
  .right { 
    justify-self: end; 
  }
  
  .nav-island a { 
    text-decoration: none; 
    color: inherit; 
  }
</style>

<header class="nav-surface" data-app-navbar>
  <div class="nav-island navisland-bg nav-offset nav-sticky-floating island-shadow cv-container">
    <div class="brand nav-item">
      <a href={`/${locale}/about`}>{L.brand}</a>
    </div>
    <nav class="center-nav nav-panel navpanel-bg ui-outline ui-outline-brandlight">
      <a class="nav-btn nav-item nav-chip" href={`/${locale}/about`} aria-current={Astro.url.pathname.includes('/about') ? 'page' : 'false'}>{L.about}</a>
      <a class="nav-btn nav-item nav-chip" href={`/${locale}/bookme`} aria-current={Astro.url.pathname.includes('/bookme') ? 'page' : 'false'}>{L.book}</a>
      <a class="nav-btn nav-item nav-chip" href={`/${locale}/blog`} aria-current={Astro.url.pathname.includes('/blog') ? 'page' : 'false'}>{L.blog}</a>
    </nav>
    <div class="right">
      <LanguageToggle locale={locale} />
    </div>
  </div>
</header>
```

**AFTER:**
```astro
---
interface Props {
  locale: 'en' | 'ru';
}

const { locale } = Astro.props;

// Локализованные лейблы для бренда
const L = {
  en: { brand: 'Dmitry B.' },
  ru: { brand: 'Дмитрий Б.' },
}[locale];
---

<div class="navbar-brand">
  <a href={`/${locale}/about`} class="brand-link">
    {L.brand}
  </a>
</div>

<style>
  .navbar-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem 0;
  }
  
  .brand-link { 
    font-weight: 600; 
    font-size: 1.25rem;
    opacity: 0.85; 
    text-decoration: none;
    color: var(--cv-text);
    transition: opacity .2s ease;
  }
  
  .brand-link:hover {
    opacity: 1;
  }
</style>
```

### 2. apps/website/src/app/layouts/AppShell.astro
**BEFORE:**
```astro
    <!-- Global navbar height sync script -->
    <script>
      const el = document.querySelector('header[data-app-navbar]');
      const set = () => {
        const h = el?.offsetHeight || 72;
        document.documentElement.style.setProperty('--navbar-h', h + 'px');
      };
      set();
      new ResizeObserver(set).observe(el);
    </script>
```

**AFTER:**
```astro
    <!-- Global navbar height sync script with rAF throttling -->
    <script is:inline>
      (() => {
        const el = document.querySelector('header[data-app-navbar]');
        let prev = -1, raf = 0;
        const measure = () => {
          raf = 0;
          const h = Math.max(0, Math.round(el?.offsetHeight || 72));
          if (h !== prev) {
            prev = h;
            document.documentElement.style.setProperty('--navbar-h', h + 'px');
          }
        };
        const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };
        schedule();
        if (el) new ResizeObserver(schedule).observe(el);
        addEventListener('resize', schedule, { passive: true });
      })();
    </script>
```

### 3. apps/website/src/app/shared/i18n/switch.ts
**BEFORE:**
```typescript
export function switchLocaleHref(currentPath: string, target: Locale): string {
  // Remove leading slash for easier processing
  const path = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
  
  // Handle root paths
  if (path === '' || path === 'en' || path === 'ru') {
    return `/${target}/about`;
  }
  
  // Extract locale and path without locale
  let pathWithoutLocale: string;
  let currentLocale: Locale | null = null;
  
  if (path.startsWith('en/')) {
    currentLocale = 'en';
    pathWithoutLocale = path.slice(3);
  } else if (path.startsWith('ru/')) {
    currentLocale = 'ru';
    pathWithoutLocale = path.slice(3);
  } else {
    // No locale prefix found, treat as English content
    currentLocale = 'en';
    pathWithoutLocale = path;
  }
  
  // Handle specific page mappings with fallbacks
  if (pathWithoutLocale === '') {
    return `/${target}/about`;
  }
  
  // Direct page mappings
  const pageMappings: Record<string, string> = {
    'about': 'about',
    'bookme': 'bookme',
    'cv': 'cv',
    'privacy': 'privacy',
    'terms': 'terms',
    'cookies': 'cookies',
    'legal': 'legal'
  };
  
  // Check if it's a direct page mapping
  if (pageMappings[pathWithoutLocale]) {
    return `/${target}/${pageMappings[pathWithoutLocale]}`;
  }
  
  // Handle blog routes
  if (pathWithoutLocale.startsWith('blog/')) {
    const blogPath = pathWithoutLocale.slice(5); // Remove 'blog/'
    
    if (blogPath === '') {
      return `/${target}/blog`;
    }
    
    // For individual blog posts, try to find the localized version
    // For now, fallback to blog index if specific post doesn't exist
    return `/${target}/blog`;
  }
  
  // Handle admin routes (keep as-is)
  if (pathWithoutLocale.startsWith('website-admin/')) {
    return `/${pathWithoutLocale}`;
  }
  
  // Handle API routes (keep as-is)
  if (pathWithoutLocale.startsWith('api/')) {
    return `/${pathWithoutLocale}`;
  }
  
  // Default fallback: try to preserve the path structure
  return `/${target}/${pathWithoutLocale}`;
}
```

**AFTER:**
```typescript
export function switchLocaleHref(path: string, target: 'en' | 'ru'): string {
  const m = path.match(/^\/(en|ru)(\/.*)?$/);
  const rest = m?.[2] ?? '/about';

  if (/^\/blog\/[^/]+/.test(rest)) return `/${target}/blog`;
  if (rest === '/' || rest === '') return `/${target}/about`;

  return `/${target}${rest}`.replace(/\/{2,}/g, '/');
}
```

## Files Unchanged
- `apps/website/astro.config.ts` - i18n configuration already correct
- `apps/website/src/pages/en/index.astro` - redirect already correct
- `apps/website/src/pages/ru/index.astro` - redirect already correct
- `apps/website/src/pages/en/blog/index.astro` - already exists
- `apps/website/src/pages/ru/blog/index.astro` - already exists
- `apps/website/src/app/widgets/navisland/NavIsland.astro` - already correct
