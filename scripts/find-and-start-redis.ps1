# Find and Start Redis Script

Write-Host "`n🔍 Searching for Redis installation...`n" -ForegroundColor Cyan

# Check common installation paths
$searchPaths = @(
    "C:\Redis",
    "C:\Program Files\Redis",
    "C:\Program Files (x86)\Redis",
    "$env:LOCALAPPDATA\Programs\Redis",
    "$env:ProgramFiles\Redis",
    "$env:ProgramFiles(x86)\Redis",
    "$env:USERPROFILE\Redis",
    "$env:USERPROFILE\AppData\Local\Programs\Redis"
)

$found = $false

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        Write-Host "✅ Found Redis directory: $path" -ForegroundColor Green
        
        # Look for redis-server.exe
        $serverExe = Get-ChildItem -Path $path -Filter "redis-server.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        
        if ($serverExe) {
            Write-Host "   Found redis-server.exe at: $($serverExe.FullName)" -ForegroundColor Cyan
            Write-Host "`n🚀 Starting Redis...`n" -ForegroundColor Yellow
            
            # Start Redis server
            Start-Process -FilePath $serverExe.FullName -WindowStyle Minimized
            
            Start-Sleep -Seconds 3
            
            # Test connection
            $test = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
            
            if ($test) {
                Write-Host "✅ Redis is now running on port 6379!" -ForegroundColor Green
                $found = $true
                break
            } else {
                Write-Host "⚠️  Redis started but not responding on port 6379" -ForegroundColor Yellow
            }
        }
    }
}

if (-not $found) {
    Write-Host "`n❌ Could not find Redis installation automatically.`n" -ForegroundColor Red
    Write-Host "💡 Manual steps:" -ForegroundColor Yellow
    Write-Host "   1. Find where you installed Redis"
    Write-Host "   2. Look for redis-server.exe"
    Write-Host "   3. Run it manually or create a shortcut"
    Write-Host "`n   Or install Memurai (Windows Redis):"
    Write-Host "   https://www.memurai.com/get-memurai`n"
}

# Final check
Start-Sleep -Seconds 2
$finalCheck = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($finalCheck) {
    Write-Host "`n✅ SUCCESS! Redis is running and accessible!`n" -ForegroundColor Green
    Write-Host "Your application will now connect to Redis automatically.`n" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Redis is not accessible on port 6379`n" -ForegroundColor Yellow
    Write-Host "The app will work without Redis, but some features won't be available.`n"
}

