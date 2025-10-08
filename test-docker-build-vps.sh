#!/bin/bash

# Test script for Docker build on VPS
# This script tests the Docker build with proper error handling and debugging

echo "🚀 Testing Docker build for website on VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the repository root."
    exit 1
fi

if [ ! -f "package-lock.json" ]; then
    print_error "package-lock.json not found. Please run 'npm install' first."
    exit 1
fi

if [ ! -f "apps/website/Dockerfile" ]; then
    print_error "apps/website/Dockerfile not found."
    exit 1
fi

print_status "All required files found"

# Check workspace configuration
echo "🔍 Checking workspace configuration..."
if grep -q '"workspaces"' package.json; then
    print_status "Workspaces configured in package.json"
else
    print_error "Workspaces not configured in package.json"
    exit 1
fi

# Check build script
if grep -q '"build:website"' package.json; then
    print_status "build:website script found"
else
    print_error "build:website script not found in package.json"
    exit 1
fi

# Clean up any existing test image
echo "🧹 Cleaning up existing test images..."
docker rmi website-test:latest 2>/dev/null || true

# Build the Docker image
echo "🔨 Building Docker image..."
print_warning "This may take several minutes..."

if docker build -f apps/website/Dockerfile -t website-test:latest .; then
    print_status "Docker build successful!"
else
    print_error "Docker build failed!"
    exit 1
fi

# Test the container
echo "🧪 Testing container startup..."
CONTAINER_ID=$(docker run -d -p 3000:3000 website-test:latest)

if [ $? -eq 0 ]; then
    print_status "Container started successfully with ID: $CONTAINER_ID"
else
    print_error "Failed to start container"
    exit 1
fi

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 10

# Test server response
echo "🌐 Testing server response..."
if curl -f -s http://localhost:3000 > /dev/null; then
    print_status "Server is responding"
else
    print_error "Server is not responding"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi

# Test uploads directory
echo "📁 Testing uploads directory..."
if curl -f -s -I http://localhost:3000/uploads/placeholders/avatar.png | grep -q "Content-Type: image/"; then
    print_status "Uploads directory accessible and serving images correctly"
else
    print_warning "Uploads directory test failed - checking if it exists..."
    if curl -f -s http://localhost:3000/uploads/placeholders/avatar.png > /dev/null; then
        print_warning "Uploads accessible but may not be serving as images"
    else
        print_error "Uploads directory not accessible"
        docker logs $CONTAINER_ID
    fi
fi

# Check container logs for any errors
echo "📋 Checking container logs..."
if docker logs $CONTAINER_ID 2>&1 | grep -i error; then
    print_warning "Found errors in container logs (see above)"
else
    print_status "No errors found in container logs"
fi

# Clean up
echo "🧹 Cleaning up..."
docker stop $CONTAINER_ID
docker rm $CONTAINER_ID
docker rmi website-test:latest

print_status "Test completed successfully!"
echo ""
echo "🎉 Your Docker build is working correctly!"
echo "You can now deploy using: docker-compose -f compose.prod.yml up -d --build"
