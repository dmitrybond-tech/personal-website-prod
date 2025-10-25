# PowerShell script for local SSG deployment
# Usage: .\scripts\deploy-ssg.ps1 -Host "your-server.com" -User "deploy" -KeyPath "C:\path\to\key"

param(
    [Parameter(Mandatory=$true)]
    [string]$Host,
    
    [Parameter(Mandatory=$true)]
    [string]$User,
    
    [Parameter(Mandatory=$true)]
    [string]$KeyPath,
    
    [string]$RemotePath = "/srv/www/dmitrybond.tech"
)

Write-Host "🚀 Starting SSG deployment..." -ForegroundColor Green

# Build the website
Write-Host "📦 Building website..." -ForegroundColor Yellow
Set-Location "apps/website"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}
Set-Location "../.."

# Create backup on server
Write-Host "💾 Creating backup..." -ForegroundColor Yellow
$backupName = "dmitrybond.tech.bak.$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
ssh -i $KeyPath $User@$Host "sudo cp -a $RemotePath $RemotePath.$backupName"

# Create temp directory
Write-Host "📁 Preparing upload directory..." -ForegroundColor Yellow
ssh -i $KeyPath $User@$Host "mkdir -p /srv/www/tmp-upload"

# Upload build artifacts
Write-Host "⬆️ Uploading files..." -ForegroundColor Yellow
scp -i $KeyPath -r "apps/website/dist/*" "$User@$Host`:/srv/www/tmp-upload/"

# Finalize deployment
Write-Host "🔄 Finalizing deployment..." -ForegroundColor Yellow
ssh -i $KeyPath $User@$Host @"
sudo rsync -a --delete /srv/www/tmp-upload/ $RemotePath/
sudo chown -R www-data:www-data $RemotePath
sudo chmod -R 755 $RemotePath
rm -rf /srv/www/tmp-upload
sudo systemctl reload caddy
"@

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Website should be available at https://dmitrybond.tech" -ForegroundColor Cyan
