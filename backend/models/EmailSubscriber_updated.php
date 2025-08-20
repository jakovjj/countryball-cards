<?php
/**
 * Email Subscriber Model
 */

require_once __DIR__ . '/../config/database.php';

class EmailSubscriber {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();

        // Ensure tables exist
        $database->createTables();
    }

    /**
     * Get database connection (for admin API)
     */
    public function getDb() {
        return $this->db;
    }

    /**
     * Add new email subscriber
     */
    public function addSubscriber($email, $source = 'unknown', $metadata = []) {
        try {
            // Validate email
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('Invalid email address');
            }

            // Check if email already exists
            if ($this->emailExists($email)) {
                // Update existing subscriber instead of creating duplicate
                return $this->updateSubscriber($email, $source, $metadata);
            }

            // Collect additional metadata
            $ipAddress = $this->getClientIP();
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $referrer = $_SERVER['HTTP_REFERER'] ?? '';
            $country = $this->getCountryFromIP($ipAddress);

            // Extract UTM parameters
            $utmSource = $_GET['utm_source'] ?? $metadata['utm_source'] ?? '';
            $utmMedium = $_GET['utm_medium'] ?? $metadata['utm_medium'] ?? '';
            $utmCampaign = $_GET['utm_campaign'] ?? $metadata['utm_campaign'] ?? '';

            $sql = "INSERT INTO email_subscribers (
                email, source, ip_address, user_agent, country, referrer,
                utm_source, utm_medium, utm_campaign, metadata, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')";

            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([
                $email,
                $source,
                $ipAddress,
                $userAgent,
                $country,
                $referrer,
                $utmSource,
                $utmMedium,
                $utmCampaign,
                json_encode($metadata)
            ]);

            if ($result) {
                $subscriberId = $this->db->lastInsertId();
                $this->logAction($email, 'subscribed', "New subscription from $source", $ipAddress);

                // Trigger welcome email (async)
                $this->triggerWelcomeEmail($email, $subscriberId);

                return [
                    'success' => true,
                    'subscriber_id' => $subscriberId,
                    'message' => 'Successfully subscribed'
                ];
            }

            throw new Exception('Failed to insert subscriber');

        } catch (Exception $e) {
            $this->logAction($email, 'subscription_failed', $e->getMessage(), $this->getClientIP(), false);
            throw $e;
        }
    }

    /**
     * Update existing subscriber
     */
    private function updateSubscriber($email, $source, $metadata = []) {
        $sql = "UPDATE email_subscribers SET
                source = CASE WHEN source = 'unknown' THEN ? ELSE source END,
                ip_address = ?,
                user_agent = ?,
                metadata = ?,
                status = CASE WHEN status = 'unsubscribed' THEN 'pending' ELSE status END
                WHERE email = ?";

        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute([
            $source,
            $this->getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            json_encode($metadata),
            $email
        ]);

        if ($result) {
            $this->logAction($email, 'resubscribed', "Updated subscription from $source");
            return [
                'success' => true,
                'message' => 'Subscription updated'
            ];
        }

        throw new Exception('Failed to update subscriber');
    }

    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $sql = "SELECT COUNT(*) FROM email_subscribers WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Get subscriber by email
     */
    public function getSubscriber($email) {
        $sql = "SELECT * FROM email_subscribers WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    /**
     * Get all subscribers with optional filters
     */
    public function getSubscribers($filters = []) {
        $where = [];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = "status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['source'])) {
            $where[] = "source = ?";
            $params[] = $filters['source'];
        }

        if (!empty($filters['since'])) {
            $where[] = "subscribed_at >= ?";
            $params[] = $filters['since'];
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT * FROM email_subscribers $whereClause ORDER BY subscribed_at DESC";

        if (!empty($filters['limit'])) {
            $sql .= " LIMIT " . intval($filters['limit']);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Unsubscribe email
     */
    public function unsubscribe($email, $reason = '') {
        $sql = "UPDATE email_subscribers SET
                status = 'unsubscribed',
                unsubscribed_at = CURRENT_TIMESTAMP
                WHERE email = ?";

        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute([$email]);

        if ($result) {
            $this->logAction($email, 'unsubscribed', $reason);
            return true;
        }

        return false;
    }

    /**
     * Get statistics
     */
    public function getStats() {
        $stats = [];

        // Total subscribers
        $sql = "SELECT COUNT(*) as total FROM email_subscribers";
        $stmt = $this->db->query($sql);
        $stats['total'] = $stmt->fetchColumn();

        // Active subscribers
        $sql = "SELECT COUNT(*) as active FROM email_subscribers WHERE status IN ('pending', 'confirmed')";
        $stmt = $this->db->query($sql);
        $stats['active'] = $stmt->fetchColumn();

        // Unsubscribed
        $sql = "SELECT COUNT(*) as unsubscribed FROM email_subscribers WHERE status = 'unsubscribed'";
        $stmt = $this->db->query($sql);
        $stats['unsubscribed'] = $stmt->fetchColumn();

        // Today's signups
        $sql = "SELECT COUNT(*) as today FROM email_subscribers WHERE DATE(subscribed_at) = DATE('now')";
        $stmt = $this->db->query($sql);
        $stats['today'] = $stmt->fetchColumn();

        // Sources breakdown
        $sql = "SELECT source, COUNT(*) as count FROM email_subscribers GROUP BY source ORDER BY count DESC";
        $stmt = $this->db->query($sql);
        $stats['sources'] = $stmt->fetchAll();

        return $stats;
    }

    /**
     * Export subscribers for Google Mail API
     */
    public function exportForGoogleMail($status = 'confirmed') {
        $sql = "SELECT email, subscribed_at, source, metadata FROM email_subscribers WHERE status = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$status]);
        return $stmt->fetchAll();
    }

    /**
     * Log action
     */
    private function logAction($email, $action, $details = '', $ipAddress = null, $success = true) {
        try {
            $sql = "INSERT INTO email_logs (email, action, details, ip_address, success) VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $email,
                $action,
                $details,
                $ipAddress ?? $this->getClientIP(),
                $success ? 1 : 0
            ]);
        } catch (Exception $e) {
            // Silent fail for logging
            error_log("Failed to log email action: " . $e->getMessage());
        }
    }

    /**
     * Get client IP address
     */
    private function getClientIP() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];

        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = trim(explode(',', $_SERVER[$key])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    /**
     * Get country from IP (simple implementation)
     */
    private function getCountryFromIP($ip) {
        // This is a simple implementation
        // In production, you might want to use a proper GeoIP service
        if ($ip === 'unknown' || filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return 'unknown';
        }

        try {
            $response = @file_get_contents("http://ip-api.com/json/$ip?fields=countryCode");
            if ($response) {
                $data = json_decode($response, true);
                return $data['countryCode'] ?? 'unknown';
            }
        } catch (Exception $e) {
            // Silent fail
        }

        return 'unknown';
    }

    /**
     * Trigger welcome email (to be implemented with Google Mail API)
     */
    private function triggerWelcomeEmail($email, $subscriberId) {
        // This will be implemented when we integrate with Google Mail API
        // For now, just log the intent
        $this->logAction($email, 'welcome_email_queued', "Subscriber ID: $subscriberId");
    }

    /**
     * Test database connection
     */
    public function testConnection() {
        try {
            return $this->db->query('SELECT 1')->fetchColumn() == 1;
        } catch (Exception $e) {
            return false;
        }
    }
}
