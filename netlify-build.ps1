# Netlify Build Script for Reaper Market (PowerShell)
# This script handles dependency installation and building more reliably

Write-Host "🚀 Starting Netlify build process..." -ForegroundColor Green

# Set npm configuration for better reliability
$env:NPM_CONFIG_CACHE = ".npm-cache"
$env:NPM_CONFIG_PREFER_OFFLINE = "true"
$env:NPM_CONFIG_NO_OPTIONAL = "true"
$env:NPM_CONFIG_AUDIT = "false"
$env:NPM_CONFIG_FUND = "false"
$env:NPM_CONFIG_PROGRESS = "false"
$env:NPM_CONFIG_LOGLVEL = "error"

# Create npm cache directory
if (!(Test-Path ".npm-cache")) {
    New-Item -ItemType Directory -Path ".npm-cache" | Out-Null
}

Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
$rootInstall = npm ci --prefer-offline --no-optional --cache .npm-cache --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
Set-Location "client"
$clientInstall = npm ci --prefer-offline --no-optional --cache ..\.npm-cache --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install client dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Building client application..." -ForegroundColor Yellow
$build = npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build client application" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "📁 Build output: client/dist" -ForegroundColor Cyan

# Return to root directory
Set-Location ".."

exit 0
