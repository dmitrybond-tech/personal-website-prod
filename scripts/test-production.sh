#!/bin/bash

# Production testing script
set -e

echo "🧪 Running production health checks..."

DOMAIN="dmitrybond.tech"
BASE_URL="https://$DOMAIN"

echo "🔍 Testing static assets..."

# Test CSS files
echo "Testing CSS files:"
curl -s -I "$BASE_URL/_astro/" | head -1 || echo "❌ CSS directory test failed"

# Test a specific CSS file (if available)
CSS_FILE=$(curl -s "$BASE_URL/_astro/" | grep -o 'href="[^"]*\.css"' | head -1 | sed 's/href="//;s/"//')
if [ ! -z "$CSS_FILE" ]; then
    echo "Testing specific CSS file: $CSS_FILE"
    curl -s -I "$BASE_URL$CSS_FILE" | head -1 || echo "❌ CSS file test failed"
    
    # Check content type and cache headers
    echo "CSS headers:"
    curl -s -I "$BASE_URL$CSS_FILE" | grep -E "(content-type|cache-control)" || echo "⚠️  Headers not found"
fi

# Test fonts
echo "Testing fonts:"
curl -s -I "$BASE_URL/fonts/" | head -1 || echo "❌ Fonts directory test failed"

# Test main pages
echo "Testing main pages:"
echo "Homepage:"
curl -s -I "$BASE_URL/" | head -1 || echo "❌ Homepage test failed"

echo "About page:"
curl -s -I "$BASE_URL/en/about" | head -1 || echo "❌ About page test failed"

echo "Russian about page:"
curl -s -I "$BASE_URL/ru/about" | head -1 || echo "❌ Russian about page test failed"

# Test health endpoint
echo "Testing health endpoint:"
curl -s -I "$BASE_URL/_healthz" | head -1 || echo "❌ Health endpoint test failed"

# Test static asset caching
echo "Testing cache headers:"
echo "CSS cache headers:"
curl -s -I "$BASE_URL/_astro/" | grep -i cache || echo "⚠️  No cache headers found"

echo "Font cache headers:"
curl -s -I "$BASE_URL/fonts/" | grep -i cache || echo "⚠️  No cache headers found"

echo "✅ Production testing complete!"

# Summary
echo ""
echo "📊 Test Summary:"
echo "✅ Static assets should return 200 OK"
echo "✅ CSS files should have 'text/css' content-type"
echo "✅ Cache headers should include 'immutable' for _astro files"
echo "✅ Main pages should return 200 OK"
echo "✅ Health endpoint should return 200 OK"
