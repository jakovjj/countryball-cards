<?php
declare(strict_types=1);

// Relays events from analytics.js to TikTok's Events API (server-side pixel).
// Exists so the Events API access token never reaches the browser.

header('Content-Type: application/json');

function respond(bool $ok, int $status = 200): never {
    http_response_code($status);
    echo json_encode(['success' => $ok]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 405);
}

// Basic same-origin check — this endpoint exists only to serve our own site's
// analytics.js, not as a general-purpose relay.
$origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if ($origin !== '' && !preg_match('#^https://(www\.)?countryballcards\.com(/|$)#', $origin)) {
    respond(false, 403);
}

function loadEnv(string $path): array {
    $env = [];
    if (!is_readable($path)) return $env;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        $env[trim($parts[0])] = trim($parts[1]);
    }
    return $env;
}

$env = loadEnv(__DIR__ . '/../.env');
$pixelId = $env['TIKTOK_PIXEL_ID'] ?? '';
$accessToken = $env['TIKTOK_ACCESS_TOKEN'] ?? '';

if ($pixelId === '' || $accessToken === '') {
    error_log('tiktok-events: missing TIKTOK_PIXEL_ID or TIKTOK_ACCESS_TOKEN in .env');
    respond(false, 500);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    respond(false, 400);
}

// Only relay events we actually emit client-side — no arbitrary event injection.
$allowedEvents = ['PageView', 'ViewContent', 'ClickButton', 'InitiateCheckout'];
$event = $body['event'] ?? '';
if (!in_array($event, $allowedEvents, true)) {
    respond(false, 400);
}

$eventId = is_string($body['event_id'] ?? null) ? $body['event_id'] : null;
$url = is_string($body['url'] ?? null) ? $body['url'] : '';
$properties = is_array($body['properties'] ?? null) ? $body['properties'] : new stdClass();

$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
$ttclid = is_string($body['ttclid'] ?? null) ? $body['ttclid'] : null;
$externalId = is_string($body['external_id'] ?? null) ? hash('sha256', $body['external_id']) : null;

$context = array_filter([
    'page' => $url !== '' ? ['url' => $url] : null,
    'user' => array_filter([
        'external_id' => $externalId,
    ]) ?: null,
    'ip' => $ip,
    'user_agent' => $userAgent,
    'ad' => $ttclid ? ['callback' => $ttclid] : null,
]);

$payload = [
    'event_source' => 'web',
    'event_source_id' => $pixelId,
    'data' => [array_filter([
        'event' => $event,
        'event_time' => time(),
        'event_id' => $eventId,
        'context' => $context,
        'properties' => $properties,
    ])],
];

$ch = curl_init('https://business-api.tiktok.com/open_api/v1.3/event/track/');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Access-Token: ' . $accessToken,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 5,
]);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($result === false || $httpCode >= 400) {
    error_log('tiktok-events: TikTok API error (' . $httpCode . '): ' . substr((string) $result, 0, 500));
    respond(false, 502);
}

respond(true);
