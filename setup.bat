@echo off
echo ========================================
echo Buddy_to_study - Quick Setup Script
echo ========================================
echo.

echo [1/3] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Server installation failed!
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Client installation failed!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Installing root dependencies...
call npm install

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Before running the app, you need to:
echo 1. Edit server\.env and add your MongoDB URI
echo 2. Edit server\.env and set a secure JWT_SECRET
echo.
echo Then run: npm run dev
echo.
pause
