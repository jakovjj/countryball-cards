// Analytics and pixels (Reddit + GA4)
(function(){
  // Track JavaScript support immediately
  function trackJavaScriptSupport() {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'javascript_supported', {
        event_category: 'technical',
        event_label: 'js_enabled',
        value: 1
      });
    }
  }

  // Track browser capabilities
  function trackBrowserCapabilities() {
    if (typeof gtag !== 'undefined') {
      const capabilities = {
        fetch_supported: typeof fetch !== 'undefined',
        async_supported: typeof Promise !== 'undefined',
        local_storage: typeof localStorage !== 'undefined',
        session_storage: typeof sessionStorage !== 'undefined',
        geolocation: typeof navigator.geolocation !== 'undefined',
        user_agent: navigator.userAgent.substring(0, 100) // Truncate for privacy
      };

      gtag('event', 'browser_capabilities', {
        event_category: 'technical',
        event_label: JSON.stringify(capabilities),
        value: 1
      });
    }
  }

  // Track page load progress
  function trackPageLoadStage(stage) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_load_stage', {
        event_category: 'technical',
        event_label: stage,
        value: 1
      });
    }
  }

  // Track immediately on script execution
  trackJavaScriptSupport();
  trackPageLoadStage('analytics_script_loaded');

  // Track when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      trackPageLoadStage('dom_ready');
      trackBrowserCapabilities();
    });
  } else {
    trackPageLoadStage('dom_already_ready');
    trackBrowserCapabilities();
  }

  // Track when everything is loaded
  window.addEventListener('load', function() {
    trackPageLoadStage('window_loaded');
  });

  // GA4 loader remains in HTML head for early init

  // Reddit Pixel bootstrap
  (function(w,d){
    if(!w.rdt){
      var p=w.rdt=function(){
        p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments);
      };
      p.callQueue=[];

      var isValidDomain=function(){
        var h=w.location.hostname;
        return h!=='localhost' && h!=='127.0.0.1' && h!=='' && !h.endsWith('.local') &&
               !h.startsWith('192.168.') && !h.startsWith('10.') && !h.startsWith('172.') &&
               (w.location.protocol==='https:' || w.location.protocol==='http:');
      };

      if(isValidDomain()){
        var t=d.createElement('script');
        t.src='https://www.redditstatic.com/ads/pixel.js';
        t.async=true;
        t.crossOrigin='anonymous';
        t.referrerPolicy='no-referrer-when-downgrade';
        t.onerror=function(e){
          console.warn('Reddit pixel failed to load', e);
          if(!w.rdt.sendEvent){ w.rdt = function(){ /* noop fallback */ }; w.rdt.sendEvent=w.rdt; }
        };
        (d.getElementsByTagName('script')[0]||d.head).parentNode.insertBefore(t,d.scripts[0]);
      } else {
        w.rdt=function(){ /* local mock */ }; w.rdt.sendEvent=w.rdt;
      }
    }
  })(window,document);

  // Init after a short delay
  setTimeout(function(){
    var h=location.hostname;
    var ok = h && h.indexOf('.')>-1 && h!=='localhost' && h!=='127.0.0.1' && !h.endsWith('.local');
    if(!ok) return;
    try{
      rdt('init','a2_hgzcstbb8534',{ optOut:false, useDecimalCurrencyValues:true, debug:true });
      rdt('track','PageVisit');
    }catch(e){ /* ignore */ }
  },500);

  // Optional debug after load
  setTimeout(function(){
    if(!window.rdt) return;
    try{ rdt('track','ViewContent',{ content_ids:['debug_test'], content_type:'product', content_name:'Debug Test' }); }catch(_){ }
  },3000);
})();
