@echo off
echo Setting up AI Dope Checker Backend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

REM Check if MongoDB is running
echo Checking MongoDB connection...
mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Warning: MongoDB is not running or not accessible
    echo Please start MongoDB service or install MongoDB
    echo You can install MongoDB Community Server from: https://www.mongodb.com/try/download/community
    echo.
    echo Would you like to continue anyway? (y/n)
    set /p continue=
    if /i not "%continue%"=="y" (
        echo Setup cancelled.
        pause
        exit /b 1
    )
) else (
    echo ✅ MongoDB is accessible
)
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

REM Copy environment file if it doesn't exist
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env >nul
    echo ✅ .env file created
    echo.
    echo ⚠️ IMPORTANT: Please edit the .env file and add your Gemini API key:
    echo    1. Get your API key from: https://makersuite.google.com/app/apikey
    echo    2. Replace 'your_gemini_api_key_here' with your actual API key
    echo    3. Optionally update MongoDB URI if using a different database
    echo.
) else (
    echo ✅ .env file already exists
    echo.
)

REM Check if .env has been configured
findstr /c:"your_gemini_api_key_here" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ WARNING: Gemini API key is not configured in .env file
    echo Please edit .env file and add your actual Gemini API key
    echo.
    echo Would you like to open .env file for editing? (y/n)
    set /p openenv=
    if /i "%openenv%"=="y" (
        notepad .env
    )
    echo.
)

REM Ask if user wants to seed the database
echo Would you like to seed the WADA database with sample substances? (y/n)
echo (Recommended for first-time setup)
set /p seeddb=
if /i "%seeddb%"=="y" (
    echo Seeding WADA database...
    call npm run seed
    if %errorlevel% equ 0 (
        echo ✅ Database seeded successfully
    ) else (
        echo ⚠️ Warning: Database seeding failed. You can run 'npm run seed' manually later.
    )
    echo.
)

echo.
echo 🎉 Setup completed!
echo.
echo Next steps:
echo   1. Make sure your .env file has the correct Gemini API key
echo   2. Start the development server: npm run dev
echo   3. The API will be available at: http://localhost:5000
echo   4. Health check endpoint: http://localhost:5000/health
echo.
echo Useful commands:
echo   npm run dev     - Start development server with auto-reload
echo   npm start       - Start production server
echo   npm run seed    - Seed WADA database with sample data
echo   npm test        - Run tests
echo.
echo For more information, see README.md
echo.
pause
