# Unix Socket Migration Runbook

## Prerequisites
- Docker and Docker Compose installed
- Caddy installed and configured
- Root/sudo access for socket directory permissions

## Step 1: Host Permissions Setup

```bash
# Create socket directory with proper permissions
sudo mkdir -p /var/run/website
sudo chown caddy:caddy /var/run/website
sudo chmod 2775 /var/run/website
```

## Step 2: Deploy Updated Application

```bash
# Build and deploy the updated website container
docker compose --env-file .env.prod build website-prod
docker compose --env-file .env.prod up -d --force-recreate website-prod
```

## Step 3: Update Caddy Configuration

```bash
# Format and validate Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy with new configuration
sudo systemctl reload caddy
```

## Step 4: Smoke Tests

### Test 1: HTML Response with Cache Headers
```bash
curl -sI https://dmitrybond.tech/en/about | sed -n '1,12p'
```
**Expected**: HTML response with `Cache-Control: no-store, max-age=0, must-revalidate`

### Test 2: CSS Asset Delivery
```bash
curl --http2 -sS -o /dev/null -w 'CSS %header{content-type} %header{content-length} %{time_total}s\n' \
     https://dmitrybond.tech/_astro/about.CYKiepS_.css
```
**Expected**: 
- Content-Type: `text/css; charset=utf-8`
- Cache-Control: `public, max-age=31536000, immutable`
- Time total < 0.3s

### Test 3: Font Asset Delivery
```bash
curl --http2 -sS -o /dev/null -w 'WOFF2 %header{content-type} %header{content-length} %{time_total}s\n' \
     https://dmitrybond.tech/fonts/inter-roman.var.woff2
```
**Expected**:
- Content-Type: `font/woff2`
- Cache-Control: `public, max-age=31536000, immutable`
- Time total < 0.3s

### Test 4: Health Check
```bash
curl -sI http://127.0.0.1:3000/_healthz
```
**Expected**: HTTP 200 with `Content-Type: text/plain`

## Step 5: Verification Checklist

- [ ] No published ports for website container
- [ ] Unix socket created at `/var/run/website/astro.sock`
- [ ] Socket permissions are 0660
- [ ] Caddy connects via Unix socket
- [ ] Static assets served by Express with proper cache headers
- [ ] HTML responses have no-store cache control
- [ ] Health checks work on loopback port
- [ ] No EPIPE/ECONNRESET errors in logs

## Troubleshooting

### Socket Permission Issues
```bash
# Check socket permissions
ls -la /var/run/website/
# Should show: srw-rw---- caddy caddy astro.sock

# Fix permissions if needed
sudo chown caddy:caddy /var/run/website/astro.sock
sudo chmod 0660 /var/run/website/astro.sock
```

### Container Health Check Failures
```bash
# Check container logs
docker compose logs website

# Test health check manually
docker exec -it <container_name> curl -sI http://127.0.0.1:3000/_healthz
```

### Caddy Connection Issues
```bash
# Check Caddy logs
sudo journalctl -u caddy -f

# Test socket connectivity
sudo -u caddy curl -sI http://unix:/var/run/website/astro.sock:/_healthz
```

### Performance Issues
```bash
# Monitor socket usage
sudo lsof /var/run/website/astro.sock

# Check for connection errors
sudo netstat -an | grep astro.sock
```

## Rollback Procedure

If issues occur, rollback to TCP-based communication:

1. **Revert server.ts**: Remove Unix socket logic, restore TCP-only listening
2. **Revert docker-compose**: Add back port mapping `"127.0.0.1:3000:3000"`
3. **Revert Caddyfile**: Change `reverse_proxy` back to `127.0.0.1:3000`
4. **Redeploy**: Run deployment commands above
5. **Clean up**: Remove socket directory if no longer needed

## Monitoring

### Key Metrics to Watch
- Response times for static assets (< 0.3s)
- Health check success rate (100%)
- Socket connection errors (0)
- Memory usage of website container
- Caddy error logs

### Log Locations
- Website container: `docker compose logs website`
- Caddy access: `/var/lib/caddy/logs/website_access.log`
- Caddy errors: `sudo journalctl -u caddy`
