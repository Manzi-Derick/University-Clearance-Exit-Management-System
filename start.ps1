# UniClear - Automatic Startup Script
# This script starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UniClear Application Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Write-Host "Backend will run on http://localhost:5000" -ForegroundColor Cyan

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$PSScriptRoot\backend'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Backend Server' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
npm run dev
"@ -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Write-Host "Frontend will run on http://localhost:5173" -ForegroundColor Cyan

# Start frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$PSScriptRoot\frontend'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Frontend Server' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
npm run dev
"@ -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servers Starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Yellow
Write-Host ""

# Wait for servers to initialize
Start-Sleep -Seconds 5

# Open browser
Start-Process "http://localhost:5173"

Write-Host "Done! Check the two new terminal windows for server status." -ForegroundColor Green
Write-Host ""
pause
