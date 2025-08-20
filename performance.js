// Performance monitoring and optimization script
(function() {
  'use strict';
  
  // Measure and report Core Web Vitals
  function measureWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry && typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'performance',
              event_label: 'LCP',
              value: Math.round(lastEntry.startTime),
              custom_parameter: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs_improvement' : 'poor'
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'web_vitals', {
                event_category: 'performance',
                event_label: 'FID',
                value: Math.round(entry.processingStart - entry.startTime),
                custom_parameter: entry.processingStart - entry.startTime < 100 ? 'good' : entry.processingStart - entry.startTime < 300 ? 'needs_improvement' : 'poor'
              });
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // Report CLS on page unload
        window.addEventListener('beforeunload', () => {
          if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'performance',
              event_label: 'CLS',
              value: Math.round(clsValue * 1000),
              custom_parameter: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs_improvement' : 'poor'
            });
          }
        });
        
      } catch (e) {
        console.warn('Performance monitoring failed:', e);
      }
    }
  }
  
  // Optimize images after page load
  function optimizeImages() {
    // Add lazy loading to images that don't have it
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach((img, index) => {
      // Skip the first few images (above the fold)
      if (index > 2) {
        img.loading = 'lazy';
      }
    });
    
    // Convert eligible images to WebP if supported
    if (supportsWebP()) {
      const pngImages = document.querySelectorAll('img[src$=".png"]');
      pngImages.forEach(img => {
        const webpSrc = img.src.replace('.png', '.webp');
        // Check if WebP version exists
        const testImg = new Image();
        testImg.onload = function() {
          img.src = webpSrc;
        };
        testImg.src = webpSrc;
      });
    }
  }
  
  // Check WebP support
  function supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }
  
  // Preload critical resources
  function preloadCriticalResources() {
    // Preload hero images
    const heroImages = ['extended.png', 'us.webp'];
    heroImages.forEach(imagePath => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imagePath;
      document.head.appendChild(link);
    });
  }
  
  // Initialize performance optimizations
  function init() {
    // Run immediately for critical optimizations
    preloadCriticalResources();
    
    // Run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        optimizeImages();
        measureWebVitals();
      });
    } else {
      optimizeImages();
      measureWebVitals();
    }
  }
  
  // Start optimization
  init();
  
})();
