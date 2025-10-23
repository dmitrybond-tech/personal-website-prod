#!/bin/bash

# Production deployment script for VPS
set -e

echo "🚀 Starting production deployment..."

# Check if we're in the right directory
if [ ! -f "compose.prod.yml" ]; then
    echo "❌ Error: compose.prod.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if compose.image.yml exists (override file)
if [ -f "compose.image.yml" ]; then
    echo "📋 Using compose.image.yml override..."
    COMPOSE_FILES="-f compose.prod.yml -f compose.image.yml"
else
    echo "📋 Using compose.prod.yml only..."
    COMPOSE_FILES="-f compose.prod.yml"
fi

echo "🏗️ Pulling latest image and starting services..."
docker compose $COMPOSE_FILES pull
docker compose $COMPOSE_FILES up -d

echo "⏳ Waiting for service to start..."
sleep 10

echo "📁 Syncing static assets from container to host..."
# Create static directory if it doesn't exist
sudo mkdir -p /srv/www/static

# Copy static assets from container
CONTAINER_ID=$(docker compose $COMPOSE_FILES ps -q website)
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

echo "🔧 Fixing Unix socket permissions..."
# Ensure Caddy can access the socket
sudo chgrp caddy /var/run/website
sudo chmod 2775 /var/run/website
sudo chgrp caddy /var/run/website/astro.sock 2>/dev/null || echo "⚠️  Socket not found yet, will be created by container"
sudo chmod 660 /var/run/website/astro.sock 2>/dev/null || echo "⚠️  Socket not found yet, will be created by container"

echo "🔄 Reloading Caddy configuration..."
sudo systemctl reload caddy

echo "🔍 Checking service status..."
docker compose $COMPOSE_FILES ps

echo "🧪 Running health checks..."
echo "Testing static assets..."
curl -s -I https://dmitrybond.tech/_astro/ | head -1 || echo "⚠️  Static assets test failed"

echo "Testing main page..."
curl -s -I https://dmitrybond.tech/en/about | head -1 || echo "⚠️  Main page test failed"

echo "✅ Production deployment complete!"
echo "🌐 Website should be available at: https://dmitrybond.tech"
