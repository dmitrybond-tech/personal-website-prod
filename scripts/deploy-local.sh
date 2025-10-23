#!/bin/bash

# Local deployment script with environment variable verification
set -e

echo "🚀 Starting local deployment with environment variable verification..."

# Check if env.prod exists
if [ ! -f "env.prod" ]; then
    echo "❌ Error: env.prod file not found!"
    echo "Please create env.prod with your environment variables."
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables from env.prod..."
set -a
source env.prod
set +a

# Verify critical environment variables
echo "🔍 Verifying environment variables..."

required_vars=(
    "PUBLIC_CAL_USERNAME"
    "PUBLIC_CAL_EMBED_LINK"
    "PUBLIC_CAL_EVENTS"
    "PUBLIC_SITE_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in env.prod"
        exit 1
    else
        echo "✅ $var is set: ${!var}"
    fi
done

# Export GIT_SHA if not set
if [ -z "$GIT_SHA" ]; then
    export GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "local-build")
    echo "✅ GIT_SHA set to: $GIT_SHA"
fi

echo "🏗️ Building Docker image with environment variables..."

# Build the image
docker compose -f compose.prod.yml build --no-cache

echo "🚀 Starting services..."
docker compose -f compose.prod.yml up -d

echo "⏳ Waiting for service to start..."
sleep 5

echo "📁 Syncing static assets from container to host..."
# Create static directory if it doesn't exist
sudo mkdir -p /srv/www/static

# Copy static assets from container
CONTAINER_ID=$(docker compose -f compose.prod.yml ps -q website)
if [ ! -z "$CONTAINER_ID" ]; then
    echo "📋 Copying _astro assets..."
    docker cp $CONTAINER_ID:/app/dist/client/_astro /srv/www/static/ 2>/dev/null || echo "⚠️  _astro directory not found in container"
    
    echo "📋 Copying fonts..."
    docker cp $CONTAINER_ID:/app/dist/client/fonts /srv/www/static/ 2>/dev/null || echo "⚠️  fonts directory not found in container"
    
    echo "📋 Copying uploads..."
    docker cp $CONTAINER_ID:/app/dist/client/uploads /srv/www/static/ 2>/dev/null || echo "⚠️  uploads directory not found in container"
    
    # Set proper ownership for Caddy
    sudo chown -R caddy:caddy /srv/www/static
    echo "✅ Static assets synced and ownership set"
else
    echo "⚠️  Container not found, skipping static asset sync"
fi

echo "🔍 Checking service status..."
docker compose -f compose.prod.yml ps

echo "📊 Checking logs for environment variable debug info..."
docker compose -f compose.prod.yml logs website | grep -E "(cal|PUBLIC_)" || echo "No cal-related logs found yet"

echo "✅ Local deployment complete!"
echo "🌐 Website should be available at: http://localhost:3000"
echo "📝 Check browser console for environment variable debug logs"
