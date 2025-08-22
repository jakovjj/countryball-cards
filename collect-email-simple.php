<?php
// Simple Email Collection Script - Basic Version
// This version should work on most servers

// Basic error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type first
header('Content-Type: text/html; charset=UTF-8');

// Allow all methods for testing
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(200);
    exit;
}

echo "<!DOCTYPE html><html><body>";
echo "<h2>Email Collection - Simple Version</h2>";

try {
    // Handle both GET and POST for testing
    $email = '';
    $source = '';
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = $_POST['email'] ?? '';
        $source = $_POST['source'] ?? 'post_unknown';
        echo "<p>✅ POST request received</p>";
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $email = $_GET['email'] ?? '';
        $source = $_GET['source'] ?? 'get_unknown';
        echo "<p>⚠️ GET request received (testing mode)</p>";
    } else {
        echo "<p>❌ Unsupported method: " . htmlspecialchars($_SERVER['REQUEST_METHOD']) . "</p>";
        echo "<p><a href='join.html'>← Back to form</a></p>";
        echo "</body></html>";
        exit;
    }
    
    // Validate email
    if (empty($email)) {
        throw new Exception('No email provided');
    }
    
    $email = filter_var(trim($email), FILTER_VALIDATE_EMAIL);
    if (!$email) {
        throw new Exception('Invalid email format');
    }
    
    // Prepare data
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    // Create CSV line
    $csvLine = sprintf('"%s","%s","%s","%s"' . "\n", 
        str_replace('"', '""', $email),
        str_replace('"', '""', $timestamp),
        str_replace('"', '""', $source),
        str_replace('"', '""', $ip)
    );
    
    // Try to save
    $csvFile = 'emails.csv';
    
    // Create file with header if it doesn't exist
    if (!file_exists($csvFile)) {
        file_put_contents($csvFile, '"email","date","source","ip"' . "\n");
    }
    
    // Check if email already exists
    if (file_exists($csvFile)) {
        $existing = file_get_contents($csvFile);
        if (strpos($existing, $email) !== false) {
            echo "<p>ℹ️ Email already registered: " . htmlspecialchars($email) . "</p>";
            echo "<p><a href='join.html'>← Back to form</a></p>";
            echo "</body></html>";
            exit;
        }
    }
    
    // Append new email
    if (file_put_contents($csvFile, $csvLine, FILE_APPEND | LOCK_EX) !== false) {
        echo "<p>✅ <strong>Success!</strong> Email saved: " . htmlspecialchars($email) . "</p>";
        echo "<p>Source: " . htmlspecialchars($source) . "</p>";
        echo "<p>Time: " . htmlspecialchars($timestamp) . "</p>";
    } else {
        throw new Exception('Failed to save email to file');
    }
    
} catch (Exception $e) {
    echo "<p>❌ <strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<p><a href='join.html'>← Back to form</a></p>";
echo "<p><a href='debug.php'>Debug Info</a> | <a href='test-email.html'>Test Form</a></p>";
echo "</body></html>";
?>
