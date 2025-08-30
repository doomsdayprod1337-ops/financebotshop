@echo off
echo ========================================
echo Finance Shop Bot - Complete Deployment
echo GitHub Update + Netlify Deploy
echo ========================================
echo.

echo This script will:
echo 1. Update your GitHub repository
echo 2. Build your project
echo 3. Prepare for Netlify deployment
echo.

set /p continue="Continue? (Y/N): "
if /i "%continue%" neq "Y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo STEP 1: UPDATING GITHUB REPOSITORY
echo ========================================
echo.

echo Checking git status...
git status
if %errorlevel% neq 0 (
    echo Error: Git not initialized or not a git repository
    echo Please run: git init
    pause
    exit /b 1
)

echo.
echo Adding all files to git...
git add .
if %errorlevel% neq 0 (
    echo Error: Failed to add files to git
    pause
    exit /b 1
)

echo.
echo Checking what will be committed...
git status --porcelain
echo.

echo Enter commit message:
set /p commit_message="Commit message (or press Enter for default): "

if "%commit_message%"=="" (
    set commit_message="Update Finance Shop Bot - Ready for Netlify deployment"
)

echo.
echo Committing changes...
git commit -m %commit_message%
if %errorlevel% neq 0 (
    echo Error: Failed to commit changes
    pause
    exit /b 1
)

echo.
echo Checking remote origin...
git remote -v
if %errorlevel% neq 0 (
    echo Error: No remote origin found
    echo Please add your GitHub repository as origin
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo Trying to push to master branch...
    git push origin master
    if %errorlevel% neq 0 (
        echo Error: Failed to push to GitHub
        echo Please check your remote configuration
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo STEP 2: BUILDING PROJECT
echo ========================================
echo.

echo Installing root dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Error: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Installing client dependencies...
cd client
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Error: Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Verifying build output...
if not exist "dist" (
    echo Error: Build output directory 'dist' not found!
    echo Expected location: client/dist
    pause
    exit /b 1
)

echo Build output verified: client/dist exists
echo.

cd ..

echo.
echo ========================================
echo DEPLOYMENT READY!
echo ========================================
echo.
echo ✅ GitHub repository updated
echo ✅ Project built successfully
echo ✅ Build output verified
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
echo Your project is ready for deployment!
echo Publish directory: client/dist
echo.
echo ========================================
echo SUMMARY
echo ========================================
echo.
echo What was accomplished:
echo - GitHub repository updated with latest changes
echo - Project dependencies installed
echo - Project built successfully
echo - Build output verified in client/dist
echo - Ready for Netlify deployment
echo.
echo Next: Deploy to Netlify using the steps above
echo.
pause
