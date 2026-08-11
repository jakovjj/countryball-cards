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

  document.addEventListener('DOMContentLoaded', function () {
    detectCountry();
    initEmailForm();
    initTrailer();
  });
})();
