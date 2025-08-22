<?php
// Alternative email collection endpoint
// Uses different approach to avoid 405 errors

// Minimal headers to avoid conflicts
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Allow both GET and POST to bypass server restrictions
$email = '';
$source = '';
$isAjax = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if it's AJAX
    $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
              strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    
    if ($isAjax) {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $source = $input['source'] ?? 'ajax';
    } else {
        $email = $_POST['email'] ?? '';
        $source = $_POST['source'] ?? 'form';
    }
} else {
    // Fallback to GET if POST is blocked
    $email = $_GET['email'] ?? '';
    $source = $_GET['source'] ?? 'get_fallback';
}

// Simple response function
function respond($success, $message, $isAjax = false) {
    if ($isAjax) {
        header('Content-Type: application/json');
        echo json_encode($success ? 
            ['success' => true, 'message' => $message] : 
            ['error' => $message]
        );
    } else {
        $status = $success ? 'success' : 'error';
        $encoded = urlencode($message);
        header("Location: join.html?status=$status&message=$encoded");
    }
    exit;
}

// Validate email
$email = filter_var(trim($email), FILTER_VALIDATE_EMAIL);
if (!$email) {
    respond(false, 'Please enter a valid email address', $isAjax);
}

// Save to file
$line = sprintf('"%s","%s","%s","%s"' . "\n", 
    str_replace('"', '""', $email),
    date('Y-m-d H:i:s'),
    str_replace('"', '""', $source),
    $_SERVER['REMOTE_ADDR'] ?? 'unknown'
);

if (file_put_contents('emails.csv', $line, FILE_APPEND | LOCK_EX)) {
    respond(true, 'Thank you! You\'ve been added to our newsletter.', $isAjax);
} else {
    respond(false, 'Unable to save email. Please try again.', $isAjax);
}
?>
