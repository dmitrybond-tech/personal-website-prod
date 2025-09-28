# Cal.com Integration - Safe Webhook + Embed Widget

## 🎯 Цель
Реализовать безопасную интеграцию Cal.com вебхуков и embed виджета с минимальными точечными правками в существующую архитектуру.

## ✅ Что реализовано

### 🔐 Безопасный вебхук эндпойнт
- **Путь:** `/api/cal/webhook` (Astro endpoint)
- **Runtime:** Node.js
- **Безопасность:** 
  - RAW body чтение до JSON.parse
  - HMAC-SHA256 верификация с `crypto.timingSafeEqual`
  - Case-insensitive заголовок `x-cal-signature-256`
  - Timing-safe сравнение буферов
- **Производительность:** Fire-and-forget асинхронная обработка
- **Логирование:** Структурированные логи (dev: console.info, prod: заглушка)

### 📅 Cal.com Embed виджет
- **Компонент:** `apps/website/src/widgets/cal/CalEmbed.astro`
- **Функции:**
  - Асинхронная загрузка Cal.com скрипта
  - Поддержка темной темы
  - Локализация (EN/RU)
  - Fallback при ошибках
- **Интеграция:** Читает `CAL_EMBED_LINK` из env

### 🌐 Обновленные страницы
- **EN:** `/en/bookme` - "Book a Meeting"
- **RU:** `/ru/bookme` - "Записаться на встречу"
- **Навигация:** Существующие ссылки в navbar работают

### ⚙️ Конфигурации
- **Astro:** Поддержка `TUNNEL_HOSTS` из env для туннелей
- **Env:** Добавлены `CAL_WEBHOOK_SECRET`, `CAL_EMBED_LINK`, `TUNNEL_HOSTS`
- **Package.json:** Скрипты управления вебхуками

### 🛠️ Утилиты
- **Скрипт:** `scripts/cal-webhook.mjs` для создания/обновления вебхуков
- **Команды:** `npm run cal:webhook:create|update|list`
- **Тесты:** Unit-тесты для `verifySignature` функции

## 🔧 Как проверить

### 1. Локальная разработка
```bash
cd apps/website
cp env.example .env.local
# Отредактируйте .env.local с вашими значениями
npm run dev
```

### 2. Проверка страниц
- http://localhost:4321/en/bookme
- http://localhost:4321/ru/bookme

### 3. Тестирование вебхука
```bash
# Настройте туннель (ngrok)
export PUBLIC_URL="https://your-ngrok-url.ngrok-free.app"
npm run cal:webhook:create
```

### 4. Unit-тесты
```bash
npm test src/server/cal/verify.test.ts
```

## 📋 Checklist

### Функциональность
- [x] Страницы bookme загружаются
- [x] Cal.com виджет отображается
- [x] Локализация работает
- [x] Темная тема поддерживается
- [x] Навигация работает
- [x] Вебхук эндпойнт отвечает

### Безопасность
- [x] Верификация подписи работает
- [x] Неверные подписи отклоняются (401)
- [x] RAW body читается корректно
- [x] Timing-safe сравнение
- [x] Секреты не логируются

### Производительность
- [x] Быстрый ответ вебхука (204/200)
- [x] Асинхронная обработка
- [x] Асинхронная загрузка Cal.com
- [x] Нет блокирующих операций

## 🚀 Готово к продакшену

Все компоненты протестированы и готовы к использованию:
- ✅ Безопасная верификация подписи
- ✅ Минимальные изменения в коде
- ✅ Поддержка туннелей
- ✅ Локализация и темы
- ✅ Unit-тесты
- ✅ Утилиты управления

## 📚 Документация

Подробная инструкция: `CAL_INTEGRATION_README.md`
