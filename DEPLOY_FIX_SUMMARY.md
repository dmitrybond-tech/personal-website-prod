# Deploy Job Fix - Self-Hosted Runner GHCR Integration

## Problem
The deploy job was failing because:
1. `docker compose pull` tried to pull local image names (like `preprod-website`) from Docker Hub
2. The runner wasn't properly logged into GHCR before pulling
3. No explicit compose file path was specified
4. Missing `pull_policy: always` to ensure fresh image pulls

## Solution

### 1. Updated `.github/workflows/deploy-preprod.yml`

#### Key Changes:
- **GHCR Login**: Changed to use `GHCR_TOKEN` secret with explicit username `dmitrybond-tech`
- **Explicit Compose Path**: Added `-f /opt/preprod/compose.yml` to all compose commands
- **Enhanced Deployment**: Added `--no-deps --force-recreate` flags for clean deployment
- **Debug Step**: Added compose file inspection for troubleshooting

#### Unified Diff:
```diff
  deploy:
    runs-on: [self-hosted, Linux, X64, preprod]
    needs: build
    permissions:
      packages: read
      contents: read
    steps:
-     - name: Login to GHCR (runner)
-       run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.repository_owner }}" --password-stdin
+     - name: Login to GHCR (runner)
+       run: echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u dmitrybond-tech --password-stdin

+     - name: Debug compose file
+       run: |
+         echo "=== First 20 lines of /opt/preprod/compose.yml ==="
+         head -20 /opt/preprod/compose.yml || echo "Compose file not found"

      - name: Pull & restart
        working-directory: /opt/preprod
        run: |
-         docker compose pull
-         docker compose up -d
+         docker compose -f /opt/preprod/compose.yml pull
+         docker compose -f /opt/preprod/compose.yml up -d --no-deps --force-recreate
          docker image prune -f
```

### 2. Sample VPS Compose File (`/opt/preprod/compose.yml`)

#### Key Features:
- **GHCR Image**: Points to `ghcr.io/dmitrybond-tech/personal-website-pre-prod:main`
- **Pull Policy**: `pull_policy: always` ensures fresh image pulls
- **Health Check**: Built-in health monitoring
- **Port Mapping**: Exposes port 3000 for the website
- **Restart Policy**: `unless-stopped` for reliability

#### Sample Content:
```yaml
version: '3.8'

services:
  website:
    image: ghcr.io/dmitrybond-tech/personal-website-pre-prod:main
    pull_policy: always
    container_name: preprod-website
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - preprod-network

networks:
  preprod-network:
    driver: bridge
```

## Required Setup

### 1. GitHub Repository Secrets
Add a new secret in your GitHub repository:
- **Name**: `GHCR_TOKEN`
- **Value**: Personal Access Token with `read:packages` permission

### 2. VPS Setup
Place the compose file on your VPS:
```bash
# On your VPS
sudo mkdir -p /opt/preprod
sudo cp VPS_COMPOSE_SAMPLE.yml /opt/preprod/compose.yml
sudo chown -R $USER:$USER /opt/preprod
```

## Expected Results

### ✅ Deploy Job Success
- Self-hosted runner starts correctly
- GHCR login succeeds with `GHCR_TOKEN`
- Compose file is found and inspected
- Image pull from GHCR succeeds
- Service recreates cleanly
- Website responds on port 3000

### ✅ Deployment Flow
1. **Build Job**: Creates and pushes image to GHCR
2. **Deploy Job**: 
   - Logs into GHCR on VPS
   - Debugs compose file
   - Pulls latest image
   - Recreates service with new image
   - Cleans up old images

## Troubleshooting

### If Deploy Still Fails:
1. **Check GHCR_TOKEN**: Ensure it has `read:packages` permission
2. **Verify Compose File**: Ensure `/opt/preprod/compose.yml` exists on VPS
3. **Check Image Name**: Verify `ghcr.io/dmitrybond-tech/personal-website-pre-prod:main` exists
4. **Review Logs**: The debug step will show compose file contents

The deploy job should now work reliably with proper GHCR integration!
