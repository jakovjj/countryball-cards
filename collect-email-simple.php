<?php
// Simple Email Collection Script - JSON API Version
// Fixed for proper AJAX handling

// Basic error reporting (but don't display to user)
error_reporting(E_ALL);
ini_set('display_errors', 0);  // Don't show errors in output

// Function to send JSON response
function sendJsonResponse($data, $httpCode = 200) {
    // Clear any previous output
    if (ob_get_contents()) ob_clean();
    
    http_response_code($httpCode);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    
    echo json_encode($data);
    exit;
}

// Function to redirect for standard form submissions  
function redirectWithMessage($success, $message) {
    $status = $success ? 'success' : 'error';
    $encodedMessage = urlencode($message);
    header("Location: join.html?status=$status&message=$encodedMessage");
    exit;
}

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJsonResponse(['success' => true, 'message' => 'CORS preflight OK']);
}

// Only allow POST for actual submissions
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Only POST method allowed'], 405);
}

// Determine if this is an AJAX request
$isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
          strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

try {
    // Get input data
    $email = '';
    $source = '';
    
    if ($isAjax) {
        // Handle AJAX request (JSON input)
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON input');
        }
        
        $email = $input['email'] ?? '';
        $source = $input['source'] ?? 'ajax_unknown';
    } else {
        // Handle standard form submission
        $email = $_POST['email'] ?? '';
        $source = $_POST['source'] ?? 'form_unknown';
    }
    
    // Validate email
    if (empty($email)) {
        throw new Exception('Email address is required');
    }
    
    $email = filter_var(trim($email), FILTER_VALIDATE_EMAIL);
    if (!$email) {
        throw new Exception('Please enter a valid email address');
    }
    
    // Prepare data
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Create CSV line
    $csvLine = sprintf('"%s","%s","%s","%s","%s"' . "\n", 
        str_replace('"', '""', $email),
        str_replace('"', '""', $timestamp),
        str_replace('"', '""', $source),
        str_replace('"', '""', $ip),
        str_replace('"', '""', $userAgent)
    );
    
    // Try to save
    $csvFile = 'emails.csv';
    
    // Create file with header if it doesn't exist
    if (!file_exists($csvFile)) {
        $header = '"email","date","source","ip","user_agent"' . "\n";
        if (file_put_contents($csvFile, $header) === false) {
            throw new Exception('Cannot create email storage file');
        }
    }
    
    // Check if email already exists
    if (file_exists($csvFile)) {
        $existing = file_get_contents($csvFile);
        if (strpos($existing, '"' . str_replace('"', '""', $email) . '"') !== false) {
            $message = 'This email is already subscribed to our newsletter!';
            
            if ($isAjax) {
                sendJsonResponse(['success' => true, 'message' => $message]);
            } else {
                redirectWithMessage(true, $message);
            }
        }
    }
    
    // Append new email
    if (file_put_contents($csvFile, $csvLine, FILE_APPEND | LOCK_EX) === false) {
        throw new Exception('Failed to save email. Please try again later.');
    }
    
    // Success response
    $message = 'Thank you! You\'ve been added to our newsletter.';
    
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
    $message = $e->getMessage();
    
    if ($isAjax) {
        sendJsonResponse(['error' => $message], 400);
    } else {
        redirectWithMessage(false, $message);
    }
}
?>
