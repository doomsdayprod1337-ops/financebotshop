# Finance Shop Bot - Netlify Deployment Script
# Run this script in PowerShell as Administrator if needed

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Finance Shop Bot - Netlify Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "Step 1: Installing root dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install root dependencies"
    }

    Write-Host "Step 2: Installing client dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install client dependencies"
    }

    Write-Host "Step 3: Building the project..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }

    Set-Location ..

    Write-Host ""
    Write-Host "Step 4: Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Go to https://netlify.com" -ForegroundColor White
    Write-Host "2. Click 'New site from Git'" -ForegroundColor White
    Write-Host "3. Connect your repository" -ForegroundColor White
    Write-Host "4. Set build command: npm run build:netlify:simple" -ForegroundColor White
    Write-Host "5. Set publish directory: client/dist" -ForegroundColor White
    Write-Host "6. Set functions directory: api" -ForegroundColor White
    Write-Host "7. Add environment variables:" -ForegroundColor White
    Write-Host "   - SUPABASE_URL" -ForegroundColor White
    Write-Host "   - SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host "   - JWT_SECRET" -ForegroundColor White
    Write-Host "   - FRONTEND_URL" -ForegroundColor White
    Write-Host ""
    Write-Host "Your project is ready for deployment!" -ForegroundColor Green

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Deployment failed. Please check the error and try again." -ForegroundColor Red
} finally {
    Read-Host "Press Enter to continue..."
}
