<?php
// Quick test script for email collection
echo "<h2>Email Collection Test</h2>";

// Test 1: Check if collect-email.php exists
echo "<h3>Test 1: File Existence</h3>";
if (file_exists('collect-email.php')) {
    echo "✅ collect-email.php exists<br>";
} else {
    echo "❌ collect-email.php missing<br>";
}

if (file_exists('emails.csv')) {
    echo "✅ emails.csv exists<br>";
} else {
    echo "❌ emails.csv missing<br>";
}

// Test 2: Check file permissions
echo "<h3>Test 2: File Permissions</h3>";
if (is_writable('emails.csv')) {
    echo "✅ emails.csv is writable<br>";
} else {
    echo "❌ emails.csv is not writable<br>";
}

if (is_readable('emails.csv')) {
    echo "✅ emails.csv is readable<br>";
} else {
    echo "❌ emails.csv is not readable<br>";
}

// Test 3: Check current emails
echo "<h3>Test 3: Current Emails</h3>";
$csvContent = file_get_contents('emails.csv');
$lines = explode("\n", trim($csvContent));
echo "Current email count: " . (count($lines) - 1) . " (excluding header)<br>";

if (count($lines) > 1) {
    echo "<h4>Recent emails:</h4>";
    echo "<pre>" . htmlspecialchars($csvContent) . "</pre>";
} else {
    echo "No emails collected yet.<br>";
}

// Test 4: Simulate a test submission
echo "<h3>Test 4: Simulate Submission</h3>";
echo "<form method='POST' action='collect-email.php' style='background: #f0f0f0; padding: 15px; border-radius: 5px;'>";
echo "<label>Test Email: <input type='email' name='email' value='test@example.com' required></label><br><br>";
echo "<input type='hidden' name='source' value='test_script'>";
echo "<input type='hidden' name='page_url' value='test.php'>";
echo "<input type='hidden' name='timestamp' value='" . date('c') . "'>";
echo "<button type='submit'>Submit Test Email</button>";
echo "</form>";

// Test 5: PHP Configuration
echo "<h3>Test 5: PHP Configuration</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "file_put_contents enabled: " . (function_exists('file_put_contents') ? '✅ Yes' : '❌ No') . "<br>";
echo "json_decode enabled: " . (function_exists('json_decode') ? '✅ Yes' : '❌ No') . "<br>";
echo "filter_var enabled: " . (function_exists('filter_var') ? '✅ Yes' : '❌ No') . "<br>";

// Check URL parameters for submission result
if (isset($_GET['status'])) {
    echo "<div style='background: " . ($_GET['status'] === 'success' ? '#d4edda' : '#f8d7da') . "; padding: 10px; margin: 10px 0; border-radius: 5px;'>";
    echo "<strong>Form submission result:</strong> " . htmlspecialchars($_GET['message'] ?? 'Unknown');
    echo "</div>";
}
?>
