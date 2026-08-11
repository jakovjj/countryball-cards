(function () {
  'use strict';

  const countryCopy = {
    US: {
      title: 'Not shipping to the United States yet',
      message: 'We’re still reviewing the best way to bring Countryball Cards to the United States. Leave your email and we’ll let you know when delivery becomes available.',
      availabilityTitle: 'U.S. delivery is under review',
      availabilityMessage: 'We want shipping to be reliable and reasonably priced before we open U.S. orders. We don’t have a launch date yet, but subscribers will hear first.',
      ball: 'cb/us.webp',
      source: 'north_america_us'
    },
    CA: {
      title: 'Not shipping to Canada yet',
      message: 'We’re still reviewing the best way to bring Countryball Cards to Canada. Leave your email and we’ll let you know when delivery becomes available.',
      availabilityTitle: 'Canadian delivery is under review',
      availabilityMessage: 'We want shipping to be reliable and reasonably priced before we open Canadian orders. We don’t have a launch date yet, but subscribers will hear first.',
      ball: 'cb/canada.webp',
      source: 'north_america_ca'
    }
  };

  function applyCountry(code) {
    const copy = countryCopy[code];
    if (!copy) return;

    document.documentElement.dataset.country = code;
    document.title = `Countryball Cards | ${code === 'US' ? 'U.S.' : 'Canada'} Shipping Updates`;
    document.getElementById('shippingTitle').textContent = copy.title;
    document.getElementById('shippingMessage').textContent = copy.message;
    document.getElementById('availabilityTitle').textContent = copy.availabilityTitle;
    document.getElementById('availabilityMessage').textContent = copy.availabilityMessage;
    document.getElementById('signupSource').value = copy.source;
    document.getElementById('countryBall').src = copy.ball;
    document.getElementById('countryBallColor').src = copy.ball;
    document.getElementById('shippingCountryBall').src = copy.ball;

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'north_america_country_detected', { country_code: code });
    }
  }

  async function countryRequest(url, getCode) {
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, 3500);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Country lookup failed');
      return getCode(await response.json());
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function detectCountry() {
    const override = new URLSearchParams(window.location.search).get('country');
    if (override && countryCopy[override.toUpperCase()]) {
      applyCountry(override.toUpperCase());
      return;
    }

    try {
      const code = await countryRequest('https://ipapi.co/json/', function (data) {
        return data && data.country_code;
      });
      if (countryCopy[code]) applyCountry(code);
      return;
    } catch (_) {
      try {
        const code = await countryRequest('https://api.country.is/', function (data) {
          return data && data.country;
        });
        if (countryCopy[code]) applyCountry(code);
      } catch (_) {
        // Keep the North America fallback when neither service is available.
      }
    }
  }

  function initEmailForm() {
    const form = document.getElementById('naEmailForm');
    const input = document.getElementById('naEmail');
    const button = document.getElementById('naSubmit');
    const buttonLabel = button.querySelector('span');
    const status = document.getElementById('naFormStatus');
    const frame = document.getElementById('naEmailFrame');
    let waitingForResponse = false;

    form.addEventListener('submit', function (event) {
      status.className = 'footer-form-message na-form-status';
      if (!input.checkValidity()) {
        event.preventDefault();
        status.classList.add('error');
        status.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }

      waitingForResponse = true;
      button.disabled = true;
      buttonLabel.textContent = 'Sending…';
      status.textContent = '';

      window.setTimeout(function () {
        if (!waitingForResponse) return;
        waitingForResponse = false;
        button.disabled = false;
        buttonLabel.textContent = 'Try again';
        status.classList.add('error');
        status.textContent = 'That took too long. Please check your connection and try again.';
      }, 12000);
    });

    frame.addEventListener('load', function () {
      if (!waitingForResponse) return;
      waitingForResponse = false;
      input.value = '';
      input.disabled = true;
      button.disabled = true;
      button.classList.add('success');
      buttonLabel.textContent = 'You’re on the list';
      status.className = 'footer-form-message na-form-status success';
      status.textContent = 'Thanks! We’ll email you when shipping opens.';

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'email_signup', {
          event_category: 'conversion',
          event_label: document.getElementById('signupSource').value,
          value: 1
        });
      }
    });
  }

  function initTrailer() {
    const container = document.getElementById('trailerContainer');
    const poster = container.querySelector('.yt-poster');
    const iframe = document.getElementById('trailerIframe');
    poster.addEventListener('click', function () {
      container.classList.add('is-playing');
      iframe.src = poster.dataset.autoplaySrc;
    });
  }

  function initReviewsCarousel() {
    const carousel = document.querySelector('[data-reviews-carousel]');
    if (!carousel) return;

    const viewport = carousel.querySelector('.reviews-viewport');
    const track = carousel.querySelector('.reviews-track');
    const cards = Array.from(carousel.querySelectorAll('.review-card'));
    const previous = carousel.querySelector('[data-reviews-prev]');
    const next = carousel.querySelector('[data-reviews-next]');
    const dots = carousel.querySelector('[data-reviews-dots]');
    if (!viewport || !track || cards.length < 2 || !dots) return;

    let activeIndex = 0;
    let userPausedUntil = 0;

    function stepSize() {
      const styles = window.getComputedStyle(track);
      return cards[0].getBoundingClientRect().width + (parseFloat(styles.columnGap || styles.gap || '0') || 0);
    }

    function maxIndex() {
      const step = stepSize();
      return step > 0 ? Math.max(0, Math.ceil((viewport.scrollWidth - viewport.clientWidth) / step)) : 0;
    }

    function clamp(index) {
      return Math.max(0, Math.min(maxIndex(), index));
    }

    function setActiveDot() {
      const step = stepSize();
      activeIndex = step > 0 ? clamp(Math.round(viewport.scrollLeft / step)) : 0;
      Array.from(dots.children).forEach(function (dot, index) {
        dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
      });
    }

    function goTo(index, behavior) {
      activeIndex = clamp(index);
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const targetLeft = Math.max(0, cards[activeIndex].offsetLeft - track.offsetLeft);
      viewport.scrollTo({ left: Math.min(targetLeft, maxScroll), behavior: behavior || 'smooth' });
      setActiveDot();
    }

    function pauseAutoAdvance() {
      userPausedUntil = Date.now() + 10000;
    }

    function rebuildDots() {
      dots.innerHTML = '';
      for (let index = 0; index <= maxIndex(); index += 1) {
        const dot = document.createElement('button');
        dot.className = 'reviews-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show reviews page ${index + 1}`);
        dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
        dot.addEventListener('click', function () { pauseAutoAdvance(); goTo(index); });
        dots.appendChild(dot);
      }
    }

    previous.addEventListener('click', function () {
      pauseAutoAdvance();
      goTo(activeIndex <= 0 ? maxIndex() : activeIndex - 1);
    });
    next.addEventListener('click', function () {
      pauseAutoAdvance();
      goTo(activeIndex >= maxIndex() ? 0 : activeIndex + 1);
    });
    viewport.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      pauseAutoAdvance();
      goTo(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });
    viewport.addEventListener('scroll', function () { window.requestAnimationFrame(setActiveDot); }, { passive: true });
    carousel.addEventListener('pointerdown', pauseAutoAdvance, { passive: true });
    carousel.addEventListener('focusin', pauseAutoAdvance);
    window.addEventListener('resize', function () {
      window.requestAnimationFrame(function () { activeIndex = clamp(activeIndex); rebuildDots(); goTo(activeIndex, 'auto'); });
    });

    rebuildDots();
    goTo(0, 'auto');
    window.setInterval(function () {
      if (!document.hidden && Date.now() >= userPausedUntil) goTo(activeIndex >= maxIndex() ? 0 : activeIndex + 1);
    }, 5500);
  }

  document.addEventListener('DOMContentLoaded', function () {
    detectCountry();
    initEmailForm();
    initTrailer();
    initReviewsCarousel();
  });
})();
