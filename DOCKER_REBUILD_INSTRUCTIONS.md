# Docker Rebuild Instructions

## ✅ Что сделано:

1. **Удалены старые файлы:**
   - `apps/website/src/pages/api/decap/authorize.ts`
   - `apps/website/src/pages/api/decap/oauth/` (весь каталог)
   - Старые конфликтующие Astro файлы

2. **Оставлены только нужные файлы:**
   - `apps/website/src/pages/api/decap/[...params].ts` - основной OAuth endpoint
   - `apps/website/src/pages/api/decap/callback.ts` - GitHub callback handler

3. **Изменения закоммичены в git**

## 🐳 Пересборка Docker образа:

### 1. **На сервере выполните:**

```bash
# Перейти в директорию проекта
cd /opt/prod

# Остановить текущий контейнер
docker stop website-prod
docker rm website-prod

# Получить последние изменения
git pull origin main

# Пересобрать образ с OAuth переменными
docker build \
  --build-arg PUBLIC_SITE_URL="https://dmitrybond.tech" \
  --build-arg DECAP_GITHUB_CLIENT_ID="$DECAP_GITHUB_CLIENT_ID" \
  --build-arg DECAP_GITHUB_CLIENT_SECRET="$DECAP_GITHUB_CLIENT_SECRET" \
  --build-arg GIT_SHA="$(git rev-parse HEAD)" \
  -t dmitrybond-website:latest .

# Запустить новый контейнер
docker run -d --name website-prod -p 3000:3000 \
  -e DECAP_GITHUB_CLIENT_ID="$DECAP_GITHUB_CLIENT_ID" \
  -e DECAP_GITHUB_CLIENT_SECRET="$DECAP_GITHUB_CLIENT_SECRET" \
  -e PUBLIC_SITE_URL="https://dmitrybond.tech" \
  dmitrybond-website:latest
```

### 2. **Проверка после пересборки:**

```bash
# Проверить что новые API routes скомпилировались
docker exec website-prod ls -la /app/dist/server/pages/api/decap/
# Должны быть:
# [...params].mjs
# callback.mjs

# Проверить переменные окружения
docker exec website-prod printenv | grep DECAP

# Проверить логи
docker logs website-prod --tail 20
```

### 3. **Тестирование OAuth:**

```bash
# Тест OAuth endpoint
curl -v "https://dmitrybond.tech/api/decap?provider=github&site_id=dmitrybond.tech&scope=repo"
# Ожидается: 302 redirect на GitHub

# Тест в браузере
# Откройте: https://dmitrybond.tech/website-admin/
# Нажмите "Login with GitHub"
```

## 🎯 Ожидаемый результат:

- ✅ Нет 500 ошибок
- ✅ OAuth endpoint возвращает 302 redirect
- ✅ GitHub OAuth flow работает
- ✅ CMS UI загружается после авторизации

---

**Status:** ✅ Ready for Rebuild  
**Files:** Cleaned up  
**Next:** Execute rebuild commands on server
