# Инструкции для деплоя сайта в Docker

## Описание

Данная инструкция описывает процесс деплоя сайта из `apps/website` как отдельного Docker контейнера с использованием Caddy для раздачи статики.

## Структура сборки

- **Multi-stage Dockerfile**: Сборка в `node:20-alpine`, runtime в `caddy:2.8-alpine`
- **Изоляция**: Собирается только `apps/website`, без зависимостей от монорепо
- **Оптимизация**: Сжатие, кеширование статики, security headers

## Требования к серверу

1. Docker и Docker Compose установлены
2. `docker-compose.yml` находится вне репозитория
3. Доступ к порту 3000 на localhost

## Настройка docker-compose.yml на сервере

Создайте `docker-compose.yml` со следующим содержимым:

```yaml
version: '3.8'

services:
  website:
    build:
      context: /path/to/website-v3/website  # путь к корню репозитория
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:3000:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

## Команды для деплоя

### Первый запуск
```bash
# Перейти в директорию с docker-compose.yml
cd /path/to/docker-compose/

# Собрать и запустить контейнер
docker compose up -d --build
```

### Обновление сайта
```bash
# Остановить контейнер
docker compose down

# Обновить код (git pull или другой способ)

# Пересобрать и запустить
docker compose up -d --build
```

### Полезные команды

```bash
# Посмотреть логи
docker compose logs -f website

# Проверить статус
docker compose ps

# Зайти в контейнер для отладки
docker compose exec website sh

# Перезапустить без пересборки
docker compose restart website
```

## Особенности сборки

1. **Кеширование слоев**: `package*.json` копируются первыми для оптимизации Docker cache
2. **CMS конфигурация**: Автоматически выполняется `cms-config-swap.mjs prod`
3. **Исключения**: `.dockerignore` исключает ненужные файлы
4. **Безопасность**: Настроены security headers в Caddy

## Мониторинг

После запуска сайт будет доступен на `http://127.0.0.1:3000`

Для проверки работоспособности:
```bash
curl -I http://127.0.0.1:3000
```

## Troubleshooting

### Проблемы с сборкой
- Проверьте, что все зависимости установлены в `apps/website/package.json`
- Убедитесь, что скрипт `cms-config-swap.mjs` существует и корректен

### Проблемы с запуском
- Проверьте логи: `docker compose logs website`
- Убедитесь, что порт 3000 свободен
- Проверьте права доступа к файлам

### Проблемы с производительностью
- Убедитесь, что включено сжатие (zstd, gzip)
- Проверьте кеширование статических файлов
- Мониторьте использование ресурсов: `docker stats`
