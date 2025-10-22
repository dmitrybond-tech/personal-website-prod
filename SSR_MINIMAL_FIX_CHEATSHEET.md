# SSR Minimal Fix - Command Cheatsheet 🚀

## ⚡ One-Line Deploy

```bash
git add apps/website/astro.config.ts && git commit -m "fix(astro): SSR asset config" && docker build -f apps/website/Dockerfile -t website:latest . && docker-compose up -d
```

---

## 📋 Step-by-Step Deploy

```bash
# 1. Verify changes
git diff apps/website/astro.config.ts

# 2. Commit
git add apps/website/astro.config.ts
git commit -m "fix(astro): explicit asset config for SSR"

# 3. Build Docker image
docker build -f apps/website/Dockerfile -t website:latest .

# 4. Deploy
docker-compose up -d

# 5. Check logs
docker-compose logs -f --tail=50
```

---

## 🧪 Local Testing

```bash
# Build
cd apps/website
npm run build

# Run
node ./dist/server/entry.mjs

# Test (in another terminal)
curl -I http://localhost:3000/_astro/
curl -I http://localhost:3000/fonts/
curl -I http://localhost:3000/uploads/
curl -I http://localhost:3000/
```

---

## 🐳 Docker Testing

```bash
# Build
docker build -f apps/website/Dockerfile -t test .

# Run
docker run -d --name test -p 3000:3000 test

# Wait for health
sleep 10

# Check health status
docker inspect --format='{{.State.Health.Status}}' test

# Test assets
curl -I http://localhost:3000/_astro/
curl -I http://localhost:3000/fonts/
curl -I http://localhost:3000/

# View logs
docker logs test

# Cleanup
docker stop test && docker rm test
```

---

## 🔍 Verification Commands

```bash
# Check CSS (should be 200 + immutable)
curl -I http://localhost:3000/_astro/ | grep -E "HTTP|Content-Type|Cache-Control"

# Check Font (should be 200 + immutable)
curl -I http://localhost:3000/fonts/ | grep -E "HTTP|Content-Type|Cache-Control"

# Check Upload (should be 200 + 1-day cache)
curl -I http://localhost:3000/uploads/ | grep -E "HTTP|Content-Type|Cache-Control"

# Check HTML (should be 200 + no-store)
curl -I http://localhost:3000/ | grep -E "HTTP|Content-Type|Cache-Control"
```

---

## 🔧 Troubleshooting

### 404 on `/_astro/*`
```bash
# Check if files exist
docker exec container-name ls -la /app/dist/client/_astro

# Check middleware is running
docker logs container-name | grep middleware
```

### Wrong MIME type
```bash
# Check middleware response headers
curl -v http://localhost:3000/_astro/main.css 2>&1 | grep -i content-type
```

### Health check fails
```bash
# Check if server is listening
docker exec container-name netstat -tuln | grep 3000

# Check health check logs
docker inspect container-name | jq '.[0].State.Health'
```

### Container won't start
```bash
# Check logs
docker logs container-name

# Check environment variables
docker exec container-name env | grep -E "NODE_ENV|PORT"
```

---

## 🔄 Rollback

```bash
# Quick rollback
git checkout HEAD -- apps/website/astro.config.ts
npm run build
docker-compose up -d --build

# Or revert commit
git revert HEAD
docker-compose up -d --build
```

---

## 📊 Expected Results

| URL | Status | Content-Type | Cache-Control |
|-----|--------|--------------|---------------|
| `/_astro/*.css` | 200 | `text/css` | `max-age=31536000, immutable` |
| `/_astro/*.js` | 200 | `application/javascript` | `max-age=31536000, immutable` |
| `/fonts/*.woff2` | 200 | `font/woff2` | `max-age=31536000, immutable` |
| `/uploads/*.png` | 200 | `image/png` | `max-age=86400` |
| `/` | 200 | `text/html` | `no-store, max-age=0` |

---

## 📝 Quick Checks

```bash
# ✅ Files exist in Docker?
docker exec container ls -la /app/dist/client/_astro | head
docker exec container ls -la /app/dist/client/fonts | head
docker exec container ls -la /app/dist/client/uploads | head

# ✅ Server running?
docker exec container ps aux | grep node

# ✅ Port listening?
docker exec container netstat -tuln | grep 3000

# ✅ Logs clean?
docker logs container 2>&1 | grep -i error

# ✅ Health check passing?
docker inspect --format='{{.State.Health.Status}}' container
```

---

## 🎯 CI Smoke Test (GitHub Actions)

```yaml
- name: Smoke Test
  run: |
    docker run -d --name test -p 3000:3000 ${{ env.IMAGE }}
    sleep 10
    
    # CSS test
    CSS=$(docker exec test sh -c "ls /app/dist/client/_astro/*.css | head -1 | xargs basename")
    curl -fsSL -I http://localhost:3000/_astro/$CSS | grep "immutable" || exit 1
    
    # Font test
    FONT=$(docker exec test sh -c "ls /app/dist/client/fonts/*.woff2 | head -1 | xargs basename")
    curl -fsSL -I http://localhost:3000/fonts/$FONT | grep "immutable" || exit 1
    
    # HTML test
    curl -fsSL -I http://localhost:3000/ | grep "no-store" || exit 1
    
    docker stop test && docker rm test
```

---

## 🚦 Pre-Deploy Checklist

- [ ] `git status` shows only `astro.config.ts` modified
- [ ] `git diff` shows only 3 lines added
- [ ] Local build succeeds: `cd apps/website && npm run build`
- [ ] Docker build succeeds: `docker build -f apps/website/Dockerfile .`
- [ ] No linting errors: check IDE or run `npm run lint`
- [ ] Committed with clear message

---

## 📞 Support

| Issue | Command |
|-------|---------|
| Check what changed | `git diff apps/website/astro.config.ts` |
| View commit | `git show HEAD` |
| Rollback | `git checkout HEAD~1 -- apps/website/astro.config.ts` |
| Rebuild | `cd apps/website && npm run build` |
| Container logs | `docker logs container-name -f` |
| Container shell | `docker exec -it container-name sh` |

---

## 📚 Documentation

| File | Use Case |
|------|----------|
| `SSR_MINIMAL_FIX_SUMMARY.md` | Start here (overview) |
| `SSR_MINIMAL_FIX_QUICKREF.md` | Quick deploy guide |
| `SSR_MINIMAL_FIX_COMPLETE.md` | Full documentation |
| `SSR_MINIMAL_FIX_CHANGELOG.md` | What changed + why |
| `SSR_MINIMAL_FIX.diff` | Exact code changes |
| `SSR_MINIMAL_FIX_CHEATSHEET.md` | This file (commands) |

---

**Quick links:**
- 🎯 Summary → `SSR_MINIMAL_FIX_SUMMARY.md`
- ⚡ Quick Start → `SSR_MINIMAL_FIX_QUICKREF.md`
- 📖 Full Docs → `SSR_MINIMAL_FIX_COMPLETE.md`

**Status:** ✅ Production-ready  
**Risk:** Minimal  
**Changes:** 1 file, 3 lines

