<?php
// Enhanced Email Collection Script
// Handles both AJAX and standard form submissions

// Function to send JSON response for AJAX requests
function sendJsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Function to redirect for standard form submissions
function redirectWithMessage($success, $message) {
    // Check if this is an iframe submission (form target="hidden_iframe")
    $isIframeSubmission = isset($_SERVER['HTTP_REFERER']) && 
                         (strpos($_SERVER['HTTP_REFERER'], 'join.html') !== false || 
                          strpos($_SERVER['HTTP_REFERER'], 'join.php') !== false);
    
    if ($isIframeSubmission) {
        // For iframe submissions, return minimal response
        header('Content-Type: text/html; charset=UTF-8');
        echo '<!DOCTYPE html>';
        echo '<html><head><meta charset="UTF-8"><title>Success</title></head>';
        echo '<body><p>Success</p></body></html>';
        exit;
    } else {
        // For direct submissions, redirect as before
        $status = $success ? 'success' : 'error';
        $encodedMessage = urlencode($message);
        header("Location: join.html?status=$status&message=$encodedMessage");
        exit;
    }
}

// CORS headers for AJAX requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if we have a valid request method
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['POST', 'GET'])) {
    // For non-JS users, show a helpful error page instead of JSON
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html><head><title>Error</title></head><body>';
    echo '<h2>Method Not Allowed</h2>';
    echo '<p>This form only accepts POST requests. Please <a href="join.html">go back and try again</a>.</p>';
    echo '</body></html>';
    exit;
}

// Determine if this is an AJAX request
$isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
          strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

// For debugging: log the request details
error_log("Email collection request: Method=" . ($method ?? 'unknown') . ", Ajax=" . ($isAjax ? 'yes' : 'no') . ", UserAgent=" . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));

// Get input data
$email = '';
$source = 'unknown';
$pageUrl = '';
$timestamp = '';

// Handle both AJAX and form submissions, but also GET as fallback
if ($method === 'POST') {
    if ($isAjax) {
        // Handle AJAX request (JSON input)
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $source = $input['source'] ?? 'ajax_unknown';
        $pageUrl = $input['form_data']['page_url'] ?? '';
        $timestamp = $input['form_data']['timestamp'] ?? '';
    } else {
        // Handle standard form submission
        $email = $_POST['email'] ?? '';
        $source = $_POST['source'] ?? 'form_unknown';
        $pageUrl = $_POST['page_url'] ?? '';
        $timestamp = $_POST['timestamp'] ?? '';
    }
} else if ($method === 'GET') {
    // Fallback to GET if server blocks POST
    $email = $_GET['email'] ?? '';
    $source = $_GET['source'] ?? 'get_fallback';
    $pageUrl = $_GET['page_url'] ?? '';
    $timestamp = $_GET['timestamp'] ?? '';
}

// Validate email
$email = filter_var(trim($email), FILTER_VALIDATE_EMAIL);

if (!$email) {
    $message = 'Please enter a valid email address.';
    if ($isAjax) {
        sendJsonResponse(['error' => $message], 400);
    } else {
        redirectWithMessage(false, $message);
    }
}

// Check if email already exists
$csvFile = 'emails.csv';
if (file_exists($csvFile)) {
    $existingEmails = array_map('str_getcsv', file($csvFile));
    foreach ($existingEmails as $row) {
        if (isset($row[0]) && strtolower(trim($row[0], '"')) === strtolower($email)) {
            $message = 'This email is already subscribed to our newsletter!';
            if ($isAjax) {
                sendJsonResponse(['success' => true, 'message' => $message]);
            } else {
                redirectWithMessage(true, $message);
            }
        }
    }
}

// Prepare data
$data = [
    'email' => $email,
    'date' => date('Y-m-d H:i:s'),
    'source' => $source,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    'page_url' => $pageUrl,
    'timestamp' => $timestamp
];

// Create CSV line
$csvLine = implode(',', [
    '"' . str_replace('"', '""', $email) . '"',
    '"' . str_replace('"', '""', $data['date']) . '"',
    '"' . str_replace('"', '""', $data['source']) . '"',
    '"' . str_replace('"', '""', $data['ip']) . '"',
    '"' . str_replace('"', '""', $data['user_agent']) . '"',
    '"' . str_replace('"', '""', $data['page_url']) . '"',
    '"' . str_replace('"', '""', $data['timestamp']) . '"'
]) . "\n";

// Ensure directory exists and is writable
$emailsDir = dirname($csvFile);
if (!is_dir($emailsDir)) {
    mkdir($emailsDir, 0755, true);
}

// Try to save to CSV file
try {
    if (file_put_contents($csvFile, $csvLine, FILE_APPEND | LOCK_EX) === false) {
        throw new Exception('Failed to write to file');
    }
    
    $message = 'Thank you! You\'ve been added to our newsletter. Check your email for confirmation.';
    
    if ($isAjax) {
        sendJsonResponse([
            'success' => true, 
            'message' => $message,
            'data' => ['subscriber_id' => hash('md5', $email . time())]
        ]);
    } else {
        redirectWithMessage(true, $message);
    }
    
} catch (Exception $e) {
    error_log("Email collection error: " . $e->getMessage());
    
    $message = 'Sorry, there was a problem saving your email. Please try again later.';
    
    if ($isAjax) {
        sendJsonResponse(['error' => $message], 500);
    } else {
        redirectWithMessage(false, $message);
    }
}
?>
