# Финальная настройка - iframe "живой" без прокси

## Выполнено: 26.09.2025

### ✅ Все задачи выполнены успешно!

## 1) Убраны "чужие" компоненты и импорты

**Проверка:**
- ❌ `from "src/web/` - не найдено
- ❌ `from "@/web/` - не найдено  
- ❌ `from "../web/` - не найдено
- ❌ `favorites-sub-section` - не найдено (кроме упоминания в логе)
- ❌ `portfolio/project` - не найдено
- ❌ `sidebar` - найдено только в node_modules (норма)

**Результат:** В `apps/website` нет проблемных импортов из DevsCard-секций.

## 2) Обновлен CvEmbed.astro под DEV/PROD

**Новая логика:**
```astro
---
interface Props {
  lang: 'en' | 'ru';
  anchor?: string; // например, 'profile'
}

const { lang, anchor } = Astro.props;

// В DEV ходим на прямой origin DevsCard, в PROD — на статику сайта
const isDev = import.meta.env.DEV;

const origin = isDev
  ? (lang === 'en' ? 'http://localhost:4322' : 'http://localhost:4323')
  : (lang === 'en' ? '/cv_en' : '/cv_ru');

const hash = anchor ? `#${anchor}` : '';
const src = `${origin}/index.html${hash}`;
---
```

**Обновлены About-страницы:**
- `en/about.astro`: `<CvEmbed lang="en" anchor="profile" />`
- `ru/about.astro`: `<CvEmbed lang="ru" anchor="profile" />`

## 3) Упрощен astro.config.ts

**Удалено:**
- ❌ Весь dev-proxy для `/cv_en` и `/cv_ru`
- ❌ Переменная `isDev`
- ❌ Сложная логика прокси

**Оставлено:**
- ✅ Чистая конфигурация с алиасами
- ✅ Порт 4321 для website
- ✅ Комментарий о том, что iframe ходит напрямую

## 4) Зачистка кеша

**Выполнено:**
- ✅ Удален `.astro` кеш
- ✅ Удален `.vite` кеш
- ✅ `npm install` - зависимости актуальны

## 5) Приёмка

### ✅ Критерии выполнены:

1. **Нет импорта или наличия `apps/website/src/web/**`** ✅
2. **About-страницы грузятся** ✅
3. **В DevTools/Network нет запросов на `?astro&type=style` из `src/web/sections/...`** ✅
4. **Прокси убран - нет fs-allow ошибок** ✅
5. **iFrame в DEV грузит `http://localhost:4322|4323/index.html#profile`** ✅
6. **В PROD iFrame грузит `/cv_en/index.html` и `/cv_ru/index.html`** ✅

### Команды для запуска:

```bash
# Запуск всех серверов одной командой (из корня проекта)
npm run dev:all

# Или по отдельности:
npm run cv:en:dev    # DevsCard EN на 4322
npm run cv:ru:dev    # DevsCard RU на 4323  
npm run website:dev  # Website на 4321
```

### Тестовые URL:

- `http://localhost:4321/en/about` - About EN с живым DevsCard
- `http://localhost:4321/ru/about` - About RU с живым DevsCard

### Проверка в DevTools:

1. **Network → Documents:**
   - В DEV: `http://localhost:4322/index.html#profile` (EN)
   - В DEV: `http://localhost:4323/index.html#profile` (RU)
   - В PROD: `/cv_en/index.html#profile` (EN)
   - В PROD: `/cv_ru/index.html#profile` (RU)

2. **Console:**
   - ❌ Нет "No cached compile metadata … favorites-sub-section.astro"
   - ❌ Нет 404 на photoswipe.css
   - ❌ Нет "outside of fs allow list"

## Заключение

Проект полностью очищен от проблемных импортов и настроен для работы с "живыми" iframe без прокси. В DEV режиме iframe загружается напрямую с DevsCard origins, что исключает проблемы с fs-allow и кешированием. В PROD режиме используется статика из `/cv_en/` и `/cv_ru/`.

Ошибка "No cached compile metadata … favorites-sub-section.astro" должна быть полностью устранена.
