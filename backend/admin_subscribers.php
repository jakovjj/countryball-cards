<?php
/**
 * Admin API for subscriber management
 * Requires authentication via session or API key
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

// Check authentication
if (empty($_SESSION['admin_logged_in']) && empty($_GET['admin_key'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}

require_once __DIR__ . '/models/EmailSubscriber.php';

class AdminSubscriberAPI {
    private $emailModel;

    public function __construct() {
        $this->emailModel = new EmailSubscriber();
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $action = $_GET['action'] ?? '';

            switch ($action) {
                case 'list':
                    $this->getSubscribers();
                    break;
                case 'export':
                    $this->exportSubscribers();
                    break;
                case 'delete':
                    $this->deleteSubscriber();
                    break;
                case 'update_status':
                    $this->updateSubscriberStatus();
                    break;
                case 'search':
                    $this->searchSubscribers();
                    break;
                case 'recent':
                    $this->getRecentSubscribers();
                    break;
                default:
                    $this->sendError('Invalid action', 400);
            }
        } catch (Exception $e) {
            $this->sendError('Server error: ' . $e->getMessage(), 500);
        }
    }

    private function getSubscribers() {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $status = $_GET['status'] ?? '';
        $source = $_GET['source'] ?? '';
        $search = $_GET['search'] ?? '';

        try {
            $db = $this->emailModel->getDb();
            
            // Build WHERE clause
            $where = [];
            $params = [];
            
            if ($status) {
                $where[] = "status = ?";
                $params[] = $status;
            }
            
            if ($source) {
                $where[] = "source = ?";
                $params[] = $source;
            }
            
            if ($search) {
                $where[] = "email LIKE ?";
                $params[] = "%$search%";
            }
            
            $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // Get total count
            $countSql = "SELECT COUNT(*) FROM email_subscribers $whereClause";
            $stmt = $db->prepare($countSql);
            $stmt->execute($params);
            $total = $stmt->fetchColumn();
            
            // Get subscribers
            $sql = "SELECT id, email, status, source, country, subscribed_at, unsubscribed_at, 
                           utm_source, utm_medium, utm_campaign 
                    FROM email_subscribers $whereClause 
                    ORDER BY subscribed_at DESC 
                    LIMIT $limit OFFSET $offset";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format dates
            foreach ($subscribers as &$subscriber) {
                $subscriber['subscribed_at_formatted'] = date('M j, Y g:i A', strtotime($subscriber['subscribed_at']));
                if ($subscriber['unsubscribed_at']) {
                    $subscriber['unsubscribed_at_formatted'] = date('M j, Y g:i A', strtotime($subscriber['unsubscribed_at']));
                }
            }
            
            $this->sendSuccess([
                'subscribers' => $subscribers,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Failed to fetch subscribers: ' . $e->getMessage(), 500);
        }
    }

    private function getRecentSubscribers() {
        try {
            $db = $this->emailModel->getDb();
            
            $sql = "SELECT id, email, status, source, subscribed_at 
                    FROM email_subscribers 
                    ORDER BY subscribed_at DESC 
                    LIMIT 10";
            
            $stmt = $db->query($sql);
            $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format dates
            foreach ($subscribers as &$subscriber) {
                $subscriber['subscribed_at_formatted'] = date('M j, Y g:i A', strtotime($subscriber['subscribed_at']));
                $subscriber['time_ago'] = $this->timeAgo($subscriber['subscribed_at']);
            }
            
            $this->sendSuccess(['recent_subscribers' => $subscribers]);
            
        } catch (Exception $e) {
            $this->sendError('Failed to fetch recent subscribers: ' . $e->getMessage(), 500);
        }
    }

    private function exportSubscribers() {
        try {
            $format = $_GET['format'] ?? 'csv';
            $status = $_GET['status'] ?? '';
            
            $db = $this->emailModel->getDb();
            
            $where = $status ? "WHERE status = ?" : "";
            $params = $status ? [$status] : [];
            
            $sql = "SELECT email, status, source, country, subscribed_at, unsubscribed_at, 
                           utm_source, utm_medium, utm_campaign 
                    FROM email_subscribers $where 
                    ORDER BY subscribed_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($format === 'csv') {
                $this->exportToCsv($subscribers);
            } else {
                $this->sendSuccess(['subscribers' => $subscribers]);
            }
            
        } catch (Exception $e) {
            $this->sendError('Export failed: ' . $e->getMessage(), 500);
        }
    }

    private function exportToCsv($subscribers) {
        $filename = 'subscribers_' . date('Y-m-d_H-i-s') . '.csv';
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        
        $output = fopen('php://output', 'w');
        
        // CSV headers
        fputcsv($output, [
            'Email', 'Status', 'Source', 'Country', 'Subscribed At', 'Unsubscribed At',
            'UTM Source', 'UTM Medium', 'UTM Campaign'
        ]);
        
        // CSV data
        foreach ($subscribers as $subscriber) {
            fputcsv($output, [
                $subscriber['email'],
                $subscriber['status'],
                $subscriber['source'],
                $subscriber['country'],
                $subscriber['subscribed_at'],
                $subscriber['unsubscribed_at'],
                $subscriber['utm_source'],
                $subscriber['utm_medium'],
                $subscriber['utm_campaign']
            ]);
        }
        
        fclose($output);
        exit;
    }

    private function deleteSubscriber() {
        try {
            $email = $_POST['email'] ?? $_GET['email'] ?? '';
            
            if (empty($email)) {
                $this->sendError('Email is required', 400);
                return;
            }
            
            $db = $this->emailModel->getDb();
            
            $sql = "DELETE FROM email_subscribers WHERE email = ?";
            $stmt = $db->prepare($sql);
            $result = $stmt->execute([$email]);
            
            if ($result && $stmt->rowCount() > 0) {
                $this->sendSuccess(['message' => 'Subscriber deleted successfully']);
            } else {
                $this->sendError('Subscriber not found', 404);
            }
            
        } catch (Exception $e) {
            $this->sendError('Delete failed: ' . $e->getMessage(), 500);
        }
    }

    private function updateSubscriberStatus() {
        try {
            $email = $_POST['email'] ?? '';
            $status = $_POST['status'] ?? '';
            
            if (empty($email) || empty($status)) {
                $this->sendError('Email and status are required', 400);
                return;
            }
            
            $validStatuses = ['pending', 'confirmed', 'unsubscribed', 'bounced'];
            if (!in_array($status, $validStatuses)) {
                $this->sendError('Invalid status', 400);
                return;
            }
            
            $db = $this->emailModel->getDb();
            
            $sql = "UPDATE email_subscribers SET status = ? WHERE email = ?";
            $stmt = $db->prepare($sql);
            $result = $stmt->execute([$status, $email]);
            
            if ($result && $stmt->rowCount() > 0) {
                $this->sendSuccess(['message' => 'Status updated successfully']);
            } else {
                $this->sendError('Subscriber not found', 404);
            }
            
        } catch (Exception $e) {
            $this->sendError('Update failed: ' . $e->getMessage(), 500);
        }
    }

    private function searchSubscribers() {
        try {
            $query = $_GET['q'] ?? '';
            
            if (strlen($query) < 2) {
                $this->sendError('Search query must be at least 2 characters', 400);
                return;
            }
            
            $db = $this->emailModel->getDb();
            
            $sql = "SELECT id, email, status, source, subscribed_at 
                    FROM email_subscribers 
                    WHERE email LIKE ? 
                    ORDER BY subscribed_at DESC 
                    LIMIT 20";
            
            $stmt = $db->prepare($sql);
            $stmt->execute(["%$query%"]);
            $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($subscribers as &$subscriber) {
                $subscriber['subscribed_at_formatted'] = date('M j, Y g:i A', strtotime($subscriber['subscribed_at']));
            }
            
            $this->sendSuccess(['subscribers' => $subscribers]);
            
        } catch (Exception $e) {
            $this->sendError('Search failed: ' . $e->getMessage(), 500);
        }
    }

    private function timeAgo($datetime) {
        $time = time() - strtotime($datetime);
        
        if ($time < 60) return 'just now';
        if ($time < 3600) return floor($time/60) . ' minutes ago';
        if ($time < 86400) return floor($time/3600) . ' hours ago';
        if ($time < 2592000) return floor($time/86400) . ' days ago';
        if ($time < 31536000) return floor($time/2592000) . ' months ago';
        
        return floor($time/31536000) . ' years ago';
    }

    private function sendSuccess($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data,
            'timestamp' => date('c')
        ]);
    }

    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message,
            'timestamp' => date('c')
        ]);
    }
}

// Handle request
$api = new AdminSubscriberAPI();
$api->handleRequest();
