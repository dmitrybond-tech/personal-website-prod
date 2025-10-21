#!/usr/bin/env bash
# Health check script for SSR cache and static asset delivery
# Usage: ./scripts/health.sh [hostname]
# Example: ./scripts/health.sh dmitrybond.tech
#          ./scripts/health.sh localhost:3000

set -e

# Configuration
PAGE="${PAGE:-/en/about}"
HOST="${1:-dmitrybond.tech}"
PROTOCOL="${PROTOCOL:-https}"

# Use http for localhost
if [[ "$HOST" == localhost* ]]; then
  PROTOCOL="http"
fi

BASE_URL="${PROTOCOL}://${HOST}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 SSR Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: ${BASE_URL}${PAGE}"
echo ""

# Test 1: HTML Cache-Control
echo "📄 [1/5] HTML Cache Policy"
echo "─────────────────────────────────────────────────"
HTML_CACHE=$(curl -sI "${BASE_URL}${PAGE}" | grep -i '^cache-control' | sed 's/^cache-control: //i' | tr -d '\r\n')
echo "Expected: no-store, max-age=0, must-revalidate"
echo "Actual:   ${HTML_CACHE}"

if [[ "$HTML_CACHE" == *"no-store"* ]] && [[ "$HTML_CACHE" == *"must-revalidate"* ]]; then
  echo "✅ PASS: HTML is not cached"
else
  echo "❌ FAIL: HTML cache policy incorrect"
  exit 1
fi
echo ""

# Test 2: Extract CSS and check headers
echo "🎨 [2/5] CSS Asset Delivery"
echo "─────────────────────────────────────────────────"
CSS_PATH=$(curl -s "${BASE_URL}${PAGE}" | grep -o '/_astro/[^"]*\.css' | head -n1)

if [ -z "$CSS_PATH" ]; then
  echo "❌ FAIL: No CSS found in HTML"
  exit 1
fi

echo "CSS Path: ${CSS_PATH}"

# Check CSS response
echo "Fetching: ${BASE_URL}${CSS_PATH}"
CSS_RESPONSE=$(curl -sI "${BASE_URL}${CSS_PATH}")

# Extract headers
CSS_STATUS=$(echo "$CSS_RESPONSE" | head -n1 | awk '{print $2}')
CSS_CONTENT_TYPE=$(echo "$CSS_RESPONSE" | grep -i '^content-type' | sed 's/^content-type: //i' | tr -d '\r\n')
CSS_CACHE=$(echo "$CSS_RESPONSE" | grep -i '^cache-control' | sed 's/^cache-control: //i' | tr -d '\r\n')
CSS_LOCATION=$(echo "$CSS_RESPONSE" | grep -i '^location' | sed 's/^location: //i' | tr -d '\r\n')

echo "Status:       ${CSS_STATUS}"
echo "Content-Type: ${CSS_CONTENT_TYPE}"
echo "Cache:        ${CSS_CACHE}"

# Validate CSS
if [ "$CSS_STATUS" != "200" ]; then
  echo "❌ FAIL: CSS returned status ${CSS_STATUS} (expected 200)"
  exit 1
fi

if [ -n "$CSS_LOCATION" ]; then
  echo "❌ FAIL: CSS has Location header (redirect): ${CSS_LOCATION}"
  exit 1
fi

if [[ ! "$CSS_CONTENT_TYPE" == *"text/css"* ]]; then
  echo "❌ FAIL: CSS Content-Type is '${CSS_CONTENT_TYPE}' (expected text/css)"
  exit 1
fi

if [[ ! "$CSS_CACHE" == *"immutable"* ]] || [[ ! "$CSS_CACHE" == *"max-age=31536000"* ]]; then
  echo "⚠️  WARN: CSS cache is '${CSS_CACHE}' (expected immutable, max-age=31536000)"
fi

echo "✅ PASS: CSS delivered correctly"
echo ""

# Test 3: Font delivery
echo "🔤 [3/5] Font Asset Delivery"
echo "─────────────────────────────────────────────────"
FONT_PATH="/fonts/inter-roman.var.woff2"
echo "Font Path: ${FONT_PATH}"

FONT_RESPONSE=$(curl -sI "${BASE_URL}${FONT_PATH}")
FONT_STATUS=$(echo "$FONT_RESPONSE" | head -n1 | awk '{print $2}')
FONT_CONTENT_TYPE=$(echo "$FONT_RESPONSE" | grep -i '^content-type' | sed 's/^content-type: //i' | tr -d '\r\n')
FONT_CACHE=$(echo "$FONT_RESPONSE" | grep -i '^cache-control' | sed 's/^cache-control: //i' | tr -d '\r\n')

echo "Status:       ${FONT_STATUS}"
echo "Content-Type: ${FONT_CONTENT_TYPE}"
echo "Cache:        ${FONT_CACHE}"

if [ "$FONT_STATUS" == "200" ]; then
  if [[ "$FONT_CONTENT_TYPE" == *"font"* ]]; then
    if [[ "$FONT_CACHE" == *"immutable"* ]]; then
      echo "✅ PASS: Font delivered with immutable cache"
    else
      echo "⚠️  WARN: Font cache is '${FONT_CACHE}'"
    fi
  else
    echo "⚠️  WARN: Font Content-Type is '${FONT_CONTENT_TYPE}'"
  fi
else
  echo "⚠️  SKIP: Font not found (status ${FONT_STATUS})"
fi
echo ""

# Test 4: Check for duplicate Cache-Control headers
echo "🔍 [4/5] Duplicate Headers Check"
echo "─────────────────────────────────────────────────"
CACHE_COUNT=$(echo "$CSS_RESPONSE" | grep -i '^cache-control' | wc -l)
echo "Cache-Control headers in CSS response: ${CACHE_COUNT}"

if [ "$CACHE_COUNT" -gt 1 ]; then
  echo "❌ FAIL: Multiple Cache-Control headers detected"
  echo "$CSS_RESPONSE" | grep -i '^cache-control'
  exit 1
else
  echo "✅ PASS: Single Cache-Control header"
fi
echo ""

# Test 5: Upload directory cache
echo "📁 [5/5] Uploads Directory Cache"
echo "─────────────────────────────────────────────────"
# Try to find an upload asset (adjust path as needed)
UPLOAD_PATH="/uploads/about/favorites/technologies-thumbnail-custom.jpg"
echo "Upload Path: ${UPLOAD_PATH}"

UPLOAD_RESPONSE=$(curl -sI "${BASE_URL}${UPLOAD_PATH}" 2>/dev/null || echo "")
if [ -n "$UPLOAD_RESPONSE" ]; then
  UPLOAD_STATUS=$(echo "$UPLOAD_RESPONSE" | head -n1 | awk '{print $2}')
  UPLOAD_CACHE=$(echo "$UPLOAD_RESPONSE" | grep -i '^cache-control' | sed 's/^cache-control: //i' | tr -d '\r\n')
  
  echo "Status:       ${UPLOAD_STATUS}"
  echo "Cache:        ${UPLOAD_CACHE}"
  
  if [ "$UPLOAD_STATUS" == "200" ]; then
    if [[ "$UPLOAD_CACHE" == *"max-age=86400"* ]]; then
      echo "✅ PASS: Upload cached for 1 day"
    else
      echo "⚠️  WARN: Upload cache is '${UPLOAD_CACHE}' (expected max-age=86400)"
    fi
  else
    echo "⚠️  SKIP: Upload not found"
  fi
else
  echo "⚠️  SKIP: Upload path not accessible"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All critical tests passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Expected Headers Summary:"
echo "  HTML:    Cache-Control: no-store, max-age=0, must-revalidate"
echo "  CSS/JS:  Cache-Control: public, max-age=31536000, immutable"
echo "  Fonts:   Cache-Control: public, max-age=31536000, immutable"
echo "  Uploads: Cache-Control: public, max-age=86400"
echo ""

