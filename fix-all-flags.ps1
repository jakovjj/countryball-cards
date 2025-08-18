$content = Get-Content "packages.html" -Raw -Encoding UTF8

# Define correct mappings
$replacements = @{
    "'CY': { cost: 'FREE', flag: '🇭🇷', name: 'Cyprus' }" = "'CY': { cost: 'FREE', flag: '🇨🇾', name: 'Cyprus' }"
    "'CZ': { cost: 'FREE', flag: '🇭🇷', name: 'Czech Republic' }" = "'CZ': { cost: 'FREE', flag: '🇨🇿', name: 'Czech Republic' }"
    "'DK': { cost: 'FREE', flag: '🇭🇷', name: 'Denmark' }" = "'DK': { cost: 'FREE', flag: '🇩🇰', name: 'Denmark' }"
    "'EE': { cost: 'FREE', flag: '🇭🇷', name: 'Estonia' }" = "'EE': { cost: 'FREE', flag: '🇪🇪', name: 'Estonia' }"
    "'FI': { cost: 'FREE', flag: '🇭🇷', name: 'Finland' }" = "'FI': { cost: 'FREE', flag: '🇫🇮', name: 'Finland' }"
    "'FR': { cost: 'FREE', flag: '🇭🇷', name: 'France' }" = "'FR': { cost: 'FREE', flag: '🇫🇷', name: 'France' }"
    "'GR': { cost: 'FREE', flag: '🇭🇷', name: 'Greece' }" = "'GR': { cost: 'FREE', flag: '🇬🇷', name: 'Greece' }"
    "'HU': { cost: 'FREE', flag: '🇭🇷', name: 'Hungary' }" = "'HU': { cost: 'FREE', flag: '🇭🇺', name: 'Hungary' }"
    "'IE': { cost: 'FREE', flag: '🇭🇷', name: 'Ireland' }" = "'IE': { cost: 'FREE', flag: '🇮🇪', name: 'Ireland' }"
    "'IT': { cost: 'FREE', flag: '🇭🇷', name: 'Italy' }" = "'IT': { cost: 'FREE', flag: '🇮🇹', name: 'Italy' }"
    "'LV': { cost: 'FREE', flag: '🇭🇷', name: 'Latvia' }" = "'LV': { cost: 'FREE', flag: '🇱🇻', name: 'Latvia' }"
    "'LT': { cost: 'FREE', flag: '🇭🇷', name: 'Lithuania' }" = "'LT': { cost: 'FREE', flag: '🇱🇹', name: 'Lithuania' }"
    "'LU': { cost: 'FREE', flag: '🇭🇷', name: 'Luxembourg' }" = "'LU': { cost: 'FREE', flag: '🇱🇺', name: 'Luxembourg' }"
    "'MT': { cost: 'FREE', flag: '🇭🇷', name: 'Malta' }" = "'MT': { cost: 'FREE', flag: '🇲🇹', name: 'Malta' }"
    "'NL': { cost: 'FREE', flag: '🇭🇷', name: 'Netherlands' }" = "'NL': { cost: 'FREE', flag: '🇳🇱', name: 'Netherlands' }"
    "'PL': { cost: 'FREE', flag: '🇭🇷', name: 'Poland' }" = "'PL': { cost: 'FREE', flag: '🇵🇱', name: 'Poland' }"
    "'PT': { cost: 'FREE', flag: '🇭🇷', name: 'Portugal' }" = "'PT': { cost: 'FREE', flag: '🇵🇹', name: 'Portugal' }"
    "'RO': { cost: 'FREE', flag: '🇭🇷', name: 'Romania' }" = "'RO': { cost: 'FREE', flag: '🇷🇴', name: 'Romania' }"
    "'SK': { cost: 'FREE', flag: '🇭🇷', name: 'Slovakia' }" = "'SK': { cost: 'FREE', flag: '🇸🇰', name: 'Slovakia' }"
    "'SI': { cost: 'FREE', flag: '🇭🇷', name: 'Slovenia' }" = "'SI': { cost: 'FREE', flag: '🇸🇮', name: 'Slovenia' }"
    "'ES': { cost: 'FREE', flag: '🇭🇷', name: 'Spain' }" = "'ES': { cost: 'FREE', flag: '🇪🇸', name: 'Spain' }"
    "'SE': { cost: 'FREE', flag: '🇭🇷', name: 'Sweden' }" = "'SE': { cost: 'FREE', flag: '🇸🇪', name: 'Sweden' }"
    "'CH': { cost: '+€4', flag: '🇭🇷', name: 'Switzerland' }" = "'CH': { cost: '+€4', flag: '🇨🇭', name: 'Switzerland' }"
    "'ME': { cost: '+€4', flag: '🇭🇷', name: 'Montenegro' }" = "'ME': { cost: '+€4', flag: '🇲🇪', name: 'Montenegro' }"
}

# Apply all replacements
foreach ($key in $replacements.Keys) {
    $content = $content.Replace($key, $replacements[$key])
}

Set-Content "packages.html" -Value $content -Encoding UTF8

Write-Host "All country flags have been fixed!"
