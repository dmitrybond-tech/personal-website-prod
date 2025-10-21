# Smoke test for SSR static asset delivery (PowerShell version)
# Tests that CSS, fonts, and other assets are served with correct cache headers
#
# Usage:
#   .\scripts\smoke-test.ps1 [BASE_URL]
#
# Example:
#   .\scripts\smoke-test.ps1 https://dmitrybond.tech
#   .\scripts\smoke-test.ps1 http://localhost:4321

param(
    [string]$BaseUrl = "http://localhost:4321"
)

$Failed = 0

function Log-Info {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Log-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:Failed++
}

function Log-Warn {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Get-HeaderValue {
    param(
        [string]$Response,
        [string]$HeaderName
    )
    $lines = $Response -split "`r`n|`n"
    foreach ($line in $lines) {
        if ($line -match "^${HeaderName}:\s*(.+)$") {
            return $Matches[1].Trim()
        }
    }
    return "NONE"
}

Write-Host "🧪 Smoke testing: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# Test 1: HTML page should have no-store
Write-Host "Test 1: HTML page cache headers"
try {
    $htmlHeaders = Invoke-WebRequest -Uri "$BaseUrl/en/about" -Method Head -UseBasicParsing -ErrorAction Stop
    $htmlCache = $htmlHeaders.Headers.'Cache-Control'
    
    if ($htmlCache -match "no-store") {
        Log-Info "HTML has no-store: $htmlCache"
    } else {
        Log-Error "HTML missing no-store: $htmlCache"
    }
} catch {
    Log-Error "Failed to fetch HTML: $_"
}

# Test 2: Extract CSS path from HTML
Write-Host ""
Write-Host "Test 2: CSS asset discovery"
try {
    $htmlContent = Invoke-WebRequest -Uri "$BaseUrl/en/about" -UseBasicParsing -ErrorAction Stop
    if ($htmlContent.Content -match '/_astro/[^"]+\.css') {
        $cssPath = $Matches[0]
        Log-Info "Found CSS: $cssPath"
        
        # Test 3: CSS should be served with 200 and immutable cache
        Write-Host ""
        Write-Host "Test 3: CSS asset headers"
        try {
            $cssHeaders = Invoke-WebRequest -Uri "$BaseUrl$cssPath" -Method Head -UseBasicParsing -ErrorAction Stop
            
            if ($cssHeaders.StatusCode -eq 200) {
                Log-Info "CSS returns 200"
            } else {
                Log-Error "CSS not 200: $($cssHeaders.StatusCode)"
            }
            
            $cssCache = $cssHeaders.Headers.'Cache-Control'
            if ($cssCache -match "immutable" -and $cssCache -match "max-age=31536000") {
                Log-Info "CSS has immutable cache: $cssCache"
            } else {
                Log-Error "CSS missing immutable cache: $cssCache"
            }
            
            $cssContentType = $cssHeaders.Headers.'Content-Type'
            if ($cssContentType -match "text/css") {
                Log-Info "CSS has correct content-type: $cssContentType"
            } else {
                Log-Warn "CSS content-type may be incorrect: $cssContentType"
            }
        } catch {
            Log-Error "Failed to fetch CSS: $_"
        }
    } else {
        Log-Error "No CSS file found in HTML"
    }
} catch {
    Log-Error "Failed to fetch HTML content: $_"
}

# Test 4: Font file cache headers
Write-Host ""
Write-Host "Test 4: Font asset headers"
$fontPath = "/fonts/inter-roman.var.woff2"
try {
    $fontHeaders = Invoke-WebRequest -Uri "$BaseUrl$fontPath" -Method Head -UseBasicParsing -ErrorAction Stop
    
    if ($fontHeaders.StatusCode -eq 200) {
        Log-Info "Font returns 200"
    } else {
        Log-Error "Font not 200: $($fontHeaders.StatusCode)"
    }
    
    $fontCache = $fontHeaders.Headers.'Cache-Control'
    if ($fontCache -match "immutable" -and $fontCache -match "max-age=31536000") {
        Log-Info "Font has immutable cache: $fontCache"
    } else {
        Log-Error "Font missing immutable cache: $fontCache"
    }
} catch {
    Log-Warn "Font not available: $fontPath (may not exist)"
}

# Test 5: Check if server is actually running SSR (not prerendered)
Write-Host ""
Write-Host "Test 5: Server mode verification"
try {
    $htmlHeaders = Invoke-WebRequest -Uri "$BaseUrl/en/about" -Method Head -UseBasicParsing -ErrorAction Stop
    $dateHeader = $htmlHeaders.Headers.'Date'
    
    if ($dateHeader) {
        Log-Info "Server returns Date header (SSR confirmed)"
    } else {
        Log-Warn "No Date header (may be prerendered)"
    }
} catch {
    Log-Warn "Failed to check Date header"
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ($Failed -eq 0) {
    Log-Info "All tests passed!"
    Write-Host ""
    exit 0
} else {
    Log-Error "$Failed test(s) failed"
    Write-Host ""
    exit 1
}

