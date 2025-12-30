@echo off
REM Portfolio Deployment Script
REM This script will help you deploy your portfolio to GitHub Pages

echo ============================================
echo   PORTFOLIO DEPLOYMENT HELPER
echo ============================================
echo.

REM Find Brave browser
set "BRAVE="
if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set "BRAVE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
) else if exist "%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set "BRAVE=%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe"
) else if exist "%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set "BRAVE=%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"
)

if not defined BRAVE (
    echo Warning: Brave browser not found in standard locations.
    echo Using default browser instead...
    set "BRAVE=start"
) else (
    echo Using Brave browser...
    set "BRAVE="%BRAVE%""
)

REM Step 1: Using existing repository
echo.
echo [STEP 1] Using your existing Portfolio repository...
echo Repository: https://github.com/Tanvir284/Portfolio
echo.
echo Opening repository in Brave browser...
timeout /t 2 /nobreak >nul
%BRAVE% https://github.com/Tanvir284/Portfolio

echo.
echo [INFO] Ready to upload your portfolio files
echo Press ANY KEY to continue...
pause >nul

echo.
echo ============================================
echo [STEP 2] Connecting to GitHub and Uploading...
echo ============================================
echo.

REM Navigate to portfolio directory
cd /d "%~dp0"

REM Add remote
echo Adding GitHub repository...
git remote add origin https://github.com/Tanvir284/Portfolio.git 2>nul
if errorlevel 1 (
    echo Remote already exists, updating...
    git remote set-url origin https://github.com/Tanvir284/Portfolio.git
)

echo.
echo Pushing to GitHub...
echo NOTE: A browser window will open for authentication
echo       Login with your GitHub account and authorize
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ============================================
    echo   ERROR: Push failed!
    echo ============================================
    echo.
    echo This usually means you need to authenticate.
    echo Try running this command manually:
    echo.
    echo   git push -u origin main
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   SUCCESS! Files uploaded to GitHub!
echo ============================================
echo.
echo [STEP 3] Enabling GitHub Pages...
echo Opening repository settings in Brave...
timeout /t 2 /nobreak >nul
%BRAVE% https://github.com/Tanvir284/Portfolio/settings/pages

echo.
echo INSTRUCTIONS:
echo 1. On the GitHub Pages settings page
echo 2. Under "Source", select "main" branch
echo 3. Click "Save"
echo 4. Wait 1-2 minutes
echo.
echo Your site will be live at:
echo   https://tanvir284.github.io/Portfolio
echo.
echo ============================================
echo   DEPLOYMENT COMPLETE!
echo ============================================
echo.
pause
