# Troubleshooting Guide

This guide covers common issues and their solutions for the personal website deployment.

## Container Issues

### Container Name Conflicts

**Symptoms:**
```
Container name "/website-prod" is already in use
```

**Solution:**
```bash
# Remove the conflicting container
docker rm -f website-prod

# Or use the deploy script which handles this automatically
./deploy.sh
```

### Container Won't Start

**Symptoms:**
- Container exits immediately
- No logs in `docker logs website-prod`

**Diagnosis:**
```bash
# Check container status
docker ps -a --filter "name=website-prod"

# Check container logs
docker logs website-prod

# Check if image exists
docker images | grep personal-website-prod
```

**Solutions:**
1. **Missing Environment Variables:**
   ```bash
   # Check .env.prod file exists and has required variables
   cat .env.prod
   
   # Ensure all required variables are set
   grep -E "^(NODE_ENV|PORT|BASE_URL)" .env.prod
   ```

2. **Port Already in Use:**
   ```bash
   # Check what's using port 3000
   sudo netstat -tlnp | grep :3000
   
   # Kill the process or use different port
   sudo kill -9 <PID>
   ```

3. **Image Issues:**
   ```bash
   # Pull fresh image
   docker pull ghcr.io/dmitrybond-tech/personal-website-prod:main
   
   # Remove old image
   docker rmi ghcr.io/dmitrybond-tech/personal-website-prod:main
   ```

### Container Health Check Failures

**Symptoms:**
- Container shows as "unhealthy"
- Health check endpoint returns errors

**Diagnosis:**
```bash
# Check health endpoint directly
curl -f http://127.0.0.1:3000/_healthz

# Check container logs for errors
docker logs website-prod | tail -50

# Check if server is listening
docker exec website-prod netstat -tlnp | grep :3000
```

**Solutions:**
1. **Server Not Starting:**
   ```bash
   # Check if all dependencies are installed
   docker exec website-prod ls -la /app/dist/server/
   
   # Check if server.mjs exists
   docker exec website-prod test -f /app/dist/server/server.mjs
   ```

2. **Port Binding Issues:**
   ```bash
   # Check if server is binding to correct interface
   docker exec website-prod netstat -tlnp | grep :3000
   
   # Check environment variables
   docker exec website-prod env | grep -E "(PORT|HOST)"
   ```

## Static Asset Issues

### CSS/JS Assets Not Loading (ERR_CONNECTION_RESET)

**Symptoms:**
- Browser shows ERR_CONNECTION_RESET for `/_astro/*.css`
- Assets return 502/503 errors

**Diagnosis:**
```bash
# Check if static assets are extracted
ls -la /opt/prod/static/_astro/

# Check Caddy configuration
cat /etc/caddy/Caddyfile | grep -A 5 "_astro"

# Test static asset serving
curl -I https://dmitrybond.tech/_astro/any.css
```

**Solutions:**
1. **Assets Not Extracted:**
   ```bash
   # Re-run deploy script to extract assets
   ./deploy.sh
   
   # Or manually extract
   docker create --name temp-extract ghcr.io/dmitrybond-tech/personal-website-prod:main
   docker cp temp-extract:/app/dist/client/. /opt/prod/static/
   docker rm temp-extract
   ```

2. **Caddy Configuration Issues:**
   ```bash
   # Check Caddy config syntax
   caddy validate /etc/caddy/Caddyfile
   
   # Reload Caddy
   systemctl reload caddy
   
   # Check Caddy logs
   journalctl -u caddy -n 50
   ```

3. **File Permissions:**
   ```bash
   # Fix permissions
   sudo chmod -R 755 /opt/prod/static
   sudo chown -R root:root /opt/prod/static
   ```

### Uploads Directory Issues

**Symptoms:**
- Images in `/uploads/` return 404
- Upload functionality not working

**Diagnosis:**
```bash
# Check uploads directory
ls -la /opt/prod/uploads/

# Check if directory is mounted correctly
docker exec website-prod ls -la /app/public/uploads/

# Test uploads endpoint
curl -I https://dmitrybond.tech/uploads/any-image.jpg
```

**Solutions:**
1. **Directory Not Mounted:**
   ```bash
   # Check compose file volume mounts
   cat infra/compose/website.compose.yml | grep -A 5 volumes
   
   # Restart container
   docker compose -f infra/compose/website.compose.yml --env-file .env.prod restart
   ```

2. **Permission Issues:**
   ```bash
   # Fix uploads directory permissions
   sudo chmod -R 755 /opt/prod/uploads
   sudo chown -R $(whoami):$(whoami) /opt/prod/uploads
   ```

## Caddy Issues

### Caddy Service Not Running

**Symptoms:**
- Website returns connection refused
- No response from domain

**Diagnosis:**
```bash
# Check Caddy service status
systemctl status caddy

# Check Caddy logs
journalctl -u caddy -n 100
```

**Solutions:**
1. **Service Not Started:**
   ```bash
   # Start Caddy service
   sudo systemctl start caddy
   
   # Enable auto-start
   sudo systemctl enable caddy
   ```

2. **Configuration Errors:**
   ```bash
   # Validate configuration
   caddy validate /etc/caddy/Caddyfile
   
   # Check for syntax errors
   caddy fmt /etc/caddy/Caddyfile
   ```

### Reverse Proxy Issues

**Symptoms:**
- 502 Bad Gateway errors
- Upstream connection failures

**Diagnosis:**
```bash
# Check if socket file exists
ls -la /var/run/website/astro.sock

# Test upstream connection
curl -f http://127.0.0.1:3000/_healthz

# Check Caddy logs for upstream errors
journalctl -u caddy | grep -i upstream
```

**Solutions:**
1. **Socket File Missing:**
   ```bash
   # Check if container is running
   docker ps --filter "name=website-prod"
   
   # Check container logs for socket binding
   docker logs website-prod | grep socket
   
   # Restart container
   docker compose -f infra/compose/website.compose.yml --env-file .env.prod restart
   ```

2. **Upstream Health Check Failures:**
   ```bash
   # Check container health
   docker ps --filter "name=website-prod" --format "table {{.Names}}\t{{.Status}}"
   
   # Test health endpoint
   curl -f http://127.0.0.1:3000/_healthz
   
   # Check container logs
   docker logs website-prod | tail -50
   ```

## i18n Routing Issues

### Language Routes Not Working

**Symptoms:**
- `/en/about` returns 404
- `/ru/about` returns 404
- Redirects not working

**Diagnosis:**
```bash
# Test routes directly
curl -f http://127.0.0.1:3000/en/about
curl -f http://127.0.0.1:3000/ru/about

# Check container logs for routing errors
docker logs website-prod | grep -i route
```

**Solutions:**
1. **Astro Configuration Issues:**
   ```bash
   # Check if Astro is properly built
   docker exec website-prod ls -la /app/dist/server/
   
   # Check Astro config
   docker exec website-prod cat /app/astro.config.mjs
   ```

2. **Base URL Configuration:**
   ```bash
   # Check environment variables
   docker exec website-prod env | grep BASE_URL
   
   # Verify in .env.prod
   grep BASE_URL .env.prod
   ```

## Performance Issues

### Slow Response Times

**Symptoms:**
- Pages load slowly
- High response times

**Diagnosis:**
```bash
# Check container resource usage
docker stats website-prod

# Check system resources
htop
free -h
df -h
```

**Solutions:**
1. **Resource Constraints:**
   ```bash
   # Check available memory
   free -h
   
   # Check disk space
   df -h
   
   # Restart container to free resources
   docker compose -f infra/compose/website.compose.yml --env-file .env.prod restart
   ```

2. **Static Asset Optimization:**
   ```bash
   # Check if assets are properly cached
   curl -I https://dmitrybond.tech/_astro/any.css | grep -i cache
   
   # Verify Caddy cache headers
   cat /etc/caddy/Caddyfile | grep -A 3 Cache-Control
   ```

## Log Analysis

### Container Logs
```bash
# Follow logs in real-time
docker logs -f website-prod

# Get last 100 lines
docker logs --tail=100 website-prod

# Filter for errors
docker logs website-prod 2>&1 | grep -i error
```

### Caddy Logs
```bash
# Follow Caddy logs
journalctl -u caddy -f

# Get recent logs
journalctl -u caddy -n 100

# Filter for errors
journalctl -u caddy | grep -i error
```

### System Logs
```bash
# Check system logs
journalctl -n 100

# Check for Docker issues
journalctl -u docker -n 50
```

## Emergency Recovery

### Complete Reset
```bash
# Stop all services
docker compose -f infra/compose/website.compose.yml --env-file .env.prod down
systemctl stop caddy

# Clean up containers and images
docker system prune -af

# Remove static assets
sudo rm -rf /opt/prod/static/*

# Restart from scratch
./deploy.sh
```

### Rollback to Previous Version
```bash
# Stop current container
docker compose -f infra/compose/website.compose.yml --env-file .env.prod down

# Pull previous image
docker pull ghcr.io/dmitrybond-tech/personal-website-prod:main@<previous-digest>

# Start with previous image
docker run -d --name website-prod \
  -p 127.0.0.1:3000:3000 \
  -e NODE_ENV=production \
  -v /opt/prod/static:/srv/www/static:ro \
  -v /opt/prod/uploads:/app/public/uploads:rw \
  -v /var/run/website:/var/run/website \
  ghcr.io/dmitrybond-tech/personal-website-prod:main@<previous-digest>
```

## Getting Help

1. **Check Logs First:** Always start with container and Caddy logs
2. **Verify Configuration:** Ensure all environment variables are set correctly
3. **Test Components:** Test each component (container, Caddy, static assets) separately
4. **Document Issues:** Keep track of error messages and when they occur
5. **Use Deploy Script:** The deploy script handles most common issues automatically

For persistent issues, collect the following information:
- Container logs: `docker logs website-prod`
- Caddy logs: `journalctl -u caddy -n 100`
- System status: `systemctl status caddy docker`
- Configuration: `cat .env.prod`
- File permissions: `ls -la /opt/prod/static/ /opt/prod/uploads/`