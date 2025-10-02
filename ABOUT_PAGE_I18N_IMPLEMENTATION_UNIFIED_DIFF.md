# About Page i18n Implementation - Unified Diff

## Summary
This implementation adds i18n bypass for system paths, migrates About page content from website-vanilla_ref, and enforces proper content widths.

## Files Modified

### 1. apps/website/src/middleware.ts
```diff
@@ -33,6 +33,20 @@ export const onRequest: MiddlewareHandler = async (context, next) => {
   const { url, request } = context;
   const path = url.pathname;
 
   if (DEV) console.log(`[MW] ${request.method} ${path}`);
 
+  // System paths that should bypass i18n redirects
+  const SYSTEM_PATHS = [
+    '/website-admin',
+    '/admin',
+    '/api',
+    '/oauth',
+    '/auth',
+    '/favicon',
+    '/robots.txt',
+    '/sitemap',
+    '/assets',
+    '/fonts',
+    '/images',
+    '/public'
+  ];
+
+  // Check if path should bypass i18n redirect
+  const shouldBypassI18n = SYSTEM_PATHS.some(systemPath => path.startsWith(systemPath));
+
   // i18n routing: redirect bare paths and non-localized paths to default locale
-  if (path === '/' || (!SUPPORTED_LOCALES.includes(path.split('/')[1] as any))) {
+  if (!shouldBypassI18n && (path === '/' || (!SUPPORTED_LOCALES.includes(path.split('/')[1] as any)))) {
     const redirectPath = path === '/' ? `/${DEFAULT_LOCALE}/` : `/${DEFAULT_LOCALE}${path}`;
     const redirectUrl = new URL(redirectPath, url);
```

### 2. apps/website/src/content/config.ts
```diff
@@ -35,11 +35,20 @@ const legal = defineCollection({
 });
 
 const aboutPage = defineCollection({
   type: 'content',
   schema: z.object({
     title: z.string(),
-    profile: z.string().optional(),
-    sections: z.array(z.string()).optional(),
+    profile: z.object({
+      fullName: z.string(),
+      title: z.string(),
+      avatar: z.string().optional(),
+    }),
+    sections: z.array(z.object({
+      heading: z.string(),
+      body: z.string(),
+      icon: z.string().optional(),
+      image: z.string().optional(),
+    })),
+    links: z.array(z.string()).optional(),
+    cv_pdf: z.string().optional(),
+    gallery: z.array(z.string()).optional(),
   }),
 });
```

### 3. apps/website/src/content/aboutPage/en/about.mdx
```diff
@@ -1,7 +1,40 @@
 ---
 title: "About Me"
-profile: "Senior Full-Stack Developer"
-sections: ["Experience", "Skills", "Portfolio"]
+profile:
+  fullName: "Mark Freeman"
+  title: "Senior React Developer"
+  avatar: "/devscard/my-image.jpeg"
+sections:
+  - heading: "Profile"
+    body: "Lorem ipsum dolor sit amet, consectetur **adipiscing elit**. In sodales ac dui at *vestibulum*. In condimentum metus id dui tincidunt, in blandit mi [vehicula](/). Nulla lacinia, erat sit amet elementum vulputate, lectus mauris volutpat mi, vitae accumsan metus elit ut nunc. Vestibulum lacinia enim eget eros fermentum scelerisque. Proin augue leo, posuere ut imperdiet vitae, fermentum eu ipsum. Sed sed neque sagittis, posuere urna nec, commodo leo. Pellentesque posuere justo vitae massa volutpat maximus."
+    icon: "fa6-solid:user"
+  - heading: "Skills"
+    body: "I have extensive experience with modern web technologies including React, TypeScript, and various UI frameworks. I'm passionate about creating scalable and maintainable applications."
+    icon: "fa6-solid:bars-progress"
+  - heading: "Work Experience"
+    body: "I've worked as a Senior Front-end Developer at Google, React.js Developer at Facebook, and Junior Front-end Developer at GitLab. Each role has provided me with valuable experience in different aspects of web development."
+    icon: "fa6-solid:suitcase"
+  - heading: "Portfolio"
+    body: "I've worked on various projects ranging from small business websites to large-scale enterprise applications. I'm always looking for new challenges and opportunities to grow."
+    icon: "fa6-solid:briefcase"
+  - heading: "Education"
+    body: "I hold a degree in Computer Science and have completed various certifications in web development technologies."
+    icon: "fa6-solid:graduation-cap"
+  - heading: "Testimonials"
+    body: "I've received positive feedback from colleagues and clients throughout my career, highlighting my technical skills and collaborative approach."
+    icon: "fa6-solid:quote-left"
+  - heading: "Favorites"
+    body: "I enjoy staying up-to-date with the latest web development trends and technologies. I'm also passionate about mentoring and helping others grow in their careers."
+    icon: "fa6-solid:heart"
+links:
+  - "https://linkedin.com/in/mark-freeman"
+  - "https://github.com/mark-freeman"
+  - "https://twitter.com/mark-freeman"
+cv_pdf: "/devscard/cv.pdf"
+gallery:
+  - "/devscard/my-image.jpeg"
+  - "/devscard/logos/google-logo.jpg"
+  - "/devscard/logos/facebook-logo.png"
+  - "/devscard/logos/gitlab-logo.png"
 ---
 
 # About Me
@@ -8,3 +41,25 @@ Welcome to my personal website! I'm a passionate full-stack developer with a lo
 
 Welcome to my personal website! I'm a passionate full-stack developer with a love for creating innovative solutions and helping others grow in their technical journey.
+
+## Professional Summary
+
+I'm a Senior React Developer with extensive experience in modern web technologies. I specialize in creating scalable, maintainable applications using React, TypeScript, and various UI frameworks.
+
+## Key Achievements
+
+- **5+ years** of experience in front-end development
+- **Expert level** in React and TypeScript
+- **Strong background** in UI/UX design principles
+- **Proven track record** of delivering high-quality applications
+
+## Current Focus
+
+I'm currently working on several exciting projects and always looking for new challenges. I'm particularly interested in:
+
+- Modern React patterns and best practices
+- Performance optimization techniques
+- Accessibility improvements
+- Team mentoring and knowledge sharing
+
+Feel free to reach out if you'd like to discuss potential opportunities or just have a chat about web development!
```

### 4. apps/website/src/content/aboutPage/ru/about.mdx
```diff
@@ -1,7 +1,40 @@
 ---
 title: "Обо мне"
-profile: "Senior Full-Stack разработчик"
-sections: ["Опыт", "Навыки", "Портфолио"]
+profile:
+  fullName: "Марк Фриман"
+  title: "Senior React разработчик"
+  avatar: "/devscard/my-image.jpeg"
+sections:
+  - heading: "Профиль"
+    body: "Lorem ipsum dolor sit amet, consectetur **adipiscing elit**. In sodales ac dui at *vestibulum*. In condimentum metus id dui tincidunt, in blandit mi [vehicula](/). Nulla lacinia, erat sit amet elementum vulputate, lectus mauris volutpat mi, vitae accumsan metus elit ut nunc. Vestibulum lacinia enim eget eros fermentum scelerisque. Proin augue leo, posuere ut imperdiet vitae, fermentum eu ipsum. Sed sed neque sagittis, posuere urna nec, commodo leo. Pellentesque posuere justo vitae massa volutpat maximus."
+    icon: "fa6-solid:user"
+  - heading: "Навыки"
+    body: "У меня обширный опыт работы с современными веб-технологиями, включая React, TypeScript и различные UI-фреймворки. Я увлечен созданием масштабируемых и поддерживаемых приложений."
+    icon: "fa6-solid:bars-progress"
+  - heading: "Опыт работы"
+    body: "Я работал Senior Front-end разработчиком в Google, React.js разработчиком в Facebook и Junior Front-end разработчиком в GitLab. Каждая роль дала мне ценный опыт в различных аспектах веб-разработки."
+    icon: "fa6-solid:suitcase"
+  - heading: "Портфолио"
+    body: "Я работал над различными проектами, от небольших сайтов для бизнеса до крупномасштабных корпоративных приложений. Я всегда ищу новые вызовы и возможности для роста."
+    icon: "fa6-solid:briefcase"
+  - heading: "Образование"
+    body: "У меня есть степень в области компьютерных наук, и я прошел различные сертификации в области веб-разработки."
+    icon: "fa6-solid:graduation-cap"
+  - heading: "Отзывы"
+    body: "На протяжении всей моей карьеры я получал положительные отзывы от коллег и клиентов, подчеркивающие мои технические навыки и совместный подход."
+    icon: "fa6-solid:quote-left"
+  - heading: "Избранное"
+    body: "Мне нравится быть в курсе последних тенденций и технологий веб-разработки. Я также увлечен менторством и помощью другим в карьерном росте."
+    icon: "fa6-solid:heart"
+links:
+  - "https://linkedin.com/in/mark-freeman"
+  - "https://github.com/mark-freeman"
+  - "https://twitter.com/mark-freeman"
+cv_pdf: "/devscard/cv.pdf"
+gallery:
+  - "/devscard/my-image.jpeg"
+  - "/devscard/logos/google-logo.jpg"
+  - "/devscard/logos/facebook-logo.png"
+  - "/devscard/logos/gitlab-logo.png"
 ---
 
 # Обо мне
@@ -8,3 +41,25 @@ Добро пожаловать на мой персональный сайт! Я страстный full-stack разработчик, который
 
 Добро пожаловать на мой персональный сайт! Я страстный full-stack разработчик, который любит создавать инновационные решения и помогать другим расти в карьере.
+
+## Профессиональное резюме
+
+Я Senior React разработчик с обширным опытом работы с современными веб-технологиями. Я специализируюсь на создании масштабируемых, поддерживаемых приложений с использованием React, TypeScript и различных UI-фреймворков.
+
+## Ключевые достижения
+
+- **5+ лет** опыта в front-end разработке
+- **Экспертный уровень** в React и TypeScript
+- **Сильный опыт** в принципах UI/UX дизайна
+- **Проверенный опыт** доставки высококачественных приложений
+
+## Текущий фокус
+
+В настоящее время я работаю над несколькими интересными проектами и всегда ищу новые вызовы. Меня особенно интересуют:
+
+- Современные паттерны React и лучшие практики
+- Техники оптимизации производительности
+- Улучшения доступности
+- Командное менторство и обмен знаниями
+
+Не стесняйтесь обращаться, если хотите обсудить потенциальные возможности или просто поговорить о веб-разработке!
```

### 5. apps/website/src/pages/[lang]/about.astro
```diff
@@ -16,6 +16,9 @@ if (!entry) {
   console.warn(`About page content not found for locale: ${locale}. Rendering placeholder.`);
 }
 
+// Render content when available
+const { Content } = entry ? await entry.render() : { Content: null };
+
 ---
 
 <AppShell variant="about">
-  <main class="mx-auto max-w-[1040px] px-4 xl:relative xl:left-7">
+  <main class="mx-auto max-w-[var(--cv-content-max-w)] px-4 xl:relative xl:left-7">
     {entry ? (
       <div class="prose prose-lg max-w-none">
         <h1>{entry.data.title}</h1>
-        {entry.data.profile && (
-          <p class="text-lg text-gray-600 dark:text-gray-400">{entry.data.profile}</p>
-        )}
-        {entry.data.sections && entry.data.sections.length > 0 && (
-          <div class="mt-6">
-            <h2>Sections</h2>
-            <ul>
-              {entry.data.sections.map((section) => (
-                <li key={section}>{section}</li>
-              ))}
-            </ul>
-          </div>
-        )}
-        <div class="mt-8">
-          {(() => {
-            const { Content } = entry.render();
-            return <Content />;
-          })()}
-        </div>
+        {entry.data.profile && (
+          <div class="mb-6">
+            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
+              {entry.data.profile.fullName}
+            </h2>
+            <p class="text-lg text-gray-600 dark:text-gray-400">
+              {entry.data.profile.title}
+            </p>
+            {entry.data.profile.avatar && (
+              <img 
+                src={entry.data.profile.avatar} 
+                alt={entry.data.profile.fullName}
+                class="w-32 h-32 rounded-full object-cover mt-4"
+              />
+            )}
+          </div>
+        )}
+        {entry.data.sections && entry.data.sections.length > 0 && (
+          <div class="mt-8 space-y-6">
+            {entry.data.sections.map((section, index) => (
+              <div key={index} class="border-l-4 border-blue-500 pl-4">
+                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
+                  {section.icon && (
+                    <i class={`${section.icon} text-blue-500`}></i>
+                  )}
+                  {section.heading}
+                </h3>
+                <div class="mt-2 text-gray-700 dark:text-gray-300">
+                  {section.body}
+                </div>
+                {section.image && (
+                  <img 
+                    src={section.image} 
+                    alt={section.heading}
+                    class="mt-3 w-full max-w-md rounded-lg"
+                  />
+                )}
+              </div>
+            ))}
+          </div>
+        )}
+        {entry.data.links && entry.data.links.length > 0 && (
+          <div class="mt-8">
+            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Links</h3>
+            <div class="flex flex-wrap gap-2">
+              {entry.data.links.map((link, index) => (
+                <a 
+                  href={link} 
+                  target="_blank" 
+                  rel="noopener noreferrer"
+                  class="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
+                >
+                  Link {index + 1}
+                </a>
+              ))}
+            </div>
+          </div>
+        )}
+        {entry.data.cv_pdf && (
+          <div class="mt-8">
+            <a 
+              href={entry.data.cv_pdf} 
+              target="_blank" 
+              rel="noopener noreferrer"
+              class="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
+            >
+              Download CV
+            </a>
+          </div>
+        )}
+        {entry.data.gallery && entry.data.gallery.length > 0 && (
+          <div class="mt-8">
+            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Gallery</h3>
+            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
+              {entry.data.gallery.map((image, index) => (
+                <img 
+                  src={image} 
+                  alt={`Gallery image ${index + 1}`}
+                  class="w-full h-32 object-cover rounded-lg"
+                />
+              ))}
+            </div>
+          </div>
+        )}
+        <div class="mt-8">
+          {Content && <Content />}
+        </div>
       </div>
     ) : (
       <div class="prose prose-lg max-w-none">
```

## CSS Variables (Already Present)
The CSS variables for content width (1040px) and nav width (content + 48px) were already properly defined in `apps/website/src/styles/main.css`:

```css
:root {
  --cv-content-max-w: 1040px;  /* Content max width */
  --cv-nav-extra-w: 48px;  /* "slightly wider" than content */
  --cv-nav-max-w: calc(var(--cv-content-max-w) + var(--cv-nav-extra-w));  /* NavBar max width */
}
```

## Assets
All referenced assets from website-vanilla_ref were already present in the main project under `apps/website/public/devscard/` directory, preserving the relative paths as required.

## Verification Results
- ✅ `/website-admin` loads without locale prefix (Status: 200)
- ✅ `/en/about` renders dynamic content (Status: 200)
- ✅ `/ru/about` renders dynamic content (Status: 200)
- ✅ Content width enforced at 1040px via CSS variables
- ✅ NavIsland width is content + 48px via CSS variables
- ✅ No Tailwind build errors
- ✅ All referenced assets available at correct paths