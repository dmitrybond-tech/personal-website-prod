# CV Integration Guide

## Обзор

Проект успешно интегрирован согласно FSD архитектуре. CV-контент из `apps/CV/devscard-main` перенесен в единую кодовую базу `apps/website` с поддержкой локалей `en` и `ru`.

## Структура

### FSD Архитектура

```
src/
├── app/
│   ├── entities/
│   │   ├── profile/ui/ProfileSection.astro
│   │   └── sections/ui/BookMeSection.astro
│   ├── features/
│   │   └── theme-toggle/ui/ThemeToggle.astro
│   ├── shared/
│   │   ├── config/i18n.ts
│   │   └── lib/theme.ts
│   └── widgets/
│       └── navbar/ui/Navbar.astro
├── content/
│   ├── en/
│   │   ├── main.ts
│   │   └── bookme.ts
│   └── ru/
│       ├── main.ts
│       └── bookme.ts
└── pages/
    ├── en/about.astro
    └── ru/about.astro
```

### Ключевые особенности

1. **Единая кодовая база**: Все в `apps/website`, никаких отдельных серверов для CV
2. **Локализация**: Раздельные контентные файлы для `en` и `ru`
3. **FSD структура**: Строгое следование Feature-Sliced Design
4. **Sticky Navbar**: Закрепленная навигация с переключением локалей
5. **Темная тема**: Единый менеджер темы с сохранением в localStorage
6. **Якорные ссылки**: Плавная прокрутка к секциям `#aboutme` и `#bookme`

## Запуск

### Development

```bash
cd apps/website
npm run dev
```

Сервер запустится на `http://localhost:4321`

### Production Build

```bash
cd apps/website
npm run build
npm run preview
```

## Доступные страницы

- `/en/about` - Английская версия страницы "Обо мне"
- `/ru/about` - Русская версия страницы "Обо мне"
- `/en/bookme` - Английская версия страницы "Записаться"
- `/ru/bookme` - Русская версия страницы "Записаться"

## Навигация

### Navbar
- **Brand**: Ссылка на главную страницу локали
- **About**: Переход к секции `#aboutme`
- **Book Me**: Переход к секции `#bookme`
- **Language Toggle**: Переключение между `EN` ↔ `RU`

### Секции
- **#aboutme**: Профиль с фото, контактами и описанием
- **#bookme**: Форма записи на встречу с календарем

## Тема

### Переключение
- Кнопка в левом нижнем углу
- Автоматическое сохранение в localStorage
- Поддержка `prefers-color-scheme`

### Токены
- Светлая тема: `data-theme="light"`
- Темная тема: `data-theme="dark"`
- Tailwind классы: `dark:` для темной темы

## Контент

### Структура данных

```typescript
// content/en/main.ts
export const mainData = {
  fullName: string;
  role: string;
  image: string;
  details: Array<{label: string, value: string, url?: string}>;
  description: string;
  tags: Array<{name: string}>;
  links: Array<{label: string, icon: string, url: string, color: string}>;
};
```

### Локализация

Каждая локаль имеет свой набор данных:
- `content/en/main.ts` - английские данные
- `content/ru/main.ts` - русские данные

## Компоненты

### ProfileSection
- Отображает профиль пользователя
- Поддерживает локализацию через пропс `locale`
- Адаптивный дизайн

### BookMeSection  
- Секция записи на встречу
- Заглушка для интеграции календаря
- Локализованный контент

### Navbar
- Sticky позиционирование
- Переключение локалей
- Якорные ссылки

### ThemeToggle
- Переключатель темы
- Иконки Font Awesome
- Сохранение состояния

## Алиасы импортов

```typescript
// tsconfig.json
"@app/*": ["src/app/*"]
"@shared/*": ["src/app/shared/*"]
"@entities/*": ["src/app/entities/*"]
"@features/*": ["src/app/features/*"]
"@widgets/*": ["src/app/widgets/*"]
"@content/*": ["src/content/*"]
```

## Следующие шаги

1. **Интеграция календаря**: Добавить реальный виджет календаря в BookMeSection
2. **Дополнительные секции**: Порт остальных секций из devscard (Skills, Experience, etc.)
3. **SEO оптимизация**: Добавить мета-теги и структурированные данные
4. **Аналитика**: Интеграция Google Analytics или аналоги
5. **Тестирование**: Добавить unit и e2e тесты

## Troubleshooting

### Проблемы с импортами
Убедитесь, что алиасы настроены в `tsconfig.json`

### Проблемы с темой
Проверьте, что `data-theme` атрибут устанавливается на `html` элемент

### Проблемы с локализацией
Убедитесь, что пути начинаются с `/en/` или `/ru/`

## Архитектурные решения

### Почему FSD?
- Четкое разделение ответственности
- Масштабируемость
- Переиспользование компонентов
- Простота навигации по коду

### Почему Astro?
- Статическая генерация
- Производительность
- Поддержка множественных фреймворков
- SEO-friendly

### Почему единая кодовая база?
- Упрощение деплоя
- Единая система сборки
- Общие ресурсы
- Упрощение поддержки

