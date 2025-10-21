# SSR Static Asset Fix - Quick Reference

## ⚡ Что сделано (одной строкой)
Создан Express wrapper для Astro SSR, который раздаёт статику (`/_astro`, `/fonts`, `/uploads`) с правильными заголовками Cache-Control и Content-Type.

## 📝 Изменённые файлы

| Файл | Действие | Описание |
|------|----------|----------|
| `apps/website/src/server.ts` | ✨ Создан | Express server с раздачей статики |
| `apps/website/astro.config.ts` | ✏️ Изменён | Добавлены `base`, `trailingSlash`, `build.assets` |
| `apps/website/package.json` | ✏️ Изменён | Добавлены express/compression, изменён start script |
| `apps/website/Dockerfile` | ✏️ Изменён | CMD на server.mjs, healthcheck на `/_healthz` |
| `SSR_STATIC_ASSET_FIX.md` | 📖 Создан | Полная документация |
| `SSR_STATIC_ASSET_FIX_SUMMARY.md` | 📖 Создан | Краткая сводка |
| `SSR_STATIC_ASSET_FIX_CHANGELOG.md` | 📖 Создан | Детальный changelog |

## 🚀 Как задеплоить

### 1. Установить зависимости
```bash
cd apps/website
npm install
```

### 2. Проверить локально
```bash
npm run build
npm start
curl http://localhost:3000/_healthz
```

### 3. Задеплоить в production
```bash
cd ../..
npm run deploy:prod
```

### 4. Проверить в production
```bash
# HTML без кэша
curl -sI https://dmitrybond.tech/en/about | grep -i cache-control

# CSS с immutable кэшем
css=$(curl -s https://dmitrybond.tech/en/about | grep -o '/_astro/[^" ]\+\.css' | head -n1)
curl -sI "https://dmitrybond.tech$css" | egrep -i 'cache-control|content-type'

# Font с immutable кэшем
curl -sI https://dmitrybond.tech/fonts/Inter-roman.var.woff2 | egrep -i 'cache-control|content-type'

# Upload
curl -sI https://dmitrybond.tech/uploads/logos/brand-ricoh-custom.png | egrep -i 'cache-control|content-type'
```

## ✅ Ожидаемые результаты

| Путь | Content-Type | Cache-Control |
|------|--------------|---------------|
| `/en/about` | `text/html` | `no-store, max-age=0, must-revalidate` |
| `/_astro/*.css` | `text/css; charset=utf-8` | `public, max-age=31536000, immutable` |
| `/_astro/*.js` | `application/javascript` | `public, max-age=31536000, immutable` |
| `/fonts/*.woff2` | `font/woff2` | `public, max-age=31536000, immutable` |
| `/uploads/*.png` | `image/png` | `public, max-age=31536000` |

## 🔧 Troubleshooting

### Проблема: `Cannot find module 'express'`
**Решение:** Установить зависимости
```bash
cd apps/website
npm install
```

### Проблема: `Cannot find module './entry.mjs'`
**Решение:** Запустить билд
```bash
npm run build
```

### Проблема: Docker healthcheck fails
**Решение:** Проверить что сервер запустился
```bash
docker logs <container-id>
docker exec <container-id> curl http://localhost:3000/_healthz
```

### Проблема: 404 на статику в Docker
**Решение:** Проверить что `dist/client` скопирован в образ
```bash
docker exec <container-id> ls -la /app/dist/client/_astro
docker exec <container-id> ls -la /app/dist/client/fonts
```

## 🔙 Rollback

Если что-то пошло не так:

```bash
# 1. Откатить файлы
git checkout apps/website/package.json apps/website/astro.config.ts apps/website/Dockerfile

# 2. Удалить новый server
rm apps/website/src/server.ts

# 3. Переустановить зависимости
cd apps/website && npm install && cd ../..

# 4. Задеплоить (push в main запустит GitHub Actions)
git push origin main
```

## 📚 Дополнительная информация

- **Полная документация:** `SSR_STATIC_ASSET_FIX.md`
- **Changelog:** `SSR_STATIC_ASSET_FIX_CHANGELOG.md`
- **Summary:** `SSR_STATIC_ASSET_FIX_SUMMARY.md`
- **Caching policy:** `SSR_CACHE_POLICY.md`
- **Middleware:** `apps/website/src/middleware.ts`

## 💡 Важные замечания

1. **Caddy не требует изменений** - он просто проксирует на `:3000`
2. **Dev режим не затронут** - используй `npm run dev` как обычно
3. **Middleware продолжает работать** - для SSR responses
4. **Обратная совместимость** - все старые пути работают
5. **Production ready** - код готов к деплою

---

**Вопросы?** См. `SSR_STATIC_ASSET_FIX.md` или логи Docker: `docker logs website-prod`

