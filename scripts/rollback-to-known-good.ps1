# PowerShell Rollback Script for Personal Website
# Usage: .\scripts\rollback-to-known-good.ps1 -CommitHash "34f31734ddfd6780ac0c70b9ae95c019935a3aa5"

param(
    [Parameter(Mandatory=$false)]
    [string]$CommitHash = "34f31734ddfd6780ac0c70b9ae95c019935a3aa5",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupName = "backup/main-$(Get-Date -Format 'yyyy-MM-dd')",
    
    [Parameter(Mandatory=$false)]
    [string]$TagName = "stable-$(Get-Date -Format 'yyyy-MM-dd')"
)

# Set error handling
$ErrorActionPreference = "Stop"

Write-Host "🔄 Starting rollback to known good commit..." -ForegroundColor Yellow
Write-Host "📋 Parameters:" -ForegroundColor Cyan
Write-Host "   Commit Hash: $CommitHash" -ForegroundColor White
Write-Host "   Backup Branch: $BackupName" -ForegroundColor White
Write-Host "   Tag Name: $TagName" -ForegroundColor White
Write-Host ""

# Step 1: Fetch and sync with origin
Write-Host "📥 Fetching latest changes from origin..." -ForegroundColor Cyan
try {
    git fetch origin --prune
    if ($LASTEXITCODE -ne 0) { throw "Failed to fetch from origin" }
    Write-Host "✅ Fetch completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Fetch failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Switch to main and pull
Write-Host "🔄 Switching to main branch..." -ForegroundColor Cyan
try {
    git switch main
    if ($LASTEXITCODE -ne 0) { throw "Failed to switch to main" }
    Write-Host "✅ Switched to main" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to switch to main: $_" -ForegroundColor Red
    exit 1
}

Write-Host "📥 Pulling latest changes..." -ForegroundColor Cyan
try {
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw "Failed to pull latest changes" }
    Write-Host "✅ Pull completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Pull failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Create backup branch
Write-Host "💾 Creating backup branch: $BackupName" -ForegroundColor Cyan
try {
    git branch $BackupName
    if ($LASTEXITCODE -ne 0) { throw "Failed to create backup branch" }
    Write-Host "✅ Backup branch created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create backup branch: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Push backup branch
Write-Host "📤 Pushing backup branch to origin..." -ForegroundColor Cyan
try {
    git push origin $BackupName
    if ($LASTEXITCODE -ne 0) { throw "Failed to push backup branch" }
    Write-Host "✅ Backup branch pushed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push backup branch: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Create and push tag
Write-Host "🏷️ Creating stable tag: $TagName" -ForegroundColor Cyan
try {
    git tag -a $TagName $CommitHash -m "Last known good ($(Get-Date -Format 'yyyy-MM-dd'))"
    if ($LASTEXITCODE -ne 0) { throw "Failed to create tag" }
    Write-Host "✅ Tag created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create tag: $_" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Pushing tag to origin..." -ForegroundColor Cyan
try {
    git push origin $TagName
    if ($LASTEXITCODE -ne 0) { throw "Failed to push tag" }
    Write-Host "✅ Tag pushed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push tag: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Hard reset to known good commit
Write-Host "🔄 Resetting main to commit: $CommitHash" -ForegroundColor Cyan
try {
    git reset --hard $CommitHash
    if ($LASTEXITCODE -ne 0) { throw "Failed to reset to commit" }
    Write-Host "✅ Reset completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Reset failed: $_" -ForegroundColor Red
    exit 1
}

# Step 7: Force push with lease
Write-Host "📤 Force pushing main branch (with lease)..." -ForegroundColor Cyan
try {
    git push --force-with-lease origin main
    if ($LASTEXITCODE -ne 0) { throw "Failed to force push main" }
    Write-Host "✅ Force push completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Force push failed: $_" -ForegroundColor Red
    exit 1
}

# Step 8: Verification
Write-Host "🔍 Verifying rollback..." -ForegroundColor Cyan
try {
    $currentCommit = git rev-parse HEAD
    if ($currentCommit -eq $CommitHash) {
        Write-Host "✅ Main branch now points to: $currentCommit" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Warning: Main branch points to: $currentCommit (expected: $CommitHash)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Verification failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Rollback completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait for GitHub Actions CI to rebuild the Docker image" -ForegroundColor White
Write-Host "2. Deploy on VPS: cd /opt/prod && sh deploy.sh" -ForegroundColor White
Write-Host "3. Validate deployment with curl tests" -ForegroundColor White
Write-Host "4. Check GitHub Actions workflow status" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Backup branch: origin/$BackupName" -ForegroundColor Yellow
Write-Host "🏷️ Stable tag: origin/$TagName" -ForegroundColor Yellow
Write-Host "📍 Main now points to: $CommitHash" -ForegroundColor Yellow

