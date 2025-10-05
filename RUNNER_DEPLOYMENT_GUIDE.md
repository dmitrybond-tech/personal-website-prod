# 🚀 Руководство по деплою через CI/CD Runner

## Обзор

Теперь ваш монорепо настроен для простого деплоя через CI/CD раннер на VPS. Все команды выполняются из корня репозитория.

## 📁 Структура файлов

```
website-v3/website/
├── Dockerfile              # Production build (Caddy)
├── Dockerfile.dev          # Development build (Node.js)
├── Caddyfile.app           # Caddy config for static files
├── compose.prod.yml        # Production services
├── compose.dev.yml         # Development services
├── env.example            # Environment variables template
├── package.json           # Updated with deploy scripts
└── RUNNER_DEPLOYMENT_GUIDE.md
```

## 🎯 Команды для раннера

### Основные команды деплоя

```bash
# Поднять продакшн (сайт на порту 3000)
npm run deploy:prod

# Поднять разработку (сайт на порту 3001)
npm run deploy:dev

# Остановить все сервисы
npm run deploy:stop

# Остановить только продакшн
npm run deploy:stop:prod

# Остановить только разработку
npm run deploy:stop:dev
```

### Управление сервисами

```bash
# Перезапустить продакшн
npm run deploy:restart:prod

# Перезапустить разработку
npm run deploy:restart:dev

# Посмотреть логи продакшна
npm run deploy:logs:prod

# Посмотреть логи разработки
npm run deploy:logs:dev

# Проверить статус всех сервисов
npm run deploy:status
```

## 🔧 Настройка на VPS

### 1. Подготовка окружения

```bash
# На VPS установите Docker и Docker Compose
sudo apt update
sudo apt install docker.io docker-compose-plugin

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
```

### 2. Клонирование репозитория

```bash
# Клонируйте репозиторий
git clone https://github.com/yourusername/website-v3.git
cd website-v3/website

# Скопируйте env.example в .env и настройте
cp env.example .env
nano .env
```

### 3. Настройка .env файла

```bash
# Основные настройки
NODE_ENV=production
PROD_PORT=3000
DEV_PORT=3001
DOMAIN=yourdomain.com
```

## 🚀 Типичные сценарии использования

### Сценарий 1: Первый деплой

```bash
# 1. Клонировать репозиторий
git clone https://github.com/yourusername/website-v3.git
cd website-v3/website

# 2. Настроить окружение
cp env.example .env
# отредактировать .env

# 3. Поднять продакшн
npm run deploy:prod

# 4. Проверить статус
npm run deploy:status
```

### Сценарий 2: Обновление продакшна

```bash
# 1. Обновить код
git pull origin main

# 2. Пересобрать и перезапустить
npm run deploy:prod

# 3. Проверить логи
npm run deploy:logs:prod
```

### Сценарий 3: Включение режима разработки

```bash
# 1. Остановить продакшн
npm run deploy:stop:prod

# 2. Поднять разработку
npm run deploy:dev

# 3. Сайт будет доступен на localhost:3001
```

## 🔍 Мониторинг и отладка

### Проверка работоспособности

```bash
# Проверить, что сайт отвечает
curl -I http://localhost:3000

# Посмотреть статус контейнеров
docker ps

# Посмотреть логи
npm run deploy:logs:prod
```

### Отладка проблем

```bash
# Зайти в контейнер для отладки
docker exec -it website-v3-website-1 sh

# Проверить файлы в контейнере
docker exec -it website-v3-website-1 ls -la /srv

# Посмотреть переменные окружения
docker exec -it website-v3-website-1 env
```

## 🔒 Безопасность

### Firewall настройки

```bash
# Разрешить только нужные порты
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Nginx Reverse Proxy (опционально)

Если нужно использовать Nginx как reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📋 Чек-лист для деплоя

- [ ] Docker и Docker Compose установлены
- [ ] Репозиторий клонирован
- [ ] Файл .env настроен
- [ ] Порт 3000 свободен
- [ ] Firewall настроен
- [ ] Команда `npm run deploy:prod` выполнена
- [ ] Сайт отвечает на http://localhost:3000
- [ ] Логи не показывают ошибок

## 🆘 Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверить логи
npm run deploy:logs:prod

# Проверить статус
npm run deploy:status

# Пересобрать с нуля
docker compose -f compose.prod.yml down
docker compose -f compose.prod.yml build --no-cache
npm run deploy:prod
```

### Проблема: Порт занят

```bash
# Найти процесс, использующий порт
sudo lsof -i :3000

# Остановить процесс или изменить порт в compose.prod.yml
```

### Проблема: Нет доступа к сайту

```bash
# Проверить, что контейнер запущен
docker ps

# Проверить, что порт проброшен
docker port website-v3-website-1

# Проверить firewall
sudo ufw status
```
