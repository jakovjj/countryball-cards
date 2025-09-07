// Development helper - Add cache-busting timestamps to assets
// Include this script during development to prevent caching issues

(function() {
    'use strict';
    
    // Only run in development (when served from localhost or file://)
    const isDevelopment = location.hostname === 'localhost' || 
                         location.hostname === '127.0.0.1' || 
                         location.protocol === 'file:';
    
    if (!isDevelopment) {
        return; // Skip in production
    }
    
    console.log('Development mode: Cache-busting enabled');
    
    // Add timestamp to CSS links
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]');
    cssLinks.forEach(link => {
        const href = link.href;
        if (href && !href.includes('?')) {
            link.href = href + '?t=' + Date.now();
        } else if (href && href.includes('?v=')) {
            link.href = href.replace(/\?v=\d+/, '?v=' + Date.now());
        }
    });
    
    // Add timestamp to script tags
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        const src = script.src;
        if (src && !src.includes('analytics') && !src.includes('gtag')) {
            if (!src.includes('?')) {
                script.src = src + '?t=' + Date.now();
            } else if (src.includes('?v=')) {
                script.src = src.replace(/\?v=\d+/, '?v=' + Date.now());
            }
        }
    });
    
    // Reload service worker if it exists
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                console.log('Updating service worker for development');
                registration.update();
            });
        });
    }
    
    // Add a visual indicator that cache-busting is active
    const indicator = document.createElement('div');
    indicator.innerHTML = '🔄 Development Mode (Cache Disabled)';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #333;
        color: #fff;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 10000;
        opacity: 0.8;
        pointer-events: none;
    `;
    document.body.appendChild(indicator);
    
    // Remove indicator after 3 seconds
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, 3000);
})();
