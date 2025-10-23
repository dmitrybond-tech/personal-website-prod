#!/bin/bash
# Production deployment script for dmitrybond.tech
# This script handles the complete deployment process with idempotency and safety

set -Eeuo pipefail

# Configuration
IMAGE_NAME="ghcr.io/dmitrybond-tech/personal-website-prod:main"
COMPOSE_FILE="infra/compose/website.compose.yml"
ENV_FILE=".env.prod"
STATIC_DIR="/opt/prod/static"
UPLOADS_DIR="/opt/prod/uploads"
CONTAINER_NAME="website-prod"
SERVICE_NAME="website"
HEALTH_ENDPOINT="/_healthz"
MAX_WAIT_TIME=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root - allow but warn
if [[ $EUID -eq 0 ]]; then
    warn "Running as root - this is allowed but not recommended for security"
fi

# Validate required files exist
log "Validating deployment environment..."

if [[ ! -f "$COMPOSE_FILE" ]]; then
    error "Compose file not found: $COMPOSE_FILE"
fi

if [[ ! -f "$ENV_FILE" ]]; then
    error "Environment file not found: $ENV_FILE"
fi

# Check if docker and docker compose are available
if ! command -v docker >/dev/null 2>&1; then
    error "Docker is not installed or not in PATH"
fi

if ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose is not available"
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
if ! docker pull "$IMAGE_NAME"; then
    error "Failed to pull image: $IMAGE_NAME"
fi

# Stop and remove existing containers safely
log "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans || true

# Remove any orphaned containers with the same name
if docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
    log "Removing orphaned container: $CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME" || true
fi

# Extract static assets from the image (simplified approach)
log "Extracting static assets from image..."

# Create temporary container to extract assets
TEMP_CONTAINER="temp-extract-$(date +%s)"
if ! docker create --name "$TEMP_CONTAINER" "$IMAGE_NAME" >/dev/null; then
    error "Failed to create temporary container for asset extraction"
fi

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
if ! docker cp "$TEMP_CONTAINER:$CLIENT_PATH/." "$STATIC_DIR/"; then
    error "Failed to extract client assets"
fi

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
if ! docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d; then
    error "Failed to start container with docker compose"
fi

# Wait for container to be healthy
log "Waiting for container to be healthy..."
HEALTHY=false
for i in $(seq 1 $MAX_WAIT_TIME); do
    if docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
        if docker exec "$CONTAINER_NAME" node -e "fetch('http://127.0.0.1:3000$HEALTH_ENDPOINT').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
            log "Container is healthy!"
            HEALTHY=true
            break
        fi
    fi
    if [[ $i -eq $MAX_WAIT_TIME ]]; then
        error "Container failed to become healthy within ${MAX_WAIT_TIME} seconds"
    fi
    sleep 1
done

if [[ "$HEALTHY" != "true" ]]; then
    error "Container health check failed"
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

# Verify deployment with comprehensive checks
log "Verifying deployment..."

# Check if SSR container is responding
if curl -s -f "http://127.0.0.1:3000$HEALTH_ENDPOINT" >/dev/null 2>&1; then
    log "✅ SSR container is responding on 127.0.0.1:3000"
else
    error "❌ SSR container is not responding on 127.0.0.1:3000"
fi

# Check static assets
if [[ -f "$STATIC_DIR/_astro"/*.css ]]; then
    log "✅ Static assets are available in $STATIC_DIR"
else
    warn "⚠️  No CSS files found in static directory"
fi

# Test i18n routes
log "Testing i18n routes..."
for route in "/en/about" "/ru/about"; do
    if curl -s -f "http://127.0.0.1:3000$route" >/dev/null 2>&1; then
        log "✅ Route $route is responding"
    else
        warn "⚠️  Route $route is not responding"
    fi
done

# Test static assets
log "Testing static assets..."
if curl -s -f "http://127.0.0.1:3000/_astro" >/dev/null 2>&1; then
    log "✅ Static assets endpoint is responding"
else
    warn "⚠️  Static assets endpoint is not responding"
fi

# Show container status
log "Container status:"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show container logs (last 20 lines)
log "Recent container logs:"
docker logs --tail=20 "$CONTAINER_NAME" 2>/dev/null || warn "Could not retrieve container logs"

log "🎉 Deployment completed successfully!"
log "Static assets: $STATIC_DIR"
log "Uploads: $UPLOADS_DIR"
log "SSR container: 127.0.0.1:3000"

# Show next steps
echo ""
log "Next steps:"
echo "1. Verify Caddy configuration includes the new static routes"
echo "2. Test the website: curl -I https://dmitrybond.tech/_astro/any.css"
echo "3. Check logs: docker logs -f $CONTAINER_NAME"
echo "4. Monitor health: docker exec $CONTAINER_NAME curl -f http://127.0.0.1:3000$HEALTH_ENDPOINT"