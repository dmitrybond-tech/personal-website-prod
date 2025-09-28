param(
  [Parameter(Mandatory=$true)][string]$TunnelUrl,   # e.g. https://6b8d35b07d92f6.lhr.life
  [string]$CalUsername = "dmitrybond",
  [string]$Secret,
  [string]$AppRelPath = "apps/website",
  [switch]$NoSelfTest
)

# ----- helpers -----
function Set-EnvKV([string]$file,[string]$key,[string]$val){
  if (Test-Path $file) { $content = Get-Content $file -Raw } else { $content = "" }
  $pattern = "(?m)^\s*$key=.*$"
  if ([regex]::IsMatch($content,$pattern)){
    $content = [regex]::Replace($content,$pattern,"$key=$val",1)
  } else {
    if ($content -and ($content[-1] -ne "`n")){ $content += "`r`n" }
    $content += "$key=$val`r`n"
  }
  $dir = Split-Path $file -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($file,$content,$utf8)
}

function Merge-CsvEnv([string]$file,[string]$key,[string]$value){
  if (Test-Path $file) { $content = Get-Content $file -Raw } else { $content = "" }
  $pattern = "(?m)^\s*$key=(.*)$"
  $existing = @()
  $m = [regex]::Match($content,$pattern)
  if ($m.Success){
    $existing = $m.Groups[1].Value.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
  }
  if ($existing -notcontains $value){ $existing += $value }
  $joined = ($existing -join ",")
  Set-EnvKV $file $key $joined
}

function New-RandomHex([int]$bytes=32){
  $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
  $buf = New-Object byte[] $bytes
  $rng.GetBytes($buf)
  ($buf | ForEach-Object { $_.ToString('x2') }) -join ''
}

function HmacHex([string]$text,[string]$key){
  $mac = New-Object System.Security.Cryptography.HMACSHA256([Text.Encoding]::UTF8.GetBytes($key))
  $hash = $mac.ComputeHash([Text.Encoding]::UTF8.GetBytes($text))
  -join ($hash | ForEach-Object { $_.ToString('x2') })
}

# ----- main -----
try { $uri = [uri]$TunnelUrl } catch { throw "Bad -TunnelUrl: $TunnelUrl" }
$host = $uri.Host
$base = $TunnelUrl.TrimEnd('/')
$subscriberUrl = "$base/api/cal/webhook"

$root = (Get-Location).Path
$app  = Join-Path $root $AppRelPath
if (!(Test-Path $app)) { throw "App path not found: $app" }
$envf = Join-Path $app ".env.local"

if (-not $Secret){ $Secret = New-RandomHex 32 }

# server envs
Set-EnvKV $envf "CAL_WEBHOOK_SECRET" $Secret
Set-EnvKV $envf "CAL_DEBUG" "1"
Set-EnvKV $envf "CAL_DUMP_WEBHOOKS_DIR" "var/webhooks"

# client envs
Set-EnvKV $envf "PUBLIC_CAL_USERNAME" $CalUsername
Set-EnvKV $envf "PUBLIC_CAL_EMBED_LINK" ("https://cal.com/$CalUsername")

# vite allowedHosts
Merge-CsvEnv $envf "TUNNEL_HOSTS" $host

Write-Host ""
Write-Host "✅ Updated $envf"
Write-Host ("   CAL_WEBHOOK_SECRET = " + $Secret.Substring(0,8) + "… (hidden)")
Write-Host ("   TUNNEL_HOSTS       += $host")
Write-Host ("   subscriberUrl       = $subscriberUrl")
Write-Host ("   embed profile       = https://cal.com/$CalUsername")
Write-Host ""

if (-not $NoSelfTest){
  $bodyObj = @{ selftest = $true; t = [int](Get-Date -UFormat %s) }
  $body = ($bodyObj | ConvertTo-Json -Compress)
  $sig  = HmacHex $body $Secret
  Write-Host "→ Self-test POST $subscriberUrl"
  try{
    $r = Invoke-WebRequest -Uri $subscriberUrl -Method POST -ContentType 'application/json' `
      -Headers @{ 'x-cal-signature-256' = $sig } -Body $body -MaximumRedirection 0 -ErrorAction Stop
    Write-Host ("   HTTP " + [int]$r.StatusCode + " (expect 204)")
    if ($r.Headers['x-debug-id']){ Write-Host ("   x-debug-id: " + $r.Headers['x-debug-id']) }
  } catch {
    if ($_.Exception.Response){
      $code = [int]$_.Exception.Response.StatusCode
      $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
      $txt = $sr.ReadToEnd(); $sr.Close()
      Write-Host ("   HTTP $code  Body: $txt")
    } else {
      Write-Host ("   Error: " + $_.Exception.Message)
    }
  }
}

Write-Host ""
Write-Host "ℹ Set these in Cal.com Webhook:"
Write-Host "   subscriberUrl = $subscriberUrl"
Write-Host "   secret        = $Secret"
Write-Host "Then restart dev server from apps/website and press 'Test'."
