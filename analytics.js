// Analytics and pixels (Reddit + GA4)
(function(){
  var GA4_ID = 'G-M366HCYL8Z';
  var META_PIXEL_ID = '659591973725729';
  var REDDIT_PIXEL_ID = 'a2_hgzcstbb8534';
  var CLARITY_ID = 'ws94xql90s';

  function isLocalHost() {
    var h = window.location && window.location.hostname;
    return !h || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local') ||
      h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.');
  }

  function isTrackableHost() {
    var h = window.location && window.location.hostname;
    return !isLocalHost() && h && h.indexOf('.') > -1;
  }

  function runWhenIdle(fn, timeout) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: timeout || 3000 });
    } else {
      setTimeout(fn, Math.min(timeout || 3000, 1200));
    }
  }

  function runAfterIdleOrInteraction(fn) {
    var done = false;
    var run = function() {
      if (done) return;
      done = true;
      fn();
    };

    ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function(type) {
      window.addEventListener(type, run, { once: true, passive: true });
    });

    runWhenIdle(run, 3000);
  }

  function ensureQueues() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.fbq = window.fbq || function(){ (window.fbq.queue = window.fbq.queue || []).push(arguments); };
    window.rdt = window.rdt || function(){ (window.rdt.callQueue = window.rdt.callQueue || []).push(arguments); };
  }

  ensureQueues();

  function loadGA4(){
    if (!isTrackableHost() || window.__cbcGA4Loaded) return;
    window.__cbcGA4Loaded = true;

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
  }

  function loadMetaPixel() {
    if (!isTrackableHost() || window.__cbcMetaPixelLoaded) return;
    window.__cbcMetaPixelLoaded = true;

    var queued = (window.fbq && window.fbq.queue) ? window.fbq.queue : [];
    !function(f,b,e,v,n,t,s) {
      n=f.fbq=function(){ n.callMethod ?
        n.callMethod.apply(n,arguments) : n.queue.push(arguments); };
      if(!f._fbq) f._fbq=n;
      n.push=n;
      n.loaded=!0;
      n.version='2.0';
      n.queue=queued;
      t=b.createElement(e);
      t.async=!0;
      t.src=v;
      s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function loadRedditPixel() {
    if (!isTrackableHost() || window.__cbcRedditPixelLoaded) return;
    window.__cbcRedditPixelLoaded = true;

    var oldQueue = (window.rdt && window.rdt.callQueue) ? window.rdt.callQueue : [];
    var p = window.rdt = function() {
      p.sendEvent ? p.sendEvent.apply(p, arguments) : p.callQueue.push(arguments);
    };
    p.callQueue = oldQueue;

    var t = document.createElement('script');
    t.src = 'https://www.redditstatic.com/ads/pixel.js';
    t.async = true;
    t.crossOrigin = 'anonymous';
    t.referrerPolicy = 'no-referrer-when-downgrade';
    t.onerror = function() {
      if (!window.rdt.sendEvent) {
        window.rdt = function(){ /* noop fallback */ };
        window.rdt.sendEvent = window.rdt;
      }
    };
    (document.getElementsByTagName('script')[0] || document.head).parentNode.insertBefore(t, document.scripts[0]);

    try {
      window.rdt('init', REDDIT_PIXEL_ID, { optOut: false, useDecimalCurrencyValues: true, debug: false });
      window.rdt('track', 'PageVisit');
    } catch (_) { /* ignore */ }
  }

  function loadClarity() {
    if (!isTrackableHost() || window.__cbcClarityLoaded) return;
    window.__cbcClarityLoaded = true;

    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){ (c[a].q=c[a].q||[]).push(arguments); };
      t=l.createElement(r);
      t.async=1;
      t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t,y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function loadThirdPartyAnalytics() {
    loadGA4();
    loadMetaPixel();
    loadRedditPixel();
    loadClarity();
  }

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

  // Meta + Reddit ViewContent: fire once when the editions/pricing section becomes visible.
  function initEditionViewTracking() {
    if (!isTrackableHost()) return;
    var section = document.getElementById('editionComparison');
    if (!section || !('IntersectionObserver' in window)) return;

    var fired = false;
    var io = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (fired || !entries[i].isIntersecting) continue;
        fired = true;
        io.disconnect();
        try {
          window.fbq('track', 'ViewContent', {
            content_name: 'Edition Comparison',
            content_category: 'Editions',
            content_ids: ['base', 'extended', 'founders'],
            content_type: 'product',
            currency: 'USD'
          });
        } catch (_) { /* noop */ }
        try {
          window.rdt('track', 'ViewContent', {
            products: [
              { id: 'base', name: 'Base Edition', category: 'edition' },
              { id: 'extended', name: 'Extended Edition', category: 'edition' },
              { id: 'founders', name: "Founder's Edition", category: 'edition' }
            ]
          });
        } catch (_) { /* noop */ }
      }
    }, { threshold: 0.3 });
    io.observe(section);
  }

  function initKickstarterClickTracking() {
    document.addEventListener('click', function(e) {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;

      const href = String(a.getAttribute('href') || '');
      if (!href) return;

      // Track only outbound clicks to Kickstarter.
      if (href.indexOf('kickstarter.com') === -1) return;

      const text = (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      const classes = (a.className && typeof a.className === 'string') ? a.className.slice(0, 120) : '';

      safeGtagEvent('kickstarter_click', {
        event_category: 'conversion',
        link_url: href,
        link_text: text,
        link_classes: classes,
        page_path: location.pathname
      });
    }, { capture: true });
  }

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
      initKickstarterClickTracking();
      initEditionViewTracking();
      runWhenIdle(initTrailerTracking, 3500);
    });
  } else {
    trackBrowserCapabilities();
    initKickstarterClickTracking();
    initEditionViewTracking();
    runWhenIdle(initTrailerTracking, 3500);
  }

  runAfterIdleOrInteraction(loadThirdPartyAnalytics);

  // Session duration + scroll depth tracking → admin.countryballcards.com
  (function() {
    var host = window.location && window.location.hostname;
    var isLocal = !host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') ||
      host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.');
    if (isLocal) return;

    var ENDPOINT = 'https://admin.countryballcards.com/api/session-stats';
    var startTime = Date.now();
    var maxScrollPct = 0;
    var sent = false;

    function getScrollPct() {
      var el = document.documentElement;
      var scrolled = el.scrollTop || document.body.scrollTop || 0;
      var total = el.scrollHeight - el.clientHeight;
      if (total <= 0) return 100;
      return Math.min(100, Math.round((scrolled / total) * 100));
    }

    window.addEventListener('scroll', function() {
      var pct = getScrollPct();
      if (pct > maxScrollPct) maxScrollPct = pct;
    }, { passive: true });

    function sendStats() {
      if (sent) return;
      sent = true;
      var payload = JSON.stringify({
        page: location.pathname,
        timeOnPage: Math.round((Date.now() - startTime) / 1000),
        maxScrollPct: maxScrollPct,
        ts: new Date().toISOString()
      });
      try {
        navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
      } catch (_) { /* sendBeacon unavailable */ }
    }

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') sendStats();
    });
    window.addEventListener('pagehide', sendStats);
  })();
})();
