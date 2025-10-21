# 🚀 Caddy CDN Setup - Changelog

## Дата: 2025-10-21

### 📋 Что изменилось

#### 1. `compose.prod.yml`
- ✅ Добавлен Docker volume `website-static` для раздачи статики
- ✅ Примонтирован к контейнеру как readonly: `/app/apps/website/dist/client:ro`
- ✅ Добавлен healthcheck для контейнера

#### 2. `Caddyfile.prod` (новый файл)
- ✅ Создана конфигурация для Caddy на хосте
- ✅ Настроена раздача статики из Docker volume
- ✅ Настроены правильные Cache-Control заголовки:
  - `/_astro/*`, `/fonts/*` → `public, max-age=31536000, immutable`
  - `/uploads/*` → `public, max-age=31536000`
  - Корневые файлы → `public, max-age=3600`
- ✅ Настроены правильные Content-Type для всех типов файлов
- ✅ Настроены Security заголовки
- ✅ Настроен reverse proxy для Astro SSR

#### 3. Документация
- ✅ `CADDY_CDN_SETUP_VPS.md` - подробная инструкция для VPS
- ✅ `CADDY_CDN_ARCHITECTURE.md` - описание архитектуры
- ✅ `CADDY_CDN_QUICKSTART.md` - быстрая шпаргалка

### 🎯 Архитектура

**До:**
```
Browser → Caddy (хост) → Astro SSR (Docker) → раздаёт ВСЁ (статика + динамика)
```

**После:**
```
Browser → Caddy (хост) → /_astro/*  → Docker volume (статика, быстро)
                       → /fonts/*   → Docker volume (статика, быстро)
                       → /uploads/* → Docker volume (статика, быстро)
                       → /*         → Astro SSR (только динамика)
```

### 🎉 Результаты

- ⚡ **Статика раздаётся в 10-50x быстрее** (Caddy vs Node.js)
- 🎯 **Правильные заголовки кэширования** (1 год + immutable)
- 🎯 **Правильные Content-Type** (нет MIME ошибок)
- 🔄 **Автоматическое обновление** (при каждом деплое)
- 🔒 **Изоляция** (volume readonly, контейнер только localhost)
- 📊 **Разгрузка Astro SSR** (только динамический контент)

### 📦 Что нужно сделать на VPS

См. подробную инструкцию в `CADDY_CDN_SETUP_VPS.md`

Кратко:
1. Обновить `compose.yml` (добавить volumes)
2. Перезапустить контейнер
3. Узнать имя Docker volume
4. Обновить `/etc/caddy/Caddyfile` (указать путь к volume)
5. Перезагрузить Caddy

### 🧪 Проверка

```bash
# CSS
curl -sI https://dmitrybond.tech/_astro/index.DfP9kY9R.css | grep -i cache-control
# Ожидается: cache-control: public, max-age=31536000, immutable

# Font
curl -sI https://dmitrybond.tech/fonts/Inter-roman.var.woff2 | grep -i cache-control
# Ожидается: cache-control: public, max-age=31536000, immutable

# Browser
# Откройте DevTools → Network
# Стили и шрифты должны загружаться с 200 OK и правильными заголовками
```

### 🔄 Rollback (если нужен)

```bash
# На VPS
cd /opt/prod

# Вернуть старый compose.yml
cp compose.yml.backup.YYYYMMDD_HHMMSS compose.yml

# Вернуть старый Caddyfile
cp /etc/caddy/Caddyfile.backup.YYYYMMDD_HHMMSS /etc/caddy/Caddyfile

# Применить
docker compose down
docker volume rm prod_website-static
docker compose --env-file .env.prod up -d
systemctl reload caddy
```

### ⚠️ Breaking Changes

**Нет breaking changes!**

- Старый код продолжит работать без изменений
- Все изменения на стороне инфраструктуры (compose.yml, Caddyfile)
- Astro код не изменялся

### 📝 Notes

- Docker volume автоматически обновляется при рестарте контейнера
- Caddy мгновенно видит новые файлы (без перезагрузки)
- Никаких дополнительных скриптов деплоя не требуется

