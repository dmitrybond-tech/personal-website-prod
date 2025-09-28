# Cal.com Webhook: Настройка под server рендеринг

## 🎯 Цель
Настроить apps/website под вебхук Cal.com с server рендерингом и безопасным GET-хэндлером для проверки конфигурации.

## ✅ Реализовано

### 1. Обновленная конфигурация Astro
- ✅ **@astrojs/node установлен** - для server рендеринга
- ✅ **output: 'hybrid'** - включен on-demand рендер для POST запросов
- ✅ **adapter закомментирован** - только для production build
- ✅ **Все существующие настройки сохранены** - alias, allowedHosts, vite конфигурация

### 2. Безопасный GET-хэндлер в webhook.ts
- ✅ **Проверка CAL_DEBUG** - GET доступен только при CAL_DEBUG=1
- ✅ **Безопасная информация** - НЕ отдает секрет, только статус
- ✅ **Диагностические данные** - mode, hasSecret, tunnel origin
- ✅ **404 при отключенном DEBUG** - безопасность по умолчанию

### 3. POST-логика без изменений
- ✅ **RAW body + HMAC + timingSafeEqual** - все как было
- ✅ **Максимальное логирование** - все диагностические данные
- ✅ **Асинхронная обработка** - fire-and-forget для производительности

## 📁 Измененные файлы

```
apps/website/
├── astro.config.mjs                              # Добавлен output: 'hybrid'
├── src/pages/api/cal/webhook.ts                  # Добавлен безопасный GET
└── package.json                                  # @astrojs/node установлен
```

## 🧪 Результаты тестирования

### ✅ Сервер запускается корректно:
- Astro v4.16.19 ready in 772ms
- Local: http://localhost:4321/
- Network: доступен на всех интерфейсах

### ✅ Страницы работают:
- `/en/bookme` - ✅ 200 (24ms, 26ms, 6ms, 5ms, 8ms)
- `/ru/bookme` - ✅ 200 (5ms)

### ✅ Вебхук работает:
- POST запросы обрабатываются (500 из-за отсутствия CAL_WEBHOOK_SECRET)
- GET запросы возвращают 404 (без CAL_DEBUG=1)
- Логирование работает корректно

### ✅ Конфигурация корректная:
- output: 'hybrid' включен
- POST запросы доступны
- Headers доступны в API routes

## 🔧 Как проверить

### 1. Запуск сервера
```bash
npm run dev
# или
npx astro dev
```

### 2. Проверка страниц
```bash
# Откройте в браузере:
http://localhost:4321/en/bookme
http://localhost:4321/ru/bookme
```

### 3. Проверка вебхука
```bash
# GET запрос (без CAL_DEBUG=1)
curl http://localhost:4321/api/cal/webhook
# Должен вернуть 404

# POST запрос (без CAL_WEBHOOK_SECRET)
curl -X POST http://localhost:4321/api/cal/webhook
# Должен вернуть 500 с сообщением о missing CAL_WEBHOOK_SECRET
```

### 4. Проверка с отладкой
```bash
# Установите переменные окружения:
CAL_DEBUG=1
CAL_WEBHOOK_SECRET=test-secret

# GET запрос
curl http://localhost:4321/api/cal/webhook
# Должен вернуть JSON с информацией о конфигурации
```

## 🎯 Ключевые особенности

### Server рендеринг
- **output: 'hybrid'** - позволяет POST запросы в API routes
- **@astrojs/node** - установлен для production build
- **adapter закомментирован** - не мешает dev режиму

### Безопасный GET-хэндлер
- **Только при CAL_DEBUG=1** - безопасность по умолчанию
- **Не отдает секрет** - только статус hasSecret
- **Диагностическая информация** - mode, tunnel origin
- **404 при отключенном DEBUG** - скрывает существование endpoint

### POST-логика
- **Без изменений** - все как было
- **RAW body + HMAC** - безопасная проверка подписи
- **timingSafeEqual** - защита от timing атак
- **Максимальное логирование** - все диагностические данные

## 📋 Checklist

- [x] @astrojs/node установлен в package.json
- [x] output: 'hybrid' добавлен в astro.config.mjs
- [x] adapter закомментирован для dev режима
- [x] Все существующие настройки сохранены
- [x] Безопасный GET-хэндлер добавлен в webhook.ts
- [x] POST-логика без изменений
- [x] Сервер запускается корректно
- [x] Страницы работают (200)
- [x] Вебхук обрабатывает POST запросы
- [x] GET запросы безопасны (404 без DEBUG)
- [x] Логирование работает корректно
- [x] Линтер проходит без ошибок

## 🎉 Итог

apps/website успешно настроен под вебхук Cal.com:
- ✅ Server рендеринг включен (output: 'hybrid')
- ✅ @astrojs/node установлен для production
- ✅ Безопасный GET-хэндлер для проверки конфигурации
- ✅ POST-логика работает без изменений
- ✅ Все существующие настройки сохранены
- ✅ Сервер запускается и работает корректно

Готово к использованию! 🚀
