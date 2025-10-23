# Production Rollback Guide

This guide provides procedures for rolling back the dmitrybond.tech production deployment in case of issues.

## Quick Rollback (Emergency)

If the website is completely down:

```bash
# 1. Stop the current container
docker stop website-prod
docker rm website-prod

# 2. Start with a known good image (replace with actual previous digest)
docker run -d --name website-prod \
  -p 127.0.0.1:8088:3000 \
  -e NODE_ENV=production \
  -e BASE_URL=https://dmitrybond.tech \
  ghcr.io/dmitrybond-tech/personal-website-prod:sha-PREVIOUS_SHA

# 3. Verify it's working
curl -f http://127.0.0.1:8088/_healthz
```

## Full Rollback (Complete)

If you need to revert both the container and static assets:

```bash
# 1. Stop current deployment
docker compose -f infra/compose/website.compose.yml down

# 2. Restore previous static assets (if backup exists)
sudo cp -r /opt/prod/static.backup /opt/prod/static

# 3. Start with previous image
docker run -d --name website-prod \
  -p 127.0.0.1:8088:3000 \
  -e NODE_ENV=production \
  -e BASE_URL=https://dmitrybond.tech \
  ghcr.io/dmitrybond-tech/personal-website-prod:sha-PREVIOUS_SHA

# 4. Reload Caddy
sudo systemctl reload caddy
```

## Rollback with Previous Compose

If you have a previous working compose file:

```bash
# 1. Stop current deployment
docker compose -f infra/compose/website.compose.yml down

# 2. Use previous compose file (replace with actual path)
docker compose -f /path/to/previous/compose.yml up -d

# 3. Verify deployment
curl -f http://127.0.0.1:8088/_healthz
```

## Finding Previous Image Digests

To find previous working image digests:

```bash
# List available images
docker images ghcr.io/dmitrybond-tech/personal-website-prod

# Check GitHub Container Registry for tags
# Visit: https://github.com/dmitrybond-tech/personal-website-prod/pkgs/container/personal-website-prod

# Or check CI logs for previous successful deployments
```

## Verification After Rollback

```bash
# 1. Check container health
docker ps --filter "name=website-prod"
curl -f http://127.0.0.1:8088/_healthz

# 2. Check static assets
curl -I https://dmitrybond.tech/_astro/any.css

# 3. Check SSR routes
curl -s https://dmitrybond.tech/en/about | head -n 20

# 4. Check logs
docker logs website-prod
```

## Prevention: Backup Before Deployment

Before deploying, create backups:

```bash
# Backup static assets
sudo cp -r /opt/prod/static /opt/prod/static.backup.$(date +%Y%m%d_%H%M%S)

# Backup current container image
docker tag website-prod website-prod.backup.$(date +%Y%m%d_%H%M%S)

# Backup compose file
cp infra/compose/website.compose.yml infra/compose/website.compose.yml.backup.$(date +%Y%m%d_%H%M%S)
```

## Common Rollback Scenarios

### Scenario 1: Container Won't Start
```bash
# Check logs
docker logs website-prod

# Try with previous image
docker run -d --name website-prod-new \
  -p 127.0.0.1:8089:3000 \
  ghcr.io/dmitrybond-tech/personal-website-prod:sha-PREVIOUS_SHA

# If working, update Caddy to point to new port
```

### Scenario 2: Static Assets Missing
```bash
# Check if assets exist
ls -la /opt/prod/static/_astro/

# If missing, re-extract from working image
docker create --name temp-extract ghcr.io/dmitrybond-tech/personal-website-prod:sha-PREVIOUS_SHA
docker cp temp-extract:/app/dist/client/. /opt/prod/static/
docker rm temp-extract
```

### Scenario 3: Caddy Configuration Issues
```bash
# Validate Caddy config
sudo caddy validate /etc/caddy/Caddyfile

# If invalid, restore previous config
sudo cp /etc/caddy/Caddyfile.backup /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Emergency Contacts

- **Primary**: Check GitHub Actions logs for deployment status
- **Secondary**: Review container logs and Caddy logs
- **Tertiary**: Check server resources and network connectivity

## Post-Rollback Checklist

- [ ] Website loads without errors
- [ ] Static assets load with proper cache headers
- [ ] SSR routes render correctly
- [ ] No 502/503 errors in logs
- [ ] Mailcow services unaffected
- [ ] SSL certificates valid
- [ ] DNS resolution working

## Prevention for Future Deployments

1. **Always test in staging first**
2. **Create backups before deployment**
3. **Use blue-green deployment strategy**
4. **Monitor logs during deployment**
5. **Have rollback plan ready**
6. **Test rollback procedure regularly**
