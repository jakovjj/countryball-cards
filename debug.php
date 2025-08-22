<?php
// Debug script to diagnose 405 errors
header('Content-Type: text/html; charset=UTF-8');

echo "<h2>Server Debug Information</h2>";

echo "<h3>Request Method:</h3>";
echo "Method: " . $_SERVER['REQUEST_METHOD'] . "<br>";

echo "<h3>Server Info:</h3>";
echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "<br>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "<br>";

echo "<h3>File Permissions:</h3>";
if (file_exists('collect-email.php')) {
    echo "collect-email.php: ✅ Exists<br>";
    echo "Readable: " . (is_readable('collect-email.php') ? '✅ Yes' : '❌ No') . "<br>";
    echo "Executable: " . (is_executable('collect-email.php') ? '✅ Yes' : '❌ No') . "<br>";
} else {
    echo "collect-email.php: ❌ Does not exist<br>";
}

echo "<h3>Test Form (GET method):</h3>";
echo "<p>This should work if the server allows GET requests:</p>";
echo "<form method='GET' action='collect-email.php'>";
echo "<input type='email' name='email' value='test@example.com' readonly>";
echo "<input type='hidden' name='source' value='debug_get'>";
echo "<button type='submit'>Test GET Request</button>";
echo "</form>";

echo "<h3>Test Form (POST method):</h3>";
echo "<p>This should work if the server allows POST requests:</p>";
echo "<form method='POST' action='collect-email.php'>";
echo "<input type='email' name='email' value='test@example.com' readonly>";
echo "<input type='hidden' name='source' value='debug_post'>";
echo "<button type='submit'>Test POST Request</button>";
echo "</form>";

echo "<h3>Direct PHP Test:</h3>";
try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'])) {
        echo "<div style='background: #d4edda; padding: 10px; border-radius: 5px; color: #155724;'>";
        echo "✅ POST request received successfully!<br>";
        echo "Email: " . htmlspecialchars($_POST['email']) . "<br>";
        echo "Source: " . htmlspecialchars($_POST['source']) . "<br>";
        echo "</div>";
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['email'])) {
        echo "<div style='background: #fff3cd; padding: 10px; border-radius: 5px; color: #856404;'>";
        echo "⚠️ GET request received (POST preferred)<br>";
        echo "Email: " . htmlspecialchars($_GET['email']) . "<br>";
        echo "Source: " . htmlspecialchars($_GET['source']) . "<br>";
        echo "</div>";
    }
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; padding: 10px; border-radius: 5px; color: #721c24;'>";
    echo "❌ Error: " . htmlspecialchars($e->getMessage());
    echo "</div>";
}

echo "<h3>Headers Sent:</h3>";
echo "<pre>";
foreach (getallheaders() as $name => $value) {
    echo htmlspecialchars("$name: $value") . "\n";
}
echo "</pre>";

echo "<h3>Environment Variables:</h3>";
echo "<pre>";
echo "HTTP_HOST: " . ($_SERVER['HTTP_HOST'] ?? 'Not set') . "\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'Not set') . "\n";
echo "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'Not set') . "\n";
echo "QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? 'Not set') . "\n";
echo "</pre>";
?>
