<?php
declare(strict_types=1);

require __DIR__ . '/lib/data_store.php';
$config = require __DIR__ . '/config.php';

$allowOrigin = $config['allow_origin'] ?? '*';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$apiKey = $config['api_key'] ?? '';
$providedKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey && $apiKey !== 'change-me' && $providedKey !== $apiKey) {
    respond(401, null, 'Invalid API key');
}

$path = parse_path();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$subscribers = cb_load_subscribers();

switch ($method . ' ' . $path) {
    case 'GET /health':
        respond(200, ['status' => 'ok', 'count' => count($subscribers)]);
        break;

    case 'GET /stats':
        respond(200, build_stats($subscribers));
        break;

    case 'GET /subscribers':
        respond(200, list_subscribers($subscribers));
        break;

    case 'POST /unsubscribe':
        $payload = decode_json_body();
        $email = filter_var($payload['email'] ?? '', FILTER_VALIDATE_EMAIL);
        if (!$email) {
            respond(400, null, 'Valid email is required');
        }
        $reason = trim((string) ($payload['reason'] ?? '')); 
        $updated = unsubscribe_email($subscribers, $email, $reason);
        respond(200, ['unsubscribed' => $updated, 'email' => strtolower($email)]);
        break;

    case 'POST /send-campaign':
        $payload = decode_json_body();
        $filters = $payload['filters']['status'] ?? ['confirmed'];
        if (!is_array($filters) || empty($filters)) {
            $filters = ['confirmed'];
        }
        $target = array_filter($subscribers, function ($subscriber) use ($filters) {
            $status = $subscriber['status'] ?? 'pending';
            return in_array($status, $filters, true);
        });
        respond(200, [
            'results' => [
                'sent' => count($target),
                'failed' => 0
            ],
            'filters' => $filters
        ]);
        break;

    default:
        respond(404, null, 'Endpoint not found');
}

function parse_path(): string {
    $pathInfo = $_SERVER['PATH_INFO'] ?? '';
    if ($pathInfo) {
        return rtrim($pathInfo, '/') ?: '/';
    }
    $requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    if ($scriptName && strpos($requestUri, $scriptName) === 0) {
        $pathInfo = substr($requestUri, strlen($scriptName));
    } else {
        $pathInfo = $requestUri;
    }
    $pathInfo = rtrim($pathInfo, '/');
    return $pathInfo === '' ? '/' : $pathInfo;
}

function respond(int $status, $data = null, ?string $error = null): void {
    http_response_code($status);
    echo json_encode([
        'success' => $error === null,
        'data' => $error === null ? $data : null,
        'error' => $error
    ]);
    exit;
}

function decode_json_body(): array {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?? '', true);
    return is_array($decoded) ? $decoded : [];
}

function build_stats(array $subscribers): array {
    $today = date('Y-m-d');
    $stats = [
        'total' => count($subscribers),
        'active' => 0,
        'today' => 0,
        'unsubscribed' => 0,
        'sources' => []
    ];

    $sources = [];
    foreach ($subscribers as $subscriber) {
        $status = $subscriber['status'] ?? 'pending';
        if ($status === 'confirmed') {
            $stats['active']++;
        }
        if ($status === 'unsubscribed') {
            $stats['unsubscribed']++;
        }
        $signed = substr((string) ($subscriber['subscribed_at'] ?? ''), 0, 10);
        $lastSignup = substr((string) ($subscriber['last_signup_at'] ?? ''), 0, 10);
        if ($signed === $today || $lastSignup === $today) {
            $stats['today']++;
        }
        $source = $subscriber['source'] ?? 'unknown';
        $sources[$source] = ($sources[$source] ?? 0) + 1;
    }

    foreach ($sources as $source => $count) {
        $stats['sources'][] = ['source' => $source, 'count' => $count];
    }

    return $stats;
}

function list_subscribers(array $subscribers): array {
    $limit = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $search = strtolower(trim((string) ($_GET['search'] ?? '')));

    $statusFilter = $_GET['status'] ?? null;
    $statuses = [];
    if ($statusFilter) {
        $statuses = array_map('trim', explode(',', (string) $statusFilter));
        $statuses = array_filter($statuses, fn($s) => $s !== '');
    }

    $filtered = array_filter($subscribers, function ($subscriber) use ($search, $statuses) {
        if ($search && strpos(strtolower($subscriber['email'] ?? ''), $search) === false) {
            return false;
        }
        if ($statuses) {
            return in_array($subscriber['status'] ?? 'pending', $statuses, true);
        }
        return true;
    });

    $offset = ($page - 1) * $limit;
    $paged = array_slice(array_values($filtered), $offset, $limit);

    return [
        'subscribers' => array_values($paged),
        'page' => $page,
        'limit' => $limit,
        'total' => count($filtered)
    ];
}

function unsubscribe_email(array &$subscribers, string $email, string $reason = ''): bool {
    $index = cb_find_subscriber_index($subscribers, $email);
    if ($index === null) {
        return false;
    }
    $timestamp = gmdate('c');
    $subscribers[$index]['status'] = 'unsubscribed';
    $subscribers[$index]['unsubscribed_at'] = $timestamp;
    $subscribers[$index]['unsubscribe_reason'] = $reason;
    $subscribers[$index]['updated_at'] = $timestamp;
    cb_save_subscribers($subscribers);
    return true;
}
