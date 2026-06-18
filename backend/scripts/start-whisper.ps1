# Start local Whisper API (OpenAI-compatible) on http://localhost:8000
# Requires Python 3.11 or 3.12 on PATH (py launcher recommended on Windows)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$WhisperDir = Join-Path $Root "backend\whisper-server"
$VenvDir = Join-Path $WhisperDir ".venv"

function Find-Python {
    foreach ($cmd in @("py -3.12", "py -3.11", "py -3", "python")) {
        try {
            $ver = Invoke-Expression "$cmd --version 2>&1"
            if ($LASTEXITCODE -eq 0 -or $ver -match "Python") {
                return $cmd
            }
        } catch { }
    }
    return $null
}

$python = Find-Python
if (-not $python) {
    Write-Host "Python not found. Install Python 3.12 from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

Write-Host "Using: $python" -ForegroundColor Cyan

if (-not (Test-Path $VenvDir)) {
    Write-Host "Creating virtual environment…" -ForegroundColor Yellow
    Invoke-Expression "$python -m venv `"$VenvDir`""
}

$pip = Join-Path $VenvDir "Scripts\pip.exe"
$pythonExe = Join-Path $VenvDir "Scripts\python.exe"

Write-Host "Installing dependencies (first run may take a few minutes)…" -ForegroundColor Yellow
& $pip install -q -r (Join-Path $WhisperDir "requirements.txt")

Write-Host ""
Write-Host "Starting Whisper on http://localhost:8000" -ForegroundColor Green
Write-Host "  Health:  http://localhost:8000/health" -ForegroundColor Gray
Write-Host "  API:     http://localhost:8000/v1/audio/transcriptions" -ForegroundColor Gray
Write-Host ""
Write-Host "Keep this terminal open. In another terminal run: cd backend && npm run dev" -ForegroundColor Yellow
Write-Host ""

$env:WHISPER_MODEL_SIZE = if ($env:WHISPER_MODEL_SIZE) { $env:WHISPER_MODEL_SIZE } else { "small" }
$env:WHISPER_DEVICE = "cpu"
$env:WHISPER_COMPUTE_TYPE = "int8"

Set-Location $WhisperDir
& $pythonExe server.py
