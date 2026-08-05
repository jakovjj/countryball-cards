// Analytics and pixels (GA4 + Meta + TikTok + Clarity)
(function(){
  var GA4_ID = 'G-M366HCYL8Z';
  var META_PIXEL_ID = '659591973725729';
  var CLARITY_ID = 'ws94xql90s';
  var TIKTOK_PIXEL_ID = 'D9PM5KJC77UB3QTV3160';

  // Anonymous, non-PII visitor id for Meta Advanced Matching (external_id).
  // Persisted in localStorage so repeat visits/events resolve to the same person
  // without collecting email/phone. Falls back gracefully if storage is unavailable.
  function getExternalId() {
    try {
      var key = '__cbc_eid';
      var existing = localStorage.getItem(key);
      if (existing) return existing;
      var id = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : 'eid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
      localStorage.setItem(key, id);
      return id;
    } catch (_) {
      return null;
    }
  }

  function genEventId(prefix) {
    return (prefix || 'evt') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }
  window.__cbcEventId = genEventId;
  window.__cbcExternalId = getExternalId;

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
    if (!window.ttq) {
      window.TiktokAnalyticsObject = 'ttq';
      var ttq = window.ttq = [];
      ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
      ttq.setAndDefer = function(t, e) { t[e] = function() { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function(t) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
        return e;
      };
      ttq.load = function(e, n) {
        var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = r;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = r + '?sdkid=' + e + '&lib=ttq';
        var first = document.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(s, first);
      };
    }
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

    // Some pages (e.g. success.html) eagerly init their own copy of fbq before
    // this file loads, to fire PageView as early as possible on the conversion
    // page. If that already happened, don't re-inject fbevents.js or re-init
    // the pixel — that would double-count PageView for the session.
    if (window.fbq && window.fbq.loaded) return;

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

    // Advanced Matching: external_id lets Meta stitch events from the same
    // anonymous visitor (across pixel + any future Conversions API events)
    // without us collecting email/phone.
    var externalId = getExternalId();
    window.fbq('init', META_PIXEL_ID, externalId ? { external_id: externalId } : undefined);
    window.fbq('track', 'PageView');
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

  function sendTikTokServerEvent(eventName, eventId, properties) {
    if (!isTrackableHost()) return;
    try {
      fetch('/api/tiktok-events.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          event_id: eventId,
          url: location.href,
          properties: properties || {},
          external_id: getExternalId()
        }),
        keepalive: true
      }).catch(function(){});
    } catch (_) { /* noop */ }
  }
  window.__cbcSendTikTokEvent = sendTikTokServerEvent;

  function loadTikTokPixel() {
    if (!isTrackableHost() || window.__cbcTikTokLoaded) return;
    window.__cbcTikTokLoaded = true;
    window.ttq.load(TIKTOK_PIXEL_ID);
    window.ttq.page();
  }

  function loadThirdPartyAnalytics() {
    loadGA4();
    loadMetaPixel();
    loadTikTokPixel();
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

  // Meta ViewContent: fire once when the editions/pricing section becomes visible.
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
            contents: [
              { id: 'base', quantity: 1, item_price: 25 },
              { id: 'extended', quantity: 1, item_price: 40 },
              { id: 'founders', quantity: 1, item_price: 55 }
            ],
            value: 25,
            currency: 'EUR'
          }, { eventID: genEventId('viewcontent') });
        } catch (_) { /* noop */ }
        try {
          var vcEventId = genEventId('viewcontent');
          var vcProperties = {
            content_type: 'product',
            contents: [
              { content_id: 'base', content_name: 'Base Edition', price: 25, quantity: 1 },
              { content_id: 'extended', content_name: 'Extended Edition', price: 40, quantity: 1 },
              { content_id: 'founders', content_name: "Founder's Edition", price: 55, quantity: 1 }
            ],
            value: 25,
            currency: 'EUR'
          };
          window.ttq.track('ViewContent', vcProperties, { event_id: vcEventId });
          sendTikTokServerEvent('ViewContent', vcEventId, vcProperties);
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

      if (isTrackableHost()) {
        try {
          var cbEventId = genEventId('clickbutton');
          var cbProperties = {
            content_type: 'product',
            content_name: text || 'Kickstarter link'
          };
          window.ttq.track('ClickButton', cbProperties, { event_id: cbEventId });
          sendTikTokServerEvent('ClickButton', cbEventId, cbProperties);
        } catch (_) { /* noop */ }
      }

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
