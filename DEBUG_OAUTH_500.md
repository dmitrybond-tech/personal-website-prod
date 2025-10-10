# Debug OAuth 500 Error

## 🔍 Диагностика 500 ошибки на `/api/decap`

### Возможные причины:

1. **Переменные окружения не передаются в runtime**
2. **API routes не обновились в production**  
3. **Ошибка в коде API routes**
4. **Неправильный Docker build**

## 🧪 Команды для диагностики на сервере:

### 1. **Проверить переменные в контейнере:**
```bash
# Проверить все OAuth переменные
docker exec website-prod printenv | grep -E "(DECAP|AUTHJS)"

# Должны быть:
# DECAP_GITHUB_CLIENT_ID=Ov23liDxke33hnVMyefM
# DECAP_GITHUB_CLIENT_SECRET=32769066bd972e4ab9997f523e7783e9cd7e86b8
```

### 2. **Проверить логи контейнера:**
```bash
# Посмотреть логи в реальном времени
docker logs website-prod -f &

# В другом терминале сделать запрос
curl "https://dmitrybond.tech/api/decap?provider=github&site_id=dmitrybond.tech&scope=repo"

# Посмотреть что появится в логах
```

### 3. **Проверить API routes в контейнере:**
```bash
# Проверить что файлы обновились
docker exec website-prod ls -la /app/dist/server/pages/api/decap/

# Проверить дату модификации
docker exec website-prod stat /app/dist/server/pages/api/decap/_---params_.mjs

# Проверить содержимое файла
docker exec website-prod head -20 /app/dist/server/pages/api/decap/_---params_.mjs
```

### 4. **Проверить GitHub Actions:**
- Зашел ли GitHub Actions workflow?
- Завершился ли build успешно?
- Есть ли ошибки в build logs?

## 🔧 Возможные решения:

### **Если переменные отсутствуют:**
```bash
# Пересоздать контейнер с переменными
docker-compose --env-file .env.prod up -d --pull=always --force-recreate
```

### **Если API routes старые:**
```bash
# Удалить старый образ и пересобрать
docker rmi ghcr.io/dmitrybond-tech/personal-website-prod:latest
docker pull ghcr.io/dmitrybond-tech/personal-website-prod:latest
```

### **Если есть ошибки в коде:**
- Проверить логи контейнера
- Добавить больше debug информации

## 📋 Checklist:

- [ ] Переменные окружения есть в контейнере
- [ ] API routes обновились (новая дата модификации)
- [ ] GitHub Actions завершился успешно
- [ ] Логи показывают детали ошибки
- [ ] Docker образ пересобран

---

**Следующий шаг:** Выполнить диагностические команды на сервере
