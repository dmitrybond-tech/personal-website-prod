# 🚀 Настройка Caddy CDN для статики на VPS

## 📋 Архитектура

- **Caddy на хосте** (systemd) - раздаёт статику напрямую
- **Astro SSR в Docker** (контейнер) - обрабатывает динамику
- **Docker Volume** - примонтирован к контейнеру, читается Caddy

```
┌─────────┐
│ Browser │
└────┬────┘
     │
┌────▼────────────────────────┐
│ Caddy (хост systemd)        │
├─────────────────────────────┤
│ /_astro/*  → /var/lib/docker/volumes/.../_data  │ (статика)
│ /fonts/*   → /var/lib/docker/volumes/.../_data  │ (статика)
│ /uploads/* → /var/lib/docker/volumes/.../_data  │ (статика)
│ /*         → 127.0.0.1:3000                      │ (динамика)
└─────────────────────────────┘
                 │
        ┌────────▼────────┐
        │ Astro SSR       │
        │ (Docker)        │
        └─────────────────┘
```

---

## 🔧 ШАГ 1: Обновите compose.yml на VPS

```bash
ssh root@vmi2817818
cd /opt/prod

# Создайте backup
cp compose.yml compose.yml.backup.$(date +%Y%m%d_%H%M%S)

# Отредактируйте compose.yml
nano compose.yml
```

**Найдите секцию `services.website-prod` и добавьте `volumes`:**

```yaml
services:
  website-prod:
    image: ghcr.io/dmitrybond-tech/personal-website-prod:main
    container_name: website-prod
    restart: unless-stopped
    env_file: .env.prod
    ports:
      - "127.0.0.1:3000:3000"
    
    # ДОБАВЬТЕ ЭТО:
    volumes:
      - website-static:/app/apps/website/dist/client:ro
    
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

# ДОБАВЬТЕ ЭТО В КОНЕЦ ФАЙЛА:
volumes:
  website-static:
    driver: local
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🔧 ШАГ 2: Узнайте имя Docker volume

```bash
# Перезапустите контейнер чтобы создался volume
cd /opt/prod
docker compose down
docker compose --env-file .env.prod up -d

# Подождите пока контейнер станет healthy
docker ps

# Узнайте полное имя volume
docker volume ls | grep static

# Должно быть что-то типа: prod_website-static
```

**Запомните имя volume!** Например: `prod_website-static`

---

## 🔧 ШАГ 3: Обновите Caddyfile на VPS

```bash
# Создайте backup
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.$(date +%Y%m%d_%H%M%S)

# Отредактируйте Caddyfile
nano /etc/caddy/Caddyfile
```

**Замените содержимое на:**

```caddyfile
{
  email dima@dmitrybond.tech
}

# Матчеры для статики
@static {
  path /_astro/* /fonts/* /uploads/* /favicon.ico /robots.txt /sitemap.xml /manifest.webmanifest
}

@css path *.css
@js path *.js *.mjs
@woff2 path *.woff2
@woff path *.woff
@png path *.png
@jpg path *.jpg *.jpeg
@svg path *.svg
@webp path *.webp
@ico path *.ico

dmitrybond.tech, www.dmitrybond.tech {
  encode zstd gzip

  # Статика из Docker volume
  handle @static {
    # ЗАМЕНИТЕ prod_website-static на реальное имя из шага 2!
    root * /var/lib/docker/volumes/prod_website-static/_data
    file_server
    
    # Кэш для хэшированных файлов
    @hashed path /_astro/* /fonts/*
    header @hashed Cache-Control "public, max-age=31536000, immutable"
    
    # Кэш для uploads
    @uploads path /uploads/*
    header @uploads Cache-Control "public, max-age=31536000"
    
    # Короткий кэш для корневых файлов
    @root path /favicon.ico /robots.txt /sitemap.xml /manifest.webmanifest
    header @root Cache-Control "public, max-age=3600"
    
    # Content-Type
    header @css Content-Type "text/css; charset=utf-8"
    header @js Content-Type "application/javascript; charset=utf-8"
    header @woff2 Content-Type "font/woff2"
    header @woff Content-Type "font/woff"
    header @png Content-Type "image/png"
    header @jpg Content-Type "image/jpeg"
    header @svg Content-Type "image/svg+xml"
    header @webp Content-Type "image/webp"
    header @ico Content-Type "image/x-icon"
  }

  # Безопасные заголовки
  header {
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    -X-Powered-By
    -Server
  }

  # Всё остальное на Astro SSR
  reverse_proxy 127.0.0.1:3000 {
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
    header_up X-Forwarded-Host {host}
  }

  log {
    output file /var/lib/caddy/logs/website_access.log {
      roll_size 10MiB
      roll_keep 10
      roll_keep_for 720h
    }
    format json
  }
}

# Mailcow
mail.dmitrybond.tech, autodiscover.dmitrybond.tech, autoconfig.dmitrybond.tech {
  encode zstd gzip
  reverse_proxy 127.0.0.1:8080
  log {
    output file /var/lib/caddy/logs/mail_access.log {
      roll_size 10MiB
      roll_keep 10
      roll_keep_for 720h
    }
    format json
  }
}
```

**ВАЖНО:** Замените `prod_website-static` на реальное имя volume из шага 2!

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🔧 ШАГ 4: Проверьте и перезагрузите Caddy

```bash
# Проверьте синтаксис
caddy validate --config /etc/caddy/Caddyfile

# Если ошибок нет - перезагрузите
systemctl reload caddy

# Проверьте статус
systemctl status caddy

# Проверьте логи
journalctl -u caddy -n 20 --no-pager
```

---

## ✅ ШАГ 5: ПРОВЕРКА

### 5.1 Проверьте что файлы есть в volume

```bash
# Узнайте имя volume
VOLUME_NAME=$(docker volume ls | grep static | awk '{print $2}')
echo "Volume: $VOLUME_NAME"

# Проверьте содержимое
ls -la /var/lib/docker/volumes/$VOLUME_NAME/_data/
ls -la /var/lib/docker/volumes/$VOLUME_NAME/_data/_astro/ 2>/dev/null || echo "Нет папки _astro"
ls -la /var/lib/docker/volumes/$VOLUME_NAME/_data/fonts/ 2>/dev/null || echo "Нет папки fonts"
```

**Если папок нет** - проверьте путь в `compose.yml` (`volumes:` секция).

### 5.2 Проверьте загрузку статики

```bash
# CSS (замените имя файла на реальный)
curl -sI https://dmitrybond.tech/_astro/index.DfP9kY9R.css | head -15

# Ожидается:
# HTTP/2 200
# Content-Type: text/css; charset=utf-8
# Cache-Control: public, max-age=31536000, immutable

# Шрифт
curl -sI https://dmitrybond.tech/fonts/Inter-roman.var.woff2 | head -15

# Ожидается:
# HTTP/2 200
# Content-Type: font/woff2
# Cache-Control: public, max-age=31536000, immutable
```

### 5.3 Проверьте в браузере

1. Откройте https://dmitrybond.tech/
2. **Hard refresh:** `Ctrl+Shift+R`
3. **DevTools → Network** - проверьте:
   - CSS файлы загружаются с `200 OK`
   - `Cache-Control: public, max-age=31536000, immutable`
   - Стили применяются, шрифты работают

---

## 🔄 ОБНОВЛЕНИЕ СТАТИКИ ПРИ ДЕПЛОЕ

Статика обновляется **автоматически** при деплое, так как:
1. GitHub Actions пушит новый образ
2. VPS пуллит новый образ и перезапускает контейнер
3. Docker volume `website-static` автоматически обновляется из контейнера
4. Caddy читает обновлённые файлы

**Ничего дополнительно делать не нужно!** 🎉

---

## 🚨 TROUBLESHOOTING

### Проблема: "404 Not Found" на статику

**Причина:** Неправильный путь к volume в Caddyfile.

**Решение:**
```bash
# Узнайте точный путь
docker volume inspect prod_website-static | grep Mountpoint

# Обновите Caddyfile с правильным путём
nano /etc/caddy/Caddyfile
systemctl reload caddy
```

### Проблема: "Permission denied" в логах Caddy

**Причина:** Caddy не может читать файлы из volume.

**Решение:**
```bash
# Узнайте под каким пользователем работает Caddy
ps aux | grep caddy

# Дайте права на чтение
VOLUME_NAME=$(docker volume ls | grep static | awk '{print $2}')
chmod -R a+rX /var/lib/docker/volumes/$VOLUME_NAME/_data/
```

### Проблема: Volume пустой

**Причина:** Неправильный путь в `compose.yml`.

**Решение:**
```bash
# Проверьте структуру внутри контейнера
docker exec website-prod ls -la /app/apps/website/dist/

# Если нет папки client - найдите правильный путь
docker exec website-prod find /app -name "_astro" -type d

# Обновите compose.yml с правильным путём
nano /opt/prod/compose.yml
# volumes:
#   - website-static:/ПРАВИЛЬНЫЙ/ПУТЬ:ro

# Перезапустите
docker compose down
docker compose --env-file .env.prod up -d
```

---

## ✅ РЕЗУЛЬТАТ

После настройки:
- ✅ **Статика раздаётся мгновенно** (Caddy читает напрямую из диска)
- ✅ **Правильные Cache-Control** (год кэша + immutable)
- ✅ **Правильные Content-Type** (нет MIME ошибок)
- ✅ **Автоматическое обновление** (при каждом деплое)
- ✅ **Разгрузка Astro SSR** (только динамика)

**Сайт работает быстро и стабильно!** 🚀

