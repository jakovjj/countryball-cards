<?php
// Public stock counter for the Founder's Edition.
// Proxies the authenticated omnifill.net stock API so the API key never
// reaches the browser, and caches the result to keep upstream traffic low.
//
// Setup on the server (one of):
//   - set env var OMNIFILL_API_KEY
//   - or create omnifill-key.txt next to this file containing only the key
//     (.htaccess already denies web access to *.txt)

header('Content-Type: application/json');
header('Cache-Control: no-cache');

const FOUNDERS_TOTAL = 100;
const FALLBACK_REMAINING = 44; // last known count, used only if API + cache both unavailable
const CACHE_TTL_SECONDS = 120;

$cacheFile = __DIR__ . '/founders-stock-cache.json';

function respond_remaining(int $remaining): void {
    $remaining = max(0, min(FOUNDERS_TOTAL, $remaining));
    echo json_encode(['remaining' => $remaining, 'total' => FOUNDERS_TOTAL]);
    exit;
}

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

$apiKey = getenv('OMNIFILL_API_KEY') ?: '';
if ($apiKey === '' && is_readable(__DIR__ . '/omnifill-key.txt')) {
    $apiKey = trim((string) file_get_contents(__DIR__ . '/omnifill-key.txt'));
}

$remaining = null;
if ($apiKey !== '') {
    $ch = curl_init('https://omnifill.net/api/products/stock');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Bearer ' . $apiKey,
            'X-API-Key: ' . $apiKey,
        ],
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if (is_string($body) && $status === 200) {
        $json = json_decode($body, true);
        $products = null;
        if (is_array($json)) {
            if (isset($json['products']) && is_array($json['products'])) {
                $products = $json['products'];
            } elseif (isset($json['data']) && is_array($json['data'])) {
                $products = $json['data'];
            } elseif (isset($json[0])) {
                $products = $json;
            }
        }
        if ($products !== null) {
            foreach ($products as $product) {
                if (!is_array($product)) {
                    continue;
                }
                $label = strtolower(implode(' ', array_filter([
                    $product['name'] ?? '',
                    $product['title'] ?? '',
                    $product['sku'] ?? '',
                ], 'is_string')));
                if (strpos($label, 'founder') === false) {
                    continue;
                }
                $qty = $product['remaining_stock'] ?? $product['stock_qty'] ?? null;
                if (is_numeric($qty)) {
                    $remaining = (int) $qty;
                }
                break;
            }
        }
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

// Upstream unavailable: serve last cached value, else the static fallback.
respond_remaining($cached !== null ? (int) $cached['remaining'] : FALLBACK_REMAINING);
