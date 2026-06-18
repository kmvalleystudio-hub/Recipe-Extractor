# Windows Gradle workaround + Android build helper
# Fixes "Could not move temporary workspace" AccessDenied errors on Windows
# Sets up adb reverse so physical phones can reach Metro on localhost:8081

param(
    [switch]$SkipDevServer
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$AndroidDir = Join-Path $ProjectRoot "android"
$AccessorsDir = Join-Path $AndroidDir ".gradle\8.10.2\dependencies-accessors"
$ImmutableName = "569c8b261a8a714d7731d5f568e0e5c05babae10"
$MetroPort = 8081

function Fix-GradleAccessors {
    if (-not (Test-Path $AccessorsDir)) { return }

    $immutable = Join-Path $AccessorsDir $ImmutableName
    if (Test-Path $immutable) { return }

    $temp = Get-ChildItem $AccessorsDir -Directory |
        Where-Object { $_.Name -like "$ImmutableName-*" } |
        Select-Object -First 1

    if ($temp) {
        Write-Host "Applying Gradle cache workaround (robocopy)..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Force -Path $immutable | Out-Null
        robocopy $temp.FullName $immutable /E /MOVE /NFL /NDL /NJH /NJS | Out-Null
    }
}

function Setup-AdbReverse {
    $adb = Get-Command adb -ErrorAction SilentlyContinue
    if (-not $adb) {
        Write-Host "adb not found in PATH - skip USB port forwarding." -ForegroundColor Yellow
        Write-Host "Add Android SDK platform-tools to PATH, or set Debug server host to your PC IP in Dev Menu." -ForegroundColor Yellow
        return
    }

    $devices = & adb devices 2>&1 | Select-String "device$"
    if ($devices.Count -eq 0) {
        Write-Host "No USB device detected - skip adb reverse." -ForegroundColor Yellow
        return
    }

    & adb reverse "tcp:$MetroPort" "tcp:$MetroPort" 2>&1 | Out-Null
    Write-Host "adb reverse tcp:$MetroPort tcp:$MetroPort (phone localhost -> PC Metro)" -ForegroundColor Green
}

if (-not (Test-Path (Join-Path $ProjectRoot "assets\adaptive-icon.png"))) {
    node (Join-Path $ProjectRoot "scripts\create-assets.mjs")
}

Write-Host "Preparing Gradle cache..." -ForegroundColor Cyan
Push-Location $AndroidDir
& .\gradlew.bat --no-daemon help 2>&1 | Out-Null
Pop-Location
Fix-GradleAccessors

Setup-AdbReverse

Push-Location $ProjectRoot
Write-Host ""
Write-Host "Building and launching on Android (Metro port $MetroPort)..." -ForegroundColor Cyan
Write-Host "Keep this terminal open while testing. Metro serves the JS bundle." -ForegroundColor Cyan
Write-Host ""

if ($SkipDevServer) {
    npx expo run:android --no-bundler --port $MetroPort
} else {
    npx expo run:android --port $MetroPort
}
exit $LASTEXITCODE
