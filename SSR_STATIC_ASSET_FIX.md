# SSR Static Asset Delivery Fix

## Проблема

SSR-сервер (Astro Node adapter в standalone mode) не раздавал статику из `dist/client` автоматически. Симптомы:
- 404 на `/_astro/*.css`, `/fonts/*.woff2`, `/uploads/*`
- Неправильные Content-Type заголовки
- Отсутствие Cache-Control заголовков для статики

## Решение

Создан custom Express server wrapper, который:
1. Раздаёт статику из `dist/client` с правильными Content-Type
2. Устанавливает правильные Cache-Control заголовки:
   - `/_astro/*` - immutable, 1 год (хэшированные файлы)
   - `/fonts/*` - immutable, 1 год
   - `/uploads/*` - 1 год без immutable (можно обновлять)
   - HTML - no-store (динамический контент)
3. Использует Astro SSR handler для остального

## Изменённые файлы

### 1. `apps/website/src/server.ts` (СОЗДАН)
Custom Express server entry point с:
- Middleware для раздачи статики из `dist/client`
- Правильные Content-Type для CSS, JS, fonts
- Cache-Control заголовки по стратегии из `SSR_CACHE_POLICY.md`
- Healthcheck endpoint `/_healthz`
- Интеграция с Astro SSR handler

### 2. `apps/website/astro.config.ts`
Добавлены явные настройки:
```typescript
base: '/',                // корневой путь для ассетов
trailingSlash: 'never',   // без trailing slash
build: {
  assets: '_astro',       // папка для хэшированных бандлов
}
```

### 3. `apps/website/package.json`
- Добавлены dependencies: `express`, `compression`, `@types/express`
- Добавлены devDependencies: `@types/compression`
- Изменён `start` script: `node ./dist/server/server.mjs`
- Добавлен `postbuild` script: компиляция `src/server.ts` -> `dist/server/server.mjs`

### 4. `Dockerfile`
- Изменён CMD на запуск `dist/server/server.mjs`
- Добавлена установка production dependencies в runtime stage
- Healthcheck использует `/_healthz` вместо `/`

## Проверка работоспособности

### Локальная сборка
```bash
cd apps/website
npm install
npm run build
npm start
```

Проверить:
```bash
# Healthcheck
curl http://localhost:3000/_healthz

# CSS
curl -I http://localhost:3000/_astro/index.123abc.css

# Font
curl -I http://localhost:3000/fonts/Inter-roman.var.woff2

# Upload
curl -I http://localhost:3000/uploads/logos/brand-ricoh-custom.png
```

### Docker сборка
```bash
# Из корня репозитория
docker build -t website-test .

# Запуск
docker run -p 3000:3000 \
  -e PUBLIC_SITE_URL=http://localhost:3000 \
  -e NODE_ENV=production \
  website-test

# Проверка
curl http://localhost:3000/_healthz
```

### Production проверка (после деплоя)
```bash
# HTML - без кэша
curl -sI https://dmitrybond.tech/en/about | grep -i cache-control
# Ожидается: Cache-Control: no-store, max-age=0, must-revalidate

# CSS из HTML
css=$(curl -s https://dmitrybond.tech/en/about | grep -o '/_astro/[^" ]\+\.css' | head -n1)
curl -sI "https://dmitrybond.tech$css" | egrep -i '200|content-type|cache-control'
# Ожидается: 
#   200 OK
#   Content-Type: text/css; charset=utf-8
#   Cache-Control: public, max-age=31536000, immutable

# Шрифт
curl -sI https://dmitrybond.tech/fonts/Inter-roman.var.woff2 | egrep -i '200|content-type|cache-control'
# Ожидается:
#   200 OK
#   Content-Type: font/woff2
#   Cache-Control: public, max-age=31536000, immutable

# Картинка из uploads
curl -sI https://dmitrybond.tech/uploads/logos/brand-ricoh-custom.png | egrep -i '200|content-type|cache-control'
# Ожидается:
#   200 OK
#   Content-Type: image/png
#   Cache-Control: public, max-age=31536000
```

## Caddy конфигурация

Caddy остаётся без изменений - просто проксирует на `:3000`:
```caddyfile
dmitrybond.tech {
    reverse_proxy localhost:3000
    
    # Остальные настройки...
}
```

## Взаимодействие с существующим middleware

`src/middleware.ts` продолжает работать и добавляет дополнительные заголовки:
- CSP для HTML
- Безопасные заголовки для admin-страниц
- CORS для OAuth endpoints

Express server раздаёт статику **до** того как запрос дойдёт до Astro, поэтому middleware для статики не выполняется. Это ожидаемое поведение и даёт лучшую производительность.

## Критерии успеха

✅ HTML отдаётся без кэша (no-store)  
✅ CSS отдаётся с правильным Content-Type и immutable кэшем  
✅ Шрифты отдаются с правильным Content-Type и immutable кэшем  
✅ Uploads отдаются с длительным кэшем  
✅ Нет 404 на статику  
✅ Браузер применяет стили корректно  
✅ Healthcheck работает в Docker  

## Следующие шаги (опционально)

1. **Iconify офлайн**: Если нужно полностью избавиться от внешних зависимостей, можно добавить bundling иконок в build
2. **CDN**: Если нужно улучшить производительность, можно настроить CloudFlare/Cloudinary для статики
3. **Monitoring**: Добавить метрики для отслеживания cache hit rate

## Rollback

Если что-то пойдёт не так:

1. Вернуть `package.json`:
   ```bash
   git checkout apps/website/package.json
   ```

2. Удалить `src/server.ts`:
   ```bash
   rm apps/website/src/server.ts
   ```

3. Вернуть Dockerfile:
   ```bash
   git checkout Dockerfile
   ```

4. Пересобрать и задеплоить:
   ```bash
   npm run deploy:prod
   ```

