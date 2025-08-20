# Convert PNG images to WebP for better performance
# Run this script to create WebP versions of PNG images

param(
    [string]$Quality = "80"
)

# Check if ImageMagick is available
$magick = Get-Command "magick" -ErrorAction SilentlyContinue

if (-not $magick) {
    Write-Host "ImageMagick not found. Please install ImageMagick to convert images." -ForegroundColor Red
    Write-Host "Download from: https://imagemagick.org/script/download.php#windows" -ForegroundColor Yellow
    exit 1
}

# Get all PNG files in current directory
$pngFiles = Get-ChildItem -Filter "*.png" | Where-Object { $_.Name -notlike "*-bg.png" }

if ($pngFiles.Count -eq 0) {
    Write-Host "No PNG files found to convert." -ForegroundColor Yellow
    exit 0
}

Write-Host "Converting PNG files to WebP format..." -ForegroundColor Green
Write-Host "Quality: $Quality%" -ForegroundColor Cyan

foreach ($file in $pngFiles) {
    $webpFile = $file.Name -replace "\.png$", ".webp"
    
    if (Test-Path $webpFile) {
        Write-Host "Skipping $($file.Name) - WebP version already exists" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Converting $($file.Name) to $webpFile..." -ForegroundColor Cyan
    
    try {
        & magick $file.FullName -quality $Quality $webpFile
        
        $originalSize = [math]::Round($file.Length / 1KB, 2)
        $webpSize = [math]::Round((Get-Item $webpFile).Length / 1KB, 2)
        $savings = [math]::Round((($file.Length - (Get-Item $webpFile).Length) / $file.Length) * 100, 1)
        
        Write-Host "  ✓ $($file.Name): ${originalSize}KB → ${webpSize}KB (${savings}% smaller)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Failed to convert $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nConversion complete! Don't forget to update your HTML to use WebP with PNG fallback." -ForegroundColor Green
Write-Host "Example: <picture><source srcset='image.webp' type='image/webp'><img src='image.png' alt='...'></picture>" -ForegroundColor Cyan
