# Caddy Static Asset Delivery Runbook

## Overview

This setup moves static asset delivery from the SSR container to Caddy, improving stability and performance. Caddy serves static files directly from `apps/website/dist` while proxying dynamic requests to the SSR container.

## Architecture

- **website-build**: One-shot Node.js container that builds the Astro site
- **website-ssr**: Existing SSR container for dynamic content (port 4321)
- **caddy**: Reverse proxy and static file server (ports 80/443)

## First Time Setup / Code Changes

### 1. Build Static Assets

```bash
# From repository root
docker compose -f infra/compose/prod.compose.yml run --rm website-build
```

This command:
- Uses Node.js 20.18.0 with Corepack enabled
- Runs `pnpm install --frozen-lockfile && pnpm run build`
- Outputs to `./apps/website/dist` on the host
- Exits after successful build

### 2. Start Services

```bash
# Bring up SSR and Caddy
docker compose -f infra/compose/prod.compose.yml up -d website-ssr caddy
```

This command:
- Starts the SSR container with health checks
- Waits for SSR to be healthy before starting Caddy
- Caddy mounts `./apps/website/dist` as read-only static files
- Publishes ports 80 and 443

### 3. Smoke Tests

```bash
# Test static asset delivery (should return 200 with Cache-Control: immutable)
curl -I https://dmitrybond.tech/_astro/ | head -n 20

# Test health endpoint (should return 200)
curl -i https://dmitrybond.tech/_healthz

# Test dynamic content (should render via SSR)
curl -i https://dmitrybond.tech/
```

## File Structure

```
infra/
├── compose/
│   └── prod.compose.yml          # Production Docker Compose
└── caddy/
    └── Caddyfile                 # Caddy configuration
```

## Static Asset Handling

Caddy serves these paths directly from `apps/website/dist`:
- `/_astro/*` - Astro build assets
- `/assets/*` - Application assets
- `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`
- `/images/*`, `/icons/*`, `/fonts/*`, `/static/*`

All static assets get:
- `Cache-Control: public, max-age=31536000, immutable`
- HTML files get: `Cache-Control: public, max-age=60`

## Health Checks

- **SSR Container**: `/_healthz` endpoint checked every 10s
- **Caddy**: Depends on SSR being healthy before starting
- **Static Files**: Served directly by Caddy (no health check needed)

## Troubleshooting

### Build Issues
```bash
# Check if dist directory exists
ls -la apps/website/dist/

# Rebuild with verbose output
docker compose -f infra/compose/prod.compose.yml run --rm website-build
```

### Service Issues
```bash
# Check service status
docker compose -f infra/compose/prod.compose.yml ps

# View logs
docker compose -f infra/compose/prod.compose.yml logs website-ssr
docker compose -f infra/compose/prod.compose.yml logs caddy

# Restart services
docker compose -f infra/compose/prod.compose.yml restart
```

### Static Asset Issues
```bash
# Check if static files are mounted correctly
docker compose -f infra/compose/prod.compose.yml exec caddy ls -la /srv/www/static/

# Test static file serving
curl -I https://dmitrybond.tech/_astro/some-file.js
```

## Acceptance Criteria

✅ `/_astro/*.js` and `/assets/*` served directly by Caddy with `Cache-Control: immutable`  
✅ `GET /_healthz` returns 200 via Caddy reverse proxy to SSR  
✅ `GET /` renders via SSR without 5xx errors from Caddy  
✅ `docker compose run --rm website-build` completes successfully  
✅ No folder structure changes outside specified files  

## Rollback

To rollback to SSR-only serving:

1. Stop Caddy: `docker compose -f infra/compose/prod.compose.yml stop caddy`
2. Update your existing setup to serve static files from SSR container
3. Restart SSR: `docker compose -f infra/compose/prod.compose.yml restart website-ssr`
