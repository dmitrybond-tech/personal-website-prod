# Unix Socket Migration Changelog

## 1. Server.ts Hardening
- **Added Unix socket support**: Server now listens on Unix socket when `SOCKET_PATH` environment variable is set
- **Added fs import**: Required for socket file operations (unlink, chmod)
- **Enhanced error handling**: Graceful handling of socket file operations with try-catch blocks
- **Dual listening**: When using socket, server also maintains loopback port 127.0.0.1:3000 for health checks
- **Socket permissions**: Automatic chmod 0660 after socket creation
- **Socket cleanup**: Automatic removal of existing socket file before binding

## 2. Docker Compose Configuration
- **Removed port mapping**: No longer publishes port 3000 to host
- **Added socket volume**: Mounts `/var/run/website` to `/socket` inside container
- **Updated environment**: Changed from `PORT=3000` to `SOCKET_PATH=/socket/astro.sock`
- **Maintained health check**: Health check still uses localhost:3000 inside container

## 3. Caddyfile Simplification
- **Pure reverse proxy**: Removed all static file serving from Caddy
- **Unix socket target**: Changed from `127.0.0.1:3000` to `unix//var/run/website/astro.sock`
- **Removed compression**: No longer handles compression in Caddy (handled by Express)
- **Removed Alt-Svc**: Disabled HTTP/3 advertisements for stability
- **Added health check**: Configured `health_uri /_healthz` for socket health monitoring
- **Added flush_interval**: Set to -1 for immediate response flushing
- **Simplified headers**: Removed custom transport configuration

## 4. Architecture Benefits
- **No published ports**: Website container has no exposed network ports
- **Unix socket communication**: More efficient than TCP for local communication
- **Express static serving**: All static assets served by Express with proper cache headers
- **Compression optimization**: Only text-like content gets compressed
- **HTML cache control**: HTML responses get no-store headers
- **Health check isolation**: Health checks use internal loopback port

## 5. Security Improvements
- **No network exposure**: Website container not accessible from outside
- **Socket permissions**: Unix socket has restricted permissions (0660)
- **Process isolation**: Better container isolation with socket-based communication
- **Reduced attack surface**: No TCP ports exposed for website service

## 6. Performance Optimizations
- **Unix socket efficiency**: Lower latency than TCP for local communication
- **Express static serving**: Optimized static file serving with proper cache headers
- **Compression filtering**: Only compresses text-like content, not binary assets
- **Immediate flushing**: Caddy configured for immediate response delivery
