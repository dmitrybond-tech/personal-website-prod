# Production Static Asset Offload with Caddy

This document describes the production setup for serving static assets directly from Caddy while keeping dynamic content served by the SSR container.

## Architecture Overview

- **Static Assets**: Served directly by Caddy from `/srv/www/dmitrybond.tech/dist/`
- **Dynamic Content**: Proxied to SSR container on `127.0.0.1:8088`
- **Performance**: Immutable caching for hashed assets (1 year cache)
- **Reliability**: Static assets remain available even if SSR container restarts

## Setup Instructions

### 1. Deploy the Application

Run the production deployment script:

```bash
bash production-deploy-update.sh
```

This script will:
1. Build and start the SSR container
2. Export static assets using `scripts/export-assets.sh`
3. Reload Caddy configuration

### 2. Configure Caddy

Apply the Caddyfile configuration from `CADDY_STATIC_ASSET_OFFLOAD_SNIPPET.md`:

```caddyfile
dmitrybond.tech, www.dmitrybond.tech {
  encode zstd gzip

  # Security headers
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Frame-Options "SAMEORIGIN"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
  }

  # Serve hashed assets directly from disk
  @static_paths {
    path /_astro/* /assets/* *.css *.js *.mjs *.png *.jpg *.jpeg *.webp *.svg *.ico *.woff *.woff2 *.ttf
  }
  handle @static_paths {
    root * /srv/www/dmitrybond.tech/dist
    header Cache-Control "public, max-age=31536000, immutable"
    header X-Served-By "caddy-static"
    file_server
  }

  # Everything else -> SSR upstream
  handle {
    reverse_proxy 127.0.0.1:8088
  }
}
```

### 3. Reload Caddy

```bash
sudo systemctl reload caddy
```

## Manual Asset Export

If you need to manually export assets from a running container:

```bash
# Export assets from running container
bash scripts/export-assets.sh

# Or with custom parameters
CONTAINER_NAME=website-prod HOST_DIST_DIR=/srv/www/dmitrybond.tech/dist bash scripts/export-assets.sh
```

## Verification

### Check Static Asset Serving

```bash
# Test static asset serving
curl -sI --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_astro/any.css | grep -E '^(HTTP/|Cache-Control|X-Served-By)'

# Expected output:
# HTTP/2 200
# Cache-Control: public, max-age=31536000, immutable
# X-Served-By: caddy-static
```

### Check Performance Improvement

```bash
# Measure TTFB for static assets
curl -w '%{time_connect} %{time_starttransfer} %{time_total}\n' -s -o /dev/null https://dmitrybond.tech/_astro/any.css

# Compare with SSR-served content
curl -w '%{time_connect} %{time_starttransfer} %{time_total}\n' -s -o /dev/null https://dmitrybond.tech/
```

### Check Directory Structure

```bash
# Verify assets are in the correct location
ls -la /srv/www/dmitrybond.tech/dist/_astro/
```

## File Structure

```
/srv/www/dmitrybond.tech/dist/
├── _astro/                    # Hashed assets (CSS, JS)
│   ├── *.css                  # Content-hashed CSS files
│   ├── *.js                   # Content-hashed JS files
│   └── ...
├── assets/                    # Other static assets
├── uploads/                   # User-uploaded media
└── ...
```

## Troubleshooting

### Assets Not Found

1. Check if assets were exported:
   ```bash
   ls -la /srv/www/dmitrybond.tech/dist/_astro/
   ```

2. Re-export assets:
   ```bash
   bash scripts/export-assets.sh
   ```

3. Check container is running:
   ```bash
   docker ps | grep website-prod
   ```

### Caddy Not Serving Static Files

1. Check Caddy configuration:
   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   ```

2. Check Caddy logs:
   ```bash
   sudo journalctl -u caddy -f
   ```

3. Verify directory permissions:
   ```bash
   ls -la /srv/www/dmitrybond.tech/dist/
   ```

### Performance Issues

1. Check if static files are being served by Caddy:
   ```bash
   curl -I https://dmitrybond.tech/_astro/any.css | grep X-Served-By
   ```

2. Verify cache headers:
   ```bash
   curl -I https://dmitrybond.tech/_astro/any.css | grep Cache-Control
   ```

## Benefits

- **Performance**: Static assets served directly by Caddy (no reverse proxy overhead)
- **Caching**: Immutable caching for hashed assets (1 year cache)
- **Scalability**: Reduces load on SSR container
- **Reliability**: Static assets remain available even if SSR container restarts
- **Cost**: Reduces server resource usage for static content

## Maintenance

### Updating Assets

When deploying new versions:

1. Run the deployment script (automatically exports assets)
2. Or manually run: `bash scripts/export-assets.sh`

### Monitoring

Monitor the following:

- Static asset serving performance
- SSR container health
- Caddy logs for any errors
- Disk space for static assets

### Cleanup

Old static assets are automatically replaced during deployment. No manual cleanup is required.
