#!/bin/bash
# Deploy script for VPS - pulls from GHCR and deploys

set -e

# Configuration
IMAGE_NAME="ghcr.io/$GITHUB_REPOSITORY_OWNER/$GITHUB_REPOSITORY_NAME:ssg"
CONTAINER_NAME="website-ssg"
BACKUP_DIR="/srv/www/dmitrybond.tech.bak.$(date +%F-%H%M)"

echo "🚀 Starting deployment from GHCR..."

# Create backup
echo "💾 Creating backup..."
sudo cp -a /srv/www/dmitrybond.tech "$BACKUP_DIR"

# Pull latest image
echo "⬇️ Pulling latest image from GHCR..."
docker pull "$IMAGE_NAME"

# Stop and remove existing container
echo "🛑 Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# Run new container
echo "🚀 Starting new container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v /etc/ssl/certs:/etc/ssl/certs:ro \
  -v /etc/ssl/private:/etc/ssl/private:ro \
  "$IMAGE_NAME"

# Wait for container to be healthy
echo "⏳ Waiting for container to be ready..."
sleep 10

# Check if container is running
if docker ps | grep -q "$CONTAINER_NAME"; then
  echo "✅ Container is running successfully!"
  
  # Clean up old images
  echo "🧹 Cleaning up old images..."
  docker image prune -f
  
  echo "🎉 Deployment completed successfully!"
  echo "🌐 Website should be available at https://dmitrybond.tech"
else
  echo "❌ Container failed to start. Rolling back..."
  
  # Rollback to backup
  sudo rsync -a --delete "$BACKUP_DIR/" /srv/www/dmitrybond.tech/
  sudo systemctl reload caddy
  
  echo "🔄 Rolled back to previous version"
  exit 1
fi
