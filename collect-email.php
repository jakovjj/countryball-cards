<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

$data = [
    'email' => $email,
    'date' => date('Y-m-d H:i:s'),
    'source' => $input['source'] ?? 'unknown',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

// Save to CSV file (make sure emails.csv is writable)
$csvLine = implode(',', [
    '"' . $email . '"',
    '"' . $data['date'] . '"',
    '"' . $data['source'] . '"',
    '"' . $data['ip'] . '"'
]) . "\n";

file_put_contents('emails.csv', $csvLine, FILE_APPEND | LOCK_EX);

echo json_encode(['success' => true, 'message' => 'Email saved']);
?>
