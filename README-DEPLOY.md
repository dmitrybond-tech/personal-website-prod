# Production Deployment Guide

This guide covers the complete deployment process for the personal website at https://dmitrybond.tech.

## Architecture Overview

- **Runtime**: Docker/Compose with image published to GHCR
- **Reverse Proxy**: Caddy (systemd) serving static assets and proxying to app container
- **App Container**: Single container serving SSR + static assets
- **i18n Routing**: Handled by Astro app (/en, /ru), not by Caddy
- **Static Assets**: Served by Caddy from `/opt/prod/static`

## Prerequisites

### Production Server Requirements
- Docker and Docker Compose installed
- Caddy installed and configured as systemd service
- SSH access to production server
- GitHub Container Registry (GHCR) access

### Environment Setup
1. Copy `env.sample` to `.env.prod` and fill in actual values
2. Ensure all required environment variables are set (see env.sample)
3. Configure GitHub OAuth apps for authentication

## Deployment Commands

### Bash (Linux/macOS)

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh

# Check container status
docker ps --filter "name=website-prod"

# View logs
docker logs -f website-prod

# Test health endpoint
curl -f http://127.0.0.1:3000/_healthz

# Test i18n routes
curl -f http://127.0.0.1:3000/en/about
curl -f http://127.0.0.1:3000/ru/about

# Test static assets
curl -f http://127.0.0.1:3000/_astro
```

### PowerShell (Windows)

```powershell
# Set environment variables
$env:NODE_OPTIONS=""
$env:DOCKER_BUILDKIT=1

# Build image locally
docker build -t local/personal-website:dev -f apps/website/Dockerfile .

# Run container locally
docker run --rm -p 8080:3000 --name website-prod local/personal-website:dev

# Test endpoints
Invoke-WebRequest http://localhost:8080/_healthz
Invoke-WebRequest http://localhost:8080/en/about
Invoke-WebRequest http://localhost:8080/ru/about
```

## Production Runbook

### 1. Pre-deployment Checks

```bash
# Check Caddy status
systemctl status caddy --no-pager -l

# Check Caddy logs
journalctl -u caddy -n 200 --no-pager

# Verify Caddy configuration
caddy validate /etc/caddy/Caddyfile

# Check disk space
df -h /opt/prod
```

### 2. Deployment Process

```bash
# Navigate to deployment directory
cd /opt/prod

# Run deployment script
./deploy.sh

# Monitor deployment
docker compose ps
docker compose logs --tail=200
```

### 3. Post-deployment Verification

```bash
# Check container health
docker ps --filter "name=website-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test health endpoint
curl -fsS http://127.0.0.1:3000/_healthz

# Test i18n routes
curl -fsS -H 'Host: dmitrybond.tech' http://127.0.0.1:3000/en/about
curl -fsS -H 'Host: dmitrybond.tech' http://127.0.0.1:3000/ru/about

# Test static assets
curl -fsS -H 'Host: dmitrybond.tech' http://127.0.0.1:3000/_astro

# Test through Caddy (external)
curl -v --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_astro/any.css
```

### 4. Monitoring and Maintenance

```bash
# View container logs
docker logs -f website-prod

# Check container resource usage
docker stats website-prod

# Restart container if needed
docker compose restart

# Update image and redeploy
docker compose pull
docker compose up -d --force-recreate
```

## Troubleshooting

### Common Issues

#### 1. Container Name Conflicts
```bash
# Remove conflicting containers
docker rm -f website-prod
docker compose down --remove-orphans
```

#### 2. Port Conflicts
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000
```

#### 3. Static Assets Not Loading
```bash
# Check static directory
ls -la /opt/prod/static/_astro

# Verify Caddy static configuration
caddy validate /etc/caddy/Caddyfile
```

#### 4. Health Check Failures
```bash
# Check container logs
docker logs website-prod

# Test health endpoint manually
docker exec website-prod curl -f http://127.0.0.1:3000/_healthz
```

### Debug Commands

```bash
# Check all containers
docker ps -a

# Check compose services
docker compose ps

# View detailed logs
docker compose logs --tail=200

# Check Caddy configuration
caddy fmt /etc/caddy/Caddyfile
caddy validate /etc/caddy/Caddyfile

# Test Caddy config
caddy run --config /etc/caddy/Caddyfile --dry-run
```

## Environment Variables

See `env.sample` for complete list of required environment variables. Key variables:

- `PUBLIC_SITE_URL`: https://dmitrybond.tech
- `NODE_ENV`: production
- `PORT`: 3000
- `HOST`: 0.0.0.0
- OAuth credentials for GitHub integration
- Cal.com webhook configuration

## Security Considerations

- Never commit `.env.prod` to version control
- Use strong, unique secrets for all authentication
- Regularly rotate OAuth credentials
- Monitor container logs for suspicious activity
- Keep Docker and system packages updated

## Rollback Procedure

```bash
# Stop current deployment
docker compose down

# Pull previous image
docker pull ghcr.io/dmitrybond-tech/personal-website-prod:previous-tag

# Update compose file with previous image
# Edit infra/compose/website.compose.yml to use previous tag

# Restart with previous image
docker compose up -d
```

## CI/CD Integration

The deployment is automated via GitHub Actions:

1. **Build & Push**: On push to main branch
2. **Smoke Test**: Automated container testing
3. **Deploy**: Automatic deployment to production

See `.github/workflows/ci-docker.yml` for build configuration and `.github/workflows/deploy-preprod.yml` for deployment automation.
