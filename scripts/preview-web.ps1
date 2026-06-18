# Windows web preview - opens app in browser at phone screen size
# Backend: run `cd backend && npm run dev` in another terminal

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

Write-Host "Building CSS..." -ForegroundColor Cyan
node scripts/prebuild-css.mjs

Write-Host ""
Write-Host "Starting web preview at http://localhost:8081" -ForegroundColor Green
Write-Host "Phone-sized frame will appear in your browser." -ForegroundColor Gray
Write-Host ""
Write-Host "Also start the backend in another terminal:" -ForegroundColor Yellow
Write-Host "  cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""

$env:EXPO_WEB_PREVIEW = "1"
$env:BROWSERSLIST_IGNORE_OLD_DATA = "1"
npx expo start --web --port 8081
