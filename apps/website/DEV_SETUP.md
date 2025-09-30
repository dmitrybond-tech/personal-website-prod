# Настройка DEV режима с живыми DevsCard

## Что изменилось

1. **Vite-прокси для DEV**: В `astro.config.mjs` добавлен прокси для `/cv_en/*` → `localhost:4322` и `/cv_ru/*` → `localhost:4323`
2. **Новый хедер**: Центрированная навигация в стиле DevsCard с однокнопочным переключателем языков
3. **Обновленные About-страницы**: Используют новые пути `/cv_en/#profile` и `/cv_ru/#profile`
4. **FSD-структура**: LanguageToggle перемещен в `@shared/ui/LanguageToggle/`
5. **Зафиксированные порты**: DevsCard настроены на порты 4322 (EN) и 4323 (RU)

## Тестирование в DEV режиме

### 1. Запустите все три сервера:

```bash
# Терминал 1: DevsCard EN (порт 4322)
cd apps/CV/devscard_en
npm run dev

# Терминал 2: DevsCard RU (порт 4323)
cd apps/CV/devscard_ru  
npm run dev

# Терминал 3: Основной сайт (порт 4321)
cd apps/website
npm run dev
```

### 2. Проверьте работу:

- Откройте `http://localhost:4321/en/about`
- Откройте `http://localhost:4321/ru/about`
- Контент CV должен загружаться "живым" из dev-серверов
- При изменении в DevsCard - контент обновляется автоматически (HMR)
- **Однокнопочный переключатель языков**: клик по кнопке EN/RU переводит на зеркальный маршрут

### 3. Проверьте хедер:

- Бренд слева
- Кнопки About/Book Me по центру в капсуле
- **Одна кнопка EN/RU справа** - показывает текущую локаль, клик переключает язык

## PROD режим

В production сборке прокси отключен, и `/cv_en/*`/`/cv_ru/*` будут отдавать статику из `public/` (как раньше).

## Структура изменений

- `astro.config.mjs` - добавлен Vite прокси и алиас `@components`
- `src/app/shared/ui/LanguageToggle/LanguageToggle.astro` - новый однокнопочный переключатель
- `src/app/widgets/navbar/ui/Navbar.astro` - обновлен хедер с пропом locale
- `src/layouts/BaseLayout.astro` - передает locale в Navbar
- `src/pages/en/about.astro` - обновлен путь к CV
- `src/pages/ru/about.astro` - обновлен путь к CV
- `apps/CV/devscard_en/astro.config.ts` - зафиксирован порт 4322
- `apps/CV/devscard_ru/astro.config.ts` - зафиксирован порт 4323

## CMS Admin Setup (Decap CMS)

### Local CMS Development

Для локальной разработки с CMS используется Decap CMS с local_backend proxy:

#### Option A: Manual Commands (Windows/PowerShell)
```powershell
# Терминал A: Основной сайт
cd apps/website
npm run dev

# Терминал B: CMS Proxy Server (preferred)
cd apps/website
npx decap-server

# Терминал B: Fallback if decap-server fails
cd apps/website
npx netlify-cms-proxy-server@1.3.0
```

#### Option B: Helper Script (Auto-fallback)
```powershell
# One command to start both Astro dev and CMS backend
.\apps\website\scripts\dev-cms.ps1

# Force fallback mode
.\apps\website\scripts\dev-cms.ps1 -Fallback
```

### Доступ к CMS

1. Откройте `http://localhost:4321/website-admin`
2. CMS будет доступен для редактирования контента
3. Все изменения сохраняются локально в файлы Markdown

### Структура CMS

- **Pages**: Переопределение контента существующих страниц (`/en/about`, `/ru/about`, etc.)
- **Blog**: Управление блог-постами с поддержкой тегов и дат публикации
- **Legal**: Правовые документы (условия использования, политики)

### Контент-коллекции

- `src/content/pages/` - переопределения страниц
- `src/content/blog/` - блог-посты
- `src/content/legal/` - правовые документы

### CmsOptional Wrapper

Все существующие страницы обернуты в `CmsOptional` компонент, который:
- Проверяет наличие CMS-контента для текущего маршрута
- Если найден - отображает CMS-контент
- Если не найден - отображает оригинальный статический контент

### Навигация

В центр навигации добавлен пункт "Blog/Блог" с правильной локализацией.

### CMS Dev

# Terminal A
cd apps/website
npm run dev

# Terminal B
cd apps/website
npx decap-server

Open http://localhost:<printed-port>/website-admin/.

### CMS Admin Access
1. Open `http://localhost:<printed-port>/website-admin/`
2. Decap CMS UI loads from CDN (version 3.8.3)
3. Local backend on port 8081 allows saving entries
4. Static setup prevents HMR conflicts and double-boot issues

### Run dev correctly
# Port must go after `--`
npm run dev -- --port 4321

# Local backend for Decap
npx decap-server

# Open
http://localhost:4321/_admin-public-health.txt      # should say: public: OK
http://localhost:4321/website-admin/_health.txt     # should say: website-admin: OK
http://localhost:4321/website-admin/                # Decap UI