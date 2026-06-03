# 📧 Countryball Cards Email Collection System

A comprehensive backend email collection system that replaces EmailJS with a robust, self-hosted solution featuring database storage, Google Mail API integration, and powerful analytics.

## 🚀 Features

- **Database Storage**: SQLite/MySQL backend for reliable email storage
- **Google Mail API**: Send welcome emails and campaigns directly through Gmail
- **Analytics Integration**: Google Analytics and Reddit Pixel tracking
- **Rate Limiting**: Built-in protection against spam and abuse
- **Admin Dashboard**: Web-based interface for managing subscribers
- **Export Functionality**: CSV export for email lists
- **Responsive Design**: Works on all devices
- **Security**: Input validation, CORS protection, and secure storage

## 📁 Project Structure

```
countryball-cards/
├── backend/                    # Backend email system
│   ├── api.php                # Main API endpoint
│   ├── install.php            # Installation script
│   ├── admin.html             # Admin dashboard
│   ├── google_auth_setup.php  # Google API setup
│   ├── composer.json          # PHP dependencies
│   ├── config/                # Configuration files
│   │   ├── database.php       # Database connection
│   │   └── .env.example       # Environment template
│   ├── models/                # Data models
│   │   └── EmailSubscriber.php
│   ├── services/              # Business logic
│   │   └── GoogleMailService.php
│   └── utils/                 # Utilities
│       ├── Logger.php
│       └── RateLimiter.php
├── js/                        # Frontend JavaScript
│   └── email-collector.js     # Email collection client
├── index.html                 # Homepage (updated)
├── join.html                  # Newsletter signup (updated)
├── packages.html              # Packages page
└── README.md                  # This file
```

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd backend
composer install
```

### 2. Run Installation

**Via Web Interface:**
```
http://yourdomain.com/backend/install.php
```

**Via Command Line:**
```bash
php backend/install.php
```

### 3. Configure Environment

Copy and edit the environment file:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your settings:
```env
# Database Configuration
DB_HOST=localhost
DB_NAME=countryball_emails
DB_USER=your_db_user
DB_PASS=your_db_password

# Google Mail API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# SMTP Configuration  
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Security
API_KEY=your_secure_api_key_here
```

### 4. Set Up Google Mail API

Run the Google authentication setup:
```bash
php backend/google_auth_setup.php
```

Or visit: `http://yourdomain.com/backend/google_auth_setup.php`

### 5. Update HTML Files

The system is backward compatible with EmailJS, but for full features, update your HTML files to include:

```html
<!-- Replace EmailJS script with -->
<script src="js/email-collector.js"></script>
```

### 6. Test the System

- **Health Check**: `http://yourdomain.com/backend/api.php/health`
- **Admin Dashboard**: `http://yourdomain.com/backend/admin.html`
- **Test Subscription**: Use any email form on your website

## 🔧 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api.php/subscribe` | Subscribe email to newsletter |
| POST | `/api.php/unsubscribe` | Unsubscribe from newsletter |
| GET | `/api.php/stats` | Get public statistics |
| GET | `/api.php/health` | System health check |

### Protected Endpoints (require API key)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api.php/subscribers` | Get subscriber list |
| POST | `/api.php/send-campaign` | Send email campaign |

### Example API Usage

**Subscribe to Newsletter:**
```javascript
fetch('/backend/api.php/subscribe', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'user@example.com',
        source: 'homepage'
    })
});
```

**Get Statistics:**
```javascript
fetch('/backend/api.php/stats')
    .then(response => response.json())
    .then(data => console.log(data));
```

## 🎯 JavaScript Integration

### Basic Usage

```javascript
// Initialize the email collector
const collector = new CountryballEmailCollector();

// Subscribe an email
collector.subscribe('user@example.com', {
    source: 'homepage',
    campaign: 'launch_2025'
}).then(result => {
    console.log('Subscription successful:', result);
}).catch(error => {
    console.error('Subscription failed:', error);
});
```

### Form Handler

```javascript
// Auto-handle forms
new EmailFormHandler('#myEmailForm');

// Or with custom collector
const collector = new CountryballEmailCollector({ debug: true });
new EmailFormHandler('#myEmailForm', collector);
```

### Advanced Configuration

```javascript
const collector = new CountryballEmailCollector({
    baseUrl: '/backend/api.php',
    debug: true,
    retryAttempts: 3,
    retryDelay: 1000
});
```

## 📊 Admin Dashboard

Access the admin dashboard at `/backend/admin.html` to:

- View subscriber statistics
- Export email lists 
- Send email campaigns
- Monitor signup sources
- Manage unsubscriptions

**Default admin credentials:** Set your API key in the dashboard configuration.

## 🔐 Security Features

- **Rate Limiting**: Prevents spam submissions
- **Input Validation**: Sanitizes all user input
- **CORS Protection**: Configurable allowed origins
- **API Authentication**: Secure API key system
- **Data Encryption**: Secure storage of sensitive data
- **SQL Injection Protection**: Prepared statements

## 📈 Analytics Integration

The system automatically tracks events with:

- **Google Analytics**: Email signup events
- **Reddit Pixel**: Conversion tracking
- **Custom Analytics**: Built-in subscriber analytics

### Migration Steps

1. Install the backend system
2. Include the new JavaScript library
3. Update forms to use the new handlers
4. Remove old EmailJS scripts (optional)

## 🛠️ Customization

### Custom Email Templates

Edit templates in `backend/services/GoogleMailService.php`:

```php
private function getWelcomeEmailTemplate($subscriberData = []) {
    return '
    <!DOCTYPE html>
    <html>
    <!-- Your custom HTML template -->
    </html>';
}
```

### Custom Analytics

Add custom tracking in `js/email-collector.js`:

```javascript
trackAnalytics(eventName, properties = {}) {
    // Add your custom analytics here
    if (window.yourAnalytics) {
        window.yourAnalytics.track(eventName, properties);
    }
}
```

## 🔧 Maintenance

### Backup

The system automatically creates backups, but you can also:

```bash
# Manual backup
php backend/backup.php

# Scheduled backup (add to cron)
0 2 * * * /usr/bin/php /path/to/backend/backup.php
```

### Log Rotation

Logs are automatically rotated, but you can manually rotate:

```bash
php backend/rotate_logs.php
```

### Database Maintenance

```bash
# Optimize database
php backend/optimize_db.php

# Clean old logs
php backend/cleanup.php
```

## 🚨 Troubleshooting

### Common Issues

**1. "Database connection failed"**
- Check database credentials in `.env`
- Ensure database server is running
- Verify user permissions

**2. "Google Mail API not working"**
- Run `php backend/google_auth_setup.php`
- Check API credentials
- Verify OAuth consent screen

**3. "Permission denied errors"**
- Set proper file permissions: `chmod 755 backend/data`
- Ensure web server can write to data directory

**4. "Rate limit exceeded"**
- Adjust rate limits in configuration
- Check IP allowlists
- Review rate limiting logs

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const collector = new CountryballEmailCollector({ debug: true });
```

Or set in PHP:
```php
$_ENV['APP_DEBUG'] = 'true';
```

### Log Files

Check logs for issues:
- `backend/logs/app.log` - Application logs
- `backend/logs/email.log` - Email-specific logs
- `backend/logs/api.log` - API request logs

## 📞 Support

For issues or questions:

1. Check the troubleshooting section
2. Review log files
3. Check GitHub issues
4. Contact support

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📋 Changelog

### Version 1.0.0
- Initial release
- Basic email collection
- Google Mail API integration
- Admin dashboard
- Analytics integration

---

Built with ❤️ for Countryball Cards
