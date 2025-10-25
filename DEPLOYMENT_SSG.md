# SSG Deployment Guide

This document describes the deployment process for the static site generation (SSG) version of the website.

## Overview

The website has been migrated from SSR (Server-Side Rendering) to SSG (Static Site Generation) for improved performance and reduced server dependencies.

## Architecture Changes

- **Before**: Node.js server with SSR adapter
- **After**: Static files served by Caddy
- **Build Output**: `apps/website/dist/` directory
- **Server Path**: `/srv/www/dmitrybond.tech`

## Build Process

### Local Development

```bash
# Install dependencies
cd apps/website
npm install

# Build the site
npm run build

# Preview locally
npm run preview
```

### Production Build

The build process generates static files in the `dist/` directory:

- HTML pages for all routes
- Pre-rendered dynamic routes (legal pages, blog posts)
- Optimized assets with hashed filenames in `/_astro/`
- 404 pages for both locales

## Deployment

### Automated Deployment (GitHub Actions)

Deployment is triggered automatically on push to `main` branch:

1. **Build**: Uses Node.js 22.12.0 and PNPM 9.12.0
2. **Backup**: Creates timestamped backup of current site
3. **Upload**: Securely copies build artifacts to server
4. **Atomic Swap**: Uses rsync for atomic content replacement
5. **Permissions**: Sets proper ownership and permissions
6. **Reload**: Reloads Caddy configuration

### Manual Deployment (PowerShell)

For local Windows development:

```powershell
# Deploy using PowerShell script
.\scripts\deploy-ssg.ps1 -Host "your-server.com" -User "deploy" -KeyPath "C:\path\to\key"
```

### Manual Deployment (SSH)

```bash
# 1. Build locally
cd apps/website
npm run build

# 2. Create backup on server
ssh user@server "sudo cp -a /srv/www/dmitrybond.tech /srv/www/dmitrybond.tech.bak.$(date +%F-%H%M)"

# 3. Upload files
scp -r dist/* user@server:/srv/www/tmp-upload/

# 4. Atomic swap
ssh user@server "sudo rsync -a --delete /srv/www/tmp-upload/ /srv/www/dmitrybond.tech/"

# 5. Set permissions
ssh user@server "sudo chown -R www-data:www-data /srv/www/dmitrybond.tech && sudo chmod -R 755 /srv/www/dmitrybond.tech"

# 6. Reload Caddy
ssh user@server "sudo systemctl reload caddy"
```

## Caddy Configuration

### Static Configuration

The site uses a static Caddy configuration located at `infra/caddy/Caddyfile.ssg.example`:

- **Root Directory**: `/srv/www/dmitrybond.tech`
- **Asset Caching**: 1 year for `/_astro/*` files
- **Compression**: Gzip only (no Brotli due to QUIC/H3 issues)
- **Security Headers**: HSTS, X-Frame-Options, etc.
- **Fallback**: 404 page for missing routes

### Server Setup

1. Copy the Caddy configuration:
   ```bash
   sudo cp infra/caddy/Caddyfile.ssg.example /etc/caddy/Caddyfile
   ```

2. Validate configuration:
   ```bash
   sudo caddy validate
   ```

3. Restart Caddy:
   ```bash
   sudo systemctl restart caddy
   ```

## Rollback Procedures

### Quick Rollback

If a deployment fails, rollback to the previous version:

```bash
# List available backups
ls -la /srv/www/dmitrybond.tech.bak.*

# Restore from backup (replace with actual backup name)
sudo rsync -a --delete /srv/www/dmitrybond.tech.bak.2024-01-15-1430/ /srv/www/dmitrybond.tech/

# Reload Caddy
sudo systemctl reload caddy
```

### Automated Rollback Script

```bash
#!/bin/bash
# rollback.sh - Quick rollback script

BACKUP_DIR=$(ls -t /srv/www/dmitrybond.tech.bak.* | head -n1)
if [ -z "$BACKUP_DIR" ]; then
    echo "No backup found!"
    exit 1
fi

echo "Rolling back to: $BACKUP_DIR"
sudo rsync -a --delete "$BACKUP_DIR/" /srv/www/dmitrybond.tech/
sudo systemctl reload caddy
echo "Rollback completed!"
```

## Verification

### Automated Checks

Run these commands to verify deployment:

```bash
# Check root redirect
curl -sI https://dmitrybond.tech/ | head -n 5

# Check page response
curl -sI https://dmitrybond.tech/en/about | egrep 'HTTP|Content-Type'

# Check asset caching
curl -sI https://dmitrybond.tech/_astro/*.css | egrep 'HTTP|Cache-Control|Content-Type'
```

### Manual Verification

1. **Homepage**: Visit https://dmitrybond.tech (should redirect to /en)
2. **About Page**: Visit https://dmitrybond.tech/en/about
3. **Legal Pages**: Visit https://dmitrybond.tech/en/legal/privacy-policy
4. **Blog**: Visit https://dmitrybond.tech/en/blog
5. **404 Page**: Visit https://dmitrybond.tech/en/nonexistent-page
6. **Assets**: Check that CSS/JS files load with proper cache headers

### Browser Testing

- Test in incognito mode to avoid cache issues
- Check Network tab for proper cache headers
- Verify no network resets or connection issues
- Test both English and Russian locales

## Troubleshooting

### Common Issues

1. **Build Failures**: Check Node.js version and dependencies
2. **Upload Issues**: Verify SSH key permissions and server access
3. **Permission Errors**: Ensure proper ownership (www-data:www-data)
4. **Caddy Issues**: Check configuration with `sudo caddy validate`

### Logs

- **Caddy Logs**: `sudo journalctl -u caddy -f`
- **Access Logs**: `/var/log/caddy/dmitrybond.access.log`
- **Build Logs**: Check GitHub Actions or local build output

## Security Considerations

- All static files are served with appropriate security headers
- No server-side processing (reduced attack surface)
- Regular backups are created before each deployment
- SSH keys should be properly secured and rotated

## Performance Benefits

- **Faster Loading**: Pre-rendered pages load instantly
- **Reduced Server Load**: No Node.js runtime required
- **Better Caching**: Static assets cached for 1 year
- **CDN Ready**: Static files can be easily distributed via CDN
