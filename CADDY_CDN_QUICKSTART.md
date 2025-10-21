# ⚡ Caddy CDN Quick Start

## 🎯 Что делать на VPS

### 1. Обновить compose.yml

```bash
cd /opt/prod
nano compose.yml
```

Добавить в конец секции `website-prod`:
```yaml
    volumes:
      - website-static:/app/apps/website/dist/client:ro
```

Добавить в самый конец файла:
```yaml
volumes:
  website-static:
    driver: local
```

### 2. Узнать имя volume

```bash
docker compose down
docker compose --env-file .env.prod up -d
docker volume ls | grep static
# Запомнить имя, например: prod_website-static
```

### 3. Обновить Caddyfile

```bash
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup
nano /etc/caddy/Caddyfile
```

Заменить путь в строке `root *`:
```caddyfile
root * /var/lib/docker/volumes/prod_website-static/_data
```

### 4. Применить

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

### 5. Проверить

```bash
curl -sI https://dmitrybond.tech/_astro/index.DfP9kY9R.css | grep -i cache-control
```

Должно быть: `cache-control: public, max-age=31536000, immutable`

---

## 🚨 Troubleshooting

**404 на статику:**
```bash
ls -la /var/lib/docker/volumes/prod_website-static/_data/
```

**Permission denied:**
```bash
chmod -R a+rX /var/lib/docker/volumes/prod_website-static/_data/
```

**Volume пустой:**
```bash
docker exec website-prod find /app -name "_astro" -type d
# Исправить путь в compose.yml
```

---

## ✅ Готово!

- Статика раздаётся с кэшем на 1 год
- Стили и шрифты загружаются мгновенно
- Автоматическое обновление при деплое

