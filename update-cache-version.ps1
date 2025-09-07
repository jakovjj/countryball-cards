# PowerShell script to update cache version numbers automatically
# Run this script whenever you make changes to force cache refresh

$timestamp = Get-Date -Format "yyyyMMddHH"
Write-Host "Updating cache version to: $timestamp" -ForegroundColor Green

# Update service worker cache version
$swFile = "sw.js"
if (Test-Path $swFile) {
    $swContent = Get-Content $swFile -Raw
    $swContent = $swContent -replace "countryball-cards-v\d{10}", "countryball-cards-v$timestamp"
    Set-Content $swFile -Value $swContent -NoNewline
    Write-Host "Updated service worker cache version" -ForegroundColor Yellow
}

# Update CSS version in HTML files
$htmlFiles = Get-ChildItem -Filter "*.html"
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "styles\.css\?v=\d{10}") {
        $content = $content -replace "styles\.css\?v=\d{10}", "styles.css?v=$timestamp"
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Updated CSS version in $($file.Name)" -ForegroundColor Yellow
    }
}

# Update JS version in HTML files if they have versioned JS
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "main\.js\?v=\d{10}") {
        $content = $content -replace "main\.js\?v=\d{10}", "main.js?v=$timestamp"
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Updated JS version in $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`nCache version update complete!" -ForegroundColor Green
Write-Host "Version: $timestamp" -ForegroundColor Cyan
Write-Host "`nTo see changes immediately:" -ForegroundColor White
Write-Host "1. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "2. Or clear browser cache and reload" -ForegroundColor Gray
