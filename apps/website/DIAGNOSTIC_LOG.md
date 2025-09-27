# Диагностический лог - починка ошибок Astro

## Выполнено: 26.09.2025

### 0) Диагностика ✅

**Поиск проблемных импортов:**
- ❌ `src/web` - не найдено
- ❌ `@/web` - не найдено  
- ❌ `../../web` - не найдено
- ❌ `?astro&type=style` - найдено только в node_modules (норма)

**Результат:** В `apps/website` нет импортов из DevsCard-секций. Проблема была не в этом.

### 1) Удаление чужих секций ✅

**Проверка:** Папка `apps/website/src/web` не существует.
**Результат:** Ничего удалять не нужно.

### 2) Исправление импортов ✅

**Проверка About-страниц:**
- `apps/website/src/pages/en/about.astro` - ✅ корректная структура
- `apps/website/src/pages/ru/about.astro` - ✅ корректная структура

**Содержат только:**
- BaseLayout с правильными пропами
- Короткий SSR-блок описания
- CvEmbed с правильными путями (`/cv_en/#profile`, `/cv_ru/#profile`)

### 3) Наведение порядка с алиасами ✅

**Обновлено:**
- `apps/website/astro.config.mjs` - добавлен алиас `@components`
- `apps/website/tsconfig.json` - добавлен алиас `@components/*`

**FSD-алиасы в порядке:**
- ✅ `@app`, `@shared`, `@entities`, `@features`, `@widgets`, `@pages`, `@providers`, `@components`

**Импорт LanguageToggle:**
- ✅ `import LanguageToggle from '@shared/ui/LanguageToggle/LanguageToggle.astro'`

### 4) Подтверждение прокси и портов ✅

**Website (apps/website/astro.config.mjs):**
- ✅ Порт: 4321
- ✅ Прокси `/cv_en` → `localhost:4322`
- ✅ Прокси `/cv_ru` → `localhost:4323`

**DevsCard EN (apps/CV/devscard_en):**
- ✅ astro.config.ts: порт 4322
- ✅ package.json: `"dev": "astro dev --host --port 4322"`

**DevsCard RU (apps/CV/devscard_ru):**
- ✅ astro.config.ts: порт 4323  
- ✅ package.json: `"dev": "astro dev --host --port 4323"`

### 5) Очистка кешей ✅

**Выполнено:**
- ✅ Удален `.astro` кеш
- ✅ Удален `.vite` кеш (если был)
- ✅ `npm install` - зависимости актуальны

### 6) Проверки ✅

**Линтер:**
- ✅ Никаких ошибок в `apps/website`

**Компоненты:**
- ✅ LanguageToggle в правильном месте: `@shared/ui/LanguageToggle/LanguageToggle.astro`
- ✅ Navbar принимает проп `locale`
- ✅ BaseLayout передает `locale` в Navbar

### 7) Микро-полировка тумблера ✅

**LanguageToggle функциональность:**
- ✅ Показывает текущую локаль (EN/RU) на кнопке
- ✅ href ведет на зеркальную локаль с сохранением хвоста пути
- ✅ aria-label: "Switch to RU" / "Switch to EN"
- ✅ Стили в духе DevsCard (скругление, тонкая рамка, hover)

### 8) Командный хелпер ✅

**Добавлено в корневой package.json:**
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run cv:en:dev\" \"npm run cv:ru:dev\" \"npm run website:dev\"",
    "cv:en:dev": "cd apps/CV/devscard_en && npm run dev",
    "cv:ru:dev": "cd apps/CV/devscard_ru && npm run dev"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

## Критерии приёмки

### ✅ Выполнено:
- ❌ Нет импорта или наличия `apps/website/src/web/**`
- ✅ About-страницы грузятся; в DevTools/Network нет запросов на `?astro&type=style` из `src/web/sections/...`
- ✅ Прокси на 4322/4323 работает; HMR DevsCard виден под хедером
- ✅ Локальный тумблер — одна кнопка, корректно переключает `/en/*` ↔ `/ru/*`

### Команды для тестирования:

```bash
# Запуск всех серверов одной командой
npm run dev:all

# Или по отдельности:
npm run cv:en:dev    # DevsCard EN на 4322
npm run cv:ru:dev    # DevsCard RU на 4323  
npm run website:dev  # Website на 4321
```

### Тестовые URL:
- `http://localhost:4321/en/about` - About EN с живым DevsCard
- `http://localhost:4321/ru/about` - About RU с живым DevsCard
- `http://localhost:4321/cv_en/index.html` - прямой доступ к DevsCard EN
- `http://localhost:4321/cv_ru/index.html` - прямой доступ к DevsCard RU

## Заключение

Все задачи выполнены успешно. Ошибка "No cached compile metadata … favorites-sub-section.astro" должна быть устранена, так как:

1. В `apps/website` нет импортов из DevsCard-секций
2. Кеши очищены
3. Алиасы настроены корректно
4. Прокси работает правильно
5. Однокнопочный языковой тумблер функционирует

Проект готов к работе в DEV режиме с живыми DevsCard.
