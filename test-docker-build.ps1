# Test script to verify Docker build works correctly
# This script builds the Docker image and tests that client assets are included

Write-Host "Testing Docker build for website..." -ForegroundColor Green

# Build the Docker image from repo root
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -f apps/website/Dockerfile -t website-test:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Docker build successful!" -ForegroundColor Green

# Start the container in background
Write-Host "Starting container..." -ForegroundColor Yellow
$containerId = docker run -d -p 3000:3000 website-test:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start container!" -ForegroundColor Red
    exit 1
}

Write-Host "Container started with ID: $containerId" -ForegroundColor Green

# Wait for container to be ready
Write-Host "Waiting for container to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test that the server is responding
Write-Host "Testing server response..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    Write-Host "Server is responding with status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Server is not responding: $($_.Exception.Message)" -ForegroundColor Red
    docker stop $containerId
    docker rm $containerId
    exit 1
}

# Test that uploads directory exists and is accessible
Write-Host "Testing uploads directory..." -ForegroundColor Yellow
try {
    $uploadsResponse = Invoke-WebRequest -Uri "http://localhost:3000/uploads/placeholders/avatar.png" -TimeoutSec 10
    Write-Host "Uploads directory accessible with status: $($uploadsResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($uploadsResponse.Headers.'Content-Type')" -ForegroundColor Green
    
    if ($uploadsResponse.Headers.'Content-Type' -like "image/*") {
        Write-Host "✓ Uploads are serving as images (not HTML fallbacks)" -ForegroundColor Green
    } else {
        Write-Host "✗ Uploads are not serving as images!" -ForegroundColor Red
    }
} catch {
    Write-Host "Uploads directory not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Clean up
Write-Host "Cleaning up..." -ForegroundColor Yellow
docker stop $containerId
docker rm $containerId
docker rmi website-test:latest

Write-Host "Test completed!" -ForegroundColor Green
