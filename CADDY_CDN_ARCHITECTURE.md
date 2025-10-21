# 🏗️ Архитектура: Caddy CDN + Astro SSR

## 📊 Обзор

**Цель:** Быстрая и стабильная раздача статики с правильными заголовками кэширования.

**Решение:** Разделение ответственности между Caddy (статика) и Astro SSR (динамика).

---

## 🎯 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Caddy (systemd на хосте)                   │
│─────────────────────────────────────────────────────────│
│  Роль: Reverse Proxy + Static CDN                       │
│                                                          │
│  Правила:                                               │
│  • /_astro/*  → Статика из Docker volume (immutable)    │
│  • /fonts/*   → Статика из Docker volume (immutable)    │
│  • /uploads/* → Статика из Docker volume (long cache)   │
│  • /*         → Proxy на :3000 (Astro SSR)              │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
             │ Читает                    │ Проксирует
             │ напрямую                  │ динамику
             ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  Docker Volume       │    │  Astro SSR (Docker)      │
│  website-static      │    │──────────────────────────│
│──────────────────────│    │  Роль: SSR рендеринг     │
│  /_astro/            │    │                          │
│  /fonts/             │    │  Обрабатывает:           │
│  /uploads/           │    │  • HTML страницы         │
│  /favicon.ico        │    │  • API endpoints         │
│  /robots.txt         │    │  • Динамический контент  │
└──────────────────────┘    └──────────────────────────┘
         ▲
         │
         │ Примонтирован (readonly)
         │
┌────────┴─────────────┐
│  Docker Container    │
│  website-prod        │
└──────────────────────┘
```

---

## 🔄 Поток запросов

### Статика (CSS, JS, fonts, images)

```
Browser
  │
  ├─→ GET /_astro/index.abc123.css
  │
  ▼
Caddy (хост)
  │
  ├─→ Матчер @static: path /_astro/*  ✅
  │
  ├─→ root * /var/lib/docker/volumes/prod_website-static/_data
  │
  ├─→ file_server → Читает файл напрямую с диска
  │
  ├─→ Добавляет заголовки:
  │   • Content-Type: text/css; charset=utf-8
  │   • Cache-Control: public, max-age=31536000, immutable
  │   • Security headers
  │
  ▼
Browser получает файл (быстро, с кэшем на 1 год)
```

### Динамика (HTML, API)

```
Browser
  │
  ├─→ GET /en/about
  │
  ▼
Caddy (хост)
  │
  ├─→ Матчер @static: path /en/about  ❌ (не совпадает)
  │
  ├─→ reverse_proxy 127.0.0.1:3000
  │
  ▼
Astro SSR (Docker :3000)
  │
  ├─→ Рендерит страницу
  │
  ├─→ Возвращает HTML
  │
  ▼
Caddy (хост)
  │
  ├─→ Добавляет security headers
  │
  ▼
Browser получает HTML
```

---

## 📦 Компоненты

### 1. Caddy (хост, systemd)

**Конфиг:** `/etc/caddy/Caddyfile`

**Ответственность:**
- HTTPS терминация (Let's Encrypt)
- Раздача статики из Docker volume
- Добавление Cache-Control заголовков
- Добавление Security заголовков
- Проксирование динамики на Astro SSR
- Логирование

**Преимущества:**
- ⚡ Быстрая раздача статики (напрямую с диска)
- 🔒 Централизованная настройка безопасности
- 📊 Единое место для логов
- 🎯 Автоматические HTTPS сертификаты

### 2. Docker Volume (примонтирован readonly)

**Имя:** `prod_website-static`

**Путь на хосте:** `/var/lib/docker/volumes/prod_website-static/_data`

**Содержимое:**
```
_data/
├── _astro/          # Хэшированные бандлы (CSS, JS)
├── fonts/           # Шрифты (woff2, woff)
├── uploads/         # Картинки и файлы
├── favicon.ico
├── robots.txt
├── sitemap.xml
└── manifest.webmanifest
```

**Обновление:** Автоматически при рестарте контейнера (деплое).

### 3. Astro SSR (Docker контейнер)

**Имя:** `website-prod`

**Порт:** `127.0.0.1:3000` (только localhost)

**Ответственность:**
- SSR рендеринг HTML страниц
- API endpoints
- Динамический контент
- i18n роутинг

**НЕ отвечает за:**
- ❌ Раздачу статики (делает Caddy)
- ❌ HTTPS терминацию (делает Caddy)
- ❌ Установку Cache-Control (делает Caddy)

---

## 🎛️ Конфигурация кэширования

### Иммутабельный кэш (1 год)

**Для:** `/_astro/*`, `/fonts/*`

**Заголовок:** `Cache-Control: public, max-age=31536000, immutable`

**Почему:**
- Файлы хэшированы (content hash в имени)
- Если файл изменился → новый хэш → новый URL
- Браузер никогда не проверяет старые версии
- Максимальная производительность

### Длинный кэш (1 год, без immutable)

**Для:** `/uploads/*`

**Заголовок:** `Cache-Control: public, max-age=31536000`

**Почему:**
- Файлы могут быть заменены по тому же URL
- Браузер может revalidate при необходимости
- Баланс между производительностью и свежестью

### Короткий кэш (1 час)

**Для:** `/favicon.ico`, `/robots.txt`, `/sitemap.xml`

**Заголовок:** `Cache-Control: public, max-age=3600`

**Почему:**
- Файлы могут обновляться
- Не критичны для производительности
- Быстрое обновление при изменениях

### Без кэша (HTML)

**Для:** Все остальные запросы (HTML страницы)

**Заголовок:** Устанавливается Astro SSR middleware

**Почему:**
- Контент может часто меняться
- SSR позволяет персонализацию
- Всегда свежий контент

---

## 🔐 Безопасность

### Заголовки (устанавливает Caddy)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Изоляция

- Docker контейнер слушает только `127.0.0.1:3000` (не доступен извне)
- Docker volume примонтирован `readonly` (Caddy не может писать)
- Caddy работает под отдельным пользователем `caddy`

---

## 🚀 Деплой

### Автоматический (GitHub Actions)

1. **Build:** GitHub Actions собирает Docker образ
2. **Push:** Пушит в GHCR (`ghcr.io/dmitrybond-tech/personal-website-prod:main`)
3. **Deploy:** VPS пуллит новый образ
4. **Restart:** `docker compose up -d` перезапускает контейнер
5. **Volume Update:** Docker автоматически обновляет `website-static` из нового образа
6. **Caddy:** Сразу начинает раздавать новые файлы (без перезагрузки)

**Никаких ручных действий не требуется!**

---

## 📊 Производительность

### Метрики

| Ресурс | Обработка | Время ответа | Кэш |
|--------|-----------|--------------|-----|
| CSS | Caddy → Диск | ~1-5ms | 1 год |
| JS | Caddy → Диск | ~1-5ms | 1 год |
| Fonts | Caddy → Диск | ~1-10ms | 1 год |
| Images | Caddy → Диск | ~1-10ms | 1 год |
| HTML | Caddy → Astro SSR | ~50-200ms | Нет |

### Оптимизации

- ✅ **Статика читается напрямую** (без Node.js overhead)
- ✅ **Иммутабельный кэш** (браузер не делает запросы)
- ✅ **gzip/zstd сжатие** (меньше трафика)
- ✅ **HTTP/2** (мультиплексирование)
- ✅ **HSTS preload** (без редиректов HTTP→HTTPS)

---

## 🛠️ Поддержка

### Обновление статики вручную

Обычно не требуется, но если нужно:

```bash
# Перезапустить контейнер (volume обновится автоматически)
cd /opt/prod
docker compose restart website-prod

# Или пересоздать volume
docker compose down
docker volume rm prod_website-static
docker compose --env-file .env.prod up -d
```

### Мониторинг

```bash
# Проверить volume
docker volume ls | grep static
ls -lh /var/lib/docker/volumes/prod_website-static/_data/

# Проверить Caddy
systemctl status caddy
journalctl -u caddy -f

# Проверить Astro SSR
docker logs website-prod -f

# Проверить загрузку статики
curl -sI https://dmitrybond.tech/_astro/index.abc123.css | grep -i cache-control
```

### Логи

- **Caddy access logs:** `/var/lib/caddy/logs/website_access.log`
- **Caddy error logs:** `journalctl -u caddy`
- **Astro SSR logs:** `docker logs website-prod`

---

## ✅ Checklist для новой установки

- [ ] Обновлён `compose.yml` с `volumes` секцией
- [ ] Обновлён `/etc/caddy/Caddyfile` с правильным путём к volume
- [ ] Проверен синтаксис: `caddy validate --config /etc/caddy/Caddyfile`
- [ ] Перезапущен Caddy: `systemctl reload caddy`
- [ ] Перезапущен контейнер: `docker compose up -d`
- [ ] Проверен volume: `ls -la /var/lib/docker/volumes/prod_website-static/_data/`
- [ ] Протестирована загрузка CSS: `curl -sI https://dmitrybond.tech/_astro/...`
- [ ] Протестирована загрузка fonts: `curl -sI https://dmitrybond.tech/fonts/...`
- [ ] Проверено в браузере: стили применяются, шрифты загружаются
- [ ] Проверены заголовки в DevTools: `Cache-Control`, `Content-Type`

---

## 🎉 Результат

- ⚡ **Статика раздаётся мгновенно** (Caddy читает с диска)
- 🎯 **Правильные заголовки** (Cache-Control, Content-Type)
- 🔄 **Автоматическое обновление** (при каждом деплое)
- 🔒 **Безопасность** (изоляция, security headers)
- 📊 **Мониторинг** (централизованные логи)
- 🚀 **Производительность** (разгрузка Astro SSR)

**Сайт работает быстро, стабильно и безопасно!** 🎉

