# Production Deployment Test Checklist

This checklist provides step-by-step verification commands to ensure the production deployment is working correctly.

## Pre-Deployment Checklist

- [ ] Environment file `.env.prod` is configured with actual values
- [ ] Caddy is installed and running
- [ ] Docker and Docker Compose are available
- [ ] GitHub Container Registry access is configured
- [ ] Mailcow configuration is backed up (if needed)

## Deployment Verification

### 1. Static Assets Verification

```bash
# Check immutable assets return proper cache headers
curl -sI --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_astro/any.css | egrep -i '^(HTTP/|content-type:|cache-control:|etag:|last-modified:)'

# Expected output:
# HTTP/2 200
# content-type: text/css
# cache-control: public, max-age=31536000, immutable
```

### 2. Uploads Verification

```bash
# Check uploads return proper cache headers
curl -sI --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/uploads/logos/brand-ricoh-custom.png | egrep -i '^(HTTP/|content-type:|cache-control:)'

# Expected output:
# HTTP/2 200
# content-type: image/png
# cache-control: public, max-age=3600
```

### 3. SSR Container Verification

```bash
# Check SSR container health
curl -sS http://127.0.0.1:8088/_healthz

# Expected output: 200 OK

# Check SSR route rendering
curl -sS http://127.0.0.1:8088/en/about | head -n 50

# Expected: HTML content with proper structure
```

### 4. Container Status Verification

```bash
# Check container is running
docker ps --filter "name=website-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Expected output:
# website-prod    Up X minutes    127.0.0.1:8088->3000/tcp
```

### 5. Log Verification

```bash
# Check container logs
docker logs -f website-prod

# Check Caddy access logs
tail -f /var/log/caddy/dmitrybond.access.log

# Check Caddy error logs
journalctl -u caddy -f
```

## Windows/PowerShell Verification

### 1. Website Response Test

```powershell
# Test website response
Invoke-WebRequest https://dmitrybond.tech/robots.txt -Headers @{"Host"="dmitrybond.tech"} -UseBasicParsing | Select-Object -ExpandProperty StatusCode

# Expected output: 200
```

### 2. Static Asset Test

```powershell
# Test static asset loading
$response = Invoke-WebRequest https://dmitrybond.tech/_astro/any.css -UseBasicParsing
$response.Headers["Cache-Control"]

# Expected output: public, max-age=31536000, immutable
```

## Comprehensive Testing

### 1. Full Page Load Test

```bash
# Test complete page load with all assets
curl -s https://dmitrybond.tech/en/about | grep -E "(css|js|png|jpg|svg)" | head -10

# Expected: All asset references should be present
```

### 2. Asset Loading Test

```bash
# Test that all referenced assets are accessible
curl -s https://dmitrybond.tech/en/about | grep -oE 'src="[^"]*"' | head -5 | while read -r src; do
    asset=$(echo "$src" | sed 's/src="//; s/"//')
    echo "Testing: $asset"
    curl -sI "https://dmitrybond.tech$asset" | head -1
done

# Expected: All assets return 200 OK
```

### 3. Performance Test

```bash
# Test response times
time curl -s https://dmitrybond.tech/en/about > /dev/null

# Expected: Fast response (< 2 seconds)
```

## Error Scenarios Testing

### 1. 404 Handling

```bash
# Test 404 handling
curl -sI https://dmitrybond.tech/nonexistent-page

# Expected: 404 status with proper error page
```

### 2. Health Check Failure

```bash
# Test health check endpoint
curl -s http://127.0.0.1:8088/_healthz

# Expected: 200 OK
```

### 3. Container Restart

```bash
# Test container restart
docker restart website-prod
sleep 10
curl -s http://127.0.0.1:8088/_healthz

# Expected: 200 OK after restart
```

## Mailcow Preservation Test

### 1. Mail Services Test

```bash
# Test mail services are still working
curl -sI https://mail.dmitrybond.tech
curl -sI https://sogo.dmitrybond.tech
curl -sI https://autodiscover.dmitrybond.tech

# Expected: All return 200 OK (or appropriate redirects)
```

### 2. DNS Resolution Test

```bash
# Test DNS resolution
nslookup dmitrybond.tech
nslookup mail.dmitrybond.tech

# Expected: Proper DNS resolution
```

## Load Testing

### 1. Concurrent Requests

```bash
# Test concurrent requests
for i in {1..10}; do
    curl -s https://dmitrybond.tech/en/about > /dev/null &
done
wait

# Expected: All requests complete successfully
```

### 2. Static Asset Load

```bash
# Test static asset loading under load
for i in {1..20}; do
    curl -s https://dmitrybond.tech/_astro/any.css > /dev/null &
done
wait

# Expected: All assets load successfully
```

## Security Testing

### 1. Port Exposure Test

```bash
# Test that SSR port is not externally exposed
nmap -p 8088 dmitrybond.tech

# Expected: Port 8088 should not be open externally
```

### 2. Loopback Access Test

```bash
# Test loopback access
curl -s http://127.0.0.1:8088/_healthz

# Expected: 200 OK (internal access works)
```

## Rollback Testing

### 1. Rollback Readiness

```bash
# Test rollback procedure
docker stop website-prod
docker run -d --name website-prod-test \
  -p 127.0.0.1:8089:3000 \
  -e NODE_ENV=production \
  ghcr.io/dmitrybond-tech/personal-website-prod:main

# Test new container
curl -s http://127.0.0.1:8089/_healthz

# Clean up
docker stop website-prod-test
docker rm website-prod-test
```

## Final Verification

### 1. Complete Website Test

```bash
# Test main pages
curl -s https://dmitrybond.tech/ | head -20
curl -s https://dmitrybond.tech/en/about | head -20
curl -s https://dmitrybond.tech/ru/about | head -20

# Expected: All pages load with proper content
```

### 2. Asset Integrity Test

```bash
# Test that all assets are properly served
curl -s https://dmitrybond.tech/robots.txt
curl -s https://dmitrybond.tech/sitemap.xml
curl -s https://dmitrybond.tech/favicon.ico

# Expected: All return 200 OK
```

## Success Criteria

- [ ] All static assets return 200 with proper cache headers
- [ ] SSR routes render without blank pages
- [ ] Container is healthy and responding
- [ ] No 502/503 errors in logs
- [ ] Mailcow services unaffected
- [ ] Performance is acceptable (< 2s load time)
- [ ] Security requirements met (no external port exposure)
- [ ] Rollback procedure tested and working

## Troubleshooting

If any test fails:

1. **Check container logs**: `docker logs website-prod`
2. **Check Caddy logs**: `tail -f /var/log/caddy/dmitrybond.access.log`
3. **Check container health**: `docker exec website-prod node -e "fetch('http://127.0.0.1:3000/_healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`
4. **Check static assets**: `ls -la /opt/prod/static/_astro/`
5. **Check Caddy config**: `sudo caddy validate /etc/caddy/Caddyfile`
6. **Check network**: `netstat -tlnp | grep 8088`

## Post-Deployment Monitoring

- [ ] Monitor error rates for 24 hours
- [ ] Check performance metrics
- [ ] Verify all functionality works
- [ ] Test rollback procedure
- [ ] Document any issues found
