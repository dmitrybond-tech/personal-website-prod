# start-lhr-tunnel-v2.ps1
# Stable localhost.run tunnel with auto-reconnect (Windows PowerShell 5.1 friendly)

$WorkDir   = "C:\PersonalProjects\website\apps\website"
$KeyPath   = "C:\Users\dmevb\.ssh\id_ed25519_wsl"
$LocalPort = 4321
$Remote    = "localhost.run"
$RetrySec  = 5

$LogDir     = Join-Path $WorkDir ".tunnel-logs"
$ControlLog = Join-Path $LogDir ("control-" + (Get-Date -Format "yyyyMMdd") + ".log")
$SshLog     = Join-Path $LogDir ("ssh-"     + (Get-Date -Format "yyyyMMdd") + ".log")

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location -Path $WorkDir

# Ensure ssh is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  Write-Host "[fatal] OpenSSH client not found. Enable 'OpenSSH Client' in Optional Features." -ForegroundColor Red
  exit 1
}

# Start ssh-agent and add key (no ternary, PS 5.1 safe)
try {
  $svc = Get-Service -Name "ssh-agent" -ErrorAction SilentlyContinue
  if ($svc) {
    if ($svc.Status -ne "Running") {
      Start-Service "ssh-agent"
      Write-Host "[ok] ssh-agent started."
    }
    $loaded = ""
    try { $loaded = (& ssh-add -L 2>$null) | Out-String } catch {}

    $needAdd = $true
    $pubPath = $KeyPath + ".pub"
    if (Test-Path $pubPath) {
      $pub = Get-Content $pubPath -Raw
      $parts = $pub -split " "
      if ($parts.Length -ge 2) {
        $needle = [Regex]::Escape($parts[0] + " " + $parts[1])
        if ($loaded -match $needle) { $needAdd = $false }
      }
    }
    if ($needAdd) {
      Write-Host "[info] loading key into ssh-agent: $KeyPath"
      & ssh-add $KeyPath
    } else {
      Write-Host "[ok] key already in ssh-agent."
    }
  } else {
    Write-Host "[warn] ssh-agent service not found; will use -i directly."
  }
} catch {
  Write-Host "[warn] ssh-agent init failed; will use -i directly."
}

# SSH args (keepalive + proxy-friendly)
$sshArgs = @(
  "-i", $KeyPath,
  "-o", "IdentitiesOnly=yes",
  "-o", "ServerAliveInterval=60",
  "-o", "ServerAliveCountMax=3",
  "-o", "ExitOnForwardFailure=yes",
  "-o", "TCPKeepAlive=yes",
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "UserKnownHostsFile=NUL",
  "-R", "80:localhost:$LocalPort",
  $Remote
)

"[start] $(Get-Date) dir=$WorkDir key=$KeyPath port=$LocalPort remote=$Remote" | Add-Content -Path $ControlLog
"[hint] public URL will be printed in ssh-log" | Add-Content -Path $ControlLog
Write-Host "[run] Tunnel will appear at https://<random>.lhr.life (or your custom domain)."
Write-Host "[log] control: $ControlLog"
Write-Host "[log] ssh:     $SshLog"

while ($true) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$ts [connect] ssh $($sshArgs -join ' ')" | Add-Content -Path $ControlLog
  try {
    # IMPORTANT: write ssh output to a separate file to avoid file locks
    & ssh @sshArgs 2>&1 | Tee-Object -FilePath $SshLog -Append
    $exit = $LASTEXITCODE
  } catch {
    $exit = -1
    $_ | Out-String | Add-Content -Path $SshLog
  }
  $ts2 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$ts2 [exit] code=$exit -> retry in $RetrySec s" | Add-Content -Path $ControlLog
  Start-Sleep -Seconds $RetrySec
}
