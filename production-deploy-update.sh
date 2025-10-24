#!/bin/bash
# Quick update script for production server

echo "Updating deploy.sh on production server with enhanced auto-discovery..."

# Backup the current script
cp deploy.sh deploy.sh.backup.$(date +%s)

# Create the updated deploy.sh with enhanced logic
cat > deploy.sh << 'EOF'
#!/bin/bash
# Production deployment script for dmitrybond.tech
# This script handles the complete deployment process including static asset extraction

set -euo pipefail

# Configuration
IMAGE_NAME="ghcr.io/dmitrybond-tech/personal-website-prod:main"
COMPOSE_FILE="infra/compose/website.compose.yml"
ENV_FILE=".env.prod"
STATIC_DIR="/opt/prod/static"
UPLOADS_DIR="/opt/prod/uploads"
TEMP_CONTAINER="temp-extract-$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root - allow but warn
if [[ $EUID -eq 0 ]]; then
    warn "Running as root - this is allowed but not recommended for security"
fi

# Check if required files exist
if [[ ! -f "$COMPOSE_FILE" ]]; then
    error "Compose file not found: $COMPOSE_FILE"
fi

if [[ ! -f "$ENV_FILE" ]]; then
    error "Environment file not found: $ENV_FILE"
fi

log "Starting production deployment..."

# Create directories with proper permissions
log "Creating production directories..."
if [[ $EUID -eq 0 ]]; then
    # Running as root
    mkdir -p "$STATIC_DIR" "$UPLOADS_DIR"
    chmod 755 "$STATIC_DIR" "$UPLOADS_DIR"
    # Keep root ownership for security
else
    # Running as regular user
    sudo mkdir -p "$STATIC_DIR" "$UPLOADS_DIR"
    sudo chmod 755 "$STATIC_DIR" "$UPLOADS_DIR"
    sudo chown $(whoami):$(whoami) "$STATIC_DIR" "$UPLOADS_DIR"
fi

# Pull the latest image
log "Pulling latest image: $IMAGE_NAME"
docker pull "$IMAGE_NAME" || error "Failed to pull image: $IMAGE_NAME"

# Stop and remove existing container if it exists
log "Stopping existing container..."
docker stop website-prod 2>/dev/null || true
docker rm website-prod 2>/dev/null || true

# Extract static assets from the image
log "Extracting static assets from image..."

# Create temporary container to extract assets
docker create --name "$TEMP_CONTAINER" "$IMAGE_NAME" >/dev/null

# Detect the correct path for client assets inside the image
CLIENT_PATH=""
CANDIDATES=(
    "/app/dist/client"
    "/app/client" 
    "/app/apps/website/dist/client"
    "/app/apps/website/dist"
    "/app/dist"
)

# Try standard paths first
for path in "${CANDIDATES[@]}"; do
    if docker run --rm "$IMAGE_NAME" test -d "$path" 2>/dev/null; then
        # Check if this path contains _astro directory
        if docker run --rm "$IMAGE_NAME" test -d "$path/_astro" 2>/dev/null; then
            CLIENT_PATH="$path"
            log "Found client assets at: $CLIENT_PATH"
            break
        fi
    fi
done

# Auto-discovery fallback: find _astro directory anywhere in the image
if [[ -z "$CLIENT_PATH" ]]; then
    log "Standard paths not found, attempting auto-discovery..."
    CLIENT_ROOT="$(docker run --rm --entrypoint sh "$IMAGE_NAME" -lc 'set -e; for d in /app /workspace /usr/src/app; do [ -d "$d" ] && find "$d" -maxdepth 5 -type d -name "_astro" -print -quit; done' | xargs -I{} dirname "{}" 2>/dev/null || true)"
    if [[ -n "$CLIENT_ROOT" ]]; then
        CLIENT_PATH="$CLIENT_ROOT"
        log "Auto-discovered client assets at: $CLIENT_PATH"
    fi
fi

if [[ -z "$CLIENT_PATH" ]]; then
    error "Could not find client assets in the image. Checked: ${CANDIDATES[*]} and auto-discovery failed"
fi

# Extract client assets to static directory
log "Extracting client assets from $CLIENT_PATH to $STATIC_DIR"
docker cp "$TEMP_CONTAINER:$CLIENT_PATH/." "$STATIC_DIR/"

# Verify extraction
if [[ ! -d "$STATIC_DIR/_astro" ]]; then
    error "Static assets extraction failed. _astro directory not found in $STATIC_DIR"
fi

log "Static assets extracted successfully from '$CLIENT_PATH':"
ls -la "$STATIC_DIR" | head -10

# Clean up temporary container
docker rm "$TEMP_CONTAINER" >/dev/null

# Start the SSR container
log "Starting SSR container..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for container to be healthy
log "Waiting for container to be healthy..."
for i in {1..30}; do
    if docker ps --filter "name=website-prod" --filter "status=running" | grep -q website-prod; then
        if docker exec website-prod node -e "fetch('http://127.0.0.1:3000/_healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
            log "Container is healthy!"
            break
        fi
    fi
    if [[ $i -eq 30 ]]; then
        error "Container failed to become healthy within 30 seconds"
    fi
    sleep 1
done

# Export static assets for Caddy to serve directly
log "Exporting static assets for Caddy static serving..."
if [[ -f "scripts/export-assets.sh" ]]; then
    # Use the dedicated export script
    bash scripts/export-assets.sh
else
    # Fallback to inline extraction (legacy method)
    warn "scripts/export-assets.sh not found, using legacy extraction method"
    log "Extracting static assets from running container..."
    
    # Create target directory
    HOST_DIST_DIR="/srv/www/dmitrybond.tech/dist"
    mkdir -p "$HOST_DIST_DIR"
    
    # Copy assets from running container
    docker cp website-prod:/app/dist/client/. "$HOST_DIST_DIR/"
    
    # Verify extraction
    if [[ ! -d "$HOST_DIST_DIR/_astro" ]]; then
        error "Static assets extraction failed. _astro directory not found in $HOST_DIST_DIR"
    fi
    
    log "Static assets extracted successfully to $HOST_DIST_DIR"
fi

# Reload Caddy configuration
log "Reloading Caddy configuration..."
if command -v caddy >/dev/null 2>&1; then
    if [[ $EUID -eq 0 ]]; then
        # Running as root
        caddy fmt /etc/caddy/Caddyfile 2>/dev/null || warn "Caddy fmt failed (non-critical)"
        systemctl reload caddy || warn "Caddy reload failed - check Caddy configuration"
    else
        # Running as regular user
        sudo caddy fmt /etc/caddy/Caddyfile 2>/dev/null || warn "Caddy fmt failed (non-critical)"
        sudo systemctl reload caddy || warn "Caddy reload failed - check Caddy configuration"
    fi
else
    warn "Caddy not found in PATH. Please reload Caddy manually."
fi

# Verify deployment
log "Verifying deployment..."

# Check if SSR container is responding
if curl -s -f "http://127.0.0.1:8088/_healthz" >/dev/null 2>&1; then
    log "✅ SSR container is responding on 127.0.0.1:8088"
else
    error "❌ SSR container is not responding on 127.0.0.1:8088"
fi

# Check static assets
if [[ -f "$STATIC_DIR/_astro"/*.css ]]; then
    log "✅ Static assets are available in $STATIC_DIR"
else
    warn "⚠️  No CSS files found in static directory"
fi

# Show container status
log "Container status:"
docker ps --filter "name=website-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

log "🎉 Deployment completed successfully!"
log "Static assets: $STATIC_DIR"
log "Uploads: $UPLOADS_DIR"
log "SSR container: 127.0.0.1:8088"

# Show next steps
echo ""
log "Next steps:"
echo "1. Verify Caddy configuration includes the new static routes"
echo "2. Test the website: curl -I https://dmitrybond.tech/_astro/any.css"
echo "3. Check logs: docker logs -f website-prod"
EOF

# Make it executable
chmod +x deploy.sh

echo "✅ Updated deploy.sh script with enhanced auto-discovery"
echo "✅ Backup created: deploy.sh.backup.$(date +%s)"
echo ""
echo "Now you can run: bash deploy.sh"
echo "The script will now:"
echo "1. Check 5 standard paths for client assets"
echo "2. Verify each path contains _astro directory"
echo "3. Use auto-discovery if standard paths fail"
echo "4. Show clear logging of which path was used"
