#!/usr/bin/env bash
set -euo pipefail

# OAuth Acceptance Tests for Decap CMS
# Tests the complete OAuth flow without requiring actual GitHub login

SITE="${DECAP_TEST_SITE:-https://dmitrybond.tech}"
TMPDIR="${TMPDIR:-$(mktemp -d)}"
JAR="${TMPDIR}/cookies.txt"

echo "======================================"
echo "Decap OAuth Acceptance Tests"
echo "Site: ${SITE}"
echo "Temp: ${TMPDIR}"
echo "======================================"
echo ""

# Cleanup on exit
trap "rm -rf '${TMPDIR}'" EXIT

# 0) Smoke test: Admin assets
echo "[0] Smoke Test: Admin Assets"
echo "---------------------------------------"
echo "Testing: ${SITE}/website-admin/config.yml"
curl -sI "${SITE}/website-admin/config.yml" | sed -n '1,12p'
echo ""

echo "Testing: ${SITE}/website-admin/"
curl -sI "${SITE}/website-admin/" | sed -n '1,12p'
echo ""

# 1) Dry-run entry (no redirect, but with Set-Cookie)
echo "[1] Dry-Run Entry Test"
echo "---------------------------------------"
echo "Testing: ${SITE}/api/decap?provider=github&scope=repo&site_id=${SITE}&dry=1"
curl -sS -D "${TMPDIR}/dry.h" -c "${JAR}" -o "${TMPDIR}/dry.json" \
  "${SITE}/api/decap?provider=github&scope=repo&site_id=${SITE}&dry=1"

echo "=== Headers (first 20 lines) ==="
sed -n '1,20p' "${TMPDIR}/dry.h"
echo ""

echo "=== Response JSON ==="
cat "${TMPDIR}/dry.json" | jq . 2>/dev/null || cat "${TMPDIR}/dry.json"
echo ""

echo "=== Cookies ==="
awk '{print NR, $0}' "${JAR}" | head -20
echo ""

# Extract state from cookies
STATE="$(awk '$6=="decap_oauth_state"{print $7}' "${JAR}" || echo '')"
if [ -z "${STATE}" ]; then
  echo "ERROR: No state cookie found!"
  exit 1
fi
echo "✓ STATE cookie found: ${STATE:0:16}..."
echo ""

# 2) Token exchange (as browser would: Origin+Referer, with cookie jar)
echo "[2] Token Exchange Test (fake code)"
echo "---------------------------------------"
echo "Testing: ${SITE}/api/decap/token"
curl -sS -i -b "${JAR}" \
  -H "origin: ${SITE}" \
  -H "referer: ${SITE}/website-admin/" \
  -H "content-type: application/json" \
  -H "x-requested-with: XMLHttpRequest" \
  -X POST "${SITE}/api/decap/token" \
  --data "{\"code\":\"fake_code_for_testing\",\"state\":\"${STATE}\"}" \
  2>&1 | head -40
echo ""

# Expected: 400 with bad_verification_code or token_exchange_failed (NOT "Invalid state")
echo "✓ Expected: 400 with 'bad_verification_code' or 'token_exchange_failed'"
echo "✗ If you see 'Invalid state' — the state validation is broken"
echo ""

# 3) Diagnostic endpoint
echo "[3] Diagnostic Endpoint"
echo "---------------------------------------"
echo "Testing: ${SITE}/api/decap/diag"
curl -sS "${SITE}/api/decap/diag" | jq . 2>/dev/null || curl -sS "${SITE}/api/decap/diag"
echo ""

# 4) Health endpoint
echo "[4] Health Check"
echo "---------------------------------------"
echo "Testing: ${SITE}/api/decap/health"
curl -sS "${SITE}/api/decap/health" | jq . 2>/dev/null || curl -sS "${SITE}/api/decap/health"
echo ""

echo "======================================"
echo "Tests Complete!"
echo "======================================"
echo ""
echo "Expected Results:"
echo "  [0] Both 200 OK"
echo "  [1] 200 + Set-Cookie: decap_oauth_state=..., dryRun:true in JSON"
echo "  [2] 400 with bad_verification_code|token_exchange_failed (NOT 'Invalid state')"
echo "  [3] has_client_id/secret=true, ok:true"
echo "  [4] ok:true, service:decap-oauth"
echo ""

