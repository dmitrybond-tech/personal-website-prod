# Production Fix Summary

## Issues Fixed

### 1. Caddyfile Static Asset Handling
**Problem**: Static assets (CSS, JS, fonts) were returning 502 errors
**Solution**: Fixed Caddyfile.prod to properly handle static assets

**Changes made**:
- Changed `handle_path` to `handle` for better path matching
- Simplified `file_server` configuration
- Ensured static handlers are placed **above** the `reverse_proxy` directive

### 2. Unix Socket Permissions
**Problem**: Caddy couldn't access the Unix socket `/var/run/website/astro.sock`
**Solution**: Created permission fix script

**Changes made**:
- Created `scripts/fix-socket-permissions.sh`
- Sets proper group ownership (`caddy:caddy`)
- Uses setgid bit (2775) for directory inheritance
- Sets socket permissions to 660

### 3. Compose Configuration Cleanup
**Problem**: Outdated `version` key in compose.prod.yml
**Solution**: Removed version key and created override file

**Changes made**:
- Removed `version: '3.8'` from `compose.prod.yml`
- Created `compose.image.yml` override file
- Override uses pre-built image instead of building

### 4. Static Asset Synchronization
**Problem**: Static assets not properly synced from container to host
**Solution**: Enhanced deploy scripts with asset sync

**Changes made**:
- Updated `scripts/deploy-local.sh` with asset sync
- Created `deploy/scripts/deploy_web.sh` for production
- Added automatic ownership setting for Caddy

## Files Modified

### Core Configuration
- `Caddyfile.prod` - Fixed static asset handlers
- `compose.prod.yml` - Removed version key
- `compose.image.yml` - Created override file

### Scripts
- `scripts/deploy-local.sh` - Added static asset sync
- `deploy/scripts/deploy_web.sh` - Created production deploy script
- `scripts/fix-socket-permissions.sh` - Created permission fix script
- `scripts/test-production.sh` - Created testing script

## Deployment Instructions

### 1. Fix Socket Permissions (Run on VPS)
```bash
# Make script executable
chmod +x scripts/fix-socket-permissions.sh

# Run permission fix
sudo ./scripts/fix-socket-permissions.sh
```

### 2. Deploy with Override
```bash
# Deploy with image override
docker compose -f compose.prod.yml -f compose.image.yml up -d

# Or use the production script
./deploy/scripts/deploy_web.sh
```

### 3. Test Production
```bash
# Run health checks
./scripts/test-production.sh

# Manual curl tests
curl -I https://dmitrybond.tech/_astro/
curl -I https://dmitrybond.tech/en/about
```

## Expected Results

### Static Assets
- `/_astro/*` → 200 OK, `text/css`, `Cache-Control: public, max-age=31536000, immutable`
- `/fonts/*` → 200 OK, proper content-type, immutable cache headers
- `/uploads/*` → 200 OK, `Cache-Control: public, max-age=31536000`

### Main Pages
- `/en/about` → 200 OK, `text/html`
- `/ru/about` → 200 OK, `text/html`
- `/` → 200 OK, `text/html`

### Health Check
- `/_healthz` → 200 OK

## Troubleshooting

### If static assets still return 502:
1. Check Caddy logs: `sudo journalctl -u caddy -f`
2. Verify static files exist: `ls -la /srv/www/static/`
3. Check ownership: `ls -la /srv/www/static/` (should be `caddy:caddy`)

### If socket connection fails:
1. Check socket exists: `ls -la /var/run/website/astro.sock`
2. Check permissions: `ls -la /var/run/website/`
3. Run permission fix script again

### If container won't start:
1. Check logs: `docker compose -f compose.prod.yml logs website`
2. Verify environment variables in `env.prod`
3. Check image exists: `docker images | grep personal-website-prod`

## Security Notes

- Static assets are served directly by Caddy (no container overhead)
- Unix socket provides secure communication between Caddy and Astro
- Proper file permissions prevent unauthorized access
- Cache headers optimize performance while maintaining security
