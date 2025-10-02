# Verification script for admin setup
Write-Host "=== Admin Setup Verification ===" -ForegroundColor Green

# Check if config files exist
$configProd = "public/website-admin/config.prod.yml"
$configDev = "public/website-admin/config.dev.yml"

if (Test-Path $configProd) {
    Write-Host "✓ config.prod.yml exists" -ForegroundColor Green
} else {
    Write-Host "✗ config.prod.yml missing" -ForegroundColor Red
}

if (Test-Path $configDev) {
    Write-Host "✓ config.dev.yml exists" -ForegroundColor Green
} else {
    Write-Host "✗ config.dev.yml missing" -ForegroundColor Red
}

# Check if admin pages exist
$adminProd = "src/pages/website-admin/index.html"
$adminTest = "src/pages/website-admin-test/index.html"

if (Test-Path $adminProd) {
    Write-Host "✓ Production admin page exists" -ForegroundColor Green
} else {
    Write-Host "✗ Production admin page missing" -ForegroundColor Red
}

if (Test-Path $adminTest) {
    Write-Host "✓ Test admin page exists" -ForegroundColor Green
} else {
    Write-Host "✗ Test admin page missing" -ForegroundColor Red
}

# Check middleware
$middleware = "src/middleware.ts"
if (Test-Path $middleware) {
    Write-Host "✓ Middleware exists" -ForegroundColor Green
} else {
    Write-Host "✗ Middleware missing" -ForegroundColor Red
}

Write-Host "`n=== Testing URLs ===" -ForegroundColor Yellow
Write-Host "Production admin: https://<your-tunnel>.lhr.life/website-admin"
Write-Host "Test admin: http://localhost:4321/website-admin-test"
Write-Host "Dev config: http://localhost:4321/website-admin/config.dev.yml"

Write-Host "`n=== Environment Setup ===" -ForegroundColor Yellow
Write-Host "Make sure your .env.local has:"
Write-Host "  OAUTH_GITHUB_CLIENT_ID=..."
Write-Host "  OAUTH_GITHUB_CLIENT_SECRET=..."
Write-Host "  TUNNEL_HOSTS=<your-subdomain>.lhr.life (or leave empty)"

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Start dev server: npm run dev -- --port 4321"
Write-Host "2. Test local admin: http://localhost:4321/website-admin-test"
Write-Host "3. Start tunnel and test prod admin: https://<tunnel>.lhr.life/website-admin"
Write-Host "4. Check browser console for [ADMIN config] logs"
Write-Host "5. Verify no api.netlify.com redirects occur"
