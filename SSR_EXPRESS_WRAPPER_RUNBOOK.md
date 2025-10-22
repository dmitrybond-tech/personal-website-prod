# SSR Express Wrapper - Deployment Runbook

## Prerequisites
- Docker and Docker Compose installed
- `.env.prod` file configured with required environment variables
- Git repository with latest changes

## Local Development

### Install Dependencies
```powershell
# Windows (PowerShell)
cd apps\website
npm install

# Or from monorepo root
npm install
```

```bash
# Linux/macOS
cd apps/website
npm install
```

### Build Locally
```powershell
# Windows (PowerShell)
cd apps\website
npm run build
# This will:
# 1. Run prebuild (assert-decap-asset, build-iconify-bundle)
# 2. Run astro build
# 3. Run postbuild (bundle src/server.ts → dist/server/server.mjs)

# Start locally
npm run start
```

```bash
# Linux/macOS
cd apps/website
npm run build
npm run start
```

### Local Verification
```powershell
# Windows (PowerShell)
curl.exe -I http://127.0.0.1:3000/_healthz
curl.exe -I http://127.0.0.1:3000/en/about
# Check for /_astro/*.css in HTML, then test one:
curl.exe -I http://127.0.0.1:3000/_astro/about.CYKiepS_.css
curl.exe -I http://127.0.0.1:3000/fonts/inter-roman.var.woff2
```

```bash
# Linux/macOS
curl -sI http://127.0.0.1:3000/_healthz | head -n12
curl -sI http://127.0.0.1:3000/en/about | head -n12
curl -sI http://127.0.0.1:3000/_astro/about.CYKiepS_.css | head -n12
curl -sI http://127.0.0.1:3000/fonts/inter-roman.var.woff2 | head -n12
```

## Docker Build & Deployment

### Build Docker Image
```powershell
# Windows (PowerShell) - from monorepo root
docker compose --env-file env.prod -f compose.prod.yml build website-prod
```

```bash
# Linux/macOS - from monorepo root
docker compose --env-file .env.prod -f compose.prod.yml build website-prod
```

### Deploy Container
```powershell
# Windows (PowerShell)
docker compose --env-file env.prod -f compose.prod.yml up -d --force-recreate website-prod
```

```bash
# Linux/macOS
docker compose --env-file .env.prod -f compose.prod.yml up -d --force-recreate website-prod
```

### Check Container Status
```powershell
# Windows (PowerShell)
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml logs -f website-prod
```

```bash
# Linux/macOS
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml logs -f website-prod
```

## Smoke Tests

### Internal Health Check
```powershell
# Windows (PowerShell) - inside container or host
curl.exe -sI http://127.0.0.1:3000/_healthz
# Expected: HTTP/1.1 200 OK, Content-Type: text/plain
```

```bash
# Linux/macOS
curl -sI http://127.0.0.1:3000/_healthz | sed -n '1,12p'
# Expected: HTTP/1.1 200 OK, Content-Type: text/plain
```

### Production Smoke Tests

```bash
# 1. HTML response (should be no-cache)
curl -sI https://dmitrybond.tech/en/about | sed -n '1,12p'
# Expected: 200 OK, Cache-Control: no-store

# 2. Extract and test first CSS/JS asset
curl -s https://dmitrybond.tech/en/about | grep -oE '/_astro/[^\"]+\.(css|js)' | head -n1 | xargs -I{} sh -c 'curl -sI https://dmitrybond.tech{} | sed -n "1,12p"'
# Expected: 200 OK, Cache-Control: public, max-age=31536000, immutable

# 3. Font file
curl -sI https://dmitrybond.tech/fonts/inter-roman.var.woff2 | sed -n '1,12p'
# Expected: 200 OK, Content-Type: font/woff2, Cache-Control: public, max-age=31536000, immutable

# 4. Upload file (pick existing file from your setup)
curl -sI https://dmitrybond.tech/uploads/photo-linkedin-cropped.png | sed -n '1,12p'
# Expected: 200 OK, Content-Type: image/png, Cache-Control: public, max-age=31536000
```

### PowerShell Smoke Tests (Windows)
```powershell
# 1. HTML response
curl.exe -sI https://dmitrybond.tech/en/about | Select-Object -First 12

# 2. Test specific CSS file (replace hash with actual)
curl.exe -sI https://dmitrybond.tech/_astro/about.CYKiepS_.css | Select-Object -First 12

# 3. Font file
curl.exe -sI https://dmitrybond.tech/fonts/inter-roman.var.woff2 | Select-Object -First 12

# 4. Upload file
curl.exe -sI https://dmitrybond.tech/uploads/photo-linkedin-cropped.png | Select-Object -First 12
```

## Expected Cache Headers

| Asset Type | Cache-Control Header | Immutable |
|------------|---------------------|-----------|
| `/_astro/*` | `public, max-age=31536000, immutable` | ✅ |
| `/fonts/*` | `public, max-age=31536000, immutable` | ✅ |
| `/uploads/*` | `public, max-age=31536000` | ❌ |
| HTML pages | `no-store, max-age=0, must-revalidate` | ❌ |

## Troubleshooting

### 404 on /_astro/*
1. Check if dist/client/_astro exists:
   ```bash
   docker exec website-prod ls -la /app/dist/client/_astro
   ```
2. Check server.ts resolution of CLIENT_ROOT:
   ```bash
   docker exec website-prod node -e "console.log(require('path').resolve('/app/dist/server', '../client'))"
   ```

### Container Won't Start
1. Check logs:
   ```bash
   docker compose -f compose.prod.yml logs website-prod
   ```
2. Verify dependencies installed:
   ```bash
   docker exec website-prod npm list express compression
   ```

### HEALTHCHECK Failing
1. Test healthcheck manually:
   ```bash
   docker exec website-prod wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/_healthz
   ```
2. Check if port 3000 is listening:
   ```bash
   docker exec website-prod netstat -tlnp | grep 3000
   ```

### Wrong MIME Types
Express automatically sets Content-Type based on file extensions. If wrong:
1. Check if express.static is serving the correct directory
2. Verify file extensions are correct (.css, .js, .woff2, etc.)

## Rollback

If issues occur, rollback to previous version:

```bash
# Stop current container
docker compose -f compose.prod.yml down website-prod

# Revert git changes
git revert HEAD

# Rebuild and deploy
docker compose --env-file .env.prod -f compose.prod.yml build website-prod
docker compose --env-file .env.prod -f compose.prod.yml up -d website-prod
```

## CI/CD Integration

Add to your CI pipeline (GitHub Actions, GitLab CI, etc.):

```yaml
# Example GitHub Actions snippet
- name: Build Docker Image
  run: |
    docker compose --env-file .env.prod -f compose.prod.yml build website-prod

- name: Deploy Container
  run: |
    docker compose --env-file .env.prod -f compose.prod.yml up -d --force-recreate website-prod

- name: Health Check
  run: |
    sleep 15
    curl -f http://127.0.0.1:3000/_healthz || exit 1

- name: Smoke Test Assets
  run: |
    curl -sI https://dmitrybond.tech/_astro/about.CYKiepS_.css | grep "200 OK"
```

## Notes

- **No Changes to Caddy**: Caddy remains a pure reverse proxy to `127.0.0.1:3000`
- **No Changes to Astro Config**: No modifications to `base`, `assets`, or `assetPrefix`
- **Runtime Dependencies**: `express` and `compression` are production dependencies, not dev
- **Build Output**: After build, you should see `dist/server/server.mjs` (bundled) and `dist/server/entry.mjs` (Astro's SSR entry)

