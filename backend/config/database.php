<?php
/**
 * Database configuration for email collection system
 */

class Database {
    private $host;
    private $database;
    private $username;
    private $password;
    private $charset;
    private $pdo;

    public function __construct() {
        // Load configuration from environment or defaults
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->database = $_ENV['DB_NAME'] ?? 'countryball_emails';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
        $this->charset = 'utf8mb4';
    }

    public function connect() {
        if ($this->pdo === null) {
            $dsn = "mysql:host={$this->host};dbname={$this->database};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            try {
                $this->pdo = new PDO($dsn, $this->username, $this->password, $options);
            } catch (PDOException $e) {
                // Fallback to SQLite if MySQL is not available
                $this->setupSQLite();
            }
        }

        return $this->pdo;
    }

    private function setupSQLite() {
        $dbPath = __DIR__ . '/../data/emails.sqlite';
        $dbDir = dirname($dbPath);
        
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }

        $dsn = "sqlite:$dbPath";
        $this->pdo = new PDO($dsn);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->createTables();
    }

    public function createTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS email_subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            source VARCHAR(100) NOT NULL DEFAULT 'unknown',
            ip_address VARCHAR(45),
            user_agent TEXT,
            country VARCHAR(10),
            referrer TEXT,
            utm_source VARCHAR(100),
            utm_medium VARCHAR(100),
            utm_campaign VARCHAR(100),
            subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            confirmed_at DATETIME NULL,
            unsubscribed_at DATETIME NULL,
            last_email_sent DATETIME NULL,
            email_count INTEGER DEFAULT 0,
            status ENUM('pending', 'confirmed', 'unsubscribed', 'bounced') DEFAULT 'pending',
            metadata TEXT -- JSON field for additional data
        );

        CREATE INDEX IF NOT EXISTS idx_email ON email_subscribers(email);
        CREATE INDEX IF NOT EXISTS idx_status ON email_subscribers(status);
        CREATE INDEX IF NOT EXISTS idx_source ON email_subscribers(source);
        CREATE INDEX IF NOT EXISTS idx_subscribed_at ON email_subscribers(subscribed_at);

        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) NOT NULL,
            action VARCHAR(50) NOT NULL,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address VARCHAR(45),
            success BOOLEAN DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
        CREATE INDEX IF NOT EXISTS idx_email_logs_timestamp ON email_logs(timestamp);
        ";

        $this->pdo->exec($sql);
    }

    public function testConnection() {
        try {
            $pdo = $this->connect();
            return $pdo->query('SELECT 1')->fetchColumn() === '1';
        } catch (Exception $e) {
            return false;
        }
    }
}
