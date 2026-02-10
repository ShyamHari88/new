@echo off
echo Check for Git installation...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/download/win
    echo After installing, close and reopen this terminal, then run this script again.
    pause
    exit /b
)

echo Git found! Proceeding with repository setup...

:: Initialize git repository
if not exist .git (
    echo Initializing new Git repository...
    git init
) else (
    echo Git repository already initialized.
)

:: Add all files
echo Adding files to staging...
git add .

:: Commit changes
echo Committing changes...
git commit -m "Separate frontend and backend architecture"

:: create main branch
git branch -M main

:: Add remote origin
echo Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/ShyamHari88/new.git

:: Push to GitHub
echo Pushing to GitHub...
echo You may be asked to sign in to GitHub in a browser window.
git push -u origin main

echo Done!
pause
