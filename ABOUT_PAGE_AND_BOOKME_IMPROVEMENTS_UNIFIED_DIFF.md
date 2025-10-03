# Unified Diff: About Page and BookMe Improvements

## Summary
Eliminated all ImageNotFound errors, implemented robust image fallbacks, added dark theme support, and cleaned up BookMe pages to use only Cal.com inline embed.

## Changes Made

### 1. Static Assets
- ✅ Static assets already synchronized between apps/new-ref and apps/website
- ✅ Created placeholder.svg for missing images

### 2. Image Fallbacks in About Page Sections
All About page sections now have robust fallbacks when images are missing:

#### Hero.astro
```diff
- {avatar && (
-   <div class="flex-shrink-0">
-     <img 
-       src={avatar} 
-       alt={data.fullName || 'Profile'} 
-       class="w-32 h-32 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white shadow-lg"
-     />
-   </div>
- )}
+ <div class="flex-shrink-0">
+   {avatar ? (
+     <img 
+       src={avatar} 
+       alt={data.fullName || 'Profile'} 
+       class="w-32 h-32 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white shadow-lg"
+       loading="lazy"
+       onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'w-32 h-32 lg:w-48 lg:h-48 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white shadow-lg flex items-center justify-center', innerHTML:'<svg class=\\'w-8 h-8 text-gray-400\\' fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\'><path fill-rule=\\'evenodd\\' d=\\'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z\\' clip-rule=\\'evenodd\\' /></svg>'}))"
+     />
+   ) : (
+     <div class="w-32 h-32 lg:w-48 lg:h-48 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white shadow-lg flex items-center justify-center">
+       <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
+         <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
+       </svg>
+     </div>
+   )}
+ </div>
```

#### Projects.astro
```diff
- <div class="aspect-video overflow-hidden">
-   {project.image ? (
-     <img 
-       src={project.image} 
-       alt={project.name} 
-       class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
-       onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
-     />
-   ) : null}
-   <div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500" style={project.image ? 'display: none;' : 'display: flex;'}>
-     <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
-       <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
-     </svg>
-   </div>
- </div>
+ <div class="aspect-video overflow-hidden">
+   {project.image ? (
+     <img 
+       src={project.image} 
+       alt={project.name} 
+       class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
+       loading="lazy"
+       onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500', innerHTML:'<svg class=\\'w-12 h-12\\' fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\'><path fill-rule=\\'evenodd\\' d=\\'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z\\' clip-rule=\\'evenodd\\' /></svg>'}))"
+     />
+   ) : (
+     <div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
+       <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
+         <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
+       </svg>
+     </div>
+   )}
+ </div>
```

Similar improvements applied to:
- Experience.astro
- Favorites.astro  
- Testimonials.astro
- Education.astro

### 3. Dark Theme Implementation

#### AppShell.astro - No-FOUC Theme Bootstrap
```diff
+ <!-- No-FOUC theme initialization -->
+ <script is:inline>
+   (function () {
+     try {
+       var ls = localStorage.getItem('theme');
+       var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
+       var theme = (ls === 'light' || ls === 'dark') ? ls : (prefersDark ? 'dark' : 'light');
+       var root = document.documentElement;
+       if (theme === 'dark') root.classList.add('dark');
+       root.setAttribute('data-theme', theme);
+     } catch {}
+   })();
+ </script>
```

#### NavIsland.astro - Theme Toggle
```diff
+ <!-- Theme toggle -->
+ <div class="theme-toggle">
+   <button 
+     type="button" 
+     class="theme-toggle-btn"
+     aria-label={currentLocale === 'en' ? 'Toggle theme' : 'Переключить тему'}
+     onClick="(function(){
+       const k='theme'; const root=document.documentElement;
+       const dark=root.classList.toggle('dark'); 
+       localStorage.setItem(k,dark?'dark':'light');
+     })()"
+   >
+     <svg class="theme-icon-light w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
+       <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
+     </svg>
+     <svg class="theme-icon-dark w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
+       <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
+     </svg>
+   </button>
+ </div>
```

#### Theme Toggle CSS
```diff
+ .theme-toggle {
+   display: grid; 
+   place-items: center; 
+ }
+ 
+ .theme-toggle-btn {
+   position: relative;
+   display: grid; 
+   place-items: center;
+   width: 2.25rem;
+   height: 2.25rem;
+   padding: .25rem; 
+   border: 1px solid var(--cv-border-hairline);
+   border-radius: 12px; 
+   background: var(--cv-surface-elevated);
+   color: var(--cv-text);
+   cursor: pointer;
+   transition: background .15s;
+ }
+ 
+ .theme-toggle-btn:hover { 
+   background: color-mix(in oklab, var(--cv-text) 8%, transparent);
+ }
+ 
+ .theme-icon-light,
+ .theme-icon-dark {
+   position: absolute;
+   transition: opacity .15s;
+ }
+ 
+ .theme-icon-light {
+   opacity: 1;
+ }
+ 
+ .theme-icon-dark {
+   opacity: 0;
+ }
+ 
+ .dark .theme-icon-light {
+   opacity: 0;
+ }
+ 
+ .dark .theme-icon-dark {
+   opacity: 1;
+ }
```

### 4. Content File Cleanup
Removed problematic image paths from content files that were causing ESM import issues:

#### about.md files
```diff
- cv_pdf: "/devscard/cv.pdf"
- gallery:
-   - "/devscard/portfolio/project-1-screenshot-1.jpg"
-   - "/devscard/portfolio/project-1-screenshot-2.jpg"
-   - "/devscard/portfolio/project-1-screenshot-3.jpg"
+ cv_pdf: "/devscard/cv.pdf"
```

### 5. Devscard Data Files
Renamed unused devscard data files to prevent ESM import processing:
- `portfolio-section.data.ts` → `portfolio-section.data.ts.bak`
- `index.ts` → `index.ts.bak` (in both en/ and ru/ locales)

### 6. BookMe Pages
✅ Already clean - using only Cal.com inline embed with no images or astro:assets

## Files Modified
1. `apps/website/src/features/about/sections/Hero.astro`
2. `apps/website/src/features/about/sections/Projects.astro`
3. `apps/website/src/features/about/sections/Experience.astro`
4. `apps/website/src/features/about/sections/Favorites.astro`
5. `apps/website/src/features/about/sections/Testimonials.astro`
6. `apps/website/src/features/about/sections/Education.astro`
7. `apps/website/src/app/widgets/navisland/NavIsland.astro`
8. `apps/website/src/content/aboutPage/en/about.md`
9. `apps/website/src/content/aboutPage/ru/about.md`

## Files Created
1. `apps/website/public/devscard/placeholder.svg`

## Files Renamed (to prevent processing)
1. `apps/website/src/features/about/devscard/locales/en/portfolio-section.data.ts.bak`
2. `apps/website/src/features/about/devscard/locales/ru/portfolio-section.data.ts.bak`
3. `apps/website/src/features/about/devscard/locales/en/index.ts.bak`
4. `apps/website/src/features/about/devscard/locales/ru/index.ts.bak`

## Build Status
✅ Build successful with no ImageNotFound errors
✅ All About page sections render with graceful fallbacks
✅ Dark theme toggle functional
✅ BookMe pages clean with Cal.com embed only