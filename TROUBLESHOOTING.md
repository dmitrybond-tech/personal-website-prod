# Troubleshooting Guide

This guide covers common issues and their solutions for the personal website deployment.

## Common Error Scenarios

### 1. ERR_CONNECTION_RESET / HTTP 502/503

#### Symptoms
- Browser shows ERR_CONNECTION_RESET for assets (/_astro/*.css, /uploads/*)
- Main pages sometimes return 502/503
- curl to CSS returns 200 but browser fails

#### Root Causes & Solutions

**A. Container Not Running**
```bash
# Check container status
docker ps --filter "name=website-prod"

# If not running, check logs
docker logs website-prod

# Restart container
docker compose restart
```

**B. Port Mismatch**
```bash
# Check if container is listening on correct port
docker exec website-prod netstat -tlnp | grep :3000

# Verify compose file port mapping
cat infra/compose/website.compose.yml | grep ports
```

**C. Health Check Failures**
```bash
# Test health endpoint directly
docker exec website-prod curl -f http://127.0.0.1:3000/_healthz

# Check container logs for errors
docker logs website-prod --tail=50
```

**D. Caddy Upstream Misconfiguration**
```bash
# Check Caddy configuration
caddy validate /etc/caddy/Caddyfile

# Verify upstream points to correct container
grep -A 5 "reverse_proxy" /etc/caddy/Caddyfile
```

### 2. Container Name Conflicts

#### Symptoms
- `docker compose up` fails with "Container name '/website-prod' is already in use"
- Deployment script fails

#### Solutions
```bash
# Remove conflicting containers
docker rm -f website-prod
docker compose down --remove-orphans

# Clean up orphaned containers
docker container prune -f

# Restart deployment
./deploy.sh
```

### 3. Static Assets Not Loading

#### Symptoms
- CSS/JS files return 404
- Images not loading
- _astro directory missing

#### Root Causes & Solutions

**A. Static Asset Extraction Failed**
```bash
# Check if static directory exists
ls -la /opt/prod/static/_astro

# Re-extract assets
docker run --rm ghcr.io/dmitrybond-tech/personal-website-prod:main \
  find /app -name "_astro" -type d

# Manual extraction
docker create --name temp-extract ghcr.io/dmitrybond-tech/personal-website-prod:main
docker cp temp-extract:/app/dist/client/. /opt/prod/static/
docker rm temp-extract
```

**B. Caddy Static Configuration**
```bash
# Check Caddy static routes
grep -A 10 "@static" /etc/caddy/Caddyfile

# Verify static directory permissions
ls -la /opt/prod/static
sudo chown -R caddy:caddy /opt/prod/static
```

**C. Asset Path Mismatch**
```bash
# Check if assets are in correct location
find /opt/prod/static -name "*.css" | head -5

# Verify Caddy root directory
grep "root" /etc/caddy/Caddyfile
```

### 4. i18n Routing Issues

#### Symptoms
- /en and /ru routes not working
- 404 errors for internationalized pages
- Redirect loops

#### Solutions
```bash
# Test i18n routes directly
curl -f http://127.0.0.1:3000/en/about
curl -f http://127.0.0.1:3000/ru/about

# Check Astro configuration
cat apps/website/astro.config.ts | grep -A 10 i18n

# Verify environment variables
docker exec website-prod env | grep -E "(BASE_URL|SITE_URL)"
```

### 5. OAuth/Authentication Issues

#### Symptoms
- Login not working
- OAuth callbacks failing
- 500 errors on auth endpoints

#### Solutions
```bash
# Check OAuth environment variables
docker exec website-prod env | grep -E "(AUTHJS|DECAP|GITHUB)"

# Verify OAuth app configuration
echo "Check GitHub OAuth app settings:"
echo "- Callback URL: https://dmitrybond.tech/api/auth/callback/github"
echo "- OAuth callback: https://dmitrybond.tech/oauth/callback"

# Test OAuth endpoints
curl -f https://dmitrybond.tech/api/auth/providers
```

## Diagnostic Commands

### System Health Checks
```bash
# Check all services
systemctl status caddy --no-pager -l
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check resource usage
docker stats website-prod
df -h /opt/prod
```

### Network Diagnostics
```bash
# Test local connectivity
curl -v http://127.0.0.1:3000/_healthz
curl -v http://127.0.0.1:3000/en/about

# Test through Caddy
curl -v --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_healthz
curl -v --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/en/about
```

### Log Analysis
```bash
# Container logs
docker logs website-prod --tail=100

# Caddy logs
journalctl -u caddy -n 100 --no-pager

# System logs
journalctl -n 100 --no-pager
```

## Performance Issues

### High Memory Usage
```bash
# Check container memory usage
docker stats website-prod

# Check system memory
free -h

# Restart container if needed
docker compose restart
```

### Slow Response Times
```bash
# Check container CPU usage
docker stats website-prod

# Test response times
time curl -f http://127.0.0.1:3000/_healthz

# Check for bottlenecks
docker exec website-prod top
```

## Recovery Procedures

### Complete Reset
```bash
# Stop all services
docker compose down --remove-orphans
systemctl stop caddy

# Clean up containers and images
docker system prune -f
docker volume prune -f

# Restart services
systemctl start caddy
./deploy.sh
```

### Rollback to Previous Version
```bash
# Stop current deployment
docker compose down

# Pull previous image
docker pull ghcr.io/dmitrybond-tech/personal-website-prod:previous-tag

# Update compose file
sed -i 's/:main/:previous-tag/' infra/compose/website.compose.yml

# Restart with previous version
docker compose up -d
```

### Emergency Maintenance
```bash
# Put site in maintenance mode
echo "Site under maintenance" > /opt/prod/static/maintenance.html

# Update Caddy to serve maintenance page
# Add to Caddyfile:
# handle {
#     rewrite * /maintenance.html
#     file_server
# }

# Reload Caddy
systemctl reload caddy
```

## Monitoring and Alerts

### Health Check Script
```bash
#!/bin/bash
# health-check.sh
if ! curl -f http://127.0.0.1:3000/_healthz >/dev/null 2>&1; then
    echo "Health check failed at $(date)"
    # Send alert notification
    # systemctl restart website-prod
fi
```

### Log Monitoring
```bash
# Monitor container logs
docker logs -f website-prod | grep -E "(ERROR|WARN|FATAL)"

# Monitor Caddy logs
journalctl -u caddy -f | grep -E "(ERROR|WARN)"
```

## Contact and Support

For additional support:
1. Check container logs: `docker logs website-prod`
2. Check Caddy logs: `journalctl -u caddy`
3. Verify configuration files
4. Test individual components
5. Review this troubleshooting guide

## Prevention

### Regular Maintenance
- Monitor container health
- Keep Docker images updated
- Regular log rotation
- Backup static assets
- Test deployments in staging

### Monitoring Setup
- Set up health check monitoring
- Configure log aggregation
- Monitor resource usage
- Set up alerting for failures
