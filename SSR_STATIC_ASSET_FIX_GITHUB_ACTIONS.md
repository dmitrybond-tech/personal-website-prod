# SSR Static Asset Fix - GitHub Actions Deployment Guide

## 🎯 Специально для вашего проекта (GHCR → VPS)

Ваш проект использует автоматический деплой через GitHub Actions:
- **`ci-docker.yml`** - собирает образ и пушит в GHCR
- **`deploy-preprod.yml`** - деплоит на preprod и VPS

**Всё будет работать автоматически!** ✅

---

## ✅ Что уже сделано

### Изменённые файлы:
1. ✅ **`apps/website/src/server.ts`** (создан) - Express server с раздачей статики
2. ✅ **`apps/website/astro.config.ts`** - добавлены `base`, `trailingSlash`, `build.assets`
3. ✅ **`apps/website/package.json`** - добавлены express/compression, postbuild script
4. ✅ **`apps/website/Dockerfile`** - обновлён CMD и healthcheck

---

## 🚀 Как задеплоить

### Вариант 1: Автоматический (рекомендуется)

Просто запушьте изменения в `main`:

```bash
# Из корня репозитория
git add .
git commit -m "fix: SSR static asset delivery with Express wrapper"
git push origin main
```

**Что произойдёт автоматически:**

1. **GitHub Actions `ci-docker.yml` запустится:**
   ```
   ✓ Checkout кода (с LFS для uploads)
   ✓ npm ci (установит зависимости включая express/compression)
   ✓ npm run --workspace apps/website build
     ├─ astro build (соберёт dist/server/entry.mjs и dist/client)
     └─ postbuild: tsc src/server.ts → dist/server/server.mjs
   ✓ Docker build с apps/website/Dockerfile
     ├─ Скопирует dist и node_modules
     └─ CMD запустит dist/server/server.mjs
   ✓ Push образа в ghcr.io/your-repo:latest и :sha-xxxxx
   ```

2. **GitHub Actions `deploy-preprod.yml` запустится:**
   ```
   ✓ Login в GHCR
   ✓ Pull нового образа
   ✓ Restart контейнера website-preprod
   ✓ SSH на VPS
     ├─ docker compose pull
     └─ docker compose up -d --force-recreate
   ✓ Health check через curl
   ```

---

### Вариант 2: Ручной (если нужно)

Если GitHub Actions отключены или нужен локальный тест:

```bash
# 1. Установить зависимости
cd apps/website
npm install

# 2. Локальная сборка и тест
npm run build
npm start

# В другом терминале:
curl http://localhost:3000/_healthz
# Ожидается: ok

# 3. Docker сборка (как в CI)
cd ../..
docker build -f apps/website/Dockerfile -t test-website .

# 4. Запуск
docker run -d -p 3000:3000 --name test-website \
  -e NODE_ENV=production \
  test-website

# 5. Проверка
curl http://localhost:3000/_healthz
curl -I http://localhost:3000/fonts/Inter-roman.var.woff2

# 6. Остановка
docker rm -f test-website
```

---

## 🔍 Проверка после деплоя

После того как GitHub Actions завершится (обычно 3-5 минут):

### 1. Проверить GitHub Actions
```
https://github.com/YOUR-USERNAME/YOUR-REPO/actions
```
Убедитесь что оба workflow зелёные ✅

### 2. Проверить preprod
```bash
# Healthcheck
curl https://pre-prod.dmitrybond.tech/_healthz
# Ожидается: ok

# CSS
css=$(curl -s https://pre-prod.dmitrybond.tech/en/about | grep -o '/_astro/[^"]\+\.css' | head -n1)
curl -sI "https://pre-prod.dmitrybond.tech$css" | egrep -i 'cache-control|content-type'
# Ожидается:
#   Content-Type: text/css; charset=utf-8
#   Cache-Control: public, max-age=31536000, immutable
```

### 3. Проверить production VPS
```bash
# Healthcheck
curl https://dmitrybond.tech/_healthz
# Ожидается: ok

# Font
curl -sI https://dmitrybond.tech/fonts/Inter-roman.var.woff2 | egrep -i 'cache-control|content-type'
# Ожидается:
#   Content-Type: font/woff2
#   Cache-Control: public, max-age=31536000, immutable

# Upload
curl -sI https://dmitrybond.tech/uploads/logos/brand-ricoh-custom.png | egrep -i 'cache-control|content-type'
```

### 4. Проверить в браузере
1. Откройте https://dmitrybond.tech/en/about
2. DevTools → Network
3. Убедитесь:
   - ✅ Нет 404 на `/_astro/*.css`
   - ✅ Нет 404 на `/fonts/*.woff2`
   - ✅ Стили применяются корректно
   - ✅ Headers: `Cache-Control: public, max-age=31536000, immutable`

---

## 🐛 Troubleshooting

### Проблема: Build failed в GitHub Actions

**Симптом:**
```
Error: Cannot find module 'express'
```

**Решение:** Убедитесь что изменения в `package.json` закоммичены:
```bash
git status
git add apps/website/package.json
git commit -m "chore: add express dependencies"
git push origin main
```

---

### Проблема: Healthcheck fails в Docker

**Симптом:**
```
Health check failed after 3 retries
```

**Решение:** Проверьте логи контейнера:
```bash
# На VPS
ssh YOUR_USER@YOUR_VPS_HOST
docker logs preprod-website

# Должно быть:
# ✅ SSR server running on http://0.0.0.0:3000
```

---

### Проблема: 404 на статику после деплоя

**Симптом:**
```
GET /_astro/index.abc123.css → 404
```

**Решение:** Проверьте что `server.mjs` скомпилировался:
```bash
# Локально
ls -la apps/website/dist/server/
# Должны быть: entry.mjs и server.mjs

# В Docker образе (локально)
docker run --rm test-website ls -la /app/dist/server/
```

Если `server.mjs` отсутствует - проверьте что `postbuild` script запустился:
```bash
cd apps/website
npm run build
# Должно показать: "build" → "postbuild"
```

---

### Проблема: Deploy на VPS failed

**Симптом:**
```
ERROR: compose.yml not found in /opt/preprod
```

**Решение:** Убедитесь что на VPS есть `compose.yml`:
```bash
ssh YOUR_USER@YOUR_VPS_HOST
cd /opt/preprod
cat compose.yml
```

Если файла нет - создайте его вручную на VPS или через GitHub Actions checkout.

---

## 📊 Ожидаемые метрики

После успешного деплоя:

| Метрика | До | После |
|---------|-----|-------|
| 404 на CSS | ❌ Часто | ✅ Никогда |
| Cache-Control для CSS | ❌ Отсутствует | ✅ immutable, 1 год |
| Content-Type для fonts | ❌ Неправильный | ✅ font/woff2 |
| Lighthouse Score | 🔴 ~60 | 🟢 ~90+ |
| Docker healthcheck | ❌ Fails | ✅ Passes |

---

## 🎉 Готово!

После пуша в `main`:
1. ⏱️ Подождите 3-5 минут (пока GitHub Actions соберёт и задеплоит)
2. ✅ Проверьте https://dmitrybond.tech/_healthz
3. 🎨 Откройте сайт - стили должны применяться
4. 🚀 Наслаждайтесь быстрой и стабильной раздачей статики!

---

**Вопросы?** См. полную документацию в `SSR_STATIC_ASSET_FIX.md`

**Rollback?** См. инструкции в `SSR_STATIC_ASSET_FIX_QUICKREF.md`

