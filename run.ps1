# ==========================================================
# Echo Knowledge-Risk Engine - Windows PowerShell Launcher
# ==========================================================
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "=== Starting Echo Prototype (PURECODERS) ===" -ForegroundColor Cyan

# 1. Verify Python interpreter
$pyCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pyCmd) {
    Write-Host "[ERROR] Python was not found in PATH." -ForegroundColor Red
    exit 1
}

$pyVersion = (& python --version 2>&1)
Write-Host "[INFO] Detected Python: $pyVersion" -ForegroundColor Gray

# 2. Start FastAPI Backend in separate terminal window
Write-Host "[1/2] Launching FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$Root\backend'; Write-Host '=== Echo Backend (FastAPI) ===' -ForegroundColor Cyan; Write-Host 'Running at: http://localhost:8000' -ForegroundColor Green; Write-Host 'API Docs:   http://localhost:8000/docs' -ForegroundColor Yellow; python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

# 3. Start React + Vite Frontend in separate terminal window
Write-Host "[2/2] Launching Vite Frontend on http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$Root\frontend'; Write-Host '=== Echo Frontend (Vite + React) ===' -ForegroundColor Cyan; Write-Host 'Running at: http://localhost:3000' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Echo servers launched successfully!" -ForegroundColor Green
Write-Host " -> Frontend UI:  http://localhost:3000" -ForegroundColor Yellow
Write-Host " -> Backend API:  http://localhost:8000" -ForegroundColor Yellow
Write-Host " -> Swagger Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Green
