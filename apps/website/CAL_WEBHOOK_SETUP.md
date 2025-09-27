# Cal.com Webhook Setup Guide

## Обзор

Этот модуль реализует серверный вебхук для Cal.com с валидацией подписи HMAC-SHA256 и интеграцией с типами встреч (interview/tech/mentoring).

## Структура файлов

```
apps/website/src/
├── server/cal/
│   ├── verify.ts          # Проверка подписи HMAC-SHA256
│   └── store.ts           # Логирование событий в файлы
└── pages/api/cal/
    └── webhook.ts         # Astro API-маршрут вебхука
```

## Настройка

### 1. Переменные окружения

Создайте файл `apps/website/.env.local`:

```bash
# Секретный ключ из Cal.com
CAL_WEBHOOK_SECRET=your_secret_from_cal_com

# Опционально: пропустить проверку подписи в dev (только для разработки!)
CAL_WEBHOOK_DEV_SKIP_VERIFY=0
```

### 2. Настройка slug'ов

В файле `src/pages/api/cal/webhook.ts` обновите маппинг `slugToType`:

```typescript
const slugToType = new Map<string, BookingType>([
  ['your-interview-slug', 'interview'],
  ['your-tech-slug', 'tech'],
  ['your-mentoring-slug', 'mentoring'],
]);
```

### 3. Cal.com настройки

1. Войдите в Cal.com → Developers → Webhooks
2. Добавьте новый endpoint:
   - **URL**: `https://your-domain.com/api/cal/webhook`
   - **Secret**: тот же, что в `.env.local`
   - **Triggers**: Booking Created, Rescheduled, Cancelled

## Локальное тестирование

### 1. Запуск сервера

```bash
cd apps/website
npm run dev
# Сервер запустится на http://localhost:4321
```

### 2. Туннель (ngrok)

```bash
# Установите ngrok если не установлен
npm install -g ngrok

# Создайте туннель
ngrok http 4321

# Используйте https URL в настройках Cal.com
# Например: https://abc123.ngrok.io/api/cal/webhook
```

### 3. Тестирование

1. Настройте вебхук в Cal.com с ngrok URL
2. Сделайте тестовое бронирование через `/en/bookme` или `/ru/bookme`
3. Проверьте логи в консоли и файлы в папке `.cal-logs/`

## Логирование

События сохраняются в папку `.cal-logs/` в формате:
```
.cal-logs/
└── event-2024-01-15T10-30-45-123Z.json
```

Каждый файл содержит:
- Тип события (trigger)
- Slug и тип встречи (bookingType)
- Данные бронирования (время, участники)
- Полное событие от Cal.com

## Расширения

В файле `webhook.ts` в секции TODO можно добавить:

### Telegram уведомления
```typescript
// Отправка в Telegram
if (trigger === 'BOOKING_CREATED') {
  await sendTelegramNotification(bookingType, payload);
}
```

### Notion интеграция
```typescript
// Создание записи в Notion
await createNotionPage({
  type: bookingType,
  attendee: payload.attendee,
  time: payload.startTime
});
```

### База данных
```typescript
// Сохранение в БД
await db.bookings.create({
  type: bookingType,
  attendeeEmail: payload.attendee?.email,
  startTime: payload.startTime
});
```

## Безопасность

- ✅ Подпись HMAC-SHA256 проверяется строго
- ✅ Секреты не попадают в клиентский бандл
- ✅ Сырое тело запроса используется для проверки
- ✅ Обработка ошибок и валидация входных данных

## Мониторинг

Проверяйте:
- Логи в консоли сервера
- Файлы в `.cal-logs/`
- Статус ответов вебхука в Cal.com
- Ошибки в браузере при тестировании

## Troubleshooting

### Ошибка 401 "Invalid signature"
- Проверьте `CAL_WEBHOOK_SECRET` в `.env.local`
- Убедитесь, что секрет совпадает в Cal.com
- Проверьте, что используете HTTPS URL

### События не приходят
- Проверьте URL вебхука в Cal.com
- Убедитесь, что сервер доступен извне (ngrok)
- Проверьте выбранные триггеры в настройках

### Неправильный bookingType
- Обновите маппинг `slugToType` в `webhook.ts`
- Проверьте slug'и в Cal.com (payload.type)
- Добавьте логирование для отладки
