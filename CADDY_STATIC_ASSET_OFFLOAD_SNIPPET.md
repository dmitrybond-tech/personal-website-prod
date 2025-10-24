# Caddy Static Asset Offload Configuration

This document provides the Caddyfile configuration snippet for serving static assets directly from the filesystem while proxying dynamic content to the SSR container.

## Production Caddyfile Snippet

Replace your existing `dmitrybond.tech, www.dmitrybond.tech` block with this configuration:

```caddyfile
dmitrybond.tech, www.dmitrybond.tech {
  encode zstd gzip

  # Security headers for all responses
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Frame-Options "SAMEORIGIN"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
  }

  # Serve hashed assets directly from disk with immutable caching
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

## Key Features

1. **Static Asset Detection**: Matches `/_astro/*`, `/assets/*`, and common static file extensions
2. **Immutable Caching**: Sets `Cache-Control: public, max-age=31536000, immutable` for hashed assets
3. **Verification Header**: Adds `X-Served-By: caddy-static` to identify Caddy-served static files
4. **Fallback to SSR**: All non-static requests are proxied to the SSR container
5. **Security Headers**: Maintains existing security headers

## Verification Commands

After applying this configuration, verify it's working:

```bash
# Check static asset serving
curl -sI --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_astro/any.css | grep -E '^(HTTP/|Cache-Control|X-Served-By)'

# Expected output:
# HTTP/2 200
# Cache-Control: public, max-age=31536000, immutable
# X-Served-By: caddy-static

# Check TTFB improvement
curl -w '%{time_connect} %{time_starttransfer} %{time_total}\n' -s -o /dev/null https://dmitrybond.tech/_astro/any.css
```

## Directory Structure

The configuration expects static assets to be available at:
```
/srv/www/dmitrybond.tech/dist/
├── _astro/
│   ├── *.css (hashed)
│   ├── *.js (hashed)
│   └── ...
├── assets/
└── ...
```

## Deployment Process

1. Build and start the SSR container
2. Run `scripts/export-assets.sh` to copy assets to `/srv/www/dmitrybond.tech/dist`
3. Apply this Caddyfile configuration
4. Reload Caddy: `systemctl reload caddy`

## Benefits

- **Performance**: Static assets served directly by Caddy (no reverse proxy overhead)
- **Caching**: Immutable caching for hashed assets (1 year cache)
- **Scalability**: Reduces load on SSR container
- **Reliability**: Static assets remain available even if SSR container restarts
