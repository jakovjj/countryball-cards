<?php
// Initialize variables for form processing
$formMessage = '';
$messageType = '';
$isFormSubmitted = false;

// Process form submission if POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $isFormSubmitted = true;
    
    // Get form data
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
    $source = $_POST['source'] ?? 'form_unknown';
    $pageUrl = $_POST['page_url'] ?? '';
    $timestamp = $_POST['timestamp'] ?? '';
    
    if (!$email) {
        $formMessage = 'Please enter a valid email address.';
        $messageType = 'error';
    } else {
        // Check if email already exists
        $csvFile = 'emails.csv';
        $emailExists = false;
        
        if (file_exists($csvFile)) {
            $existingEmails = array_map('str_getcsv', file($csvFile));
            foreach ($existingEmails as $row) {
                if (isset($row[0]) && strtolower(trim($row[0], '"')) === strtolower($email)) {
                    $emailExists = true;
                    break;
                }
            }
        }
        
        if ($emailExists) {
            $formMessage = 'This email is already subscribed to our newsletter!';
            $messageType = 'success';
        } else {
            // Prepare data for CSV
            $data = [
                'email' => $email,
                'date' => date('Y-m-d H:i:s'),
                'source' => $source,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'page_url' => $pageUrl,
                'timestamp' => $timestamp
            ];
            
            // Create CSV line
            $csvLine = implode(',', [
                '"' . str_replace('"', '""', $email) . '"',
                '"' . str_replace('"', '""', $data['date']) . '"',
                '"' . str_replace('"', '""', $data['source']) . '"',
                '"' . str_replace('"', '""', $data['ip']) . '"',
                '"' . str_replace('"', '""', $data['user_agent']) . '"',
                '"' . str_replace('"', '""', $data['page_url']) . '"',
                '"' . str_replace('"', '""', $data['timestamp']) . '"'
            ]) . "\n";
            
            // Ensure directory exists and is writable
            $emailsDir = dirname($csvFile);
            if (!is_dir($emailsDir)) {
                mkdir($emailsDir, 0755, true);
            }
            
            // Try to save to CSV file
            try {
                if (file_put_contents($csvFile, $csvLine, FILE_APPEND | LOCK_EX) === false) {
                    throw new Exception('Failed to write to file');
                }
                
                $formMessage = 'Thank you! You\'ve been added to our newsletter. Check your email for confirmation.';
                $messageType = 'success';
                
            } catch (Exception $e) {
                error_log("Email collection error: " . $e->getMessage());
                $formMessage = 'Sorry, there was a problem saving your email. Please try again later.';
                $messageType = 'error';
            }
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta name="referrer" content="no-referrer-when-downgrade" />
  <title>Join Newsletter & Get Updates - Countryball Cards</title>
  <meta name="description" content="Join the Countryball Cards newsletter for Kickstarter updates. Get notified when we launch October 1st, 2025 and receive exclusive updates." />
  <link rel="canonical" href="https://countryballcards.com/join.php" />
  <meta name="robots" content="index,follow" />
  <meta name="theme-color" content="#151515" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://countryballcards.com/join.php">
  <meta property="og:title" content="Join Newsletter & Get Updates - Countryball Cards">
  <meta property="og:description" content="Be the first to know when Countryball Cards launches on Kickstarter October 1st! Join our newsletter for exclusive updates.">
  <meta property="og:image" content="https://countryballcards.com/logo.png">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="Countryball Cards">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://countryballcards.com/join.php">
  <meta property="twitter:title" content="Join Newsletter & Get Updates - Countryball Cards">
  <meta property="twitter:description" content="Be the first to know when Countryball Cards launches on Kickstarter October 1st! Join our newsletter for exclusive updates.">
  <meta property="twitter:image" content="https://countryballcards.com/logo.png">
  
  <!-- Enhanced Favicon Implementation -->
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="icon" sizes="any" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
  
  <!-- Structured Data for Newsletter Signup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Countryball Cards Newsletter Signup",
    "description": "Subscribe to Countryball Cards newsletter for Kickstarter launch updates and exclusive content about the strategic card game.",
    "url": "https://countryballcards.com/join.php",
    "isPartOf": {
      "@type": "WebSite",
      "url": "https://countryballcards.com",
      "name": "Countryball Cards"
    },
    "about": {
      "@type": "Product",
      "name": "Countryball Cards",
      "category": "Card Game"
    }
  }
  </script>
  
  <!-- Critical CSS for above-the-fold content -->
  <style>
    /* Critical styles for immediate render - Optimized for CLS */
    :root {
      --primary: #c7a455;
      --bg-dark: #151515;
      --text-light: #f0f0f0;
      --card-bg: #1e1e1e;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-light);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      flex: 1;
    }
    
    .hero {
      text-align: center;
      padding: 60px 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .logo-section {
      margin-bottom: 40px;
    }
    
    .logo {
      width: 150px;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(199, 164, 85, 0.3);
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      background: linear-gradient(135deg, var(--primary), #f4d03f);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      font-size: 1.2rem;
      margin-bottom: 40px;
      color: #cccccc;
      max-width: 600px;
    }
  </style>
  
  <!-- Load main styles asynchronously to prevent blocking -->
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>

<body>
  <!-- Show form message if there is one -->
  <?php if ($isFormSubmitted && $formMessage): ?>
  <div id="form-message" style="
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 15px 25px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    max-width: 90%;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    background-color: <?php echo $messageType === 'success' ? '#4CAF50' : '#f44336'; ?>;
  ">
    <?php echo $messageType === 'success' ? '✅' : '❌'; ?> <?php echo htmlspecialchars($formMessage); ?>
  </div>
  <script>
    // Auto-hide the message after 5 seconds
    setTimeout(() => {
      const message = document.getElementById('form-message');
      if (message) {
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.5s';
        setTimeout(() => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        }, 500);
      }
    }, 5000);
  </script>
  <?php endif; ?>

  <div class="container">
    <section class="hero">
      <div class="logo-section">
        <img src="logo.png" alt="Countryball Cards Logo" class="logo" width="150" height="150" />
      </div>
      
      <h1>Join the Countryball Cards Newsletter</h1>
      <p class="subtitle">
        Be the first to know when we launch on Kickstarter October 1st, 2025! 
        Get exclusive updates, early bird pricing, and behind-the-scenes content.
      </p>
      
      <!-- Newsletter Benefits Box -->
      <div class="newsletter-perks">
        <h2>🎯 Why Join Our Newsletter?</h2>
        <ul class="perks-list">
          <li>🚀 <strong>Early Bird Access:</strong> Get notified 24 hours before public launch</li>
          <li>💰 <strong>Exclusive Discounts:</strong> Newsletter-only pricing and special offers</li>
          <li>🎮 <strong>Game Development Updates:</strong> Behind-the-scenes content and progress</li>
          <li>🏆 <strong>Special Edition Cards:</strong> Access to limited edition variants</li>
          <li>📦 <strong>Kickstarter Insider Info:</strong> Stretch goals and bonus content previews</li>
        </ul>
      </div>
      
      <!-- Email Signup Form - Now submits to same page -->
      <form class="email-form" action="join.php" method="POST" id="joinEmailForm">
        <div class="input-group">
          <input type="email" name="email" id="joinEmailInput" placeholder="Enter your email address" required />
          <button type="submit" id="joinSubmitBtn">Get Updates</button>
        </div>
        <input type="hidden" name="source" value="join_page_form" />
        <input type="hidden" name="page_url" value="" />
        <input type="hidden" name="timestamp" value="" />
      </form>
      
      <p class="privacy-note">
        We respect your privacy. Unsubscribe at any time. 
        <a href="privacy-policy.html">Privacy Policy</a>
      </p>
    </section>
  </div>

  <!-- Comprehensive styling for the page -->
  <style>
    /* Newsletter Perks Styling */
    .newsletter-perks {
      background: linear-gradient(135deg, #1e1e1e, #2a2a2a);
      border: 2px solid var(--primary);
      border-radius: 16px;
      padding: 30px;
      margin: 40px 0;
      max-width: 420px; /* Increased width for mobile */
      width: 100%;
      box-shadow: 0 8px 32px rgba(199, 164, 85, 0.2);
    }
    
    .newsletter-perks h2 {
      color: var(--primary);
      font-size: 1.4rem;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .perks-list {
      list-style: none;
      text-align: left;
    }
    
    .perks-list li {
      margin-bottom: 12px; /* Reduced spacing */
      font-size: 0.95rem; /* Slightly smaller text */
      line-height: 1.4;
      color: #e0e0e0;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    
    .perks-list li strong {
      color: var(--primary);
      font-weight: 600;
    }
    
    /* Email Form Styling */
    .email-form {
      margin: 40px 0;
      width: 100%;
      max-width: 500px;
    }
    
    .input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .input-group input[type="email"] {
      flex: 1;
      min-width: 250px;
      padding: 15px 20px;
      border: 2px solid #333;
      border-radius: 8px;
      background-color: #2a2a2a;
      color: var(--text-light);
      font-size: 16px;
      transition: all 0.3s ease;
    }
    
    .input-group input[type="email"]:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(199, 164, 85, 0.3);
    }
    
    .input-group button {
      padding: 15px 30px;
      background: linear-gradient(135deg, var(--primary), #f4d03f);
      color: #151515;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    
    .input-group button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(199, 164, 85, 0.4);
    }
    
    .privacy-note {
      font-size: 0.9rem;
      color: #999;
      margin-top: 20px;
    }
    
    .privacy-note a {
      color: var(--primary);
      text-decoration: none;
    }
    
    .privacy-note a:hover {
      text-decoration: underline;
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }
      
      .subtitle {
        font-size: 1.1rem;
      }
      
      .newsletter-perks {
        padding: 20px;
        margin: 30px 10px;
      }
      
      .perks-list li {
        font-size: 0.9rem;
        margin-bottom: 10px;
      }
      
      .input-group {
        flex-direction: column;
      }
      
      .input-group input[type="email"] {
        min-width: auto;
        width: 100%;
      }
    }
    
    @media (max-width: 480px) {
      .hero {
        padding: 40px 0;
      }
      
      .newsletter-perks {
        max-width: 350px;
        padding: 15px;
      }
      
      .newsletter-perks h2 {
        font-size: 1.2rem;
      }
      
      .perks-list li {
        font-size: 0.85rem;
        line-height: 1.3;
      }
    }
  </style>

  <!-- Initialize form with hidden field values -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Set hidden field values
      const form = document.getElementById('joinEmailForm');
      if (form) {
        form.querySelector('input[name="page_url"]').value = window.location.href;
        form.querySelector('input[name="timestamp"]').value = new Date().toISOString();
      }
    });
  </script>

  <!-- Performance and Analytics Scripts -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-123456789"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-123456789');
  </script>
</body>
</html>
