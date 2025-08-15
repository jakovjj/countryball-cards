# PowerShell script to convert images to WebP format
# Requires ImageMagick to be installed

param(
    [string]$InputFolder = ".",
    [int]$Quality = 80,
    [switch]$DeleteOriginals = $false
)

# Check if ImageMagick is installed
try {
    $null = Get-Command magick -ErrorAction Stop
    Write-Host "✅ ImageMagick found" -ForegroundColor Green
} catch {
    Write-Host "❌ ImageMagick not found. Please install from: https://imagemagick.org/script/download.php" -ForegroundColor Red
    exit 1
}

# Get all image files
$imageFiles = Get-ChildItem -Path $InputFolder -Include *.png, *.jpg, *.jpeg -Recurse

if ($imageFiles.Count -eq 0) {
    Write-Host "❌ No PNG/JPG files found in $InputFolder" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Found $($imageFiles.Count) images to convert" -ForegroundColor Cyan
Write-Host "📁 Working in: $InputFolder" -ForegroundColor Cyan
Write-Host "🎛️  Quality setting: $Quality" -ForegroundColor Cyan

$converted = 0
$errors = 0

foreach ($file in $imageFiles) {
    $outputPath = Join-Path $file.Directory ($file.BaseName + ".webp")
    
    # Skip if WebP already exists
    if (Test-Path $outputPath) {
        Write-Host "⏭️  Skipping $($file.Name) (WebP exists)" -ForegroundColor Yellow
        continue
    }
    
    try {
        Write-Host "🔄 Converting: $($file.Name)" -ForegroundColor Cyan
        
        # Convert to WebP
        $result = magick convert "$($file.FullName)" -quality $Quality "$outputPath" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $originalSize = [math]::Round($file.Length / 1KB, 1)
            $newSize = [math]::Round((Get-Item $outputPath).Length / 1KB, 1)
            $savings = [math]::Round((1 - ($newSize / $originalSize)) * 100, 1)
            
            Write-Host "✅ $($file.Name) → $($file.BaseName).webp" -ForegroundColor Green
            Write-Host "   📊 Size: $($originalSize)KB → $($newSize)KB (saved $($savings)%)" -ForegroundColor Green
            
            $converted++
            
            # Delete original if requested
            if ($DeleteOriginals) {
                Remove-Item $file.FullName -Force
                Write-Host "   🗑️  Deleted original" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Failed to convert $($file.Name): $result" -ForegroundColor Red
            $errors++
        }
    } catch {
        Write-Host "❌ Error converting $($file.Name): $_" -ForegroundColor Red
        $errors++
    }
}

Write-Host "`n📊 Conversion Summary:" -ForegroundColor Cyan
Write-Host "✅ Converted: $converted files" -ForegroundColor Green
Write-Host "❌ Errors: $errors files" -ForegroundColor Red
Write-Host "✨ Done!" -ForegroundColor Green
