<?php
// Public stock counter for the Founder's Edition.
//
// Calls OmniFill's stock API with a read-only API key (OmniFill dashboard →
// Settings → API keys) and exposes only the remaining count to the browser.
// The key never reaches the client, and results are cached briefly to keep
// upstream traffic low.
//
// Setup on the server (one of):
//   - env var OMNIFILL_AGENT_TOKEN
//   - or a file omnifill-token.txt next to this file containing only the
//     key (.htaccess already denies web access to *.txt)

header('Content-Type: application/json');
header('Cache-Control: no-cache');

const FOUNDERS_TOTAL = 100;
const CACHE_TTL_SECONDS = 120;
const STOCK_URL = 'https://omnifill.net/api/products/stock';
const FOUNDERS_SKU = 'CBC-FOUNDER';

$cacheFile = __DIR__ . '/founders-stock-cache.json';

function respond_remaining(int $remaining): void {
    $remaining = max(0, min(FOUNDERS_TOTAL, $remaining));
    echo json_encode(['remaining' => $remaining, 'total' => FOUNDERS_TOTAL]);
    exit;
}

function respond_unavailable(): void {
    http_response_code(503);
    echo json_encode(['error' => 'stock unavailable']);
    exit;
}

// Products come back as a bare array of {id, name, sku, track_stock,
// stock_qty, assigned_qty, remaining_stock}; match the Founder's Edition
// by exact SKU, with a name/sku substring fallback.
function extract_founders_remaining(string $body): ?int {
    $json = json_decode($body, true);
    if (!is_array($json)) {
        return null;
    }
    $products = null;
    foreach (['products', 'data', 'items'] as $key) {
        if (isset($json[$key]) && is_array($json[$key])) {
            $products = $json[$key];
            break;
        }
    }
    if ($products === null && isset($json[0])) {
        $products = $json;
    }
    if ($products === null) {
        return null;
    }
    $fallback = null;
    foreach ($products as $product) {
        if (!is_array($product)) {
            continue;
        }
        $sku = is_string($product['sku'] ?? null) ? $product['sku'] : '';
        $qty = $product['remaining_stock'] ?? $product['stock_qty'] ?? null;
        if (!is_numeric($qty)) {
            continue;
        }
        if (strcasecmp($sku, FOUNDERS_SKU) === 0) {
            return (int) $qty;
        }
        $label = strtolower($sku . ' ' . (is_string($product['name'] ?? null) ? $product['name'] : ''));
        if ($fallback === null && strpos($label, 'founder') !== false) {
            $fallback = (int) $qty;
        }
    }
    return $fallback;
}

// 1. Fresh cache? Serve it (real data from a recent API call).
$cached = null;
if (is_readable($cacheFile)) {
    $decoded = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($decoded) && isset($decoded['remaining'], $decoded['fetched_at'])) {
        $cached = $decoded;
    }
}
if ($cached !== null && (time() - (int) $cached['fetched_at']) < CACHE_TTL_SECONDS) {
    respond_remaining((int) $cached['remaining']);
}

// 2. Ask the API.
$token = getenv('OMNIFILL_AGENT_TOKEN') ?: '';
if ($token === '' && is_readable(__DIR__ . '/omnifill-token.txt')) {
    $token = trim((string) file_get_contents(__DIR__ . '/omnifill-token.txt'));
}

$remaining = null;
if ($token !== '') {
    $ch = curl_init(STOCK_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Bearer ' . $token,
        ],
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if (is_string($body) && $status === 200) {
        $remaining = extract_founders_remaining($body);
    }
}

if ($remaining !== null) {
    @file_put_contents(
        $cacheFile,
        json_encode(['remaining' => $remaining, 'fetched_at' => time()]),
        LOCK_EX
    );
    respond_remaining($remaining);
}

// 3. API unreachable: serve the last real value if we ever had one.
if ($cached !== null) {
    respond_remaining((int) $cached['remaining']);
}
respond_unavailable();
