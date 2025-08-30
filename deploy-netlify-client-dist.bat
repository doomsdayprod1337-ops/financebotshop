@echo off
echo ========================================
echo Finance Shop Bot - Netlify Deployment
echo Publish Directory: client/dist
echo ========================================
echo.

echo Step 1: Installing root dependencies...
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
echo Step 4: Verifying build output...
if not exist "dist" (
    echo Error: Build output directory 'dist' not found!
    echo Expected location: client/dist
    pause
    exit /b 1
)

echo Build output verified: client/dist exists
echo.

cd ..

echo Step 5: Build completed successfully!
echo.
echo ========================================
echo DEPLOYMENT READY!
echo ========================================
echo.
echo Next steps to deploy on Netlify:
echo.
echo 1. Go to https://netlify.com
echo 2. Click "New site from Git"
echo 3. Connect your repository
echo 4. Configure build settings:
echo    - Build command: npm run build:netlify:simple
echo    - Publish directory: client/dist  [IMPORTANT!]
echo    - Functions directory: api
echo 5. Click "Deploy site"
echo 6. Set environment variables:
echo    - SUPABASE_URL
echo    - SUPABASE_ANON_KEY
echo    - JWT_SECRET
echo    - FRONTEND_URL
echo.
echo Your project is built and ready for deployment!
echo Publish directory: client/dist
echo.
pause
