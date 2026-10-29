@echo off
setlocal
cd /d "%~dp0"

echo =========================================================================
echo   Starting DNDSheet 5e Monster Maker (Release Candidate)
echo =========================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js was not found in your system PATH.
    echo Please install Node.js from https://nodejs.org or run with your local environment.
    echo.
    pause
    exit /b 1
)

node server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Server terminated. Press any key to close this window.
    pause
)
