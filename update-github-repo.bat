@echo off
echo ========================================
echo Finance Shop Bot - GitHub Update
echo ========================================
echo.

echo Step 1: Checking git status...
git status
if %errorlevel% neq 0 (
    echo Error: Git not initialized or not a git repository
    echo Please run: git init
    pause
    exit /b 1
)

echo.
echo Step 2: Adding all files to git...
git add .
if %errorlevel% neq 0 (
    echo Error: Failed to add files to git
    pause
    exit /b 1
)

echo.
echo Step 3: Checking what will be committed...
git status --porcelain
echo.

echo Step 4: Enter commit message:
set /p commit_message="Commit message (or press Enter for default): "

if "%commit_message%"=="" (
    set commit_message="Update Finance Shop Bot - Ready for Netlify deployment"
)

echo.
echo Step 5: Committing changes...
git commit -m %commit_message%
if %errorlevel% neq 0 (
    echo Error: Failed to commit changes
    pause
    exit /b 1
)

echo.
echo Step 6: Checking remote origin...
git remote -v
if %errorlevel% neq 0 (
    echo Error: No remote origin found
    echo Please add your GitHub repository as origin
    pause
    exit /b 1
)

echo.
echo Step 7: Pushing to GitHub...
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
echo GITHUB UPDATE COMPLETED!
echo ========================================
echo.
echo Your changes have been pushed to GitHub!
echo.
echo Next steps:
echo 1. Go to https://netlify.com
echo 2. Deploy your site from the updated repository
echo 3. Or run deploy-netlify-client-dist.bat first
echo.
echo Repository updated successfully!
pause
