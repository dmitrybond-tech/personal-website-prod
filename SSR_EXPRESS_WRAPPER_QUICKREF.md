# SSR Express Wrapper - Quick Reference

## What Changed

✅ **New file**: `apps/website/src/server.ts` (Express wrapper for static assets)  
✅ **Updated**: `apps/website/package.json` (deps: express, compression, esbuild, @types)  
✅ **Updated**: `apps/website/Dockerfile` (runtime deps install, new CMD, healthcheck)  

## Quick Deploy

```bash
# 1. Install dependencies
npm install

# 2. Rebuild Docker image
docker compose --env-file .env.prod -f compose.prod.yml build website-prod

# 3. Deploy
docker compose --env-file .env.prod -f compose.prod.yml up -d --force-recreate website-prod

# 4. Verify
curl -sI https://dmitrybond.tech/_healthz
curl -sI https://dmitrybond.tech/_astro/about.CYKiepS_.css
```

## PowerShell (Windows)

```powershell
# Install dependencies
npm install

# Rebuild Docker
docker compose --env-file env.prod -f compose.prod.yml build website-prod

# Deploy
docker compose --env-file env.prod -f compose.prod.yml up -d --force-recreate website-prod

# Verify
curl.exe -sI https://dmitrybond.tech/_healthz
curl.exe -sI https://dmitrybond.tech/_astro/about.CYKiepS_.css
```

## Expected Results

| Endpoint | Status | Cache-Control | Content-Type |
|----------|--------|---------------|--------------|
| `/_healthz` | 200 | - | text/plain |
| `/_astro/*.css` | 200 | public, max-age=31536000, immutable | text/css |
| `/_astro/*.js` | 200 | public, max-age=31536000, immutable | application/javascript |
| `/fonts/*.woff2` | 200 | public, max-age=31536000, immutable | font/woff2 |
| `/uploads/*.png` | 200 | public, max-age=31536000 | image/png |
| `/en/about` | 200 | no-store, max-age=0, must-revalidate | text/html |

## Files

- **Diff**: `SSR_EXPRESS_WRAPPER_IMPLEMENTATION.diff`
- **Changelog**: `SSR_EXPRESS_WRAPPER_CHANGELOG.md`
- **Runbook**: `SSR_EXPRESS_WRAPPER_RUNBOOK.md`
- **Summary**: `SSR_EXPRESS_WRAPPER_SUMMARY.md`

## Rollback

```bash
git revert HEAD
docker compose --env-file .env.prod -f compose.prod.yml build website-prod
docker compose --env-file .env.prod -f compose.prod.yml up -d website-prod
```

## Key Dependencies

**Runtime**:
- `express@4.19.2`
- `compression@1.7.4`

**Dev**:
- `@types/express@4.17.21`
- `@types/compression@1.7.5`
- `esbuild@0.23.0`

## Architecture

```
Caddy → Express → [Static Assets | Astro SSR]
             ↓
    /_astro, /fonts, /uploads → express.static
    /_healthz → 200 text/plain
    /* → Astro handler
```

## Troubleshooting

**404 on assets?**
```bash
docker exec website-prod ls -la /app/dist/client/_astro
```

**Health check failing?**
```bash
docker exec website-prod wget --spider http://127.0.0.1:3000/_healthz
```

**Check logs:**
```bash
docker compose -f compose.prod.yml logs -f website-prod
```

---

**Ready to deploy!** 🚀

