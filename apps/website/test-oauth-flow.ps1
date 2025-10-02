# Test script for OAuth Device Flow
# This script tests the complete OAuth flow end-to-end

Write-Host "Testing OAuth Device Flow..." -ForegroundColor Green

# Test 1: Check if server is running
Write-Host "`n1. Testing server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "http://localhost:4321" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 0
    if ($response.StatusCode -eq 302 -or $response.StatusCode -eq 200) {
        Write-Host "✅ Server is running (Status: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Server responded with unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Server is not running. Please start with: npm run dev" -ForegroundColor Red
    exit 1
}

# Test 2: Check OAuth device endpoint
Write-Host "`n2. Testing OAuth device endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "http://localhost:4321/oauth/device" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ OAuth device endpoint is working (Status: $($response.StatusCode))" -ForegroundColor Green
    
    # Check if response contains expected elements
    $content = $response.Content
    if ($content -match "verification_uri" -and $content -match "user_code") {
        Write-Host "✅ Device flow HTML contains expected elements" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Device flow HTML may be missing expected elements" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ OAuth device endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check OAuth poll endpoint
Write-Host "`n3. Testing OAuth poll endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Method POST "http://localhost:4321/oauth/device/poll?device_code=TEST" -Body "device_code=TEST" -ContentType "application/x-www-form-urlencoded" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ OAuth poll endpoint is working (Status: $($response.StatusCode))" -ForegroundColor Green
    
    # Check response content
    $content = $response.Content
    if ($content -match "missing_params" -or $content -match "pending") {
        Write-Host "✅ Poll endpoint returns expected error for test device code" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Poll endpoint response: $content" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ OAuth poll endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check website-admin endpoint
Write-Host "`n4. Testing website-admin endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "http://localhost:4321/website-admin" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Website-admin endpoint is working (Status: $($response.StatusCode))" -ForegroundColor Green
    
    # Check if response contains Decap CMS
    $content = $response.Content
    if ($content -match "decap-cms" -or $content -match "CMS") {
        Write-Host "✅ Website-admin contains CMS elements" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Website-admin may be missing CMS elements" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Website-admin endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Check environment variables
Write-Host "`n5. Checking environment variables..." -ForegroundColor Yellow
$clientId = $env:OAUTH_GITHUB_CLIENT_ID
$clientSecret = $env:OAUTH_GITHUB_CLIENT_SECRET

if ($clientId) {
    Write-Host "✅ OAUTH_GITHUB_CLIENT_ID is set" -ForegroundColor Green
} else {
    Write-Host "⚠️  OAUTH_GITHUB_CLIENT_ID is not set (OAuth will not work with real GitHub)" -ForegroundColor Yellow
}

if ($clientSecret) {
    Write-Host "✅ OAUTH_GITHUB_CLIENT_SECRET is set" -ForegroundColor Green
} else {
    Write-Host "⚠️  OAUTH_GITHUB_CLIENT_SECRET is not set (OAuth will not work with real GitHub)" -ForegroundColor Yellow
}

Write-Host "`n🎉 OAuth Device Flow test completed!" -ForegroundColor Green
Write-Host "`nTo test the complete flow:" -ForegroundColor Cyan
Write-Host "1. Set environment variables:" -ForegroundColor White
Write-Host "   `$env:OAUTH_GITHUB_CLIENT_ID='your_client_id'" -ForegroundColor Gray
Write-Host "   `$env:OAUTH_GITHUB_CLIENT_SECRET='your_client_secret'" -ForegroundColor Gray
Write-Host "2. Open http://localhost:4321/website-admin" -ForegroundColor White
Write-Host "3. Follow the OAuth flow" -ForegroundColor White
