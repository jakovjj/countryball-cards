# PowerShell script to update cache version numbers automatically.
# Run this script whenever you make changes to force cache refresh.

$timestamp = Get-Date -Format "yyyyMMddHH"
Write-Host "Updating cache version to: $timestamp" -ForegroundColor Green

# Update service worker cache version
$swFile = "sw.js"
if (Test-Path $swFile) {
    $swContent = Get-Content $swFile -Raw
    $swContent = $swContent -replace "countryball-cards-v\d{10}", "countryball-cards-v$timestamp"
    Set-Content $swFile -Value $swContent -NoNewline -Encoding UTF8
    Write-Host "Updated service worker cache version" -ForegroundColor Yellow
}

# Update cache-busting query strings in all live HTML files.
$htmlFiles = Get-ChildItem -Recurse -Filter "*.html" |
    Where-Object {
        $_.FullName -notmatch "\\archive\\" -and
        $_.FullName -notmatch "\\.tmp\\" -and
        $_.Name -notmatch "\.backup$"
    }

$assetPattern = '(?<prefix>\b(?:src|href)=["''])(?<asset>(?!https?:|//|data:)[^"'']+\.(?:css|js))(?:\?v=\d+)?(?<suffix>["''])'

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $updated = [regex]::Replace($content, $assetPattern, '${prefix}${asset}?v=' + $timestamp + '${suffix}')

    if ($updated -ne $content) {
        Set-Content $file.FullName -Value $updated -NoNewline -Encoding UTF8
        Write-Host "Updated asset versions in $($file.FullName)" -ForegroundColor Yellow
    }
}

# Keep the service worker precache list aligned with the same version.
if (Test-Path $swFile) {
    $swContent = Get-Content $swFile -Raw
    $swUpdated = [regex]::Replace($swContent, '(?<asset>/[A-Za-z0-9._/-]+\.(?:css|js))\?v=\d+', '${asset}?v=' + $timestamp)
    if ($swUpdated -ne $swContent) {
        Set-Content $swFile -Value $swUpdated -NoNewline -Encoding UTF8
        Write-Host "Updated service worker precache asset versions" -ForegroundColor Yellow
    }
}

Write-Host "`nCache version update complete!" -ForegroundColor Green
Write-Host "Version: $timestamp" -ForegroundColor Cyan
Write-Host "`nAfter upload/deploy, browsers should fetch fresh HTML, sw.js, CSS, and JS automatically." -ForegroundColor Gray
