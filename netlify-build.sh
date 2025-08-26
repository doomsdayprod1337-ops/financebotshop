#!/bin/bash

# Netlify Build Script for Reaper Market
# This script handles dependency installation and building more reliably

set -e

echo "🚀 Starting Netlify build process..."

# Set npm configuration for better reliability
export NPM_CONFIG_CACHE=".npm-cache"
export NPM_CONFIG_PREFER_OFFLINE="true"
export NPM_CONFIG_NO_OPTIONAL="true"
export NPM_CONFIG_AUDIT="false"
export NPM_CONFIG_FUND="false"

# Create npm cache directory
mkdir -p .npm-cache

echo "📦 Installing root dependencies..."
npm ci --prefer-offline --no-optional --cache .npm-cache

echo "📦 Installing client dependencies..."
cd client
npm ci --prefer-offline --no-optional --cache ../.npm-cache

echo "🔨 Building client application..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output: client/dist"
