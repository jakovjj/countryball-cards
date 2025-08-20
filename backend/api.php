<?php
/**
 * Main API endpoint for email collection
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/models/EmailSubscriber.php';
require_once __DIR__ . '/services/GoogleMailService.php';
require_once __DIR__ . '/utils/RateLimiter.php';
require_once __DIR__ . '/utils/Logger.php';

class EmailAPI {
    private $emailModel;
    private $googleMail;
    private $rateLimiter;
    private $logger;

    public function __construct() {
        $this->emailModel = new EmailSubscriber();
        $this->googleMail = new GoogleMailService();
        $this->rateLimiter = new RateLimiter();
        $this->logger = new Logger();
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $path = $_SERVER['PATH_INFO'] ?? '/';

            // Rate limiting
            if (!$this->rateLimiter->checkLimit($this->getClientIP())) {
                $this->sendError('Rate limit exceeded', 429);
                return;
            }

            switch ($method) {
                case 'POST':
                    $this->handlePost($path);
                    break;
                case 'GET':
                    $this->handleGet($path);
                    break;
                default:
                    $this->sendError('Method not allowed', 405);
            }

        } catch (Exception $e) {
            $this->logger->error('API Error: ' . $e->getMessage());
            $this->sendError('Internal server error', 500);
        }
    }

    private function handlePost($path) {
        $data = json_decode(file_get_contents('php://input'), true);

        switch ($path) {
            case '/subscribe':
                $this->subscribe($data);
                break;
            case '/unsubscribe':
                $this->unsubscribe($data);
                break;
            case '/send-campaign':
                $this->sendCampaign($data);
                break;
            default:
                $this->sendError('Endpoint not found', 404);
        }
    }

    private function handleGet($path) {
        switch ($path) {
            case '/stats':
                $this->getStats();
                break;
            case '/subscribers':
                $this->getSubscribers();
                break;
            case '/health':
                $this->healthCheck();
                break;
            default:
                $this->sendError('Endpoint not found', 404);
        }
    }

    private function subscribe($data) {
        try {
            // Validate input
            if (empty($data['email'])) {
                $this->sendError('Email is required', 400);
                return;
            }

            $email = filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL);
            if (!$email) {
                $this->sendError('Invalid email format', 400);
                return;
            }

            $source = $data['source'] ?? 'api';
            $metadata = [
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'referrer' => $_SERVER['HTTP_REFERER'] ?? '',
                'campaign_data' => $data['campaign'] ?? [],
                'form_data' => $data['form_data'] ?? []
            ];

            // Subscribe user
            $result = $this->emailModel->addSubscriber($email, $source, $metadata);

            if ($result['success']) {
                // Send welcome email asynchronously
                $this->queueWelcomeEmail($email, $result['subscriber_id']);

                $this->sendSuccess([
                    'message' => 'Successfully subscribed to newsletter',
                    'subscriber_id' => $result['subscriber_id']
                ]);
            } else {
                $this->sendError('Failed to subscribe', 500);
            }

        } catch (InvalidArgumentException $e) {
            $this->sendError($e->getMessage(), 400);
        } catch (Exception $e) {
            $this->logger->error('Subscription error: ' . $e->getMessage());
            $this->sendError('Subscription failed', 500);
        }
    }

    private function unsubscribe($data) {
        try {
            if (empty($data['email'])) {
                $this->sendError('Email is required', 400);
                return;
            }

            $email = filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL);
            if (!$email) {
                $this->sendError('Invalid email format', 400);
                return;
            }

            $reason = $data['reason'] ?? 'User request';
            $result = $this->emailModel->unsubscribe($email, $reason);

            if ($result) {
                $this->sendSuccess(['message' => 'Successfully unsubscribed']);
            } else {
                $this->sendError('Unsubscribe failed', 500);
            }

        } catch (Exception $e) {
            $this->logger->error('Unsubscribe error: ' . $e->getMessage());
            $this->sendError('Unsubscribe failed', 500);
        }
    }

    private function sendCampaign($data) {
        // Require authentication for campaign sending
        if (!$this->isAuthenticated()) {
            $this->sendError('Authentication required', 401);
            return;
        }

        try {
            $subject = $data['subject'] ?? '';
            $htmlTemplate = $data['html_template'] ?? '';
            $plainTemplate = $data['plain_template'] ?? '';
            $filters = $data['filters'] ?? ['status' => 'confirmed'];

            if (empty($subject) || empty($htmlTemplate)) {
                $this->sendError('Subject and HTML template are required', 400);
                return;
            }

            $results = $this->googleMail->sendBatchEmails($subject, $htmlTemplate, $plainTemplate, $filters);

            $this->sendSuccess([
                'message' => 'Campaign sent',
                'results' => $results
            ]);

        } catch (Exception $e) {
            $this->logger->error('Campaign send error: ' . $e->getMessage());
            $this->sendError('Campaign send failed', 500);
        }
    }

    private function getStats() {
        try {
            $stats = $this->emailModel->getStats();
            $this->sendSuccess($stats);
        } catch (Exception $e) {
            $this->logger->error('Stats error: ' . $e->getMessage());
            $this->sendError('Failed to get stats', 500);
        }
    }

    private function getSubscribers() {
        // Require authentication for subscriber list
        if (!$this->isAuthenticated()) {
            $this->sendError('Authentication required', 401);
            return;
        }

        try {
            $filters = $_GET;
            $subscribers = $this->emailModel->getSubscribers($filters);
            $this->sendSuccess(['subscribers' => $subscribers]);
        } catch (Exception $e) {
            $this->logger->error('Get subscribers error: ' . $e->getMessage());
            $this->sendError('Failed to get subscribers', 500);
        }
    }

    private function healthCheck() {
        $status = [
            'status' => 'healthy',
            'timestamp' => date('c'),
            'database' => $this->emailModel->testConnection() ? 'connected' : 'disconnected',
            'version' => '1.0.0'
        ];

        $this->sendSuccess($status);
    }

    private function queueWelcomeEmail($email, $subscriberId) {
        // In a production environment, you'd use a proper queue system
        // For now, we'll send it immediately in the background
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        }

        try {
            $subscriber = $this->emailModel->getSubscriber($email);
            $this->googleMail->sendWelcomeEmail($email, $subscriber);
        } catch (Exception $e) {
            $this->logger->error('Welcome email error: ' . $e->getMessage());
        }
    }

    private function isAuthenticated() {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $validApiKey = $_ENV['API_KEY'] ?? 'your_secure_api_key';
        
        return !empty($apiKey) && hash_equals($validApiKey, $apiKey);
    }

    private function getClientIP() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = trim(explode(',', $_SERVER[$key])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
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

// Initialize and handle request
$api = new EmailAPI();
$api->handleRequest();
