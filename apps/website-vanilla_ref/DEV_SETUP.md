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
