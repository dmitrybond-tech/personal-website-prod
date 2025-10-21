# SSR Static Asset Fix - ROLLBACK

## Дата: 2025-10-21

## Причина отката

Попытка добавить Express wrapper для раздачи статики (`/_astro`, `/fonts`, `/uploads`) с правильными заголовками привела к проблемам при деплое:
- Контейнер не запускался
- Возможные проблемы с зависимостями Express/compression
- Порт 3000 конфликтовал

**Решение:** Откат к стандартному Astro SSR (без Express wrapper).

---

## Что было откачено

### 1. ✅ Удалён файл
- `apps/website/src/server.mjs` - custom Express server

### 2. ✅ Восстановлен `apps/website/package.json`
**Убраны зависимости:**
```json
"express": "^4.21.2",
"compression": "^1.7.5",
"@types/express": "^5.0.0",
"@types/compression": "^1.7.5"
```

**Восстановлен start script:**
```json
"start": "node ./dist/server/entry.mjs"  // было: server.mjs
```

### 3. ✅ Восстановлен `apps/website/Dockerfile`
**Убрано:**
```dockerfile
RUN cp /app/apps/website/src/server.mjs /app/apps/website/dist/server/server.mjs
```

**Восстановлено:**
```dockerfile
HEALTHCHECK ... CMD node -e "fetch('http://127.0.0.1:3000/')..."  // было: /_healthz
CMD ["node", "./dist/server/entry.mjs"]  // было: server.mjs
```

### 4. ✅ Восстановлен `apps/website/astro.config.ts`
**Убрано:**
```typescript
base: '/',
trailingSlash: 'never',
build: { assets: '_astro' }
```

---

## Текущее состояние

### Работает:
- ✅ Стандартный Astro SSR через Node adapter
- ✅ `src/middleware.ts` добавляет Cache-Control заголовки
- ✅ Caddy проксирует на `:3000`

### Статика раздаётся:
- **Через Astro Node adapter** (встроенная функциональность)
- **Middleware** (`src/middleware.ts`) добавляет заголовки:
  - `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable`
  - `/fonts/*` → `Cache-Control: public, max-age=31536000, immutable`
  - `/uploads/*` → `Cache-Control: public, max-age=86400`
  - HTML → `Cache-Control: no-store, max-age=0, must-revalidate`

---

## Следующие шаги

### Деплой отката:
```bash
# 1. Закоммитить откат
git add .
git commit -m "revert: rollback Express wrapper for static assets

- Remove custom Express server (server.mjs)
- Restore original Astro SSR setup
- Remove express/compression dependencies
- Fix Docker healthcheck and CMD

Reason: Container startup issues, deployment problems"

# 2. Запушить
git push origin main

# 3. GitHub Actions пересоберёт образ
# 4. Деплой на VPS произойдёт автоматически
```

### На VPS после деплоя:
```bash
# Проверить что контейнер запустился
docker logs website-prod -f

# Проверить что сайт отвечает
curl http://localhost:3000/
curl https://dmitrybond.tech/
```

---

## Альтернативные решения (на будущее)

### Вариант 1: Caddy раздаёт статику напрямую
Настроить Caddy для раздачи статики из `/var/www/static` с правильными заголовками.

**Плюсы:** Быстро, надёжно, без изменений в коде  
**Минусы:** Нужно синхронизировать статику между контейнером и хостом

### Вариант 2: Использовать встроенные возможности Astro
Astro Node adapter уже умеет раздавать статику. Возможно достаточно правильно настроить middleware.

**Плюсы:** Не нужен Express  
**Минусы:** Меньше контроля над заголовками

### Вариант 3: Правильно интегрировать Express (если очень нужно)
- Установить зависимости ПЕРЕД билдом
- Использовать правильный адаптер для Express + Astro
- Тщательно протестировать локально

**Плюсы:** Полный контроль  
**Минусы:** Сложнее, больше зависимостей

---

## Статус

✅ **Откат завершён**  
⏳ **Ожидание пуша и автоматического деплоя**

---

**Автор:** AI Assistant  
**Дата:** 2025-10-21  
**Связанные файлы:** `SSR_STATIC_ASSET_FIX*.md` (теперь неактуальны)

