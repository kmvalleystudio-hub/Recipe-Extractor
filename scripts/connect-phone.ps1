# Connect physical Android phone to Metro via Wi-Fi IP (works when adb reverse fails).
# Usage: npm run connect:phone
# Requires: Metro running (npm start), phone on same Wi-Fi as PC

$ErrorActionPreference = "Stop"
$Package = "com.yourcompany.recipeextractor"
$MetroPort = 8081

# adb writes progress to stderr even on success - avoid PowerShell treating it as fatal
function Invoke-Adb {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$AdbArgs)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & adb @AdbArgs 2>&1 | Out-Null
    $ErrorActionPreference = $prev
}

# Find PC LAN IP (same network as phone)
$ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*" -and
        $_.PrefixOrigin -ne "WellKnown"
    } |
    Sort-Object -Property InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
    Write-Host "Could not detect LAN IP. Run ipconfig and set IP manually." -ForegroundColor Red
    exit 1
}

$hostPort = "${ip}:${MetroPort}"
Write-Host "Using Metro host: $hostPort" -ForegroundColor Cyan

$adb = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adb) {
    Write-Host "adb not found. Add Android SDK platform-tools to PATH." -ForegroundColor Red
    exit 1
}

# Restart adb if it is stuck (common on Windows)
Invoke-Adb kill-server
Start-Sleep -Seconds 1
Invoke-Adb start-server

$devices = & adb devices 2>&1 | Select-String "device$"
if ($devices.Count -eq 0) {
    Write-Host "No phone connected via USB. Enable USB debugging and reconnect." -ForegroundColor Red
    exit 1
}

# Try adb reverse anyway (helps some devices)
Invoke-Adb reverse "tcp:${MetroPort}" "tcp:${MetroPort}"

# Set debug server host in app preferences (fixes Huawei/Honor where adb reverse fails)
$prefFile = "${Package}_preferences.xml"
$xml = @"
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <string name="debug_http_host">$hostPort</string>
</map>
"@

$tempFile = Join-Path $env:TEMP "rn_debug_prefs.xml"
Set-Content -Path $tempFile -Value $xml -Encoding UTF8 -NoNewline

Write-Host "Setting debug server host on phone..." -ForegroundColor Yellow
Invoke-Adb push $tempFile "/sdcard/$prefFile"
Invoke-Adb shell "run-as $Package cp /sdcard/$prefFile shared_prefs/$prefFile"
Invoke-Adb shell "rm /sdcard/$prefFile"

Remove-Item $tempFile -Force -ErrorAction SilentlyContinue

Write-Host "Restarting app..." -ForegroundColor Yellow
Invoke-Adb shell am force-stop $Package
Start-Sleep -Seconds 1
Invoke-Adb shell am start -n "$Package/.MainActivity"

Write-Host ""
Write-Host "[OK] Phone configured to use Metro at $hostPort" -ForegroundColor Green
Write-Host ""
Write-Host "Make sure Metro is running: npm start" -ForegroundColor White
Write-Host "Phone and PC must be on the same Wi-Fi network." -ForegroundColor White
Write-Host ""
Write-Host "If it still fails, allow Node.js through Windows Firewall." -ForegroundColor Yellow
