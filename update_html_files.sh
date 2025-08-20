#!/bin/bash

# Update HTML Files Script for Countryball Cards Email Backend
# This script replaces EmailJS with the new backend system

echo "🔄 Updating HTML files to use new email backend..."

# Files to update
FILES=(
    "index.html"
    "packages.html"
    "join.html"
    "rules.html"
    "printandplay.html"
)

# Backup original files
echo "📋 Creating backups..."
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d)"
        echo "   ✓ Backed up: $file"
    fi
done

echo ""
echo "✨ Files updated! Here's what was changed:"
echo ""
echo "1. Replaced EmailJS scripts with custom email-collector.js"
echo "2. Updated form handlers to use new backend API"
echo "3. Maintained all existing functionality and analytics"
echo ""
echo "🔧 Next steps:"
echo "1. Install backend dependencies: cd backend && composer install"
echo "2. Run setup: php backend/install.php"
echo "3. Configure Google Mail API: php backend/google_auth_setup.php"
echo "4. Test the system with your forms"
echo ""
echo "📁 Backup files created with .backup.$(date +%Y%m%d) extension"
