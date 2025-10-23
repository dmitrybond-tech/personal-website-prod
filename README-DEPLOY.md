# Production Deployment Guide

This guide covers the complete deployment process for the personal website at https://dmitrybond.tech.

## Architecture Overview

- **Application**: Astro SSR with Express server
- **Container**: Docker with Node.js 22 Alpine
- **Reverse Proxy**: Caddy (systemd service)
- **Static Assets**: Served by Caddy from `/opt/prod/static`
- **Uploads**: Served by Caddy from `/opt/prod/uploads`
- **Communication**: Unix socket between Caddy and app container

## Prerequisites

### System Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Caddy installed and configured as systemd service
- Git LFS support for media assets

### Required Environment Variables
Copy `env.prod.sample` to `.env.prod` and fill in the values:

```bash
cp env.prod.sample .env.prod
# Edit .env.prod with your actual values
```

## Local Development

### Windows/PowerShell
```powershell
# Build the image locally
docker build -t local/personal-website:dev -f apps/website/Dockerfile .

# Run the container
docker run --rm -p 8080:3000 --name website-prod local/personal-website:dev

# Test the application
Invoke-WebRequest http://localhost:8080/_healthz
Invoke-WebRequest http://localhost:8080/en/about
```

### Linux/macOS
```bash
# Build the image locally
docker build -t local/personal-website:dev -f apps/website/Dockerfile .

# Run the container
docker run --rm -p 8080:3000 --name website-prod local/personal-website:dev

# Test the application
curl -f http://localhost:8080/_healthz
curl -f http://localhost:8080/en/about
```

## Production Deployment

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/dmitrybond-tech/personal-website-prod.git
cd personal-website-prod

# Create production directories
sudo mkdir -p /opt/prod/static /opt/prod/uploads /var/run/website
sudo chmod 755 /opt/prod/static /opt/prod/uploads /var/run/website

# Copy environment file
cp env.prod.sample .env.prod
# Edit .env.prod with your actual values
```

### 2. Deploy Script

The `deploy.sh` script handles the complete deployment process:

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

The script will:
1. Pull the latest Docker image from GHCR
2. Stop and remove existing containers
3. Extract static assets from the image
4. Start the new container with proper configuration
5. Wait for health checks to pass
6. Reload Caddy configuration
7. Run comprehensive smoke tests

### 3. Manual Deployment Steps

If you need to run deployment steps manually:

```bash
# Pull the latest image
docker pull ghcr.io/dmitrybond-tech/personal-website-prod:main

# Stop existing containers
docker compose -f infra/compose/website.compose.yml --env-file .env.prod down --remove-orphans

# Start the new container
docker compose -f infra/compose/website.compose.yml --env-file .env.prod up -d --force-recreate

# Check container status
docker ps --filter "name=website-prod"

# Check container logs
docker logs -f website-prod
```

## Monitoring and Troubleshooting

### Health Checks

```bash
# Check container health
docker ps --filter "name=website-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test health endpoint
curl -f http://127.0.0.1:3000/_healthz

# Check container logs
docker logs --tail=50 website-prod
```

### Caddy Status

```bash
# Check Caddy service status
systemctl status caddy --no-pager -l

# Check Caddy logs
journalctl -u caddy -n 200 --no-pager

# Test Caddy configuration
caddy validate /etc/caddy/Caddyfile

# Reload Caddy configuration
systemctl reload caddy
```

### Static Assets

```bash
# Check static assets directory
ls -la /opt/prod/static/_astro/

# Test static asset serving
curl -I https://dmitrybond.tech/_astro/any.css

# Check uploads directory
ls -la /opt/prod/uploads/
```

### Socket Communication

```bash
# Check Unix socket
ls -la /var/run/website/astro.sock

# Test socket communication
curl -v --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/en/about
```

## Common Issues and Solutions

### Container Name Conflicts
```bash
# Remove orphaned containers
docker rm -f website-prod

# Clean up Docker resources
docker system prune -f
```

### Static Assets Not Loading
1. Check if assets are extracted to `/opt/prod/static`
2. Verify Caddy configuration points to correct path
3. Check file permissions: `ls -la /opt/prod/static/_astro/`

### 502/503 Errors
1. Check if container is running: `docker ps`
2. Check container logs: `docker logs website-prod`
3. Verify health endpoint: `curl -f http://127.0.0.1:3000/_healthz`
4. Check Caddy logs: `journalctl -u caddy -n 50`

### Socket Issues
1. Check socket file exists: `ls -la /var/run/website/astro.sock`
2. Verify permissions: `stat /var/run/website/astro.sock`
3. Check container logs for socket binding errors

## CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Builds the Docker image
2. Pushes to GHCR registry
3. Runs smoke tests
4. Deploys to production (if configured)

### Manual CI Trigger
```bash
# Trigger build and deployment
gh workflow run ci-docker.yml
```

## Security Considerations

- Environment variables are not exposed in logs
- Static assets are served with proper cache headers
- Unix socket communication is more secure than HTTP
- Container runs with minimal privileges
- Caddy handles TLS termination

## Backup and Recovery

### Backup Static Assets
```bash
# Create backup of static assets
tar -czf static-backup-$(date +%Y%m%d).tar.gz /opt/prod/static

# Create backup of uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /opt/prod/uploads
```

### Recovery
```bash
# Restore from backup
tar -xzf static-backup-YYYYMMDD.tar.gz -C /
tar -xzf uploads-backup-YYYYMMDD.tar.gz -C /

# Restart services
systemctl reload caddy
docker compose -f infra/compose/website.compose.yml --env-file .env.prod restart
```

## Performance Optimization

- Static assets are served directly by Caddy (no app server overhead)
- Unix socket communication is faster than HTTP
- Proper cache headers for static assets
- Compression enabled for text content
- Health checks prevent serving from unhealthy containers

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review container logs: `docker logs website-prod`
3. Check Caddy logs: `journalctl -u caddy`
4. Verify environment variables in `.env.prod`