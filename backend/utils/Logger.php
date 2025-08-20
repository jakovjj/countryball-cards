<?php
/**
 * Logger utility
 */

class Logger {
    private $logFile;
    private $level;

    const DEBUG = 0;
    const INFO = 1;
    const WARNING = 2;
    const ERROR = 3;

    public function __construct($logFile = null, $level = self::INFO) {
        $this->logFile = $logFile ?: __DIR__ . '/../logs/app.log';
        $this->level = $level;
        
        // Ensure log directory exists
        $logDir = dirname($this->logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
    }

    public function debug($message, $context = []) {
        $this->log(self::DEBUG, $message, $context);
    }

    public function info($message, $context = []) {
        $this->log(self::INFO, $message, $context);
    }

    public function warning($message, $context = []) {
        $this->log(self::WARNING, $message, $context);
    }

    public function error($message, $context = []) {
        $this->log(self::ERROR, $message, $context);
    }

    private function log($level, $message, $context = []) {
        if ($level < $this->level) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');
        $levelName = $this->getLevelName($level);
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        
        $logEntry = "[{$timestamp}] {$levelName}: {$message}{$contextStr}" . PHP_EOL;
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        // Also log errors to PHP error log
        if ($level >= self::ERROR) {
            error_log($logEntry);
        }
    }

    private function getLevelName($level) {
        switch ($level) {
            case self::DEBUG: return 'DEBUG';
            case self::INFO: return 'INFO';
            case self::WARNING: return 'WARNING';
            case self::ERROR: return 'ERROR';
            default: return 'UNKNOWN';
        }
    }

    public function logEmailEvent($email, $event, $details = [], $success = true) {
        $this->info("Email event: {$event}", [
            'email' => $email,
            'event' => $event,
            'success' => $success,
            'details' => $details,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    }

    public function logApiRequest($endpoint, $method, $responseCode, $duration = null) {
        $this->info("API request", [
            'endpoint' => $endpoint,
            'method' => $method,
            'response_code' => $responseCode,
            'duration_ms' => $duration,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    }

    public function rotateLogs($maxFiles = 5) {
        $logFiles = glob($this->logFile . '*');
        
        if (count($logFiles) > $maxFiles) {
            // Sort by modification time
            usort($logFiles, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            
            // Remove oldest files
            $filesToRemove = array_slice($logFiles, 0, count($logFiles) - $maxFiles);
            foreach ($filesToRemove as $file) {
                unlink($file);
            }
        }
        
        // Rotate current log if it's too large (> 10MB)
        if (file_exists($this->logFile) && filesize($this->logFile) > 10 * 1024 * 1024) {
            $rotatedFile = $this->logFile . '.' . date('Y-m-d-H-i-s');
            rename($this->logFile, $rotatedFile);
        }
    }
}
