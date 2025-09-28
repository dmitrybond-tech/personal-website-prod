# Debugging Cal Webhooks

## 🔍 Максимальное логирование и отладка

Вебхук Cal.com теперь поддерживает детальное логирование для удобной отладки. Все диагностические данные логируются в структурированном JSON формате.

### Переменные окружения для отладки

```bash
# В .env.local
CAL_DEBUG=1                    # Включает детальное логирование
CAL_DUMP_WEBHOOKS_DIR=var/webhooks  # Папка для сохранения сырых данных
```

### Логируемые поля

При `CAL_DEBUG=1` вебхук логирует следующие поля:

**Диагностическая информация (`cal.webhook.check`):**
- `requestId` - уникальный ID запроса (UUID)
- `method` - HTTP метод (POST)
- `url` - путь запроса
- `ip` - IP адрес клиента (из заголовков x-forwarded-for, cf-connecting-ip)
- `ua` - User-Agent
- `ct` - Content-Type
- `bodyLen` - размер тела запроса в байтах
- `bodySha` - SHA256 хэш тела запроса
- `hasSigHeader` - наличие заголовка подписи
- `sigHeaderLen` - длина заголовка подписи
- `localSigLen` - длина локальной подписи
- `sigEqual` - результат сравнения подписей
- `timestamp` - время обработки
- `processingTimeMs` - время обработки в миллисекундах

**Информация о событии (`cal.webhook.success`):**
- `requestId` - ID запроса
- `event` - полный объект события
- `triggerEvent` - тип события (BOOKING_CREATED, BOOKING_RESCHEDULED, etc.)
- `bookingId` - ID бронирования
- `timestamp` - время обработки
- `processingTimeMs` - время обработки

**Обработка события (`cal.webhook.process`):**
- `requestId` - ID запроса
- `triggerEvent` - тип события
- `bookingId` - ID бронирования
- `payload` - данные события
- `fullEvent` - полный объект события

### Сохранение сырых данных

При включенном `CAL_DEBUG=1` и указанной `CAL_DUMP_WEBHOOKS_DIR`:
- Создается папка для сохранения (если не существует)
- Каждый вебхук сохраняется в файл: `{timestamp}-{requestId}.json`
- Файлы содержат сырое тело запроса для анализа

### Заголовки ответов

Все ответы вебхука содержат заголовок `x-debug-id` с уникальным ID запроса для трассировки.

### Примеры логов

```json
{
  "level": "info",
  "msg": "cal.webhook.check",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "method": "POST",
  "url": "/api/cal/webhook",
  "ip": "192.168.1.1",
  "ua": "Cal.com-Webhook/1.0",
  "ct": "application/json",
  "bodyLen": 1024,
  "bodySha": "a1b2c3d4e5f6...",
  "hasSigHeader": true,
  "sigHeaderLen": 64,
  "localSigLen": 64,
  "sigEqual": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "processingTimeMs": 45
}
```

### Обработка ошибок

**Ошибки конфигурации:**
- `server-misconfigured: missing CAL_WEBHOOK_SECRET` (500)
- `missing-signature` (401)
- `invalid-signature` (401) - с первыми 8 символами подписей для отладки

**Ошибки данных:**
- `Invalid JSON` (400) - при ошибке парсинга JSON

Все ошибки логируются с `requestId` для трассировки.

### Как использовать

1. **Включите отладку:**
   ```bash
   CAL_DEBUG=1
   CAL_DUMP_WEBHOOKS_DIR=var/webhooks
   ```

2. **Отправьте тестовый вебхук** и проверьте логи

3. **Анализируйте сохраненные файлы** в папке `var/webhooks/`

4. **Используйте `requestId`** из заголовка `x-debug-id` для поиска в логах

### Безопасность

- В DEBUG режиме логируются только первые 8 символов подписей
- Сырые данные сохраняются только локально
- В продакшене рекомендуется отключить `CAL_DEBUG=0`
