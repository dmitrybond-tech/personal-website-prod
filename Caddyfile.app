:80 {
    root * /srv
    
    # Enable compression
    encode zstd gzip
    
    # Cache static assets
    @static {
        path *.css *.js *.png *.jpg *.jpeg *.webp *.svg *.ico *.woff *.woff2
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
    
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
    }
    
    # For SPA routing - fallback to index.html
    try_files {path} {path}/ /index.html
    
    # Serve files
    file_server
}
