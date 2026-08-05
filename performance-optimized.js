// Optimized performance monitoring and resource loading
(function() {
  'use strict';
  
  // Performance timing
  const perfData = {
    startTime: performance.now(),
    loadTime: null,
    domReady: null,
    firstPaint: null,
    lcp: null
  };
  
  // Track DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      perfData.domReady = performance.now() - perfData.startTime;
    });
  } else {
    perfData.domReady = 0;
  }
  
  // Track window load
  window.addEventListener('load', () => {
    perfData.loadTime = performance.now() - perfData.startTime;
  });
  
  // Measure Core Web Vitals efficiently
  if ('PerformanceObserver' in window) {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          perfData.lcp = lastEntry.startTime;
          if (typeof gtag !== 'undefined') {
            gtag('event', 'lcp_measured', {
              event_category: 'performance',
              value: Math.round(lastEntry.startTime),
              custom_parameter: lastEntry.startTime < 2500 ? 'good' : 'poor'
            });
          }
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay (FID) - only measure if supported
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const fidValue = entry.processingStart - entry.startTime;
            if (typeof gtag !== 'undefined') {
              gtag('event', 'fid_measured', {
                event_category: 'performance',
                value: Math.round(fidValue),
                custom_parameter: fidValue < 100 ? 'good' : 'poor'
              });
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported in this browser
      }
      
    } catch (e) {
      console.warn('Performance monitoring failed:', e);
    }
  }
  
  // Optimize images
  function optimizeImages() {
    // Add intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('img[data-src]');
      
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px'
      });
      
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }
  
  // Preload next page resources based on user behavior
  function preloadNextResources() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || ['slow-2g', '2g'].includes(conn.effectiveType))) {
      return;
    }

    const criticalPages = [
      '/rules.html'
    ];
    
    criticalPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
  }
  
  // Initialize optimizations
  function init() {
    optimizeImages();

    // Preload resources only when the browser has breathing room.
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadNextResources, { timeout: 2500 });
    } else {
      setTimeout(preloadNextResources, 1200);
    }
    
    // (GA4) page_timing event removed to reduce event volume
  }
  
  // Start optimizations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
