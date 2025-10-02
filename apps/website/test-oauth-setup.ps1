# Test OAuth Setup Script
# Run this from apps/website directory

Write-Host "=== OAuth Setup Test Script ===" -ForegroundColor Green

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env.local missing - copy from env.local.example and fill in your OAuth credentials" -ForegroundColor Red
    Write-Host "  Required: OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET, TUNNEL_HOSTS" -ForegroundColor Yellow
}

# Check if config files exist
$configFiles = @("public/website-admin/config.prod.yml", "public/website-admin/config.dev.yml")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

# Check if pages exist
$pages = @("src/pages/website-admin/index.html", "src/pages/website-admin-test/index.html", "src/pages/oauth/check.ts")
foreach ($page in $pages) {
    if (Test-Path $page) {
        Write-Host "✓ $page exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $page missing" -ForegroundColor Red
    }
}

Write-Host "`n=== Test URLs ===" -ForegroundColor Cyan
Write-Host "Localhost health check: http://localhost:4321/oauth/check" -ForegroundColor White
Write-Host "Localhost test admin: http://localhost:4321/website-admin-test" -ForegroundColor White
Write-Host "Localhost prod admin: http://localhost:4321/website-admin (will show warning)" -ForegroundColor White
Write-Host "Tunnel health check: https://<your-tunnel>.lhr.life/oauth/check" -ForegroundColor White
Write-Host "Tunnel prod admin: https://<your-tunnel>.lhr.life/website-admin" -ForegroundColor White

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Copy env.local.example to .env.local and fill in your OAuth credentials" -ForegroundColor White
Write-Host "2. Update TUNNEL_HOSTS with your current tunnel subdomain" -ForegroundColor White
Write-Host "3. Clear Vite cache: Remove-Item -Recurse -Force .\node_modules\.vite" -ForegroundColor White
Write-Host "4. Start dev server: npm run dev -- --port 4321" -ForegroundColor White
Write-Host "5. Test the URLs above" -ForegroundColor White
