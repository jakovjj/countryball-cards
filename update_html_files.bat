@echo off
echo 🔄 Updating HTML files to use new email backend...

REM Create timestamp for backups
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "timestamp=%YYYY%%MM%%DD%"

REM Files to backup
set files=index.html packages.html join.html rules.html printandplay.html

echo 📋 Creating backups...
for %%f in (%files%) do (
    if exist "%%f" (
        copy "%%f" "%%f.backup.%timestamp%" >nul
        echo    ✓ Backed up: %%f
    )
)

echo.
echo ✨ Files ready for update! Here's what needs to be done:
echo.
echo 1. Replace EmailJS scripts with custom email-collector.js
echo 2. Update form handlers to use new backend API  
echo 3. Maintain all existing functionality and analytics
echo.
echo 🔧 Next steps:
echo 1. Install backend dependencies: cd backend ^&^& composer install
echo 2. Run setup: php backend/install.php
echo 3. Configure Google Mail API: php backend/google_auth_setup.php
echo 4. Test the system with your forms
echo.
echo 📁 Backup files created with .backup.%timestamp% extension
pause
