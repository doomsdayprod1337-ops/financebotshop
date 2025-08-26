@echo off
setlocal enabledelayedexpansion

REM Netlify Build Script for Reaper Market (Windows)
REM This script handles dependency installation and building more reliably

echo 🚀 Starting Netlify build process...

REM Set npm configuration for better reliability
set NPM_CONFIG_CACHE=.npm-cache
set NPM_CONFIG_PREFER_OFFLINE=true
set NPM_CONFIG_NO_OPTIONAL=true
set NPM_CONFIG_AUDIT=false
set NPM_CONFIG_FUND=false
set NPM_CONFIG_PROGRESS=false
set NPM_CONFIG_LOGLVEL=error

REM Create npm cache directory
if not exist .npm-cache mkdir .npm-cache

echo 📦 Installing root dependencies...
call npm ci --prefer-offline --no-optional --cache .npm-cache --no-audit --no-fund
if errorlevel 1 (
    echo ❌ Failed to install root dependencies
    exit /b 1
)

echo 📦 Installing client dependencies...
cd client
call npm ci --prefer-offline --no-optional --cache ..\.npm-cache --no-audit --no-fund
if errorlevel 1 (
    echo ❌ Failed to install client dependencies
    exit /b 1
)

echo 🔨 Building client application...
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build client application
    exit /b 1
)

echo ✅ Build completed successfully!
echo 📁 Build output: client/dist

REM Return to root directory
cd ..

exit /b 0
