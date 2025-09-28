# Cal.com Integration Widgets

Единый компонент для интеграции Cal.com календаря с выбором типов встреч.

## 📁 Компоненты

### CalBooking.astro
Единый компонент с кнопками типов встреч и embed календарем в одном контейнере.

**Использование:**
```astro
import CalBooking from '@widgets/cal/CalBooking.astro';

<CalBooking locale="en" />
```

**Особенности:**
- Кнопки типов встреч в стиле карточек Cal.com
- Embed контейнер фиксированного размера 1040×490px
- Мгновенное переключение между типами встреч
- Поддержка URL параметров для выбора типа по умолчанию
- Полная локализация (EN/RU)

## 🔧 Переменные окружения

### Обязательные
- `PUBLIC_CAL_USERNAME` - имя пользователя Cal.com
  - Пример: `dmitrybond`

- `PUBLIC_CAL_EMBED_LINK` - базовая ссылка на профиль/команду Cal.com
  - Формат: `https://cal.com/<username-or-team>`
  - Пример: `https://cal.com/dmitrybond`

### Настройка событий
- `PUBLIC_CAL_EVENTS` - список событий в формате "slug|label,slug|label"
  - Формат: `slug|label,slug|label,slug|label`
  - Пример: `tech-90m|Tech 90m,intro-30m|Intro 30m,quick-15m|Quick 15m`
  - slug подставляется в URL: `https://cal.com/<username>/<slug>`

## 🎯 Как работает переключение типов

1. **Базовая загрузка:** CalBooking загружается с `PUBLIC_CAL_EMBED_LINK`
2. **Кнопки типов:** Отображаются кнопки для каждого события из `PUBLIC_CAL_EVENTS`
3. **Переключение:** При клике на кнопку:
   - Формируется URL: `https://cal.com/<username>/<slug>?overlayCalendar=true&layout=month_view`
   - Вызывается `window.Cal('ui', { calLink: newLink })`
   - Обновляется `data-cal-link` атрибут контейнера
   - Cal.com мгновенно переключается на новый тип встречи

## 🔗 URL параметры

### Выбор типа по умолчанию
- `?event=<slug>` - активирует указанный тип встречи при загрузке
- `#event=<slug>` - альтернативный способ через hash

**Примеры:**
- `/en/bookme?event=tech-90m` - откроет Tech 90m встречу
- `/ru/bookme?event=intro-30m` - откроет Intro 30m встречу

## 🧪 Как проверить

### 1. Настройка
```bash
# В .env.local
PUBLIC_CAL_USERNAME=your-username
PUBLIC_CAL_EMBED_LINK=https://cal.com/your-username
PUBLIC_CAL_EVENTS=tech-90m|Tech 90m,intro-30m|Intro 30m,quick-15m|Quick 15m
```

### 2. Запуск
```bash
npm run dev
```

### 3. Проверка в браузере
- Откройте `/en/bookme` или `/ru/bookme`
- Убедитесь, что Cal.com embed загружается (1040×490px)
- Проверьте, что кнопки типов отображаются в стиле карточек
- Кликните по кнопкам - календарь должен переключаться мгновенно
- Попробуйте URL с параметром: `/en/bookme?event=tech-90m`

### 4. Проверка в DevTools
```javascript
// Проверьте, что Cal.com загружен
console.log(window.Cal); // должен быть функцией

// Проверьте текущий calLink
console.log(document.getElementById('cal-embed').dataset.calLink);

// Проверьте переключение
window.Cal('ui', { calLink: 'https://cal.com/your-username/tech-90m?overlayCalendar=true&layout=month_view' });
```

## 🎨 Локализация

### Английский (en)
- "Book a Meeting"
- "Choose your preferred meeting type"

### Русский (ru)
- "Записаться на встречу"
- "Выберите тип встречи"

**Примечание:** Лейблы кнопок берутся из `PUBLIC_CAL_EVENTS` (без автоперевода)

## 🐛 Troubleshooting

### Cal.com не загружается
- Проверьте `PUBLIC_CAL_EMBED_LINK` и `PUBLIC_CAL_USERNAME` в .env
- Убедитесь, что ссылка ведет на существующий профиль
- Проверьте консоль браузера на ошибки

### Кнопки не работают
- Проверьте `PUBLIC_CAL_EVENTS` в .env (формат: slug|label,slug|label)
- Убедитесь, что Cal.com скрипт загружен (`window.Cal` существует)
- Проверьте консоль на ошибки JavaScript

### Стили не применяются
- Убедитесь, что Tailwind CSS работает
- Проверьте темную тему (должна поддерживаться автоматически)
- Проверьте, что контейнер имеет класс `.cal-embed-container`

## 📝 Примеры использования

### Полная интеграция
```astro
---
import CalBooking from '@widgets/cal/CalBooking.astro';
---

<CalBooking locale="en" />
```

### С кастомным классом
```astro
---
import CalBooking from '@widgets/cal/CalBooking.astro';
---

<CalBooking locale="en" className="my-custom-class" />
```

### Настройка событий
```bash
# В .env.local
PUBLIC_CAL_EVENTS=consultation-60m|Consultation 60m,interview-30m|Interview 30m,quick-15m|Quick Call 15m
```
