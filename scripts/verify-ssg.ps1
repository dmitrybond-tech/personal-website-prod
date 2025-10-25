# PowerShell script for SSG deployment verification
# Usage: .\scripts\verify-ssg.ps1

param(
    [string]$BaseUrl = "https://dmitrybond.tech"
)

Write-Host "🔍 Verifying SSG deployment..." -ForegroundColor Green

$tests = @(
    @{
        Name = "Root Redirect"
        Url = $BaseUrl
        ExpectedStatus = 308
        Description = "Root should redirect to /en"
    },
    @{
        Name = "English Homepage"
        Url = "$BaseUrl/en"
        ExpectedStatus = 200
        Description = "English homepage should load"
    },
    @{
        Name = "Russian Homepage"
        Url = "$BaseUrl/ru"
        ExpectedStatus = 200
        Description = "Russian homepage should load"
    },
    @{
        Name = "About Page"
        Url = "$BaseUrl/en/about"
        ExpectedStatus = 200
        Description = "About page should load"
    },
    @{
        Name = "Legal Page"
        Url = "$BaseUrl/en/legal/privacy-policy"
        ExpectedStatus = 200
        Description = "Legal page should load"
    },
    @{
        Name = "Blog Page"
        Url = "$BaseUrl/en/blog"
        ExpectedStatus = 200
        Description = "Blog page should load"
    },
    @{
        Name = "404 Page"
        Url = "$BaseUrl/en/nonexistent-page"
        ExpectedStatus = 404
        Description = "404 page should be served"
    }
)

$passed = 0
$failed = 0

foreach ($test in $tests) {
    Write-Host "Testing: $($test.Name)" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method Head -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq $test.ExpectedStatus) {
            Write-Host "✅ PASS: $($test.Description)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "❌ FAIL: $($test.Description) - Expected $($test.ExpectedStatus), got $($response.StatusCode)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "❌ ERROR: $($test.Description) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n📊 Test Results:" -ForegroundColor Cyan
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "`n🎉 All tests passed! SSG deployment is working correctly." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some tests failed. Please check the deployment." -ForegroundColor Yellow
    exit 1
}
