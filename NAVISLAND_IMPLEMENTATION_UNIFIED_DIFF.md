# NavIsland Implementation Unified Diff

## Summary
This diff shows the changes made to implement the NavIsland component for unified navigation across all pages.

## Files Added

### 1. NavIsland Component
**File**: `apps/website/src/app/widgets/navisland/NavIsland.astro` (NEW)

```diff
+---
+import { switchLocaleHref, getCurrentLocale, getOppositeLocale, getLocaleDisplayName, getLocaleFlag } from '@/app/shared/i18n/switch';
+import { getLocaleFromPath } from '@/app/shared/lib/locale';
+
+interface Props {
+  locale?: 'en' | 'ru';
+}
+
+const { locale = 'en' } = Astro.props;
+
+// Get current locale from URL if not provided
+const currentLocale = getLocaleFromPath(Astro.url.pathname) || locale;
+const oppositeLocale = getOppositeLocale(currentLocale);
+
+// Localized labels
+const labels = {
+  en: { about: 'About', bookme: 'Book Me', blog: 'Blog' },
+  ru: { about: 'Обо мне', bookme: 'Записаться', blog: 'Блог' }
+};
+
+const currentLabels = labels[currentLocale];
+
+// Generate navigation links for current locale
+const navLinks = [
+  { href: `/${currentLocale}/about`, label: currentLabels.about, key: 'about' },
+  { href: `/${currentLocale}/bookme`, label: currentLabels.bookme, key: 'bookme' },
+  { href: `/${currentLocale}/blog`, label: currentLabels.blog, key: 'blog' }
+];
+
+// Determine active tab based on current pathname
+function getActiveTab(pathname: string): string | null {
+  if (pathname.includes('/about')) return 'about';
+  if (pathname.includes('/bookme')) return 'bookme';
+  if (pathname.includes('/blog')) return 'blog';
+  return null;
+}
+
+const activeTab = getActiveTab(Astro.url.pathname);
+
+// Generate locale switch href
+const localeSwitchHref = switchLocaleHref(Astro.url.pathname, oppositeLocale);
+---
+
+<div class="nav-island" data-nav-island>
+  <!-- Navigation tabs -->
+  <nav class="nav-tabs" role="tablist" aria-label="Main navigation">
+    {navLinks.map((link) => (
+      <a
+        href={link.href}
+        class={`nav-tab ${activeTab === link.key ? 'nav-tab-active' : ''}`}
+        role="tab"
+        aria-current={activeTab === link.key ? 'page' : 'false'}
+        aria-selected={activeTab === link.key ? 'true' : 'false'}
+      >
+        {link.label}
+      </a>
+    ))}
+  </nav>
+
+  <!-- Locale switcher -->
+  <div class="locale-switcher">
+    <a
+      href={localeSwitchHref}
+      class="locale-switch-btn"
+      aria-label={`Switch to ${getLocaleDisplayName(oppositeLocale)}`}
+      data-locale={oppositeLocale}
+    >
+      <span class="locale-flag">{getLocaleFlag(oppositeLocale)}</span>
+      <span class="locale-code">{oppositeLocale.toUpperCase()}</span>
+    </a>
+  </div>
+</div>
+
+<style>
+  .nav-island {
+    display: flex;
+    align-items: center;
+    justify-content: space-between;
+    gap: 1rem;
+    padding: 0.75rem 1rem;
+    background: var(--cv-surface-elevated);
+    border: 1px solid var(--cv-border-hairline);
+    border-radius: 0.75rem;
+    backdrop-filter: blur(8px);
+    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
+    min-height: 3rem;
+  }
+
+  .nav-tabs {
+    display: flex;
+    gap: 0.25rem;
+    background: var(--cv-surface);
+    padding: 0.25rem;
+    border-radius: 0.5rem;
+    border: 1px solid var(--cv-border-hairline);
+  }
+
+  .nav-tab {
+    display: flex;
+    align-items: center;
+    padding: 0.5rem 0.75rem;
+    border-radius: 0.375rem;
+    text-decoration: none;
+    color: var(--cv-muted);
+    font-weight: 500;
+    font-size: 0.875rem;
+    transition: all 0.2s ease;
+    white-space: nowrap;
+  }
+
+  .nav-tab:hover {
+    color: var(--cv-text);
+    background: var(--cv-surface-elevated);
+  }
+
+  .nav-tab-active {
+    color: var(--cv-text);
+    background: var(--cv-surface-elevated);
+    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
+  }
+
+  .nav-tab[aria-current="page"] {
+    color: var(--cv-primary-600);
+    background: var(--cv-primary-50);
+  }
+
+  .locale-switcher {
+    display: flex;
+    align-items: center;
+  }
+
+  .locale-switch-btn {
+    display: flex;
+    align-items: center;
+    gap: 0.375rem;
+    padding: 0.5rem 0.75rem;
+    border-radius: 0.5rem;
+    text-decoration: none;
+    color: var(--cv-text);
+    background: var(--cv-surface);
+    border: 1px solid var(--cv-border-hairline);
+    font-weight: 500;
+    font-size: 0.875rem;
+    transition: all 0.2s ease;
+  }
+
+  .locale-switch-btn:hover {
+    background: var(--cv-surface-elevated);
+    border-color: var(--cv-primary-200);
+    color: var(--cv-primary-600);
+  }
+
+  .locale-switch-btn:focus {
+    outline: 2px solid var(--cv-primary-500);
+    outline-offset: 2px;
+  }
+
+  .locale-flag {
+    font-size: 1rem;
+  }
+
+  .locale-code {
+    font-size: 0.75rem;
+    font-weight: 600;
+  }
+
+  /* Responsive design */
+  @media (max-width: 640px) {
+    .nav-island {
+      flex-direction: column;
+      gap: 0.75rem;
+      padding: 0.75rem;
+    }
+
+    .nav-tabs {
+      width: 100%;
+      justify-content: center;
+    }
+
+    .nav-tab {
+      flex: 1;
+      justify-content: center;
+      padding: 0.5rem 0.5rem;
+      font-size: 0.8rem;
+    }
+
+    .locale-switcher {
+      width: 100%;
+      justify-content: center;
+    }
+
+    .locale-switch-btn {
+      padding: 0.5rem 1rem;
+    }
+  }
+
+  /* Dark mode support */
+  @media (prefers-color-scheme: dark) {
+    .nav-island {
+      background: var(--cv-surface-elevated);
+      border-color: var(--cv-border-hairline);
+    }
+
+    .nav-tabs {
+      background: var(--cv-surface);
+      border-color: var(--cv-border-hairline);
+    }
+
+    .nav-tab {
+      color: var(--cv-muted);
+    }
+
+    .nav-tab:hover {
+      color: var(--cv-text);
+      background: var(--cv-surface-elevated);
+    }
+
+    .nav-tab-active {
+      color: var(--cv-text);
+      background: var(--cv-surface-elevated);
+    }
+
+    .locale-switch-btn {
+      background: var(--cv-surface);
+      border-color: var(--cv-border-hairline);
+      color: var(--cv-text);
+    }
+
+    .locale-switch-btn:hover {
+      background: var(--cv-surface-elevated);
+      border-color: var(--cv-primary-200);
+      color: var(--cv-primary-400);
+    }
+  }
+</style>
+
+<script>
+  // Handle locale switching with cookie persistence
+  document.addEventListener('click', function(e) {
+    const localeBtn = e.target?.closest('[data-locale]');
+    if (localeBtn) {
+      const locale = localeBtn.getAttribute('data-locale');
+      if (locale === 'en' || locale === 'ru') {
+        // Set cookie for locale preference
+        document.cookie = `locale=${locale}; Max-Age=31536000; Path=/; SameSite=Lax`;
+      }
+    }
+  });
+</script>
```

## Files Modified

### 1. AppShell Layout
**File**: `apps/website/src/app/layouts/AppShell.astro`

```diff
 ---
 import "@/styles/main.css";
 import Navbar from '@/app/widgets/navbar/ui/Navbar.astro';
+import NavIsland from '@/app/widgets/navisland/NavIsland.astro';
 import { getLocaleFromPath, switchLocale } from '@/app/shared/lib/locale';
 
 interface Props {
   title?: string;
   description?: string;
   lang?: 'en' | 'ru';
   meta?: Record<string, string>;
   variant?: 'default' | 'bookme' | 'about' | 'blog';
   pageClass?: string;
 }
 
 const { 
   lang = 'en', 
   title = '', 
   description = '', 
   meta = {},
   variant = 'default',
   pageClass = ''
 } = Astro.props as Props;
 
 const url = Astro.url;
 const locale = getLocaleFromPath(url.pathname);
 const site = 'https://example.com'; // TODO: заменить на реальный домен
 const altEn = switchLocale(url, 'en');
 const altRu = switchLocale(url, 'ru');
 const canonical = locale === 'en' ? `${site}${altEn}` : `${site}${altRu}`;
 
 // Авто-детект page type по пути
 const isBookme = variant === 'bookme' || url.pathname.includes('/bookme');
 const isAbout = variant === 'about' || url.pathname.includes('/about');
 const isBlog = variant === 'blog' || url.pathname.includes('/blog');
 
 // Build body classes
 const bodyClasses = [
   'min-h-screen antialiased',
   isBookme ? 'page-bookme' : '',
   isAbout ? 'page-about' : '',
   isBlog ? 'page-blog' : '',
   pageClass
 ].filter(Boolean).join(' ');
 ---
 
 <!DOCTYPE html>
 <html lang={Astro.url.pathname.startsWith('/ru') ? 'ru' : 'en'}>
   <head>
     <meta charset="utf-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />
     <title>{title}</title>
     {description && <meta name="description" content={description} />}
     <meta name="theme-color" content="#ffffff" />
     
     <!-- No-FOUC theme initialization -->
     <script is:inline>
       (function () {
         try {
           var ls = localStorage.getItem('theme');
           var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
           var theme = (ls === 'light' || ls === 'dark') ? ls : (prefersDark ? 'dark' : 'light');
           var root = document.documentElement;
           if (theme === 'dark') root.classList.add('dark');
           root.setAttribute('data-theme', theme);
         } catch {}
       })();
     </script>
 
     <!-- Canonical and alternate links -->
     <link rel="canonical" href={canonical} />
     <link rel="alternate" hrefLang="en" href={`${site}${altEn}`} />
     <link rel="alternate" hrefLang="ru" href={`${site}${altRu}`} />
     <link rel="alternate" hrefLang="x-default" href={`${site}${altEn}`} />
 
     <!-- Open Graph / Facebook -->
     <meta property="og:type" content="website" />
     <meta property="og:url" content={canonical} />
     <meta property="og:title" content={title} />
     {description && <meta property="og:description" content={description} />}
 
     <!-- Twitter -->
     <meta property="twitter:card" content="summary_large_image" />
     <meta property="twitter:url" content={canonical} />
     <meta property="twitter:title" content={title} />
     {description && <meta property="twitter:description" content={description} />}
 
     <!-- Custom meta tags -->
     {Object.entries(meta).map(([key, value]) => (
       <meta name={key} content={value} />
     ))}
 
     <!-- Font Awesome for icons -->
     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
+    
+    <!-- NavIsland container styles -->
+    <style>
+      .nav-island-container {
+        max-width: var(--cv-container-max, 80rem);
+        margin: 0 auto;
+        padding: 0 var(--cv-gutter-x, 1.5rem);
+        margin-top: 1rem;
+      }
+      
+      @media (max-width: 640px) {
+        .nav-island-container {
+          padding: 0 1rem;
+          margin-top: 0.75rem;
+        }
+      }
+    </style>
   </head>
   <body class={bodyClasses}>
     <header data-app-navbar>
       <Navbar locale={locale} />
+      <div class="nav-island-container">
+        <NavIsland locale={locale} />
+      </div>
     </header>
     
     <main>
       <slot />
     </main>
     
     <!-- Script for locale switching -->
     <script is:inline>
       document.addEventListener('click', function(e) {
         var a = e.target && e.target.closest ? e.target.closest('a[data-locale]') : null;
         if (a) {
           var loc = a.getAttribute('data-locale');
           if (loc === 'en' || loc === 'ru') {
             document.cookie = 'locale=' + loc + '; Max-Age=31536000; Path=/; SameSite=Lax';
           }
         }
       });
     </script>
 
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
   </body>
 </html>
```

## Summary of Changes

### Added Files:
1. **NavIsland Component** (`apps/website/src/app/widgets/navisland/NavIsland.astro`)
   - Complete navigation component with tabs and locale switcher
   - Responsive design with mobile support
   - Accessibility features (ARIA attributes, keyboard navigation)
   - Uses existing CSS tokens and design system

### Modified Files:
1. **AppShell Layout** (`apps/website/src/app/layouts/AppShell.astro`)
   - Added NavIsland import
   - Integrated NavIsland into header section
   - Added container styling for proper layout
   - Maintained existing functionality

### Key Features Implemented:
- ✅ Three navigation tabs (About, Book Me, Blog) with active state highlighting
- ✅ Locale switcher with flag emojis and language codes
- ✅ Responsive design for mobile devices
- ✅ Accessibility compliance (ARIA attributes, keyboard navigation)
- ✅ Integration with existing i18n system and locale utilities
- ✅ Uses existing CSS tokens and design system
- ✅ Client-side locale switching with cookie persistence
- ✅ No breaking changes to existing functionality

### Testing Results:
- ✅ All main routes working: `/en/about`, `/ru/about`, `/en/blog`, `/ru/blog`, `/en/bookme`, `/ru/bookme`
- ✅ NavIsland visible and functional on all pages
- ✅ Active tab highlighting works correctly
- ✅ Locale switching functional
- ✅ No linting errors
- ✅ Responsive design working on mobile

The implementation successfully provides a unified navigation experience across all pages while maintaining compatibility with the existing codebase and design system.
