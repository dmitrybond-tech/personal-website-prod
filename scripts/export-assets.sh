#!/bin/bash
# Export static assets from running container to host filesystem for Caddy serving
# This script is idempotent and safe to re-run

set -euo pipefail

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-website-prod}"
HOST_DIST_DIR="${HOST_DIST_DIR:-/srv/www/dmitrybond.tech/dist}"
TEMP_DIR="${HOST_DIST_DIR}.tmp"

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

# Check if container exists and is running
if ! docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
    error "Container '$CONTAINER_NAME' is not running. Please start the container first."
fi

log "Starting asset export from container '$CONTAINER_NAME' to '$HOST_DIST_DIR'"

# Create temporary directory
log "Creating temporary directory: $TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Detect the correct path for client assets inside the container
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
    if docker exec "$CONTAINER_NAME" test -d "$path" 2>/dev/null; then
        # Check if this path contains _astro directory
        if docker exec "$CONTAINER_NAME" test -d "$path/_astro" 2>/dev/null; then
            CLIENT_PATH="$path"
            log "Found client assets at: $CLIENT_PATH"
            break
        fi
    fi
done

# Auto-discovery fallback: find _astro directory anywhere in the container
if [[ -z "$CLIENT_PATH" ]]; then
    log "Standard paths not found, attempting auto-discovery..."
    CLIENT_ROOT="$(docker exec "$CONTAINER_NAME" sh -c 'for d in /app /workspace /usr/src/app; do [ -d "$d" ] && find "$d" -maxdepth 5 -type d -name "_astro" -print -quit; done' | xargs -I{} dirname "{}" 2>/dev/null || true)"
    if [[ -n "$CLIENT_ROOT" ]]; then
        CLIENT_PATH="$CLIENT_ROOT"
        log "Auto-discovered client assets at: $CLIENT_PATH"
    fi
fi

if [[ -z "$CLIENT_PATH" ]]; then
    error "Could not find client assets in the container. Checked: ${CANDIDATES[*]} and auto-discovery failed"
fi

# Copy assets from container to temporary directory
log "Copying assets from container '$CONTAINER_NAME:$CLIENT_PATH' to '$TEMP_DIR'"
docker cp "$CONTAINER_NAME:$CLIENT_PATH/." "$TEMP_DIR/"

# Verify extraction
if [[ ! -d "$TEMP_DIR/_astro" ]]; then
    error "Asset extraction failed. _astro directory not found in $TEMP_DIR"
fi

log "Assets copied successfully. Verifying content:"
ls -la "$TEMP_DIR" | head -10

# Create target directory if it doesn't exist
log "Creating target directory: $HOST_DIST_DIR"
mkdir -p "$HOST_DIST_DIR"

# Use rsync for atomic update (delete old, add new)
log "Syncing assets to target directory with rsync..."
rsync -a --delete "$TEMP_DIR/" "$HOST_DIST_DIR/"

# Verify final result
if [[ ! -d "$HOST_DIST_DIR/_astro" ]]; then
    error "Final sync failed. _astro directory not found in $HOST_DIST_DIR"
fi

# Count files for verification
ASTRO_FILES=$(find "$HOST_DIST_DIR/_astro" -type f | wc -l)
log "✅ Successfully exported $ASTRO_FILES files from _astro directory"

# Clean up temporary directory
log "Cleaning up temporary directory: $TEMP_DIR"
rm -rf "$TEMP_DIR"

# Set proper permissions (if running as root or with sudo)
if [[ $EUID -eq 0 ]] || command -v sudo >/dev/null 2>&1; then
    log "Setting proper permissions for static assets..."
    if [[ $EUID -eq 0 ]]; then
        chmod -R 755 "$HOST_DIST_DIR"
        chown -R www-data:www-data "$HOST_DIST_DIR" 2>/dev/null || warn "Could not set www-data ownership (non-critical)"
    else
        sudo chmod -R 755 "$HOST_DIST_DIR" 2>/dev/null || warn "Could not set permissions (non-critical)"
        sudo chown -R www-data:www-data "$HOST_DIST_DIR" 2>/dev/null || warn "Could not set www-data ownership (non-critical)"
    fi
fi

log "🎉 Asset export completed successfully!"
log "Static assets are now available at: $HOST_DIST_DIR"
log "Ready for Caddy to serve directly from filesystem"

# Show sample files for verification
log "Sample exported files:"
find "$HOST_DIST_DIR/_astro" -name "*.css" -o -name "*.js" | head -5 | while read -r file; do
    echo "  $(basename "$file")"
done
