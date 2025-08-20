<?php
/**
 * Google Mail API Integration
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../models/EmailSubscriber.php';

class GoogleMailService {
    private $client;
    private $service;
    private $configFile;

    public function __construct() {
        $this->configFile = __DIR__ . '/../config/google_credentials.json';
        $this->initializeClient();
    }

    /**
     * Initialize Google Client
     */
    private function initializeClient() {
        $this->client = new Google_Client();
        $this->client->setApplicationName('Countryball Cards Email Collector');
        $this->client->setScopes([
            Google_Service_Gmail::GMAIL_SEND,
            Google_Service_Gmail::GMAIL_COMPOSE,
            Google_Service_Gmail::GMAIL_MODIFY
        ]);

        // Load credentials from environment or file
        if (file_exists($this->configFile)) {
            $this->client->setAuthConfig($this->configFile);
        } else {
            // Set credentials from environment variables
            $this->client->setClientId($_ENV['GOOGLE_CLIENT_ID'] ?? '');
            $this->client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET'] ?? '');
            $this->client->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI'] ?? '');
        }

        $this->client->setAccessType('offline');
        $this->client->setPrompt('select_account consent');

        // Load refresh token if available
        $tokenPath = __DIR__ . '/../config/gmail_token.json';
        if (file_exists($tokenPath)) {
            $accessToken = json_decode(file_get_contents($tokenPath), true);
            $this->client->setAccessToken($accessToken);

            // Refresh token if expired
            if ($this->client->isAccessTokenExpired()) {
                if ($this->client->getRefreshToken()) {
                    $this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
                    file_put_contents($tokenPath, json_encode($this->client->getAccessToken()));
                }
            }
        }

        $this->service = new Google_Service_Gmail($this->client);
    }

    /**
     * Get authorization URL for first-time setup
     */
    public function getAuthUrl() {
        return $this->client->createAuthUrl();
    }

    /**
     * Handle OAuth callback and save token
     */
    public function handleCallback($authCode) {
        $accessToken = $this->client->fetchAccessTokenWithAuthCode($authCode);
        
        if (array_key_exists('error', $accessToken)) {
            throw new Exception('Error fetching access token: ' . $accessToken['error']);
        }

        $tokenPath = __DIR__ . '/../config/gmail_token.json';
        file_put_contents($tokenPath, json_encode($accessToken));
        
        return true;
    }

    /**
     * Send welcome email to new subscriber
     */
    public function sendWelcomeEmail($email, $subscriberData = []) {
        try {
            $subject = '🎉 Welcome to Countryball Cards - Your Early Bird Spot is Reserved!';
            $htmlBody = $this->getWelcomeEmailTemplate($subscriberData);
            $plainBody = $this->getWelcomeEmailPlainText($subscriberData);

            return $this->sendEmail($email, $subject, $htmlBody, $plainBody);

        } catch (Exception $e) {
            error_log('Failed to send welcome email: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send kickstarter launch notification
     */
    public function sendLaunchNotification($email, $discountCode = null) {
        try {
            $subject = '🚀 Countryball Cards is LIVE on Kickstarter!';
            $htmlBody = $this->getLaunchEmailTemplate($discountCode);
            $plainBody = $this->getLaunchEmailPlainText($discountCode);

            return $this->sendEmail($email, $subject, $htmlBody, $plainBody);

        } catch (Exception $e) {
            error_log('Failed to send launch notification: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send batch emails to subscribers
     */
    public function sendBatchEmails($subject, $htmlTemplate, $plainTemplate, $filters = []) {
        $emailModel = new EmailSubscriber();
        $subscribers = $emailModel->getSubscribers($filters);
        
        $results = [
            'sent' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($subscribers as $subscriber) {
            try {
                $success = $this->sendEmail(
                    $subscriber['email'],
                    $subject,
                    $htmlTemplate,
                    $plainTemplate
                );

                if ($success) {
                    $results['sent']++;
                    // Update last email sent timestamp
                    $this->updateLastEmailSent($subscriber['email']);
                } else {
                    $results['failed']++;
                }

                // Add delay to avoid rate limiting
                usleep(100000); // 0.1 second delay

            } catch (Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'email' => $subscriber['email'],
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Send individual email
     */
    private function sendEmail($to, $subject, $htmlBody, $plainBody = '') {
        try {
            $fromEmail = $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@countryballcards.com';
            $fromName = $_ENV['SMTP_FROM_NAME'] ?? 'Countryball Cards';

            $message = new Google_Service_Gmail_Message();
            
            $rawMessage = $this->createRawMessage($to, $fromEmail, $fromName, $subject, $htmlBody, $plainBody);
            $message->setRaw($rawMessage);

            $result = $this->service->users_messages->send('me', $message);
            
            if ($result->getId()) {
                error_log("Email sent successfully to $to");
                return true;
            }

            return false;

        } catch (Exception $e) {
            error_log("Failed to send email to $to: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create raw email message
     */
    private function createRawMessage($to, $from, $fromName, $subject, $htmlBody, $plainBody = '') {
        $boundary = uniqid(rand(), true);
        
        $rawMessage = "To: $to\r\n";
        $rawMessage .= "From: $fromName <$from>\r\n";
        $rawMessage .= "Subject: $subject\r\n";
        $rawMessage .= "MIME-Version: 1.0\r\n";
        $rawMessage .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n\r\n";

        // Plain text part
        if ($plainBody) {
            $rawMessage .= "--$boundary\r\n";
            $rawMessage .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $rawMessage .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
            $rawMessage .= $plainBody . "\r\n\r\n";
        }

        // HTML part
        $rawMessage .= "--$boundary\r\n";
        $rawMessage .= "Content-Type: text/html; charset=UTF-8\r\n";
        $rawMessage .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
        $rawMessage .= $htmlBody . "\r\n\r\n";

        $rawMessage .= "--$boundary--";

        return base64url_encode($rawMessage);
    }

    /**
     * Update last email sent timestamp
     */
    private function updateLastEmailSent($email) {
        try {
            $emailModel = new EmailSubscriber();
            $db = $emailModel->getDatabase();
            
            $sql = "UPDATE email_subscribers SET 
                    last_email_sent = CURRENT_TIMESTAMP,
                    email_count = email_count + 1
                    WHERE email = ?";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([$email]);
        } catch (Exception $e) {
            error_log("Failed to update last email sent: " . $e->getMessage());
        }
    }

    /**
     * Welcome email HTML template
     */
    private function getWelcomeEmailTemplate($subscriberData = []) {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Countryball Cards!</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #c7a455 0%, #b8954a 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Welcome to Countryball Cards!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Your Early Bird Spot is Reserved</p>
                </div>

                <!-- Content -->
                <div style="padding: 30px;">
                    <h2 style="color: #333; margin: 0 0 20px; font-size: 24px;">Thank you for joining our community! 🌍</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin: 0 0 20px; font-size: 16px;">
                        You\'re now part of our exclusive early bird community and will be among the first to know when we launch on Kickstarter on <strong>October 1st, 2025</strong>.
                    </p>

                    <div style="background-color: #f8f9fa; border-left: 4px solid #c7a455; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <h3 style="color: #c7a455; margin: 0 0 10px; font-size: 18px;">🎁 Your Early Bird Benefits:</h3>
                        <ul style="color: #666; margin: 0; padding-left: 20px;">
                            <li>5€ discount on your first order</li>
                            <li>Free shipping to EU/US</li>
                            <li>Exclusive access to limited edition cards</li>
                            <li>Priority customer support</li>
                        </ul>
                    </div>

                    <p style="color: #666; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                        While you wait, check out our free print-and-play version and join our community:
                    </p>

                    <!-- CTA Buttons -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://countryballcards.com/printandplay.html" style="display: inline-block; background-color: #c7a455; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px 10px;">Download Free Game</a>
                        <a href="https://discord.gg/your-discord" style="display: inline-block; background-color: #5865F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px 10px;">Join Discord</a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #666; margin: 0; font-size: 14px;">
                        © 2025 Countryball Cards • Made for fans of countryballs & strategy
                    </p>
                    <p style="color: #999; margin: 10px 0 0; font-size: 12px;">
                        <a href="https://countryballcards.com/unsubscribe?email=' . urlencode($subscriberData['email'] ?? '') . '" style="color: #999;">Unsubscribe</a> • 
                        <a href="https://countryballcards.com/privacy-policy.html" style="color: #999;">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </body>
        </html>';
    }

    /**
     * Welcome email plain text template
     */
    private function getWelcomeEmailPlainText($subscriberData = []) {
        return "Welcome to Countryball Cards!

Thank you for joining our community! You're now part of our exclusive early bird community and will be among the first to know when we launch on Kickstarter on October 1st, 2025.

Your Early Bird Benefits:
• 5€ discount on your first order
• Free shipping to EU/US
• Exclusive access to limited edition cards
• Priority customer support

While you wait, check out our free print-and-play version:
https://countryballcards.com/printandplay.html

Join our Discord community:
https://discord.gg/your-discord

© 2025 Countryball Cards
Unsubscribe: https://countryballcards.com/unsubscribe?email=" . urlencode($subscriberData['email'] ?? '');
    }

    /**
     * Launch notification templates (placeholder)
     */
    private function getLaunchEmailTemplate($discountCode = null) {
        // Implementation for launch email template
        return '<h1>We\'re Live on Kickstarter!</h1>';
    }

    private function getLaunchEmailPlainText($discountCode = null) {
        // Implementation for launch email plain text
        return 'We\'re Live on Kickstarter!';
    }
}

/**
 * Helper function for base64url encoding
 */
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
