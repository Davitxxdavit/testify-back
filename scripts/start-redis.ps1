# Redis Startup Helper Script

Write-Host "🔍 Checking Redis installation..." -ForegroundColor Cyan

# Check if Redis is running on port 6379
$redisRunning = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($redisRunning) {
    Write-Host "✅ Redis is already running on port 6379!" -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  Redis is not running. Checking installation methods..." -ForegroundColor Yellow

# Check for Memurai (Windows Redis)
$memuraiService = Get-Service -Name "*memurai*" -ErrorAction SilentlyContinue
if ($memuraiService) {
    Write-Host "`n📦 Found Memurai service!" -ForegroundColor Cyan
    if ($memuraiService.Status -eq 'Running') {
        Write-Host "✅ Memurai is already running!" -ForegroundColor Green
    } else {
        Write-Host "🚀 Starting Memurai service..." -ForegroundColor Yellow
        Start-Service -Name $memuraiService.Name
        Start-Sleep -Seconds 2
        Write-Host "✅ Memurai started!" -ForegroundColor Green
    }
    exit 0
}

# Check for Redis Windows service
$redisService = Get-Service -Name "*redis*" -ErrorAction SilentlyContinue
if ($redisService) {
    Write-Host "`n📦 Found Redis service!" -ForegroundColor Cyan
    if ($redisService.Status -eq 'Running') {
        Write-Host "✅ Redis service is already running!" -ForegroundColor Green
    } else {
        Write-Host "🚀 Starting Redis service..." -ForegroundColor Yellow
        Start-Service -Name $redisService.Name
        Start-Sleep -Seconds 2
        Write-Host "✅ Redis service started!" -ForegroundColor Green
    }
    exit 0
}

# Check for Redis executable in common locations
$redisPaths = @(
    "$env:ProgramFiles\Redis\redis-server.exe",
    "$env:ProgramFiles(x86)\Redis\redis-server.exe",
    "$env:LOCALAPPDATA\Programs\Redis\redis-server.exe",
    "C:\Redis\redis-server.exe"
)

foreach ($path in $redisPaths) {
    if (Test-Path $path) {
        Write-Host "`n📦 Found Redis at: $path" -ForegroundColor Cyan
        Write-Host "🚀 Starting Redis..." -ForegroundColor Yellow
        Start-Process -FilePath $path -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "✅ Redis started!" -ForegroundColor Green
        exit 0
    }
}

Write-Host "`nCould not find Redis installation." -ForegroundColor Red
Write-Host "`nOptions to start Redis:" -ForegroundColor Yellow
Write-Host "   1. If installed via Memurai: Check Services (services.msc) and start Memurai"
Write-Host "   2. If installed manually: Run redis-server.exe from installation folder"
Write-Host "   3. If using WSL: Run 'wsl sudo service redis-server start'"
Write-Host "   4. If using Docker: Run 'docker start redis'"
Write-Host "`nSee scripts/install-redis-windows.md for installation help"

