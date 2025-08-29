@echo off
title AI Dope Checker - Quick Start

echo.
echo ============================================
echo      AI Dope Checker - Quick Start
echo ============================================
echo.

echo Starting AI Dope Checker application...
echo.

REM Check if setup has been completed
if not exist "backend\.env" (
    echo ❌ Backend not configured. Please run setup first:
    echo    1. Navigate to backend folder: cd backend
    echo    2. Run setup script: .\setup.bat
    echo    3. Configure your .env file with Gemini API key
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "backend\node_modules" (
    echo ❌ Backend dependencies not installed. Please run:
    echo    1. cd backend
    echo    2. npm install
    echo.
    pause
    exit /b 1
)

REM Check if MongoDB is running
echo Checking MongoDB connection...
mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Warning: MongoDB is not running or not accessible
    echo Please start MongoDB service before continuing.
    echo.
    echo Press any key to continue anyway (backend might fail to start)...
    pause >nul
    echo.
)

echo ✅ Starting backend server...
cd backend
start "AI Dope Checker Backend" cmd /k "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo ✅ Opening frontend application...
cd ..\frontend

REM Try to use live-server if available, otherwise use Python or default browser
where live-server >nul 2>&1
if %errorlevel% equ 0 (
    echo Using live-server...
    start "AI Dope Checker Frontend" cmd /k "live-server --port=3000 --open=index.html"
) else (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        echo Using Python HTTP server...
        start "AI Dope Checker Frontend" cmd /k "python -m http.server 3000 && start http://localhost:3000"
    ) else (
        echo Opening directly in default browser...
        start index.html
    )
)

echo.
echo 🎉 AI Dope Checker is starting up!
echo.
echo Services:
echo   📱 Frontend: http://localhost:3000 (or file:// if no server)
echo   ⚙️  Backend API: http://localhost:5000
echo   🏥 Health Check: http://localhost:5000/health
echo.
echo ⚠️ Make sure you have:
echo   ✅ MongoDB running
echo   ✅ Gemini API key configured in backend\.env
echo   ✅ Internet connection for AI analysis
echo.
echo Press any key to close this window...
pause >nul
