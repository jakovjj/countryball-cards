<?php
/**
 * Rate Limiter utility
 */

class RateLimiter {
    private $maxRequests;
    private $timeWindow;
    private $storageFile;

    public function __construct($maxRequests = 10, $timeWindow = 60) {
        $this->maxRequests = $maxRequests;
        $this->timeWindow = $timeWindow;
        $this->storageFile = __DIR__ . '/../data/rate_limits.json';
        
        // Ensure data directory exists
        $dataDir = dirname($this->storageFile);
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }
    }

    public function checkLimit($identifier) {
        $now = time();
        $limits = $this->loadLimits();

        // Clean old entries
        $this->cleanOldEntries($limits, $now);

        $key = md5($identifier);
        
        if (!isset($limits[$key])) {
            $limits[$key] = [];
        }

        // Count requests in the current time window
        $recentRequests = array_filter($limits[$key], function($timestamp) use ($now) {
            return ($now - $timestamp) < $this->timeWindow;
        });

        if (count($recentRequests) >= $this->maxRequests) {
            return false; // Rate limit exceeded
        }

        // Add current request
        $limits[$key][] = $now;
        
        // Keep only recent requests
        $limits[$key] = array_filter($limits[$key], function($timestamp) use ($now) {
            return ($now - $timestamp) < $this->timeWindow;
        });

        $this->saveLimits($limits);
        return true;
    }

    private function loadLimits() {
        if (file_exists($this->storageFile)) {
            $content = file_get_contents($this->storageFile);
            return json_decode($content, true) ?: [];
        }
        return [];
    }

    private function saveLimits($limits) {
        file_put_contents($this->storageFile, json_encode($limits), LOCK_EX);
    }

    private function cleanOldEntries(&$limits, $now) {
        foreach ($limits as $key => $requests) {
            $limits[$key] = array_filter($requests, function($timestamp) use ($now) {
                return ($now - $timestamp) < $this->timeWindow;
            });
            
            // Remove empty entries
            if (empty($limits[$key])) {
                unset($limits[$key]);
            }
        }
    }

    public function getRemainingRequests($identifier) {
        $now = time();
        $limits = $this->loadLimits();
        $key = md5($identifier);

        if (!isset($limits[$key])) {
            return $this->maxRequests;
        }

        $recentRequests = array_filter($limits[$key], function($timestamp) use ($now) {
            return ($now - $timestamp) < $this->timeWindow;
        });

        return max(0, $this->maxRequests - count($recentRequests));
    }

    public function getResetTime($identifier) {
        $now = time();
        $limits = $this->loadLimits();
        $key = md5($identifier);

        if (!isset($limits[$key]) || empty($limits[$key])) {
            return $now;
        }

        $oldestRequest = min($limits[$key]);
        return $oldestRequest + $this->timeWindow;
    }
}
