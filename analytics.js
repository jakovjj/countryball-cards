// Analytics and pixels (Reddit + GA4)
(function(){
  // Fallback GA4 loader for pages that don't include it in HTML.
  // Keeps defaults consistent with pages that inline GA4.
  (function ensureGA4(){
    if (typeof window.gtag !== 'undefined') return;

    var h = window.location && window.location.hostname;
    var isLocal = !h || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local') ||
      h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.');
    if (isLocal) return;

    var GA4_ID = 'G-M366HCYL8Z';

    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };

    if (!document.querySelector('script[src*="https://www.googletagmanager.com/gtag/js?id=' + GA4_ID + '"]')) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
      document.head.appendChild(s);
    }

    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, {
      transport_type: 'beacon',
      anonymize_ip: true,
      allow_google_signals: false,
      send_page_view: true,
      page_title: document.title,
      page_location: window.location.href
    });
  })();

  function safeGtagEvent(eventName, params) {
    if (typeof gtag === 'undefined') return;
    try { gtag('event', eventName, params || {}); } catch (_) { /* noop */ }
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

  // NOTE: Intentionally no page-load-stage tracking.

  // NOTE: Intentionally no campaign-specific outbound click tracking.

  function initTrailerTracking() {
    const iframe = document.getElementById('trailerIframe');
    if (!iframe) return;

    let playFired = false;

    function initPlayer() {
      if (!window.YT || !window.YT.Player) return;

      try {
        const player = new window.YT.Player('trailerIframe', {
          events: {
            onStateChange: function(ev) {
              if (playFired) return;
              if (!window.YT || !window.YT.PlayerState) return;
              if (ev.data !== window.YT.PlayerState.PLAYING) return;
              playFired = true;

              let videoId = '';
              try {
                const data = player.getVideoData ? player.getVideoData() : null;
                videoId = (data && data.video_id) ? data.video_id : '';
              } catch (_) { /* noop */ }

              safeGtagEvent('trailer_play', {
                event_category: 'engagement',
                video_id: videoId,
                page_path: location.pathname
              });
            }
          }
        });
      } catch (_) {
        // If iframe API fails, skip tracking rather than breaking the page.
      }
    }

    // Load YouTube IFrame API only on pages that have the trailer.
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      (document.head || document.documentElement).appendChild(tag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
      if (typeof prevReady === 'function') {
        try { prevReady(); } catch (_) { /* noop */ }
      }
      initPlayer();
    };

    // In case the API is already ready.
    initPlayer();
  }

  // Track when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      trackBrowserCapabilities();
      initTrailerTracking();
    });
  } else {
    trackBrowserCapabilities();
    initTrailerTracking();
  }

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
