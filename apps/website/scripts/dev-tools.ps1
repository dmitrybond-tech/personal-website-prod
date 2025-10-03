param(
  [int[]]$PortsToKill = @(4321, 4322, 8081),
  [int]$SitePort = 4321,
  [int]$CmsPort  = 8081,
  [string]$SiteScript = "dev",
  [string]$CmsScript  = "cms:proxy",
  [switch]$NoCms
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Stop-Port {
  param([int]$Port)
  $conns = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  if ($conns) {
    $procIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $procIds) {
      try {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Host ("Killed PID {0} on port {1}" -f $procId, $Port)
      } catch {
        Write-Warning ("Failed to kill PID {0} on port {1}: {2}" -f $procId, $Port, $_.Exception.Message)
      }
    }
  } else {
    Write-Host ("Port {0} is free" -f $Port)
  }
}

foreach ($p in $PortsToKill) { Stop-Port -Port $p }

# Рабочая директория: apps/website
$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path

# Запускаем npm-скрипты в том же окне через cmd.exe,
# чтобы обойти npm.ps1 и не плодить отдельные окна
$siteProc = Start-Process -FilePath $env:ComSpec `
  -ArgumentList "/c","npm","run",$SiteScript,"--","--host","--port",$SitePort `
  -WorkingDirectory $projectRoot -NoNewWindow -PassThru

$cmsProc = $null
if (-not $NoCms) {
  $cmsProc = Start-Process -FilePath $env:ComSpec `
    -ArgumentList "/c","npm","run",$CmsScript,"--","--port",$CmsPort `
    -WorkingDirectory $projectRoot -NoNewWindow -PassThru
}

Write-Host ("Running site (PID {0}) on :{1}" -f $siteProc.Id, $SitePort)
if ($cmsProc) { Write-Host ("Running CMS  (PID {0}) on :{1}" -f $cmsProc.Id, $CmsPort) }
Write-Host "Press Ctrl+C to stop both."

try {
  $ids = @()
  if ($siteProc) { $ids += $siteProc.Id }
  if ($cmsProc)  { $ids += $cmsProc.Id }
  if ($ids.Count -gt 0) {
    Wait-Process -Id $ids
  } else {
    Write-Warning "Nothing to wait for. Check scripts names and ports."
  }
}
finally {
  foreach ($p in @($cmsProc, $siteProc)) {
    if ($p -and -not $p.HasExited) {
      try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
  }
}
