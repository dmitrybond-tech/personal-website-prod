# SSR Minimal Fix - Quick Reference

## 🎯 What Changed

**One file:** `apps/website/astro.config.ts`

Added 3 lines to ensure correct asset paths and caching:
```typescript
base: '/',              // ← Absolute asset paths
trailingSlash: 'never', // ← Consistent URLs
build: { assets: '_astro' }, // ← Explicit asset dir
```

## ✅ What's Already Correct

- ✅ Middleware: Cache headers already optimal
- ✅ Dockerfile: HEALTHCHECK + correct CMD
- ✅ Caddyfile: Simple reverse proxy
- ✅ All static assets copied to `dist/client`

## 🚀 Quick Deploy

```bash
# 1. Apply changes (already done)
git add apps/website/astro.config.ts
git commit -m "fix(astro): explicit asset config for SSR"

# 2. Build & test locally
cd apps/website && npm run build
node ./dist/server/entry.mjs

# 3. Test in browser
curl -I http://localhost:3000/_astro/ # Should be 200 + immutable
curl -I http://localhost:3000/        # Should be 200 + no-store

# 4. Build Docker
docker build -f apps/website/Dockerfile -t website:latest .

# 5. Deploy
docker-compose up -d
```

## 🧪 CI Smoke Tests (Add to GitHub Actions)

```yaml
- name: Smoke Test Static Assets
  run: |
    docker run -d --name test -p 3000:3000 ${{ env.IMAGE }}
    sleep 10
    
    # Test CSS (immutable)
    CSS=$(docker exec test sh -c "ls /app/dist/client/_astro/*.css | head -1 | xargs basename")
    curl -f -I http://localhost:3000/_astro/$CSS | grep "immutable"
    
    # Test Font (immutable)
    FONT=$(docker exec test sh -c "ls /app/dist/client/fonts/*.woff2 | head -1 | xargs basename")
    curl -f -I http://localhost:3000/fonts/$FONT | grep "immutable"
    
    # Test HTML (no-store)
    curl -f -I http://localhost:3000/ | grep "no-store"
    
    docker stop test && docker rm test
```

## 📊 Expected Results

| Asset | Status | Content-Type | Cache-Control |
|-------|--------|--------------|---------------|
| `/_astro/*.css` | 200 | `text/css` | `max-age=31536000, immutable` |
| `/fonts/*.woff2` | 200 | `font/woff2` | `max-age=31536000, immutable` |
| `/uploads/*.png` | 200 | `image/png` | `max-age=86400` |
| `/` (HTML) | 200 | `text/html` | `no-store, max-age=0` |

## 🔧 Troubleshooting

### 404 on `/_astro/*`
```bash
# Check files exist in Docker
docker exec container ls -la /app/dist/client/_astro
```

### Wrong MIME type
```bash
# Check middleware is running
docker logs container | grep middleware
```

### Health check fails
```bash
# Check server is listening
docker exec container netstat -tuln | grep 3000
```

## 📝 Architecture

```
Browser → Caddy :80 → Node.js :3000 (entry.mjs)
                       ├─ HTML: no-store
                       ├─ /_astro/*: immutable (middleware)
                       ├─ /fonts/*: immutable (middleware)
                       └─ /uploads/*: 1-day cache (middleware)
```

## 🎯 Key Points

1. **No Express** - Native Astro Node adapter
2. **No CDN** - Node.js serves static files
3. **No routing changes** - Kept `/_astro` absolute paths
4. **Middleware handles caching** - No Caddy rewrites needed
5. **Single change** - Only `astro.config.ts` modified

## 📦 Rollback

```bash
git checkout HEAD -- apps/website/astro.config.ts
npm run build
```

---

**Status:** ✅ Production-ready  
**Zero downtime:** Yes  
**Breaking changes:** None

