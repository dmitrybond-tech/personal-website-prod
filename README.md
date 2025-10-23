# Personal Website - Production Deployment

This repository contains the production deployment configuration for dmitrybond.tech, a personal website built with Astro and deployed using Docker, Caddy, and GitHub Container Registry.

## Architecture

The production setup uses a simplified, deterministic architecture:

- **Caddy**: Terminates TLS and serves static assets directly from `/opt/prod/static`
- **SSR Container**: Handles server-side rendering on `127.0.0.1:8088` (not exposed externally)
- **Static Assets**: Immutable assets (/_astro/*, /assets/*, fonts, images) served with long-lived cache
- **Uploads**: Media files served from `/opt/prod/uploads` with softer caching
- **Mailcow**: Existing mail configuration remains untouched

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Caddy installed and configured
- Access to the production server
- GitHub Container Registry access

### Deployment

1. **Prepare Environment**:
   ```bash
   cp env.prod.sample .env.prod
   # Edit .env.prod with your actual values
   ```

2. **Deploy**:
   ```bash
   ./deploy.sh
   ```

The deployment script will:
- Pull the latest image from GHCR
- Extract static assets to `/opt/prod/static`
- Start the SSR container on `127.0.0.1:8088`
- Reload Caddy configuration

## File Structure

```
├── caddy/
│   └── Caddyfile              # Caddy configuration (website blocks only)
├── infra/
│   └── compose/
│       └── website.compose.yml # Docker Compose for SSR container
├── deploy.sh                  # Deployment automation script
├── env.prod.sample           # Environment variables template
└── README.md                  # This file
```

## Configuration

### Environment Variables

Copy `env.prod.sample` to `.env.prod` and configure:

- **Core**: `NODE_ENV`, `PORT`, `BASE_URL`
- **OAuth**: GitHub client credentials for Decap CMS
- **Auth**: Auth.js configuration
- **CMS**: Decap CMS settings
- **Cal.com**: Webhook configuration

### Caddy Configuration

The `caddy/Caddyfile` contains website-specific blocks that:
- Serve immutable static assets with `Cache-Control: public, max-age=31536000, immutable`
- Serve uploads with `Cache-Control: public, max-age=3600`
- Proxy all other requests to the SSR container
- Import existing Mailcow configuration (untouched)

## Verification

### Server Commands

```bash
# Check static assets caching
curl -sI --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_astro/any.css | egrep -i '^(HTTP/|content-type:|cache-control:|etag:|last-modified:)'

# Check SSR container
curl -sS http://127.0.0.1:8088/en/about | head -n 50

# Check container logs
docker logs -f website-prod

# Check Caddy logs
tail -f /var/log/caddy/dmitrybond.access.log
```

### Windows/PowerShell (Dev)

```powershell
# Test website response
Invoke-WebRequest https://dmitrybond.tech/robots.txt -Headers @{"Host"="dmitrybond.tech"} -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

## Health Checks

- **SSR Container**: `http://127.0.0.1:8088/_healthz`
- **Static Assets**: Should return 200 with proper cache headers
- **Uploads**: Should return 200 with 1-hour cache
- **SSR Routes**: Should render server-side without blank pages

## Rollback Procedure

If issues occur after deployment:

1. **Quick Rollback**:
   ```bash
   # Stop current container
   docker stop website-prod
   docker rm website-prod
   
   # Start previous image (replace with actual previous digest)
   docker run -d --name website-prod \
     -p 127.0.0.1:8088:3000 \
     -e NODE_ENV=production \
     ghcr.io/dmitrybond-tech/personal-website-prod:sha-PREVIOUS_SHA
   ```

2. **Full Rollback**:
   ```bash
   # Revert to previous static assets
   sudo cp -r /opt/prod/static.backup /opt/prod/static
   
   # Restart with previous configuration
   docker compose -f infra/compose/website.compose.yml down
   # Deploy previous version
   ```

## Troubleshooting

### Common Issues

1. **ERR_CONNECTION_RESET**: Check if SSR container is healthy on `127.0.0.1:8088`
2. **Missing Static Assets**: Verify `/opt/prod/static` contains `_astro` directory
3. **502/503 Errors**: Check container logs and health status
4. **Blank Pages**: Verify CSS/JS assets are loading with proper cache headers

### Logs

```bash
# Container logs
docker logs -f website-prod

# Caddy access logs
tail -f /var/log/caddy/dmitrybond.access.log

# Caddy error logs
journalctl -u caddy -f
```

### Directory Structure

- **Static Assets**: `/opt/prod/static` (served by Caddy)
- **Uploads**: `/opt/prod/uploads` (served by Caddy)
- **SSR Container**: `127.0.0.1:8088` (internal only)

## Security Notes

- SSR container is only accessible on loopback interface
- Static assets are served directly by Caddy (no container exposure)
- Mailcow configuration remains completely untouched
- TLS termination handled by Caddy

## CI/CD

The repository uses GitHub Actions to:
- Build and push images to `ghcr.io/dmitrybond-tech/personal-website-prod:main`
- Deploy to production via SSH
- Handle LFS assets and static asset extraction

## Support

For issues related to:
- **Deployment**: Check `deploy.sh` logs and container status
- **Static Assets**: Verify `/opt/prod/static` contents and Caddy configuration
- **SSR**: Check container health and logs
- **Mailcow**: Existing configuration is preserved and unchanged
