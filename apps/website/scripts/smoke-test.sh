#!/usr/bin/env bash
#
# Smoke test for SSR static asset delivery
# Tests that CSS, fonts, and other assets are served with correct cache headers
#
# Usage:
#   ./scripts/smoke-test.sh [BASE_URL]
#
# Example:
#   ./scripts/smoke-test.sh https://dmitrybond.tech
#   ./scripts/smoke-test.sh http://localhost:4321

set -euo pipefail

BASE_URL="${1:-http://localhost:4321}"
FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
  FAILED=$((FAILED + 1))
}

log_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

echo "🧪 Smoke testing: $BASE_URL"
echo ""

# Test 1: HTML page should have no-store
echo "Test 1: HTML page cache headers"
HTML_CACHE=$(curl -sSI "$BASE_URL/en/about" | grep -i "cache-control:" || echo "NONE")
if echo "$HTML_CACHE" | grep -qi "no-store"; then
  log_info "HTML has no-store: $HTML_CACHE"
else
  log_error "HTML missing no-store: $HTML_CACHE"
fi

# Test 2: Extract CSS path from HTML
echo ""
echo "Test 2: CSS asset discovery"
CSS_PATH=$(curl -sS "$BASE_URL/en/about" | grep -oP '/_astro/[^"]+\.css' | head -n1 || echo "")
if [ -z "$CSS_PATH" ]; then
  log_error "No CSS file found in HTML"
else
  log_info "Found CSS: $CSS_PATH"
  
  # Test 3: CSS should be served with 200 and immutable cache
  echo ""
  echo "Test 3: CSS asset headers"
  CSS_RESPONSE=$(curl -sSI "$BASE_URL$CSS_PATH")
  CSS_STATUS=$(echo "$CSS_RESPONSE" | head -n1)
  CSS_CACHE=$(echo "$CSS_RESPONSE" | grep -i "cache-control:" || echo "NONE")
  CSS_CONTENT_TYPE=$(echo "$CSS_RESPONSE" | grep -i "content-type:" || echo "NONE")
  
  if echo "$CSS_STATUS" | grep -q "200"; then
    log_info "CSS returns 200: $CSS_STATUS"
  else
    log_error "CSS not 200: $CSS_STATUS"
  fi
  
  if echo "$CSS_CACHE" | grep -qi "immutable" && echo "$CSS_CACHE" | grep -qi "max-age=31536000"; then
    log_info "CSS has immutable cache: $CSS_CACHE"
  else
    log_error "CSS missing immutable cache: $CSS_CACHE"
  fi
  
  if echo "$CSS_CONTENT_TYPE" | grep -qi "text/css"; then
    log_info "CSS has correct content-type: $CSS_CONTENT_TYPE"
  else
    log_warn "CSS content-type may be incorrect: $CSS_CONTENT_TYPE"
  fi
  
  # Check for duplicate Cache-Control headers
  CACHE_COUNT=$(echo "$CSS_RESPONSE" | grep -ci "cache-control:" || echo "0")
  if [ "$CACHE_COUNT" -eq 1 ]; then
    log_info "CSS has single Cache-Control header"
  else
    log_error "CSS has $CACHE_COUNT Cache-Control headers (should be 1)"
  fi
fi

# Test 4: Font file cache headers
echo ""
echo "Test 4: Font asset headers"
FONT_PATH="/fonts/inter-roman.var.woff2"
FONT_RESPONSE=$(curl -sSI "$BASE_URL$FONT_PATH" 2>&1 || echo "FAILED")
if echo "$FONT_RESPONSE" | grep -q "FAILED"; then
  log_warn "Font not available: $FONT_PATH (may not exist)"
else
  FONT_STATUS=$(echo "$FONT_RESPONSE" | head -n1)
  FONT_CACHE=$(echo "$FONT_RESPONSE" | grep -i "cache-control:" || echo "NONE")
  
  if echo "$FONT_STATUS" | grep -q "200"; then
    log_info "Font returns 200: $FONT_STATUS"
  else
    log_error "Font not 200: $FONT_STATUS"
  fi
  
  if echo "$FONT_CACHE" | grep -qi "immutable" && echo "$FONT_CACHE" | grep -qi "max-age=31536000"; then
    log_info "Font has immutable cache: $FONT_CACHE"
  else
    log_error "Font missing immutable cache: $FONT_CACHE"
  fi
fi

# Test 5: Check if server is actually running SSR (not prerendered)
echo ""
echo "Test 5: Server mode verification"
# A simple check: SSR should return Date header
DATE_HEADER=$(curl -sSI "$BASE_URL/en/about" | grep -i "^date:" || echo "NONE")
if [ "$DATE_HEADER" != "NONE" ]; then
  log_info "Server returns Date header (SSR confirmed)"
else
  log_warn "No Date header (may be prerendered)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  log_info "All tests passed!"
  echo ""
  exit 0
else
  log_error "$FAILED test(s) failed"
  echo ""
  exit 1
fi

