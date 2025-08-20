<?php
/**
 * Google Mail API Authentication Setup
 */

require_once __DIR__ . '/vendor/autoload.php'; // You'll need to install Google API client

class GoogleAuthSetup {
    private $client;
    private $configPath;
    private $tokenPath;

    public function __construct() {
        $this->configPath = __DIR__ . '/config/google_credentials.json';
        $this->tokenPath = __DIR__ . '/config/gmail_token.json';
        $this->initializeClient();
    }

    private function initializeClient() {
        $this->client = new Google_Client();
        $this->client->setApplicationName('Countryball Cards Email Collector');
        $this->client->setScopes([
            Google_Service_Gmail::GMAIL_SEND,
            Google_Service_Gmail::GMAIL_COMPOSE,
            Google_Service_Gmail::GMAIL_MODIFY
        ]);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('select_account consent');

        // Try to load credentials
        if (file_exists($this->configPath)) {
            $this->client->setAuthConfig($this->configPath);
        } else {
            // Use environment variables
            $clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
            $clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? '';
            $redirectUri = $_ENV['GOOGLE_REDIRECT_URI'] ?? 'http://localhost/auth/callback';

            if (empty($clientId) || empty($clientSecret)) {
                throw new Exception('Google API credentials not found. Please set up google_credentials.json or environment variables.');
            }

            $this->client->setClientId($clientId);
            $this->client->setClientSecret($clientSecret);
            $this->client->setRedirectUri($redirectUri);
        }
    }

    public function getAuthUrl() {
        return $this->client->createAuthUrl();
    }

    public function processAuthCode($authCode) {
        try {
            $accessToken = $this->client->fetchAccessTokenWithAuthCode($authCode);
            
            if (array_key_exists('error', $accessToken)) {
                throw new Exception('Error fetching access token: ' . $accessToken['error']);
            }

            // Save token
            file_put_contents($this->tokenPath, json_encode($accessToken));
            
            return true;
        } catch (Exception $e) {
            throw new Exception('Failed to process auth code: ' . $e->getMessage());
        }
    }

    public function testConnection() {
        if (!file_exists($this->tokenPath)) {
            return false;
        }

        try {
            $accessToken = json_decode(file_get_contents($this->tokenPath), true);
            $this->client->setAccessToken($accessToken);

            if ($this->client->isAccessTokenExpired()) {
                if ($this->client->getRefreshToken()) {
                    $this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
                    file_put_contents($this->tokenPath, json_encode($this->client->getAccessToken()));
                } else {
                    return false;
                }
            }

            $service = new Google_Service_Gmail($this->client);
            $profile = $service->users->getProfile('me');
            
            return [
                'success' => true,
                'email' => $profile->getEmailAddress(),
                'messages_total' => $profile->getMessagesTotal()
            ];

        } catch (Exception $e) {
            return false;
        }
    }

    public function createCredentialsFile($clientId, $clientSecret, $redirectUri) {
        $credentials = [
            "web" => [
                "client_id" => $clientId,
                "client_secret" => $clientSecret,
                "redirect_uris" => [$redirectUri],
                "auth_uri" => "https://accounts.google.com/o/oauth2/auth",
                "token_uri" => "https://oauth2.googleapis.com/token"
            ]
        ];

        file_put_contents($this->configPath, json_encode($credentials, JSON_PRETTY_PRINT));
        return true;
    }
}

// Handle CLI usage
if (php_sapi_name() === 'cli') {
    echo "=== Google Mail API Setup ===\n\n";

    try {
        $auth = new GoogleAuthSetup();

        // Test existing connection
        $testResult = $auth->testConnection();
        if ($testResult && $testResult['success']) {
            echo "✅ Google Mail API is already configured and working!\n";
            echo "   Connected email: " . $testResult['email'] . "\n";
            echo "   Total messages: " . $testResult['messages_total'] . "\n\n";
            exit(0);
        }

        echo "🔗 Please visit this URL to authorize the application:\n\n";
        echo $auth->getAuthUrl() . "\n\n";
        echo "After authorization, you will get a code. Enter it below:\n";
        echo "Authorization code: ";
        
        $authCode = trim(fgets(STDIN));
        
        if (empty($authCode)) {
            echo "❌ No authorization code provided.\n";
            exit(1);
        }

        echo "\n🔄 Processing authorization code...\n";
        
        if ($auth->processAuthCode($authCode)) {
            echo "✅ Google Mail API setup completed successfully!\n\n";
            
            // Test the connection
            $testResult = $auth->testConnection();
            if ($testResult && $testResult['success']) {
                echo "✅ Connection test successful!\n";
                echo "   Connected email: " . $testResult['email'] . "\n";
            }
        }

    } catch (Exception $e) {
        echo "❌ Setup failed: " . $e->getMessage() . "\n";
        exit(1);
    }
} else {
    // Web interface for Google auth setup
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google Mail API Setup</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .step { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            .warning { background: #fff3cd; color: #856404; }
            .code { background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; margin: 10px 0; }
            button, .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
            input[type="text"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; }
            label { display: block; margin: 10px 0 5px; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>🔐 Google Mail API Setup</h1>

        <?php
        try {
            $auth = new GoogleAuthSetup();
            
            // Handle form submissions
            if (isset($_POST['create_credentials'])) {
                $clientId = $_POST['client_id'] ?? '';
                $clientSecret = $_POST['client_secret'] ?? '';
                $redirectUri = $_POST['redirect_uri'] ?? '';
                
                if ($clientId && $clientSecret && $redirectUri) {
                    $auth->createCredentialsFile($clientId, $clientSecret, $redirectUri);
                    echo '<div class="step success">✅ Credentials file created successfully!</div>';
                    $auth = new GoogleAuthSetup(); // Reinitialize with new credentials
                } else {
                    echo '<div class="step error">❌ Please fill in all required fields.</div>';
                }
            }
            
            if (isset($_POST['auth_code'])) {
                $authCode = $_POST['auth_code'] ?? '';
                if ($authCode) {
                    try {
                        $auth->processAuthCode($authCode);
                        echo '<div class="step success">✅ Authorization successful!</div>';
                    } catch (Exception $e) {
                        echo '<div class="step error">❌ Authorization failed: ' . htmlspecialchars($e->getMessage()) . '</div>';
                    }
                }
            }

            // Test existing connection
            $testResult = $auth->testConnection();
            if ($testResult && $testResult['success']) {
                echo '<div class="step success">';
                echo '<h3>✅ Google Mail API is configured and working!</h3>';
                echo '<p><strong>Connected email:</strong> ' . htmlspecialchars($testResult['email']) . '</p>';
                echo '<p><strong>Total messages:</strong> ' . number_format($testResult['messages_total']) . '</p>';
                echo '</div>';
            } else {
                // Show setup steps
                ?>
                <div class="step warning">
                    <h3>⚠️ Google Mail API not configured</h3>
                    <p>Follow these steps to set up Google Mail API integration:</p>
                </div>

                <div class="step">
                    <h3>Step 1: Create Google Cloud Project</h3>
                    <ol>
                        <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                        <li>Create a new project or select an existing one</li>
                        <li>Enable the Gmail API</li>
                        <li>Go to "Credentials" and create OAuth 2.0 credentials</li>
                        <li>Add your redirect URI (e.g., http://localhost/auth/callback)</li>
                    </ol>
                </div>

                <div class="step">
                    <h3>Step 2: Enter Your Credentials</h3>
                    <form method="post">
                        <label>Client ID:</label>
                        <input type="text" name="client_id" required placeholder="123456789-abcdef.apps.googleusercontent.com">
                        
                        <label>Client Secret:</label>
                        <input type="text" name="client_secret" required placeholder="GOCSPX-...">
                        
                        <label>Redirect URI:</label>
                        <input type="text" name="redirect_uri" value="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/auth/callback'; ?>" required>
                        
                        <br><br>
                        <button type="submit" name="create_credentials">Save Credentials</button>
                    </form>
                </div>

                <?php
                // If credentials exist, show authorization step
                try {
                    $authUrl = $auth->getAuthUrl();
                    ?>
                    <div class="step">
                        <h3>Step 3: Authorize Application</h3>
                        <p>Click the button below to authorize this application to send emails on your behalf:</p>
                        <a href="<?php echo htmlspecialchars($authUrl); ?>" target="_blank" class="btn">🔗 Authorize Google Mail Access</a>
                        
                        <form method="post" style="margin-top: 20px;">
                            <label>After authorization, enter the code you received:</label>
                            <input type="text" name="auth_code" placeholder="4/0AX4XfWi..." required>
                            <br><br>
                            <button type="submit">Complete Setup</button>
                        </form>
                    </div>
                    <?php
                } catch (Exception $e) {
                    echo '<div class="step error">❌ Please complete Step 2 first.</div>';
                }
            }

        } catch (Exception $e) {
            echo '<div class="step error">❌ Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
        ?>

        <div class="step">
            <h3>📚 Additional Resources</h3>
            <ul>
                <li><a href="https://developers.google.com/gmail/api/quickstart/php" target="_blank">Gmail API PHP Quickstart</a></li>
                <li><a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank">Enable Gmail API</a></li>
                <li><a href="https://console.cloud.google.com/apis/credentials" target="_blank">Create Credentials</a></li>
            </ul>
        </div>
    </body>
    </html>
    <?php
}
?>
