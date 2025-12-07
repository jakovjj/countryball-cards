<?php
declare(strict_types=1);

const CBC_DATA_FILE = __DIR__ . '/../data/subscribers.json';

function cb_ensure_store(): void {
    $dir = dirname(CBC_DATA_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    if (!file_exists(CBC_DATA_FILE)) {
        file_put_contents(CBC_DATA_FILE, "[]\n", LOCK_EX);
    }
}

function cb_load_subscribers(): array {
    cb_ensure_store();
    $raw = file_get_contents(CBC_DATA_FILE);
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function cb_save_subscribers(array $subscribers): bool {
    cb_ensure_store();
    $payload = json_encode($subscribers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return file_put_contents(CBC_DATA_FILE, $payload . "\n", LOCK_EX) !== false;
}

function cb_normalize_email(string $email): string {
    return strtolower(trim($email));
}

function cb_find_subscriber_index(array $subscribers, string $email): ?int {
    $target = cb_normalize_email($email);
    foreach ($subscribers as $idx => $subscriber) {
        if (isset($subscriber['email']) && cb_normalize_email((string) $subscriber['email']) === $target) {
            return $idx;
        }
    }
    return null;
}
