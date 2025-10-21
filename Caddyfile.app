# Caddyfile for Astro SSR (Production)
# All cache headers are managed by src/middleware.ts
:80 {
    # Compression (gzip, zstd)
    encode zstd gzip
    
    # Security headers (applies to all responses)
    header {
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
    }
    
    # Transparent reverse proxy to Node SSR
    reverse_proxy 127.0.0.1:3000
}
