$content = Get-Content "packages.html" -Raw -Encoding UTF8

# Fix the incorrectly replaced flags (they all got Croatian flag instead of their own)
$content = $content -replace "'BG': { cost: 'FREE', flag: '🇭🇷', name: 'Bulgaria' }", "'BG': { cost: 'FREE', flag: '🇧🇬', name: 'Bulgaria' }"
$content = $content -replace "'CY': { cost: 'FREE', flag: '🇭🇷', name: 'Cyprus' }", "'CY': { cost: 'FREE', flag: '🇨🇾', name: 'Cyprus' }"
$content = $content -replace "'CZ': { cost: 'FREE', flag: '🇭🇷', name: 'Czech Republic' }", "'CZ': { cost: 'FREE', flag: '🇨🇿', name: 'Czech Republic' }"
$content = $content -replace "'DK': { cost: 'FREE', flag: '🇭🇷', name: 'Denmark' }", "'DK': { cost: 'FREE', flag: '🇩🇰', name: 'Denmark' }"
$content = $content -replace "'EE': { cost: 'FREE', flag: '🇭🇷', name: 'Estonia' }", "'EE': { cost: 'FREE', flag: '🇪🇪', name: 'Estonia' }"
$content = $content -replace "'FI': { cost: 'FREE', flag: '🇭🇷', name: 'Finland' }", "'FI': { cost: 'FREE', flag: '🇫🇮', name: 'Finland' }"
$content = $content -replace "'FR': { cost: 'FREE', flag: '🇭🇷', name: 'France' }", "'FR': { cost: 'FREE', flag: '🇫🇷', name: 'France' }"
$content = $content -replace "'GR': { cost: 'FREE', flag: '🇭🇷', name: 'Greece' }", "'GR': { cost: 'FREE', flag: '🇬🇷', name: 'Greece' }"
$content = $content -replace "'HU': { cost: 'FREE', flag: '🇭🇷', name: 'Hungary' }", "'HU': { cost: 'FREE', flag: '🇭🇺', name: 'Hungary' }"
$content = $content -replace "'IE': { cost: 'FREE', flag: '🇭🇷', name: 'Ireland' }", "'IE': { cost: 'FREE', flag: '🇮🇪', name: 'Ireland' }"
$content = $content -replace "'IT': { cost: 'FREE', flag: '🇭🇷', name: 'Italy' }", "'IT': { cost: 'FREE', flag: '🇮🇹', name: 'Italy' }"
$content = $content -replace "'LV': { cost: 'FREE', flag: '🇭🇷', name: 'Latvia' }", "'LV': { cost: 'FREE', flag: '🇱🇻', name: 'Latvia' }"
$content = $content -replace "'LT': { cost: 'FREE', flag: '🇭🇷', name: 'Lithuania' }", "'LT': { cost: 'FREE', flag: '🇱🇹', name: 'Lithuania' }"
$content = $content -replace "'LU': { cost: 'FREE', flag: '🇭🇷', name: 'Luxembourg' }", "'LU': { cost: 'FREE', flag: '🇱🇺', name: 'Luxembourg' }"
$content = $content -replace "'MT': { cost: 'FREE', flag: '🇭🇷', name: 'Malta' }", "'MT': { cost: 'FREE', flag: '🇲🇹', name: 'Malta' }"
$content = $content -replace "'NL': { cost: 'FREE', flag: '🇭🇷', name: 'Netherlands' }", "'NL': { cost: 'FREE', flag: '🇳🇱', name: 'Netherlands' }"
$content = $content -replace "'PL': { cost: 'FREE', flag: '🇭🇷', name: 'Poland' }", "'PL': { cost: 'FREE', flag: '🇵🇱', name: 'Poland' }"
$content = $content -replace "'PT': { cost: 'FREE', flag: '🇭🇷', name: 'Portugal' }", "'PT': { cost: 'FREE', flag: '🇵🇹', name: 'Portugal' }"
$content = $content -replace "'RO': { cost: 'FREE', flag: '🇭🇷', name: 'Romania' }", "'RO': { cost: 'FREE', flag: '🇷🇴', name: 'Romania' }"
$content = $content -replace "'SK': { cost: 'FREE', flag: '🇭🇷', name: 'Slovakia' }", "'SK': { cost: 'FREE', flag: '🇸🇰', name: 'Slovakia' }"
$content = $content -replace "'SI': { cost: 'FREE', flag: '🇭🇷', name: 'Slovenia' }", "'SI': { cost: 'FREE', flag: '🇸🇮', name: 'Slovenia' }"
$content = $content -replace "'ES': { cost: 'FREE', flag: '🇭🇷', name: 'Spain' }", "'ES': { cost: 'FREE', flag: '🇪🇸', name: 'Spain' }"
$content = $content -replace "'SE': { cost: 'FREE', flag: '🇭🇷', name: 'Sweden' }", "'SE': { cost: 'FREE', flag: '🇸🇪', name: 'Sweden' }"
$content = $content -replace "'CH': { cost: '+€4', flag: '🇭🇷', name: 'Switzerland' }", "'CH': { cost: '+€4', flag: '🇨🇭', name: 'Switzerland' }"
$content = $content -replace "'ME': { cost: '+€4', flag: '🇭🇷', name: 'Montenegro' }", "'ME': { cost: '+€4', flag: '🇲🇪', name: 'Montenegro' }"

Set-Content "packages.html" -Value $content -Encoding UTF8

Write-Host "Country flags have been correctly assigned!"
