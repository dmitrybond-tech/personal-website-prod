# CI/CD Update Summary

## ✅ Примененные изменения

### 1. **Обновлен `.github/workflows/ci-docker.yml`**
- ✅ Добавлена строка `file: apps/website/Dockerfile` в секцию Build & Push
- ✅ Теперь CI использует новый monorepo-aware Dockerfile

### 2. **Созданы инструкции**
- ✅ `ENV_BUILD_SETUP.md` - инструкция по настройке переменных окружения
- ✅ `test-docker-build-vps.sh` - скрипт для тестирования на VPS
- ✅ `test-docker-build-vps.ps1` - PowerShell версия скрипта

### 3. **Подготовлены файлы**
- ✅ `apps/website/Dockerfile` - обновлен с git и fallback механизмами
- ✅ `package.json` - добавлены workspaces и build:website скрипт
- ✅ `package-lock.json` - создан в корне
- ✅ `compose.prod.yml` - обновлен для использования правильного dockerfile

## 🚀 Что происходит теперь

### **При пуше в main:**
1. **GitHub Actions** запускает `ci-docker.yml`
2. **Собирает Docker образ** используя `apps/website/Dockerfile`
3. **Пушит образ** в GHCR с тегами `main`, `latest`, `sha-{commit}`
4. **Запускает** `deploy-preprod.yml` на self-hosted runner
5. **Деплоит** обновленный образ на VPS

### **В логах сборки вы увидите:**
```
=== ROOT PACKAGE.JSON ===
{"name":"personal-website-monorepo","workspaces":["apps/website"]...}

=== WEBSITE PACKAGE.JSON ===
{"name":"website","scripts":{"build":"astro build"}...}

=== WORKSPACE STRUCTURE ===
total 48
drwxr-xr-x    8 root     root          4096 Jan 15 10:30 .
-rw-r--r--    1 root     root          1234 Jan 15 10:30 package.json
-rw-r--r--    1 root     root         56789 Jan 15 10:30 package-lock.json

SERVER: [ 'entry.mjs', 'manifest_*.mjs', 'pages/', 'chunks/' ]
CLIENT: [ '_astro/', 'uploads/', 'cv_en/', 'cv_ru/', 'favorites/', ... ]
UPLOADS: [ 'about/', 'logos/', 'placeholders/', 'posts/' ]
```

## 📋 Следующие шаги

### **1. Настройте переменные окружения:**
Создайте файл `.env.build` или настройте GitHub Variables (см. `ENV_BUILD_SETUP.md`)

### **2. Запушьте изменения:**
```bash
git add .
git commit -m "fix: update CI to use monorepo Dockerfile with client assets"
git push origin main
```

### **3. Проверьте CI:**
- Зайдите в GitHub Actions
- Убедитесь, что сборка проходит успешно
- Проверьте логи на наличие debug сообщений

### **4. Проверьте VPS:**
- Убедитесь, что контейнер запустился
- Проверьте, что изображения отображаются корректно
- Проверьте логи контейнера

## 🎯 Ожидаемый результат

✅ **CI собирает образ** используя новый Dockerfile  
✅ **Образ содержит** и server, и client assets (включая uploads)  
✅ **VPS получает** обновленный образ с полными активами  
✅ **Изображения отображаются** корректно (не placeholder'ы)  
✅ **Build args передаются** корректно  
✅ **Guard проверки** предотвращают деплой сломанных сборок  

## 🛡️ Защиты

- **Fallback механизмы** для npm ci и workspace build
- **Guard проверки** что uploads существует
- **Подробное логирование** для debugging
- **Тестовые скрипты** для проверки на VPS

**Готово к деплою!** 🚀
