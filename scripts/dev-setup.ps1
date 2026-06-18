# Start all dev services with correct order for physical Android phone (USB).
# Run from project root: npm run dev:all

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent

Write-Host "=== Recipe Extractor - Dev Setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Kill stale backend on port 3001 if needed
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($port3001) {
    Write-Host "Port 3001 in use - stopping old backend process..." -ForegroundColor Yellow
    $port3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

# 2. adb reverse for USB phone
$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($adb) {
    $devices = & adb devices 2>&1 | Select-String "device$"
    if ($devices.Count -gt 0) {
        & adb reverse tcp:8081 tcp:8081 2>&1 | Out-Null
        Write-Host "[OK] adb reverse tcp:8081 tcp:8081" -ForegroundColor Green
    } else {
        Write-Host "[!!] No phone detected via USB. Connect phone and enable USB debugging." -ForegroundColor Yellow
    }
} else {
    Write-Host "[!!] adb not in PATH. Install Android SDK platform-tools." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps - open TWO more terminals:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal A (backend):" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal B (Metro):" -ForegroundColor White
Write-Host "    npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal C (connect phone to Metro - run after Metro starts):" -ForegroundColor White
Write-Host "    npm run connect:phone" -ForegroundColor Gray
Write-Host ""
Write-Host "  OR build standalone (no Metro needed):" -ForegroundColor White
Write-Host "    npm run android:standalone" -ForegroundColor Gray
Write-Host ""
Write-Host "  On your phone:" -ForegroundColor White
Write-Host "    App should open automatically after connect:phone" -ForegroundColor Gray
Write-Host ""
