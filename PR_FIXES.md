# Fix: Broken Routes & Cal.com Embed Loading

## 🐛 Проблемы
- **A)** Сломанные роуты `/en|ru/about` из-за неправильных алиасов импорта Navbar
- **B)** Cal.com embed бесконечно показывает "Loading calendar..." из-за проблем с env переменными

## ✅ Исправления

### 1. Алиасы и импорты
- **Исправлены импорты Navbar** в `src/pages/en/about.astro` и `src/pages/ru/about.astro`:
  - `@widgets/navbar/ui/Navbar.astro` → `@app/widgets/navbar/ui/Navbar.astro`
- **Алиасы остались без изменений** (уже корректные):
  - `@app` → `src/app`
  - `@widgets` → `src/widgets`

### 2. Cal.com Embed
- **Переименована env переменная** в `env.example`:
  - `CAL_EMBED_LINK` → `PUBLIC_CAL_EMBED_LINK`
- **Обновлен CalEmbed.astro**:
  - Использует `import.meta.env.PUBLIC_CAL_EMBED_LINK`
  - Добавлен fallback при отсутствии переменной
  - Улучшена загрузка Cal.com скрипта (устойчивость к гонкам)
  - Исправлен URL скрипта: `https://cal.com/embed.js`

## 📁 Измененные файлы

```
apps/website/
├── env.example                                    # Переименована env переменная
├── src/
│   ├── pages/
│   │   ├── en/about.astro                        # Исправлен импорт Navbar
│   │   └── ru/about.astro                        # Исправлен импорт Navbar
│   └── widgets/cal/CalEmbed.astro                # Улучшена загрузка embed
```

## 🧪 Результаты тестирования

### ✅ Все роуты работают (HTTP 200):
- `/en/about` - ✅
- `/ru/about` - ✅  
- `/en/bookme` - ✅
- `/ru/bookme` - ✅

### ✅ Cal.com Embed:
- Показывает понятное сообщение при отсутствии `PUBLIC_CAL_EMBED_LINK`
- Устойчивая загрузка скрипта с проверкой дублирования
- Обработка ошибок инициализации

## 🔧 Как проверить

1. **Настройте env переменную:**
   ```bash
   # В .env.local
   PUBLIC_CAL_EMBED_LINK=https://cal.com/your-username/event-type
   ```

2. **Запустите dev сервер:**
   ```bash
   npm run dev
   ```

3. **Проверьте роуты:**
   - http://localhost:4321/en/about
   - http://localhost:4321/ru/about
   - http://localhost:4321/en/bookme
   - http://localhost:4321/ru/bookme

4. **В DevTools проверьте:**
   - Cal.com embed.js загружается без ошибок
   - `calLink` не пустой в консоли
   - Нет ошибок инициализации

## 📋 Checklist

- [x] Все роуты `/en|ru/about` рендерятся без ошибок
- [x] Все роуты `/en|ru/bookme` рендерятся без ошибок  
- [x] Navbar импортируется из правильного пути `@app/widgets/...`
- [x] Cal.com embed показывает fallback при отсутствии env переменной
- [x] Cal.com embed загружается устойчиво к гонкам
- [x] Линтер проходит без ошибок
- [x] Никаких изменений в стилях/теме/навигации

## 🎯 Итог

Обе проблемы полностью исправлены с минимальными точечными правками. Все роуты работают, Cal.com embed загружается корректно.
