# Local deployment script with environment variable verification
# PowerShell version for Windows

Write-Host "🚀 Starting local deployment with environment variable verification..." -ForegroundColor Green

# Check if env.prod exists
if (-not (Test-Path "env.prod")) {
    Write-Host "❌ Error: env.prod file not found!" -ForegroundColor Red
    Write-Host "Please create env.prod with your environment variables." -ForegroundColor Yellow
    exit 1
}

# Load environment variables from env.prod
Write-Host "📋 Loading environment variables from env.prod..." -ForegroundColor Cyan
Get-Content "env.prod" | ForEach-Object {
    if ($_ -match "^([^#=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($name -and $value) {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "✅ Loaded: $name" -ForegroundColor Green
        }
    }
}

# Verify critical environment variables
Write-Host "🔍 Verifying environment variables..." -ForegroundColor Cyan

$requiredVars = @(
    "PUBLIC_CAL_USERNAME",
    "PUBLIC_CAL_EMBED_LINK", 
    "PUBLIC_CAL_EVENTS",
    "PUBLIC_SITE_URL"
)

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if (-not $value) {
        Write-Host "❌ Error: $var is not set in env.prod" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ $var is set: $value" -ForegroundColor Green
    }
}

# Export GIT_SHA if not set
$gitSha = [Environment]::GetEnvironmentVariable("GIT_SHA", "Process")
if (-not $gitSha) {
    try {
        $gitSha = git rev-parse HEAD 2>$null
        if (-not $gitSha) { $gitSha = "local-build" }
    } catch {
        $gitSha = "local-build"
    }
    [Environment]::SetEnvironmentVariable("GIT_SHA", $gitSha, "Process")
    Write-Host "✅ GIT_SHA set to: $gitSha" -ForegroundColor Green
}

Write-Host "🏗️ Building Docker image with environment variables..." -ForegroundColor Cyan

# Build the image
docker compose -f compose.prod.yml build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker compose -f compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🔍 Checking service status..." -ForegroundColor Cyan
docker compose -f compose.prod.yml ps

Write-Host "📊 Checking logs for environment variable debug info..." -ForegroundColor Cyan
docker compose -f compose.prod.yml logs website | Select-String -Pattern "(cal|PUBLIC_)" | Select-Object -First 10

Write-Host "✅ Local deployment complete!" -ForegroundColor Green
Write-Host "🌐 Website should be available at: http://localhost:3000" -ForegroundColor Blue
Write-Host "📝 Check browser console for environment variable debug logs" -ForegroundColor Yellow
