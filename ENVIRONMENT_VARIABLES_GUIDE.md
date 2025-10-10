# Environment Variables Guide

## 🔧 Исправления в коде:

✅ **Изменил `import.meta.env` на `process.env`** в OAuth API routes
- `apps/website/src/pages/api/decap/[...params].ts`
- `apps/website/src/pages/api/decap/callback.ts`

## 📋 Переменные окружения для продакшена:

### **1. GitHub OAuth Apps (два разных):**

#### **AuthJS OAuth App** (для основного сайта):
```bash
AUTHJS_GITHUB_CLIENT_ID=Ov23liShECAZEvuDumYU
AUTHJS_GITHUB_CLIENT_SECRET=your_authjs_secret
```
**Callback URL:** `https://dmitrybond.tech/api/auth/callback/github`

#### **Decap CMS OAuth App** (для CMS):
```bash
DECAP_GITHUB_CLIENT_ID=Ov23liDxke33hnVMyefM
DECAP_GITHUB_CLIENT_SECRET=32769066bd972e4ab9997f523e7783e9cd7e86b8
```
**Callback URL:** `https://dmitrybond.tech/api/decap/callback`

### **2. Основные переменные:**
```bash
PUBLIC_SITE_URL=https://dmitrybond.tech
NODE_ENV=production
```

## 🐳 Docker Configuration:

### **Build Args (для сборки):**
```bash
--build-arg PUBLIC_SITE_URL="https://dmitrybond.tech"
--build-arg DECAP_GITHUB_CLIENT_ID="Ov23liDxke33hnVMyefM"
--build-arg DECAP_GITHUB_CLIENT_SECRET="32769066bd972e4ab9997f523e7783e9cd7e86b8"
--build-arg AUTHJS_GITHUB_CLIENT_ID="Ov23liShECAZEvuDumYU"
--build-arg AUTHJS_GITHUB_CLIENT_SECRET="your_authjs_secret"
```

### **Runtime Environment (для запуска):**
```bash
-e DECAP_GITHUB_CLIENT_ID="Ov23liDxke33hnVMyefM"
-e DECAP_GITHUB_CLIENT_SECRET="32769066bd972e4ab9997f523e7783e9cd7e86b8"
-e AUTHJS_GITHUB_CLIENT_ID="Ov23liShECAZEvuDumYU"
-e AUTHJS_GITHUB_CLIENT_SECRET="your_authjs_secret"
-e PUBLIC_SITE_URL="https://dmitrybond.tech"
```

## 🚀 Команды для обновления:

### **1. Запушить изменения:**
```bash
git add .
git commit -m "Fix OAuth: use process.env instead of import.meta.env"
git push origin main
```

### **2. Обновить Dockerfile (добавить AUTHJS переменные):**

**В Dockerfile добавить:**
```dockerfile
# AuthJS Environment Variables for Production
ARG AUTHJS_GITHUB_CLIENT_ID=""
ARG AUTHJS_GITHUB_CLIENT_SECRET=""

ENV AUTHJS_GITHUB_CLIENT_ID=$AUTHJS_GITHUB_CLIENT_ID \
    AUTHJS_GITHUB_CLIENT_SECRET=$AUTHJS_GITHUB_CLIENT_SECRET
```

### **3. Обновить GitHub Secrets:**

Добавить в GitHub Repository Secrets:
```
AUTHJS_GITHUB_CLIENT_SECRET=your_authjs_secret
```

### **4. После GitHub Actions сборки:**

```bash
# На сервере обновить контейнер
docker pull ghcr.io/dmitrybond-tech/personal-website-prod:latest

docker stop website-prod
docker rm website-prod

docker run -d --name website-prod -p 3000:3000 \
  -e DECAP_GITHUB_CLIENT_ID="Ov23liDxke33hnVMyefM" \
  -e DECAP_GITHUB_CLIENT_SECRET="32769066bd972e4ab9997f523e7783e9cd7e86b8" \
  -e AUTHJS_GITHUB_CLIENT_ID="Ov23liShECAZEvuDumYU" \
  -e AUTHJS_GITHUB_CLIENT_SECRET="your_authjs_secret" \
  -e PUBLIC_SITE_URL="https://dmitrybond.tech" \
  ghcr.io/dmitrybond-tech/personal-website-prod:latest
```

## 🧪 Тестирование:

```bash
# Проверить переменные в контейнере
docker exec website-prod printenv | grep -E "(DECAP|AUTHJS)"

# Тест OAuth endpoint
curl -v "https://dmitrybond.tech/api/decap?provider=github&site_id=dmitrybond.tech&scope=repo"
```

## 🎯 Следующие шаги:

1. **Запушить изменения** (уже сделано)
2. **Добавить AUTHJS переменные в Dockerfile**
3. **Добавить AUTHJS_GITHUB_CLIENT_SECRET в GitHub Secrets**
4. **Обновить контейнер после сборки**

---

**Status:** ✅ Code Fixed  
**Next:** Update Dockerfile and GitHub Secrets
