<?php
declare(strict_types=1);

require __DIR__ . '/lib/data_store.php';
$config = require __DIR__ . '/config.php';

$allowOrigin = $config['allow_origin'] ?? '*';
header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Method not allowed';
    exit;
}

$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo 'Invalid email address';
    exit;
}

$source = trim((string) ($_POST['source'] ?? 'unknown')) ?: 'unknown';
$country = strtoupper(trim((string) ($_POST['country'] ?? ($_SERVER['HTTP_CF_IPCOUNTRY'] ?? ''))));
$redirectUrl = isset($_POST['redirect_url']) ? trim((string) $_POST['redirect_url']) : '';
if ($redirectUrl && !filter_var($redirectUrl, FILTER_VALIDATE_URL) && strpos($redirectUrl, '/') !== 0) {
    $redirectUrl = '';
}
$timestamp = gmdate('c');

$subscribers = cb_load_subscribers();
$existingIndex = cb_find_subscriber_index($subscribers, $email);

$metadata = [
    'referer' => $_SERVER['HTTP_REFERER'] ?? null,
    'utm_source' => $_POST['utm_source'] ?? null,
    'utm_medium' => $_POST['utm_medium'] ?? null,
    'utm_campaign' => $_POST['utm_campaign'] ?? null,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
];

if ($existingIndex !== null) {
    $subscriber = $subscribers[$existingIndex];
    $subscriber['email'] = strtolower($email);
    $subscriber['source'] = $source;
    $subscriber['updated_at'] = $timestamp;
    $subscriber['last_signup_at'] = $timestamp;
    $subscriber['country'] = $country ?: ($subscriber['country'] ?? '');
    $subscriber['ip'] = $_SERVER['REMOTE_ADDR'] ?? ($subscriber['ip'] ?? null);
    $subscriber['metadata'] = array_merge($subscriber['metadata'] ?? [], $metadata);
    if (($subscriber['status'] ?? 'pending') === 'unsubscribed') {
        $subscriber['status'] = 'pending';
        unset($subscriber['unsubscribed_at']);
    }
    $subscribers[$existingIndex] = $subscriber;
} else {
    $subscribers[] = [
        'email' => strtolower($email),
        'source' => $source,
        'status' => 'pending',
        'subscribed_at' => $timestamp,
        'last_signup_at' => $timestamp,
        'updated_at' => $timestamp,
        'country' => $country,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        'metadata' => $metadata
    ];
}

if (!cb_save_subscribers($subscribers)) {
    http_response_code(500);
    echo 'Failed to save subscriber';
    exit;
}

if ($redirectUrl) {
    header('Location: ' . $redirectUrl);
    exit;
}

echo 'success';
