# Docker OAuth Setup для Production

## 🔧 GitHub Environment Variables

Добавьте эти переменные в GitHub Secrets:

```
DECAP_GITHUB_CLIENT_ID=your_github_oauth_client_id
DECAP_GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

## 🐳 Docker Build с OAuth

### 1. **Build Command с OAuth переменными:**

```bash
docker build \
  --build-arg PUBLIC_SITE_URL="https://dmitrybond.tech" \
  --build-arg DECAP_GITHUB_CLIENT_ID="$DECAP_GITHUB_CLIENT_ID" \
  --build-arg DECAP_GITHUB_CLIENT_SECRET="$DECAP_GITHUB_CLIENT_SECRET" \
  --build-arg GIT_SHA="$(git rev-parse HEAD)" \
  -t dmitrybond-website:latest .
```

### 2. **Run с OAuth переменными:**

```bash
docker run -d \
  --name dmitrybond-website \
  -p 3000:3000 \
  -e DECAP_GITHUB_CLIENT_ID="$DECAP_GITHUB_CLIENT_ID" \
  -e DECAP_GITHUB_CLIENT_SECRET="$DECAP_GITHUB_CLIENT_SECRET" \
  -e PUBLIC_SITE_URL="https://dmitrybond.tech" \
  dmitrybond-website:latest
```

### 3. **Docker Compose (если используете):**

```yaml
version: '3.8'
services:
  website:
    build:
      context: .
      args:
        PUBLIC_SITE_URL: "https://dmitrybond.tech"
        DECAP_GITHUB_CLIENT_ID: "${DECAP_GITHUB_CLIENT_ID}"
        DECAP_GITHUB_CLIENT_SECRET: "${DECAP_GITHUB_CLIENT_SECRET}"
    environment:
      DECAP_GITHUB_CLIENT_ID: "${DECAP_GITHUB_CLIENT_ID}"
      DECAP_GITHUB_CLIENT_SECRET: "${DECAP_GITHUB_CLIENT_SECRET}"
      PUBLIC_SITE_URL: "https://dmitrybond.tech"
```

## 🚀 GitHub Actions (если используете):

```yaml
- name: Build Docker image
  run: |
    docker build \
      --build-arg PUBLIC_SITE_URL="https://dmitrybond.tech" \
      --build-arg DECAP_GITHUB_CLIENT_ID="${{ secrets.DECAP_GITHUB_CLIENT_ID }}" \
      --build-arg DECAP_GITHUB_CLIENT_SECRET="${{ secrets.DECAP_GITHUB_CLIENT_SECRET }}" \
      --build-arg GIT_SHA="${{ github.sha }}" \
      -t dmitrybond-website:${{ github.sha }} .
```

## ✅ Что добавлено в Dockerfile:

1. **Build Args** для OAuth переменных
2. **Environment Variables** для build stage
3. **Runtime Environment** для OAuth в production
4. **Ничего не удалено** - только добавлено

## 🧪 Тестирование:

После деплоя проверьте:
- `https://dmitrybond.tech/website-admin/` - загружается
- `https://dmitrybond.tech/api/decap?provider=github` - редирект на GitHub
- OAuth flow работает полностью

---

**Status:** ✅ Docker Ready  
**OAuth:** Configured  
**Secrets:** Need GitHub Variables
