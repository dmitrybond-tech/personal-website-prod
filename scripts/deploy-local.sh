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

echo "🔍 Checking service status..."
docker compose -f compose.prod.yml ps

echo "📊 Checking logs for environment variable debug info..."
docker compose -f compose.prod.yml logs website | grep -E "(cal|PUBLIC_)" || echo "No cal-related logs found yet"

echo "✅ Local deployment complete!"
echo "🌐 Website should be available at: http://localhost:3000"
echo "📝 Check browser console for environment variable debug logs"
