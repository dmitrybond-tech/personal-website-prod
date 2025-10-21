# Running Behind Reverse Proxy (Caddy/Nginx)

This document describes how to run the Astro SSR application behind a reverse proxy like Caddy or Nginx.

## Architecture Overview

```
┌─────────┐      ┌──────────┐      ┌────────────────┐
│ Browser │─────▶│  Caddy   │─────▶│ Astro SSR Node │
│         │      │  (Proxy) │      │   (port 3000)  │
└─────────┘      └──────────┘      └────────────────┘
                                           │
                                           ├─ dist/server/ (SSR logic)
                                           └─ dist/client/ (static assets)
```

**Important**: The SSR server serves both dynamic HTML and static assets (CSS, JS, fonts, images). The reverse proxy should pass **all** requests to the SSR server, not serve static files directly from the filesystem.

## Why This Configuration?

In containerized deployments:
- The reverse proxy runs on the host
- The Astro SSR server runs in a container
- Static files (in `dist/client/`) are inside the container, not accessible to the host filesystem

Therefore, **Caddy should NOT attempt to serve static files directly**. All requests must be proxied to the Node.js SSR server on port 3000 (or configured port).

## Caddy Configuration

### Basic Setup (Recommended)

```caddy
# Caddyfile.app
https://dmitrybond.tech {
    # Simple reverse proxy - pass everything to SSR server
    reverse_proxy 127.0.0.1:3000
}
```

That's it! The SSR server handles:
- Static assets with proper cache headers (`/_astro/*`, `/fonts/*`, etc.)
- Dynamic HTML with `no-store` headers
- Content-Type headers for all asset types

### What NOT to Do

❌ **Don't try to serve static files directly from filesystem:**

```caddy
# WRONG - Don't do this!
https://dmitrybond.tech {
    # This won't work in containers - files are not on host
    root * /var/www/dist/client
    file_server
    
    reverse_proxy 127.0.0.1:3000
}
```

❌ **Don't override cache headers in Caddy:**

```caddy
# WRONG - Let the SSR server handle cache headers
https://dmitrybond.tech {
    reverse_proxy 127.0.0.1:3000 {
        header_up Cache-Control "no-store"  # DON'T DO THIS
    }
}
```

## Nginx Configuration

### Basic Setup

```nginx
server {
    listen 443 ssl http2;
    server_name dmitrybond.tech;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSR Server Cache Policy

The Astro SSR server automatically applies cache headers based on content type:

### Immutable Assets (1 year cache)
- `/_astro/*` - Hashed JS/CSS bundles
- `/fonts/*` - Web fonts (woff2, etc.)

**Headers**: `Cache-Control: public, max-age=31536000, immutable`

### User Content (1 day cache)
- `/uploads/*` - User-uploaded images and media

**Headers**: `Cache-Control: public, max-age=86400`

### HTML Pages (No cache)
- All `.html` responses
- All SSR-rendered pages

**Headers**: `Cache-Control: no-store, max-age=0, must-revalidate`

### API Endpoints (No cache)
- `/api/*` - All API routes

**Headers**: `Cache-Control: no-store, max-age=0, must-revalidate`

## Verification

### Local Smoke Tests

```bash
# Test local server
npm run test:smoke

# Test production server
npm run test:smoke:prod
```

### Manual Verification

```bash
BASE_URL="https://dmitrybond.tech"

# 1. Check HTML has no-store
curl -sI "$BASE_URL/en/about" | grep -i cache-control
# Expected: Cache-Control: no-store, max-age=0, must-revalidate

# 2. Extract CSS path and check it
CSS_PATH=$(curl -sS "$BASE_URL/en/about" | grep -oP '/_astro/[^"]+\.css' | head -n1)
curl -sI "$BASE_URL$CSS_PATH" | grep -i cache-control
# Expected: Cache-Control: public, max-age=31536000, immutable

# 3. Check font
curl -sI "$BASE_URL/fonts/inter-roman.var.woff2" | grep -i cache-control
# Expected: Cache-Control: public, max-age=31536000, immutable

# 4. Verify single Cache-Control header (not duplicated)
curl -sI "$BASE_URL$CSS_PATH" | grep -c "cache-control:"
# Expected: 1
```

## E2E Tests

Run Playwright tests to verify styles are loaded:

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

## Troubleshooting

### Symptom: Styles not loading in browser

**Check 1**: Verify HTML contains stylesheet links

```bash
curl -sS https://dmitrybond.tech/en/about | grep -o '/_astro/[^"]\+\.css'
```

**Check 2**: Verify CSS file returns 200

```bash
CSS_PATH="/_astro/about.abc123.css"  # Use actual path from step 1
curl -sI "https://dmitrybond.tech$CSS_PATH"
```

**Check 3**: Verify Cache-Control is immutable, not no-store

```bash
curl -sI "https://dmitrybond.tech$CSS_PATH" | grep -i cache-control
```

If you see `no-store` on CSS files, check:
1. Middleware order in `src/middleware.ts`
2. No global `no-store` being applied to all responses
3. Caddy not overriding headers

**Check 4**: Verify Content-Type is correct

```bash
curl -sI "https://dmitrybond.tech$CSS_PATH" | grep -i content-type
# Expected: content-type: text/css
```

### Symptom: CSS returns 404

This means the static file handler is not reaching the files. Check:

1. **Build output exists**:
   ```bash
   ls -la apps/website/dist/client/_astro/
   ```

2. **Server is starting from correct directory**:
   ```bash
   # In your start script or Dockerfile
   cd apps/website && node ./dist/server/entry.mjs
   ```

3. **Node adapter is in standalone mode** (check `astro.config.ts`):
   ```ts
   adapter: node({ mode: 'standalone' })
   ```

### Symptom: Duplicate Cache-Control headers

If you see multiple `Cache-Control` headers in responses:

```bash
curl -sI https://dmitrybond.tech/_astro/about.abc123.css
```

**Fix**: Check for conflicting header logic:
1. Middleware in `src/middleware.ts`
2. Caddy/Nginx configuration
3. CDN or additional proxy layer

The SSR server should set headers once, and reverse proxy should pass them through unchanged.

## Docker Compose Example

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "127.0.0.1:3000:4321"  # Only expose to localhost
    environment:
      - PORT=4321
      - HOST=0.0.0.0
    restart: unless-stopped

  # Caddy runs on host (outside container) and proxies to app:3000
```

## Security Headers

The SSR middleware automatically applies security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (for admin pages)
- `Content-Security-Policy` (for HTML pages)

These headers should pass through the reverse proxy unchanged.

## Performance Considerations

### Browser Caching

With `immutable` cache headers, browsers will cache hashed assets forever:
- `/_astro/about.abc123.css` - Cached until page refresh
- Next deployment with new hash (`about.def456.css`) will fetch new file

### CDN Integration

If using a CDN (Cloudflare, etc.):
1. Let the SSR server set `Cache-Control` headers
2. Configure CDN to respect origin cache headers
3. For `immutable` assets, CDN can cache for 1 year
4. For HTML, CDN should respect `no-store` and not cache

### Compression

Enable gzip/brotli compression in Caddy:

```caddy
https://dmitrybond.tech {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
```

Or Nginx:

```nginx
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1000;
```

## References

- [Astro SSR Guide](https://docs.astro.build/en/guides/server-side-rendering/)
- [Astro Node Adapter](https://docs.astro.build/en/guides/integrations-guide/node/)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)

