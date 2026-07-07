@echo off
REM UniClear - Automatic Startup Script (Batch version)
REM This script starts both backend and frontend servers

echo ========================================
echo   UniClear Application Startup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo √ Node.js detected
echo.
echo Starting Backend Server...
echo Backend will run on http://localhost:5000
echo.

REM Start backend in a new window
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
echo Frontend will run on http://localhost:5173
echo.

REM Start frontend in a new window
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Opening browser in 5 seconds...
echo.

REM Wait for servers to initialize
timeout /t 5 /nobreak >nul

REM Open browser
start http://localhost:5173

echo.
echo Done! Check the two new terminal windows for server status.
echo.
pause
