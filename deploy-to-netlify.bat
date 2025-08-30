@echo off
echo ========================================
echo Finance Shop Bot - Netlify Deployment
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Error: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Installing client dependencies...
cd client
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Error: Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Step 4: Build completed successfully!
echo.
echo Next steps:
echo 1. Go to https://netlify.com
echo 2. Click "New site from Git"
echo 3. Connect your repository
echo 4. Set build command: npm run build:netlify:simple
echo 5. Set publish directory: client/dist
echo 6. Set functions directory: api
echo 7. Add environment variables:
echo    - SUPABASE_URL
echo    - SUPABASE_ANON_KEY
echo    - JWT_SECRET
echo    - FRONTEND_URL
echo.
echo Your project is ready for deployment!
pause
