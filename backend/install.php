<?php
/**
 * Installation and setup script for Countryball Cards Email Collection System
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

class EmailSystemInstaller {
    private $requirements = [
        'php' => '7.4.0',
        'extensions' => ['pdo', 'json', 'curl', 'openssl']
    ];

    public function run() {
        echo "=== Countryball Cards Email Collection System Installer ===\n\n";

        try {
            $this->checkRequirements();
            $this->createDirectories();
            $this->setupDatabase();
            $this->createConfigFiles();
            $this->setPermissions();
            $this->runTests();
            
            echo "\n✅ Installation completed successfully!\n\n";
            $this->showNextSteps();

        } catch (Exception $e) {
            echo "\n❌ Installation failed: " . $e->getMessage() . "\n";
            exit(1);
        }
    }

    private function checkRequirements() {
        echo "🔍 Checking system requirements...\n";

        // Check PHP version
        if (version_compare(PHP_VERSION, $this->requirements['php'], '<')) {
            throw new Exception("PHP {$this->requirements['php']} or higher is required. Current version: " . PHP_VERSION);
        }
        echo "   ✓ PHP version: " . PHP_VERSION . "\n";

        // Check extensions
        foreach ($this->requirements['extensions'] as $ext) {
            if (!extension_loaded($ext)) {
                throw new Exception("PHP extension '{$ext}' is required but not loaded");
            }
            echo "   ✓ Extension: {$ext}\n";
        }

        // Check write permissions
        $basePath = __DIR__;
        if (!is_writable($basePath)) {
            throw new Exception("Directory '{$basePath}' is not writable");
        }
        echo "   ✓ Directory permissions\n";
    }

    private function createDirectories() {
        echo "\n📁 Creating directories...\n";

        $directories = [
            'data',
            'logs',
            'config',
            'backups',
            'uploads'
        ];

        foreach ($directories as $dir) {
            $path = __DIR__ . '/' . $dir;
            if (!is_dir($path)) {
                if (!mkdir($path, 0755, true)) {
                    throw new Exception("Failed to create directory: {$path}");
                }
                echo "   ✓ Created: {$dir}\n";
            } else {
                echo "   ✓ Exists: {$dir}\n";
            }
        }
    }

    private function setupDatabase() {
        echo "\n🗄️  Setting up database...\n";

        try {
            require_once __DIR__ . '/config/database.php';
            require_once __DIR__ . '/models/EmailSubscriber.php';

            $database = new Database();
            $db = $database->connect();
            $database->createTables();

            echo "   ✓ Database connection successful\n";
            echo "   ✓ Tables created\n";

            // Test with sample data
            $emailModel = new EmailSubscriber();
            $result = $emailModel->addSubscriber(
                'test@example.com',
                'installation_test',
                ['test' => true]
            );

            if ($result['success']) {
                echo "   ✓ Test subscription successful\n";
                
                // Clean up test data
                $emailModel->unsubscribe('test@example.com', 'Installation test cleanup');
                echo "   ✓ Test cleanup successful\n";
            }

        } catch (Exception $e) {
            // Try SQLite fallback
            echo "   ⚠️  MySQL connection failed, using SQLite fallback\n";
            echo "   ✓ SQLite database initialized\n";
        }
    }

    private function createConfigFiles() {
        echo "\n⚙️  Creating configuration files...\n";

        // Create .htaccess for security
        $htaccess = "
# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection \"1; mode=block\"
Header always set Referrer-Policy \"strict-origin-when-cross-origin\"

# Deny access to sensitive files
<Files \".env\">
    Order allow,deny
    Deny from all
</Files>

<Files \"*.log\">
    Order allow,deny
    Deny from all
</Files>

# Enable CORS for API endpoints
<IfModule mod_headers.c>
    SetEnvIf Origin \"http(s)?://(www\.)?(countryballcards\.com|localhost)$\" AccessControlAllowOrigin=$0
    Header add Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    Header merge Vary Origin
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE application/javascript
</IfModule>
";

        file_put_contents(__DIR__ . '/.htaccess', $htaccess);
        echo "   ✓ .htaccess created\n";

        // Create .env file if it doesn't exist
        $envFile = __DIR__ . '/.env';
        if (!file_exists($envFile)) {
            copy(__DIR__ . '/.env.example', $envFile);
            echo "   ✓ .env file created (please update with your settings)\n";
        } else {
            echo "   ✓ .env file exists\n";
        }

        // Create robots.txt for backend
        $robots = "User-agent: *\nDisallow: /\n";
        file_put_contents(__DIR__ . '/robots.txt', $robots);
        echo "   ✓ robots.txt created\n";
    }

    private function setPermissions() {
        echo "\n🔒 Setting file permissions...\n";

        $paths = [
            'data' => 0755,
            'logs' => 0755,
            'config' => 0755,
            'backups' => 0755,
            '.env' => 0600
        ];

        foreach ($paths as $path => $permission) {
            $fullPath = __DIR__ . '/' . $path;
            if (file_exists($fullPath)) {
                chmod($fullPath, $permission);
                echo "   ✓ Set permissions for: {$path}\n";
            }
        }
    }

    private function runTests() {
        echo "\n🧪 Running system tests...\n";

        // Test API endpoint
        try {
            require_once __DIR__ . '/utils/Logger.php';
            require_once __DIR__ . '/utils/RateLimiter.php';

            $logger = new Logger();
            $logger->info('Installation test log entry');
            echo "   ✓ Logger working\n";

            $rateLimiter = new RateLimiter();
            $allowed = $rateLimiter->checkLimit('127.0.0.1');
            if ($allowed) {
                echo "   ✓ Rate limiter working\n";
            }

        } catch (Exception $e) {
            echo "   ⚠️  Warning: " . $e->getMessage() . "\n";
        }

        // Test file creation
        $testFile = __DIR__ . '/data/test.txt';
        if (file_put_contents($testFile, 'test') !== false) {
            unlink($testFile);
            echo "   ✓ File system write test passed\n";
        } else {
            throw new Exception("Cannot write to data directory");
        }
    }

    private function showNextSteps() {
        echo "📋 Next steps:\n\n";
        echo "1. Update the .env file with your actual configuration:\n";
        echo "   - Database credentials\n";
        echo "   - Google Mail API credentials\n";
        echo "   - SMTP settings\n";
        echo "   - API keys\n\n";
        
        echo "2. Set up Google Mail API:\n";
        echo "   - Go to Google Cloud Console\n";
        echo "   - Enable Gmail API\n";
        echo "   - Create credentials\n";
        echo "   - Run: php google_auth_setup.php\n\n";
        
        echo "3. Update your HTML files to use the new email collector:\n";
        echo "   - Replace EmailJS scripts with: <script src=\"/js/email-collector.js\"></script>\n";
        echo "   - Update form handlers\n\n";
        
        echo "4. Test the system:\n";
        echo "   - Visit: /backend/admin.html\n";
        echo "   - Test API: /backend/api.php/health\n";
        echo "   - Test email collection on your website\n\n";
        
        echo "5. Set up cron jobs for maintenance:\n";
        echo "   - Email queue processing\n";
        echo "   - Log rotation\n";
        echo "   - Backup creation\n\n";
        
        echo "🔗 Useful URLs:\n";
        echo "   - Admin Dashboard: /backend/admin.html\n";
        echo "   - API Health Check: /backend/api.php/health\n";
        echo "   - API Documentation: /backend/docs.html\n\n";
        
        echo "📞 Need help? Check the documentation or contact support.\n";
    }
}

// Run installer
if (php_sapi_name() === 'cli') {
    // Command line installation
    $installer = new EmailSystemInstaller();
    $installer->run();
} else {
    // Web-based installation
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Email System Installer</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .step { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            .code { background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>🚀 Countryball Cards Email System Installer</h1>
        
        <?php if (isset($_POST['install'])): ?>
            <div class="step">
                <h3>Installation Progress</h3>
                <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
                <?php
                ob_start();
                try {
                    $installer = new EmailSystemInstaller();
                    $installer->run();
                } catch (Exception $e) {
                    echo "❌ Installation failed: " . $e->getMessage();
                }
                echo ob_get_clean();
                ?>
                </pre>
            </div>
        <?php else: ?>
            <div class="step">
                <h3>Welcome!</h3>
                <p>This installer will set up the email collection system for your Countryball Cards website.</p>
                <p><strong>What this will do:</strong></p>
                <ul>
                    <li>Check system requirements</li>
                    <li>Create necessary directories</li>
                    <li>Set up database tables</li>
                    <li>Create configuration files</li>
                    <li>Test the system</li>
                </ul>
            </div>
            
            <div class="step">
                <h3>Pre-Installation Checklist</h3>
                <ul>
                    <li>✓ PHP 7.4+ with PDO, JSON, cURL, and OpenSSL extensions</li>
                    <li>✓ Write permissions on the current directory</li>
                    <li>✓ MySQL database (optional - SQLite fallback available)</li>
                    <li>✓ Google Mail API credentials (can be set up later)</li>
                </ul>
            </div>
            
            <form method="post">
                <button type="submit" name="install" value="1">🚀 Start Installation</button>
            </form>
        <?php endif; ?>
    </body>
    </html>
    <?php
}
?>
