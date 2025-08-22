/**
 * Countryball Cards Email Collection Client
 * Replaces EmailJS with custom backend integration
 */

class CountryballEmailCollector {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || window.location.origin + '/backend';
        this.debug = options.debug || false;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        // Analytics integration
        this.analytics = {
            gtag: window.gtag || null,
            rdt: window.rdt || null
        };

        this.log('EmailCollector initialized', { baseUrl: this.baseUrl });
    }

    /**
     * Subscribe email to newsletter
     */
    async subscribe(email, options = {}) {
        try {
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email address');
            }

            const data = {
                email: email.trim().toLowerCase(),
                source: options.source || this.detectSource(),
                campaign: this.getCampaignData(),
                form_data: {
                    page_url: window.location.href,
                    page_title: document.title,
                    timestamp: new Date().toISOString(),
                    ...options.formData
                }
            };

            this.log('Attempting subscription', { email, source: data.source });

            // Try multiple backend endpoints as fallback
            const baseUrls = [
                'https://mineward.us.to/countryball_cards/backend',  // Your actual backend server
                window.location.origin + '/backend',               // Local backend (if exists)
                window.location.origin                             // Root level endpoints
            ];

            const endpoints = [
                '/subscribe.php',
                '/api.php'
            ];

            let lastError = null;

            for (const baseUrl of baseUrls) {
                for (const endpoint of endpoints) {
                    try {
                        const url = baseUrl + endpoint;
                        this.log(`Trying endpoint: ${url}`);
                        
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            body: JSON.stringify(data)
                        });

                        let result;
                        const contentType = response.headers.get('content-type');
                        
                        if (contentType && contentType.includes('application/json')) {
                            result = await response.json();
                        } else {
                            const text = await response.text();
                            this.log(`Non-JSON response from ${url}:`, { status: response.status, text: text.substring(0, 200) });
                            continue; // Try next endpoint
                        }

                        if (response.ok && result.success) {
                            this.log('Subscription successful', result);
                            this.trackAnalytics('email_signup', {
                                event_category: 'conversion',
                                event_label: data.source,
                                value: 1
                            });
                            
                            return {
                                success: true,
                                message: result.message || 'Successfully subscribed!',
                                subscriberId: result.data?.subscriber_id || result.subscriber_id
                            };
                        } else {
                            lastError = new Error(result.error || result.message || `HTTP ${response.status}`);
                            continue; // Try next endpoint
                        }

                    } catch (error) {
                        this.log(`Endpoint ${url || baseUrl + endpoint} failed:`, { error: error.message });
                        lastError = error;
                        continue; // Try next endpoint
                    }
                }
            }

            // If all endpoints failed, throw the last error
            throw lastError || new Error('All subscription endpoints failed');

        } catch (error) {
            this.log('Subscription error', { error: error.message });
            this.trackAnalytics('email_signup_error', {
                event_category: 'error',
                event_label: error.message
            });
            throw error;
        }
    }

    /**
     * Unsubscribe email from newsletter
     */
    async unsubscribe(email, reason = '') {
        try {
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email address');
            }

            const data = {
                email: email.trim().toLowerCase(),
                reason: reason
            };

            const result = await this.makeRequest('/unsubscribe', 'POST', data);

            if (result.success) {
                this.log('Unsubscribe successful');
                return { success: true, message: result.data.message };
            } else {
                throw new Error(result.error || 'Unsubscribe failed');
            }

        } catch (error) {
            this.log('Unsubscribe error', { error: error.message });
            throw error;
        }
    }

    /**
     * Get subscription statistics (public stats only)
     */
    async getStats() {
        try {
            const result = await this.makeRequest('/stats', 'GET');
            return result.success ? result.data : null;
        } catch (error) {
            this.log('Stats error', { error: error.message });
            return null;
        }
    }

    /**
     * Check backend health
     */
    async healthCheck() {
        try {
            const result = await this.makeRequest('/health', 'GET');
            return result.success ? result.data : null;
        } catch (error) {
            this.log('Health check error', { error: error.message });
            return null;
        }
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(endpoint, method = 'GET', data = null, attempt = 1) {
        try {
            const url = this.baseUrl + endpoint;
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            this.log(`Making ${method} request to ${url}`, { data, attempt });

            const response = await fetch(url, options);
            
            // Better error handling for different response types
            let result;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                // Handle non-JSON responses (like error pages)
                const text = await response.text();
                this.log(`Non-JSON response received: ${response.status}`, { text });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                
                // Try to parse as JSON anyway in case it's malformed
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    throw new Error(`Invalid response format from server`);
                }
            }

            if (!response.ok) {
                throw new Error(result.error || result.message || `HTTP ${response.status}`);
            }

            return result;

        } catch (error) {
            this.log(`Request failed (attempt ${attempt})`, { error: error.message });

            if (attempt < this.retryAttempts) {
                await this.delay(this.retryDelay * attempt);
                return this.makeRequest(endpoint, method, data, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Validate email address
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Detect source from current page
     */
    detectSource() {
        const path = window.location.pathname;
        
        if (path.includes('join')) return 'join_page';
        if (path.includes('packages')) return 'packages_page';
        if (path.includes('index') || path === '/') return 'homepage';
        if (path.includes('rules')) return 'rules_page';
        if (path.includes('printandplay')) return 'printandplay_page';
        
        return 'unknown_page';
    }

    /**
     * Get campaign data from URL parameters
     */
    getCampaignData() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            utm_term: urlParams.get('utm_term'),
            utm_content: urlParams.get('utm_content'),
            referrer: document.referrer,
            landing_page: window.location.href
        };
    }

    /**
     * Track analytics events
     */
    trackAnalytics(eventName, properties = {}) {
        try {
            // Google Analytics
            if (this.analytics.gtag) {
                this.analytics.gtag('event', eventName, properties);
            }

            // Reddit Pixel
            if (this.analytics.rdt) {
                this.analytics.rdt('track', 'SignUp', {
                    event_name: eventName,
                    ...properties
                });
            }

            this.log('Analytics tracked', { eventName, properties });

        } catch (error) {
            this.log('Analytics tracking error', { error: error.message });
        }
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Debug logging
     */
    log(message, data = {}) {
        if (this.debug) {
            console.log(`[CountryballEmailCollector] ${message}`, data);
        }
    }
}

/**
 * Email Form Handler - Easy integration for existing forms
 */
class EmailFormHandler {
    constructor(formSelector, collector = null) {
        this.form = document.querySelector(formSelector);
        this.collector = collector || new CountryballEmailCollector();
        this.isSubmitting = false;

        if (this.form) {
            this.init();
        } else {
            console.error('EmailFormHandler: Form not found:', formSelector);
        }
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Add loading state handling
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.emailInput = this.form.querySelector('input[type="email"]');
        this.messageContainer = this.form.querySelector('.form-message, .inline-form-message');
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (this.isSubmitting) return;

        const email = this.emailInput?.value?.trim();
        if (!email) {
            this.showMessage('Please enter your email address.', 'error');
            return;
        }

        this.setLoadingState(true);

        try {
            const source = this.form.dataset.source || 'form_submission';
            const result = await this.collector.subscribe(email, { source });

            this.showMessage(result.message, 'success');
            this.onSuccess(result);

        } catch (error) {
            this.showMessage(error.message, 'error');
            this.onError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        this.isSubmitting = loading;
        
        if (this.submitButton) {
            this.submitButton.disabled = loading;
            this.submitButton.classList.toggle('loading', loading);
            
            const submitText = this.submitButton.querySelector('.inline-submit-text, .submit-text');
            if (submitText) {
                if (loading) {
                    // Store original text before changing
                    if (!submitText.dataset.originalText) {
                        submitText.dataset.originalText = submitText.textContent;
                    }
                    submitText.textContent = 'Subscribing...';
                } else {
                    // Restore original text
                    submitText.textContent = submitText.dataset.originalText || 'Get Updates';
                }
            }
        }
    }

    showMessage(message, type) {
        if (this.messageContainer) {
            this.messageContainer.textContent = message;
            this.messageContainer.className = `form-message ${type}`;
            this.messageContainer.style.display = 'block';
        }
    }

    onSuccess(result) {
        // Clear form
        if (this.emailInput) {
            this.emailInput.value = '';
        }

        // Hide form and show success message (if elements exist)
        const formContainer = this.form.closest('.email-signup, .inline-email-signup');
        const successMessage = document.getElementById('successMessage');
        
        if (formContainer && successMessage) {
            formContainer.style.display = 'none';
            successMessage.classList.add('show');
        }

        // Custom success callback
        if (typeof window.onEmailSubscriptionSuccess === 'function') {
            window.onEmailSubscriptionSuccess(result);
        }
    }

    onError(error) {
        // Focus back to email input
        if (this.emailInput) {
            this.emailInput.focus();
        }

        // Custom error callback
        if (typeof window.onEmailSubscriptionError === 'function') {
            window.onEmailSubscriptionError(error);
        }
    }
}

// Global instances for backward compatibility
window.CountryballEmailCollector = CountryballEmailCollector;
window.EmailFormHandler = EmailFormHandler;

// Auto-initialize if forms are present
document.addEventListener('DOMContentLoaded', function() {
    // Initialize collectors for common form patterns
    const formSelectors = [
        '#inlineEmailForm', 
        '#emailForm',
        '.email-signup form',
        '.newsletter-form'
        // Note: Removed '#joinEmailForm' to let join.html handle it manually
    ];

    const collector = new CountryballEmailCollector({ debug: false });

    formSelectors.forEach(selector => {
        const form = document.querySelector(selector);
        if (form) {
            new EmailFormHandler(selector, collector);
        }
    });
});
