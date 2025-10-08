# Test script for Docker build on VPS (PowerShell version)
# This script tests the Docker build with proper error handling and debugging

Write-Host "🚀 Testing Docker build for website on VPS..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the repository root."
    exit 1
}

if (-not (Test-Path "package-lock.json")) {
    Write-Error "package-lock.json not found. Please run 'npm install' first."
    exit 1
}

if (-not (Test-Path "apps/website/Dockerfile")) {
    Write-Error "apps/website/Dockerfile not found."
    exit 1
}

Write-Status "All required files found"

# Check workspace configuration
Write-Host "🔍 Checking workspace configuration..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.workspaces) {
    Write-Status "Workspaces configured in package.json"
} else {
    Write-Error "Workspaces not configured in package.json"
    exit 1
}

# Check build script
if ($packageJson.scripts.'build:website') {
    Write-Status "build:website script found"
} else {
    Write-Error "build:website script not found in package.json"
    exit 1
}

# Clean up any existing test image
Write-Host "🧹 Cleaning up existing test images..." -ForegroundColor Cyan
try {
    docker rmi website-test:latest 2>$null
} catch {
    # Ignore errors if image doesn't exist
}

# Build the Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Cyan
Write-Warning "This may take several minutes..."

try {
    docker build -f apps/website/Dockerfile -t website-test:latest .
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Docker build successful!"
    } else {
        Write-Error "Docker build failed!"
        exit 1
    }
} catch {
    Write-Error "Docker build failed with error: $($_.Exception.Message)"
    exit 1
}

# Test the container
Write-Host "🧪 Testing container startup..." -ForegroundColor Cyan
try {
    $containerId = docker run -d -p 3000:3000 website-test:latest
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Container started successfully with ID: $containerId"
    } else {
        Write-Error "Failed to start container"
        exit 1
    }
} catch {
    Write-Error "Failed to start container with error: $($_.Exception.Message)"
    exit 1
}

# Wait for container to be ready
Write-Host "⏳ Waiting for container to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Test server response
Write-Host "🌐 Testing server response..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
    Write-Status "Server is responding with status: $($response.StatusCode)"
} catch {
    Write-Error "Server is not responding: $($_.Exception.Message)"
    docker logs $containerId
    docker stop $containerId
    docker rm $containerId
    exit 1
}

# Test uploads directory
Write-Host "📁 Testing uploads directory..." -ForegroundColor Cyan
try {
    $uploadsResponse = Invoke-WebRequest -Uri "http://localhost:3000/uploads/placeholders/avatar.png" -Method Head -TimeoutSec 10 -UseBasicParsing
    if ($uploadsResponse.Headers.'Content-Type' -like "image/*") {
        Write-Status "Uploads directory accessible and serving images correctly"
    } else {
        Write-Warning "Uploads accessible but may not be serving as images (Content-Type: $($uploadsResponse.Headers.'Content-Type'))"
    }
} catch {
    Write-Warning "Uploads directory test failed: $($_.Exception.Message)"
    try {
        $testResponse = Invoke-WebRequest -Uri "http://localhost:3000/uploads/placeholders/avatar.png" -TimeoutSec 10 -UseBasicParsing
        if ($testResponse.StatusCode -eq 200) {
            Write-Warning "Uploads accessible but may not be serving as images"
        } else {
            Write-Error "Uploads directory not accessible"
        }
    } catch {
        Write-Error "Uploads directory not accessible"
    }
}

# Check container logs for any errors
Write-Host "📋 Checking container logs..." -ForegroundColor Cyan
$logs = docker logs $containerId 2>&1
if ($logs -match "error|Error|ERROR") {
    Write-Warning "Found errors in container logs:"
    $logs | Where-Object { $_ -match "error|Error|ERROR" } | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
} else {
    Write-Status "No errors found in container logs"
}

# Clean up
Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan
docker stop $containerId
docker rm $containerId
docker rmi website-test:latest

Write-Status "Test completed successfully!"
Write-Host ""
Write-Host "🎉 Your Docker build is working correctly!" -ForegroundColor Green
Write-Host "You can now deploy using: docker-compose -f compose.prod.yml up -d --build" -ForegroundColor Cyan
