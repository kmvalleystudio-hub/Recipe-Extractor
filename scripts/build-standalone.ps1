# Build standalone release APK (JS bundled inside, no Metro needed at runtime).
# Usage: npm run android:standalone

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$AndroidDir = Join-Path $ProjectRoot "android"
$AccessorsDir = Join-Path $AndroidDir ".gradle\8.10.2\dependencies-accessors"
$ImmutableName = "569c8b261a8a714d7731d5f568e0e5c05babae10"

function Fix-GradleAccessors {
    if (-not (Test-Path $AccessorsDir)) { return }
    $immutable = Join-Path $AccessorsDir $ImmutableName
    if (Test-Path $immutable) { return }
    $temp = Get-ChildItem $AccessorsDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "$ImmutableName-*" } | Select-Object -First 1
    if ($temp) {
        New-Item -ItemType Directory -Force -Path $immutable | Out-Null
        robocopy $temp.FullName $immutable /E /MOVE /NFL /NDL /NJH /NJS | Out-Null
    }
}

if (-not (Test-Path (Join-Path $ProjectRoot "assets\adaptive-icon.png"))) {
    node (Join-Path $ProjectRoot "scripts\create-assets.mjs")
}

Write-Host "Building standalone release APK (no Metro required)..." -ForegroundColor Cyan
Write-Host "This may take several minutes." -ForegroundColor Gray
Write-Host ""

Push-Location $AndroidDir
& .\gradlew.bat --no-daemon help 2>&1 | Out-Null
Fix-GradleAccessors
Pop-Location

if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = "C:\Users\admin\AppData\Local\Android\Sdk"
}

Push-Location $ProjectRoot
$env:CI = "1"
npx expo run:android --variant release --no-bundler

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[OK] Standalone app installed. Open Recipe Extractor on your phone." -ForegroundColor Green
Write-Host "No Metro needed. Re-run this command after JS code changes." -ForegroundColor Gray
