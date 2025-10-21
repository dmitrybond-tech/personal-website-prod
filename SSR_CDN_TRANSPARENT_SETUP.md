# 🚀 CDN Transparent Setup Guide (Вариант B — рекомендуется)

**Цель:** Настроить CDN как прозрачный кэш без изменений в коде

**Преимущества:**
- ✅ Нулевые изменения в коде
- ✅ Простой rollback (убрать CDN из DNS)
- ✅ Не нужен CORS для шрифтов
- ✅ Работает с текущими путями ассетов

---

## 📋 Prerequisites

1. ✅ Текущая система работает корректно (проверено через `bash scripts/health.sh`)
2. ✅ Middleware правильно устанавливает Cache-Control заголовки
3. ✅ Origin сервер доступен по IP/hostname

---

## 🌐 Выбор CDN провайдера

### Вариант 1: Cloudflare (рекомендуется)

**Плюсы:**
- ✅ Бесплатный тариф (неограниченный трафик)
- ✅ Глобальная сеть (200+ PoP)
- ✅ Простая настройка через DNS
- ✅ Автоматическая SSL/TLS
- ✅ DDoS protection

**Минусы:**
- ❌ Нужен перенос DNS на Cloudflare NS

**Стоимость:** $0/месяц (Free Plan)

---

### Вариант 2: Bunny CDN

**Плюсы:**
- ✅ Не требует переноса DNS
- ✅ Pull Zone настраивается за 2 минуты
- ✅ Дешевый (от $0.01/GB)

**Минусы:**
- ❌ Платный (но дешевле Cloudflare Pro)

**Стоимость:** ~$1-5/месяц (для малого трафика)

---

### Вариант 3: AWS CloudFront

**Плюсы:**
- ✅ Интеграция с AWS экосистемой
- ✅ Мощная аналитика

**Минусы:**
- ❌ Сложная настройка
- ❌ Дороже остальных

**Стоимость:** ~$5-20/месяц

---

## 🛠️ Setup: Cloudflare (Transparent Mode)

### Step 1: Добавить сайт в Cloudflare

1. Зарегистрироваться на [cloudflare.com](https://cloudflare.com)
2. **Add a Site** → `dmitrybond.tech`
3. Выбрать **Free Plan**
4. Cloudflare покажет nameservers (NS):
   ```
   maya.ns.cloudflare.com
   omar.ns.cloudflare.com
   ```

---

### Step 2: Обновить DNS у регистратора

1. Зайти в панель регистратора домена (где куплен dmitrybond.tech)
2. Найти настройки DNS
3. Заменить текущие NS на Cloudflare NS:
   ```
   maya.ns.cloudflare.com
   omar.ns.cloudflare.com
   ```
4. Сохранить (применится через 1-24 часа)

**Как проверить:**
```bash
dig dmitrybond.tech NS
# Должны появиться cloudflare.com nameservers
```

---

### Step 3: Настроить DNS записи в Cloudflare

В Cloudflare DNS panel:

```dns
Type  Name             Content                     Proxy  TTL
A     dmitrybond.tech  <YOUR_SERVER_IP>           ✅ ON  Auto
A     www              <YOUR_SERVER_IP>           ✅ ON  Auto
```

**Важно:**
- ✅ **Proxy status: ON** (оранжевое облачко) — трафик идёт через CDN
- ❌ **Proxy status: OFF** (серое облачко) — CDN не работает

---

### Step 4: Настроить Page Rules (Cache Everything)

**Cloudflare Dashboard → Rules → Page Rules → Create Page Rule**

#### Rule 1: Кэшировать статические ассеты

**URL:** `dmitrybond.tech/_astro/*`

**Settings:**
- **Cache Level:** Cache Everything
- **Edge Cache TTL:** 1 year
- **Browser Cache TTL:** Respect Existing Headers

**Сохранить**

---

#### Rule 2: Кэшировать шрифты

**URL:** `dmitrybond.tech/fonts/*`

**Settings:**
- **Cache Level:** Cache Everything
- **Edge Cache TTL:** 1 year
- **Browser Cache TTL:** Respect Existing Headers

**Сохранить**

---

#### Rule 3: НЕ кэшировать HTML

**URL:** `dmitrybond.tech/en/*`, `dmitrybond.tech/ru/*`

**Settings:**
- **Cache Level:** Bypass

**Сохранить**

---

### Step 5: Настроить Compression

**Cloudflare Dashboard → Speed → Optimization**

- ✅ **Brotli:** ON
- ✅ **Auto Minify:** OFF (не нужно — Vite уже минифицировал)
- ✅ **Rocket Loader:** OFF (конфликтует с SSR)

---

### Step 6: Настроить SSL/TLS

**Cloudflare Dashboard → SSL/TLS**

- **SSL/TLS encryption mode:** Full (strict)
- ✅ **Always Use HTTPS:** ON
- ✅ **Minimum TLS Version:** TLS 1.2

---

### Step 7: Проверка

**Подождать 5-10 минут после активации DNS**

**1. Проверить, что сайт доступен:**
```bash
curl -I https://dmitrybond.tech/en/about
# Ожидается: 200 OK
```

**2. Проверить, что CDN работает:**
```bash
curl -I https://dmitrybond.tech/_astro/about.BUVLCO9i.css | grep -i '^cf-'
# Ожидается:
# cf-cache-status: MISS  (первый запрос)
# cf-ray: ...

# Второй запрос:
curl -I https://dmitrybond.tech/_astro/about.BUVLCO9i.css | grep -i '^cf-cache-status'
# cf-cache-status: HIT  (кэш работает!)
```

**3. Проверить, что HTML НЕ кэшируется:**
```bash
curl -I https://dmitrybond.tech/en/about | grep -i '^cf-cache-status'
# Ожидается: DYNAMIC или отсутствует
```

---

## 🛠️ Setup: Bunny CDN (альтернатива)

### Step 1: Создать аккаунт

1. [bunny.net](https://bunny.net) → Sign Up
2. Пополнить баланс на $5

---

### Step 2: Создать Pull Zone

1. **CDN → Add Pull Zone**
2. **Name:** `dmitrybond-tech`
3. **Origin URL:** `https://dmitrybond.tech`
4. **Create**

Bunny выдаст URL:
```
https://dmitrybond-tech.b-cdn.net
```

---

### Step 3: Настроить Custom Domain

1. **Pull Zone → Hostname**
2. **Add Hostname:** `cdn.dmitrybond.tech`
3. Bunny покажет CNAME:
   ```
   CNAME cdn.dmitrybond.tech → dmitrybond-tech.b-cdn.net
   ```

---

### Step 4: Обновить DNS

В вашем DNS провайдере:
```dns
Type   Name  Content
CNAME  cdn   dmitrybond-tech.b-cdn.net
```

---

### Step 5: Настроить Cache Rules в Pull Zone

**Bunny Dashboard → Pull Zone → Cache**

- **Cache Expiration Time:** 31536000 (1 year)
- **Query String Caching:** Disabled
- **Respect Cache-Control:** ✅ ON

**Optimizer:**
- ✅ **Image Optimizer:** OFF (не нужно)
- ✅ **Minifier:** OFF (уже минифицировано)

---

### Step 6: Обновить код (если используется cdn.dmitrybond.tech)

**Файл:** `apps/website/astro.config.ts`

```typescript
export default defineConfig({
  site: 'https://dmitrybond.tech',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    build: {
      assetsPrefix: process.env.ASSETS_PREFIX || undefined,
    }
  }
});
```

**Файл:** `env.prod`

```bash
ASSETS_PREFIX=https://cdn.dmitrybond.tech
```

**Файл:** `apps/website/src/layouts/BaseLayout.astro`

```astro
---
const assetsPrefix = import.meta.env.ASSETS_PREFIX || '';
---

<head>
  <!-- Preconnect to CDN -->
  {assetsPrefix && <link rel="preconnect" href={assetsPrefix} crossorigin />}
  
  <!-- Font preload -->
  <link 
    rel="preload" 
    as="font" 
    href={`${assetsPrefix}/fonts/inter-roman.var.woff2`} 
    type="font/woff2" 
    crossorigin 
  />
</head>
```

**ПРИМЕЧАНИЕ:** Этот шаг нужен только для Bunny CDN с отдельным доменом. Для Cloudflare (Transparent Mode) изменения не требуются.

---

## 🧪 Testing CDN

### Test 1: CSS Cache HIT

```bash
# Первый запрос (MISS)
curl -I https://dmitrybond.tech/_astro/about.BUVLCO9i.css

# Второй запрос (HIT)
curl -I https://dmitrybond.tech/_astro/about.BUVLCO9i.css | grep -i '^x-cache'
# Ожидается: X-Cache: HIT
```

---

### Test 2: HTML Bypass Cache

```bash
curl -I https://dmitrybond.tech/en/about | grep -i 'cache-control'
# Ожидается: cache-control: no-store, max-age=0, must-revalidate
```

---

### Test 3: Fonts с CORS

```bash
curl -I https://dmitrybond.tech/fonts/inter-roman.var.woff2 -H "Origin: https://dmitrybond.tech"
# Ожидается: 200 OK (CORS не нужен для same-origin)
```

---

### Test 4: Performance Improvement

```bash
# Измерить TTFB до CDN
curl -w "\nTTFB: %{time_starttransfer}s\n" -so /dev/null https://dmitrybond.tech/_astro/about.css
# TTFB: 0.050s

# Измерить TTFB после CDN (из другого региона)
curl -w "\nTTFB: %{time_starttransfer}s\n" -so /dev/null https://dmitrybond.tech/_astro/about.css
# Ожидается: TTFB < 0.020s (значительно меньше)
```

---

## 🚨 Troubleshooting

### Проблема: CDN кэширует HTML

**Симптом:** HTML страницы не обновляются

**Решение (Cloudflare):**
1. **Caching → Configuration → Browser Cache TTL:** 4 hours
2. **Page Rules:** Убедиться, что `/en/*` и `/ru/*` имеют "Bypass" cache level

**Решение (Bunny):**
1. **Pull Zone → Cache → Respect Cache-Control:** ON
2. Проверить, что origin (Node middleware) отправляет `Cache-Control: no-store`

---

### Проблема: Шрифты не загружаются

**Симптом:** Console error: CORS policy blocked font

**Решение:** Добавить CORS в middleware.ts:

```typescript
if (pathname.startsWith('/fonts/')) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
}
```

---

### Проблема: Устаревший CSS после деплоя

**Симптом:** Пользователи видят старый CSS после обновления

**Решение:**
1. **Cloudflare:** Purge Cache → Custom Purge → `/_astro/*`
2. **Bunny:** Pull Zone → Purge Cache

**Автоматизация (CI/CD):**
```bash
# После деплоя в .github/workflows/deploy.yml
- name: Purge CDN Cache
  run: |
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"files":["https://dmitrybond.tech/_astro/*"]}'
```

---

## 📊 Expected Performance Gains

| Метрика | До CDN | С CDN | Улучшение |
|---------|--------|-------|-----------|
| CSS TTFB (Europe) | 50ms | 10ms | 80% |
| CSS TTFB (US) | 150ms | 15ms | 90% |
| CSS TTFB (Asia) | 300ms | 20ms | 93% |
| Origin load | 100% | 30% | 70% снижение |
| Bandwidth cost | 100% | 10% | 90% экономия |

---

## ✅ Acceptance Criteria

После внедрения CDN проверить:

- ✅ CSS загружается с CDN (X-Cache: HIT)
- ✅ HTML НЕ кэшируется (cache-control: no-store)
- ✅ Fonts загружаются корректно
- ✅ TTFB для статических ресурсов < 20ms (из разных регионов)
- ✅ Origin сервер получает <50% трафика (остальное обслуживает CDN)

---

## 🔄 Rollback Plan

### Откатить CDN (Cloudflare)

1. **DNS → Cloudflare Dashboard**
2. Для `dmitrybond.tech`: изменить **Proxy Status** с ON на OFF (серое облачко)
3. Подождать 5 минут → трафик пойдёт напрямую на origin

**ИЛИ:**

1. Вернуть NS записи на оригинальные (у регистратора)
2. Удалить сайт из Cloudflare

---

### Откатить CDN (Bunny)

1. Удалить `CNAME cdn` из DNS
2. Вернуть `ASSETS_PREFIX=""` в `env.prod`
3. Пересобрать проект: `npm run build:prod`

---

## 📚 Related Documentation

- `SSR_ASSET_DELIVERY_AUDIT.md` — полный аудит системы
- `SSR_CACHE_POLICY.md` — политика кэширования
- `scripts/health.sh` — health check script

---

**Автор:** Astro SSR Team  
**Дата:** 21 октября 2025  
**Версия:** 1.0

