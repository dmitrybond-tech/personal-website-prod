param([switch]$Fallback)

Write-Host "[dev-cms] Starting Astro dev..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "cd apps/website; npm run dev" -WindowStyle Minimized

Start-Sleep -Seconds 2
if (-not $Fallback) {
  Write-Host "[dev-cms] Trying decap-server..." -ForegroundColor Cyan
  try {
    Start-Process powershell -ArgumentList "cd apps/website; npx decap-server" -WindowStyle Normal
    exit 0
  } catch {
    Write-Host "[dev-cms] decap-server failed, falling back..." -ForegroundColor Yellow
  }
}

Write-Host "[dev-cms] Fallback: netlify-cms-proxy-server@1.3.0" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd apps/website; npx netlify-cms-proxy-server@1.3.0" -WindowStyle Normal
