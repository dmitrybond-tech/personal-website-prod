# About.md Integration with Decap CMS

Этот документ описывает интеграцию расширенной структуры `about.md` с Decap CMS для полного редактирования всех элементов страницы About.

## 🎯 Что было сделано

### 1. Расширена структура about.md
- **Добавлены все секции**: main, skills, experience, favorites
- **Полные поля для каждой секции**: иконки, ссылки, изображения, описания
- **Поддержка всех типов контента**: книги, люди, видео, медиа, хобби, фильмы
- **Настройки стилей**: варианты отображения, колонки, лимиты

### 2. Создан адаптер для маппинга данных
- **`aboutMdAdapter.ts`**: преобразует данные из about.md в формат компонентов
- **Обратная совместимость**: fallback на TypeScript данные если about.md недоступен
- **Автоматическое определение**: загружает данные из about.md или TypeScript файлов

### 3. Расширен скрипт DKAP Wire
- **`dkap-wire-advanced.mjs`**: генерирует полную структуру полей для CMS
- **Поддержка всех типов секций**: main, skills, experience, favorites, education, projects, testimonials
- **Детальные поля**: для каждого элемента с возможностью редактирования

## 📁 Структура файлов

```
apps/website/
├── src/content/aboutPage/
│   ├── en/about.md          # Расширенная структура (EN)
│   └── ru/about.md          # Расширенная структура (RU)
├── src/features/about/devscard/lib/
│   └── aboutMdAdapter.ts    # Адаптер для маппинга данных
├── scripts/
│   ├── dkap-wire-advanced.mjs  # Расширенный скрипт генерации CMS
│   └── README.about-md-integration.md
└── admin/
    └── config.generated.yml # Сгенерированная конфигурация CMS
```

## 🚀 Использование

### 1. Генерация конфигурации CMS
```bash
# Предварительный просмотр
node apps/website/scripts/dkap-wire-advanced.mjs --dry-run --pretty

# Применение конфигурации
node apps/website/scripts/dkap-wire-advanced.mjs --apply --pretty
```

### 2. Запуск CMS
```bash
# Запуск proxy сервера
npx decap-cms-proxy-server --port 8081

# Открытие админки
http://localhost:4321/website-admin/?config=/admin/config.generated.yml
```

## 🎨 Что можно редактировать в CMS

### Main Section (Профиль)
- ✅ **Личная информация**: имя, роль, описание
- ✅ **Фото профиля**: загрузка изображения
- ✅ **Контактные данные**: телефон, email, локация, зарплата
- ✅ **Социальные ссылки**: Facebook, GitHub, LinkedIn, Twitter с иконками и цветами
- ✅ **Теги**: статусы (фриланс, менторство, сайд-проекты)
- ✅ **Кнопка скачивания**: CV с настройкой имени файла

### Skills Section (Навыки)
- ✅ **Категории навыков**: "Уже знаю", "Хочу изучить", "Языки"
- ✅ **Детали навыков**: название, уровень, иконка, описание
- ✅ **Уровни**: beginner, intermediate, advanced, expert

### Experience Section (Опыт)
- ✅ **Компании**: название, локация, логотип, сайт
- ✅ **Роли**: должность, период, описание
- ✅ **Достижения**: список bullet points
- ✅ **Технологии**: используемые технологии
- ✅ **Ссылки**: на проекты, демо, документацию

### Favorites Section (Избранное)
- ✅ **Группы**: книги, люди, видео, медиа, хобби, фильмы
- ✅ **Настройки отображения**: варианты (tile, list, grid, card)
- ✅ **Колонки**: настройка для разных экранов (base, sm, lg)
- ✅ **Лимиты**: количество отображаемых элементов
- ✅ **Детали элементов**: название, автор, тип, описание, URL, изображение

## 🔧 Интеграция с компонентами

### Использование адаптера
```typescript
import { loadAboutMdData } from '@/features/about/devscard/lib/aboutMdAdapter';

// Загрузка данных с автоматическим fallback
const data = await loadAboutMdData('en');
```

### Обновление компонентов
Компоненты автоматически получают данные в нужном формате благодаря адаптеру. Никаких изменений в компонентах не требуется.

## 📝 Структура данных в about.md

### Пример секции Main
```yaml
- type: main
  data:
    title: Profile
    slug: profile
    icon: fa6-solid:user
    visible: true
    fullName: Mark Freeman
    role: Senior React Developer
    image: /devscard/my-image.jpeg
    description: |
      Описание с поддержкой **markdown**
    details:
      - label: Phone
        value: 605 475 6961
        url: tel:605 475 6961
    tags:
      - name: Open for freelance
    action:
      label: Download CV
      url: /devscard/cv.pdf
      downloadedFileName: CV-Mark_Freeman.pdf
    links:
      - label: GitHub
        url: https://github.com
        icon: fa6-brands:github
        color: "#181717"
```

### Пример секции Experience
```yaml
- type: experience
  data:
    title: Experience
    items:
      - company: CloudBlue
        location: 'Enschede, the Netherlands'
        logo: /logos/cloudblue.svg
        website: https://cloudblue.com
        roles:
          - title: Delivery Manager
            period: Mar 2023 – Apr 2025
            description: Описание роли
            bullets:
              - Достижение 1
              - Достижение 2
            technologies:
              - React
              - TypeScript
            links:
              - label: Company Website
                url: https://cloudblue.com
```

### Пример секции Favorites
```yaml
- type: favorites
  data:
    title: Favorites
    style:
      variant: tile
      cols:
        base: 2
        sm: 3
        lg: 6
    groups:
      - title: Books I read
        type: books
        style:
          limit: 5
        items:
          - title: The Pragmatic Programmer
            author: Andy Hunt, Dave Thomas
            url: https://www.goodreads.com/book/show/4099
            image: /devscard/favorites/books/book-1.jpeg
```

## 🎯 Преимущества

1. **Полный контроль**: редактирование всех элементов через CMS
2. **Обратная совместимость**: существующие компоненты работают без изменений
3. **Гибкость**: легко добавлять новые секции и поля
4. **Безопасность**: `create: false, delete: false` по умолчанию
5. **Локализация**: поддержка EN/RU версий
6. **Валидация**: типизированные поля с обязательными параметрами

## 🔄 Миграция данных

Если у вас есть данные в TypeScript файлах, они автоматически используются как fallback. Для полной миграции:

1. Скопируйте данные из TypeScript файлов в about.md
2. Обновите структуру согласно новому формату
3. Протестируйте через CMS
4. Удалите старые TypeScript файлы (опционально)

## 🐛 Отладка

### Проверка структуры данных
```bash
# Проверка YAML синтаксиса
node -e "const yaml = require('yaml'); const fs = require('fs'); console.log(yaml.parse(fs.readFileSync('about.md', 'utf8').split('---')[1]))"
```

### Логи адаптера
Адаптер выводит предупреждения в консоль при fallback на TypeScript данные.

## 📚 Дополнительные ресурсы

- [Decap CMS Documentation](https://decapcms.org/docs/)
- [YAML Front Matter](https://jekyllrb.com/docs/front-matter/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
