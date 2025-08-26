@echo off
REM Netlify Build Script for Reaper Market (Windows)
REM This script handles dependency installation and building more reliably

echo 🚀 Starting Netlify build process...

REM Set npm configuration for better reliability
set NPM_CONFIG_CACHE=.npm-cache
set NPM_CONFIG_PREFER_OFFLINE=true
set NPM_CONFIG_NO_OPTIONAL=true
set NPM_CONFIG_AUDIT=false
set NPM_CONFIG_FUND=false

REM Create npm cache directory
if not exist .npm-cache mkdir .npm-cache

echo 📦 Installing root dependencies...
call npm ci --prefer-offline --no-optional --cache .npm-cache

echo 📦 Installing client dependencies...
cd client
call npm ci --prefer-offline --no-optional --cache ..\.npm-cache

echo 🔨 Building client application...
call npm run build

echo ✅ Build completed successfully!
echo 📁 Build output: client/dist
