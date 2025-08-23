<?php
// Simple Email Collection Script
// No external dependencies, no redirects, no complex logic

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Method not allowed');
}

// Get email from form
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$source = isset($_POST['source']) ? trim($_POST['source']) : 'unknown';

// Basic validation
if (empty($email)) {
    header('Location: join.html?status=error&message=' . urlencode('Email address is required'));
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: join.html?status=error&message=' . urlencode('Please enter a valid email address'));
    exit;
}

// Create CSV file if it doesn't exist
$csvFile = 'subscriber-emails.csv';
if (!file_exists($csvFile)) {
    file_put_contents($csvFile, "email,date,source\n");
}

// Check if email already exists
$existingEmails = file_get_contents($csvFile);
if (strpos($existingEmails, $email) !== false) {
    header('Location: join.html?status=success&message=' . urlencode('You are already subscribed to our newsletter!'));
    exit;
}

// Add new email
$date = date('Y-m-d H:i:s');
$csvLine = '"' . str_replace('"', '""', $email) . '","' . $date . '","' . $source . "\"\n";

if (file_put_contents($csvFile, $csvLine, FILE_APPEND | LOCK_EX) !== false) {
    // Success
    header('Location: join.html?status=success&message=' . urlencode('Thank you! You have been added to our newsletter.'));
} else {
    // Error saving
    header('Location: join.html?status=error&message=' . urlencode('Sorry, there was a problem saving your email. Please try again.'));
}

exit;
?>
