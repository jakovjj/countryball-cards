const COUNTRY_OPTIONS = [
      { code: 'AT', label: 'Austria', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'BG', label: 'Bulgaria', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'BE', label: 'Belgium', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'HR', label: 'Croatia', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'CZ', label: 'Czechia', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'DK', label: 'Denmark', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'EE', label: 'Estonia', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'FI', label: 'Finland', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'FR', label: 'France', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'DE', label: 'Germany', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'GR', label: 'Greece', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'HU', label: 'Hungary', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'IE', label: 'Ireland', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'IT', label: 'Italy', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'LV', label: 'Latvia', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'LT', label: 'Lithuania', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'LU', label: 'Luxembourg', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'NL', label: 'Netherlands', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'NO', label: 'Norway', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'PL', label: 'Poland', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'PT', label: 'Portugal', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'RO', label: 'Romania', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'RS', label: 'Serbia', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'SK', label: 'Slovakia', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'SI', label: 'Slovenia', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'ES', label: 'Spain', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'SE', label: 'Sweden', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'GB', label: 'United Kingdom', flag: '�Y?��Y?�', zone: 'ZONE_1' },
      { code: 'US', label: 'United States', flag: '�Y?��Y?�', zone: 'ZONE_1' }
    ].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

    function countryCodeToFlag(code) {
      if (!code || typeof code !== 'string' || code.length !== 2) {
        return '';
      }
      const chars = code.toUpperCase();
      const a = chars.charCodeAt(0);
      const b = chars.charCodeAt(1);
      if (a < 65 || a > 90 || b < 65 || b > 90) {
        return '';
      }
      const base = 0x1F1E6;
      return String.fromCodePoint(base + (a - 65), base + (b - 65));
    }

    // (Extraction can corrupt emoji depending on encoding.) Always compute flags from country codes.
    COUNTRY_OPTIONS.forEach(option => {
      option.flag = countryCodeToFlag(option.code);
    });

    let filteredCountryOptions = COUNTRY_OPTIONS.slice();

    const COUNTRY_MAP = COUNTRY_OPTIONS.reduce((acc, option) => {
      acc[option.code] = option;
      return acc;
    }, {});

    const SHIPPING_ZONES = {
      ZONE_1: ['AT','BE','BG','CZ','DK','DE','EE','ES','FI','FR','GR','HU','HR','IE','IT','LT','LU','LV','NL','NO','PL','PT','RO','RS','SE','SI','SK','GB','US'],
      ZONE_2: []
    };
    const PAYMENT_LINKS = {
      ZONE_1: {
        BASE_GAME: 'https://buy.stripe.com/eVq7sL1AVdTKalE8Tvcwg02',
        EXTENDED_EDITION: 'https://buy.stripe.com/4gM4gzdjDbLCeBU2v7cwg04',
        FOUNDERS_EDITION: 'https://buy.stripe.com/fZufZha7r4ja51kc5Hcwg03'
      },
      ZONE_2: {
        BASE_GAME: 'https://buy.stripe.com/5kQ28renH8zq79s6Lncwg05',
        EXTENDED_EDITION: 'https://buy.stripe.com/7sY00j93n4ja3Xg3zbcwg06',
        FOUNDERS_EDITION: 'https://buy.stripe.com/aFafZhbbv16Y0L4c5Hcwg07'
      }
    };
    let selectedCountry = null;
    let selectedZone = null;
    let detectionRunId = 0;
    let suppressAutoDetectSelection = false;
    const shippingOverlay = document.getElementById('shippingConfirmOverlay');
    const shippingDialog = shippingOverlay ? shippingOverlay.querySelector('.modal') : null;
    const shippingCloseBtn = document.getElementById('shippingConfirmClose');
    const shippingConfirmBtn = document.getElementById('shippingConfirmBtn');
    const preorderOverlay = document.getElementById('preorderConfirmOverlay');
    const preorderDialog = preorderOverlay ? preorderOverlay.querySelector('.modal') : null;
    const preorderCloseBtn = document.getElementById('preorderConfirmClose');
    const preorderContinueBtn = document.getElementById('preorderContinueBtn');
    const preorderPaypalBtn = document.getElementById('preorderPaypalBtn');
    const preorderPaypalSection = document.getElementById('preorderPaypalSection');
    const PAYPAL_LINKS = {
      ZONE_1: {
        base: 'https://www.paypal.com/ncp/payment/E3Z4KXQARU9ZS',
        extended: 'https://www.paypal.com/ncp/payment/XTWHX2FNMELL2',
        founders: 'https://www.paypal.com/ncp/payment/W5P57LDF9GJ56'
      }
    };
    let pendingPreorder = null;
    let pendingShippingIntent = null;
    let shippingLastFocus = null;
    let shippingKeyListenerAttached = false;
    let shippingControlsBound = false;
    let shippingScrollY = 0;
    let preorderLastFocus = null;
    let preorderKeyListenerAttached = false;
    let preorderControlsBound = false;
    let preorderScrollY = 0;
    const LAST_COUNTRY_STORAGE_KEY = 'cbc:lastCountryCode';
    const DETECTION_TIMEOUT_MS = 4500;

    function getShippingZone(countryCode) {
      if (SHIPPING_ZONES.ZONE_1.includes(countryCode)) return 'ZONE_1';
      if (SHIPPING_ZONES.ZONE_2.includes(countryCode)) return 'ZONE_2';
      return null;
    }

    function handlePreorderKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePreorderConfirmation();
      }
    }

    function handleShippingKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeShippingConfirmation();
      }
    }

    function getCheckoutUrlForPackage(zone, pkg) {
      const zoneLinks = PAYMENT_LINKS[zone];
      if (!zoneLinks) return null;
      if (pkg === 'base') return zoneLinks.BASE_GAME;
      if (pkg === 'extended') return zoneLinks.EXTENDED_EDITION;
      if (pkg === 'founders') return zoneLinks.FOUNDERS_EDITION;
      return null;
    }

    function updateShippingConfirmState() {
      if (!shippingConfirmBtn) return;
      const enabled = !!selectedCountry && !!selectedZone;
      shippingConfirmBtn.disabled = !enabled;
      shippingConfirmBtn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    function openShippingConfirmation(intent, triggerEl) {
      if (!shippingOverlay || !shippingDialog) {
        return;
      }
      pendingShippingIntent = intent || null;
      shippingLastFocus = triggerEl || document.activeElement || null;
      shippingScrollY = window.scrollY || window.pageYOffset || 0;

      shippingOverlay.hidden = false;
      shippingOverlay.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      updateShippingConfirmState();

      // Only attempt to infer the user's country after they explicitly click Buy/Pre-order.
      // This avoids triggering the browser geolocation permission prompt during page load.
      const defer = typeof queueMicrotask === 'function'
        ? queueMicrotask
        : (fn) => Promise.resolve().then(fn);

      defer(() => {
        if (selectedCountry) {
          return;
        }
        const storedCountry = getStoredCountry();
        if (storedCountry) {
          selectCountry(storedCountry, { skipStorage: true });
          return;
        }
        // Do not auto-detect + auto-select on first click.
        // Auto-selecting here can surprise users and also flips button labels back to “Buy [Edition]”
        // immediately after they click the CTA. Instead, let them explicitly choose shipping.
      });

      function focusAfterOpen() {
        const searchInput = document.getElementById('countrySearchInput');
        if (searchInput && !selectedCountry) {
          openCountryDropdown();
          searchInput.focus();
        } else if (shippingConfirmBtn && !shippingConfirmBtn.disabled) {
          shippingConfirmBtn.focus();
        } else {
          shippingDialog.focus();
        }
        window.scrollTo(0, shippingScrollY);
      }

      // Wait for the modal entrance animation to finish before opening the dropdown,
      // so that getBoundingClientRect() in positionCountryDropdownList() reads the
      // final settled position instead of the mid-animation scaled/translated one.
      const animDuration = 480; // slightly longer than the 0.45s animation
      let animSettled = false;
      const onAnimEnd = () => {
        if (animSettled) return;
        animSettled = true;
        focusAfterOpen();
      };
      shippingDialog.addEventListener('animationend', onAnimEnd, { once: true });
      setTimeout(() => {
        if (!animSettled) {
          animSettled = true;
          focusAfterOpen();
        }
      }, animDuration);

      if (!shippingKeyListenerAttached) {
        document.addEventListener('keydown', handleShippingKeydown);
        shippingKeyListenerAttached = true;
      }
    }

    function closeShippingConfirmation(options = {}) {
      if (!shippingOverlay) {
        return;
      }
      shippingOverlay.hidden = true;
      shippingOverlay.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (shippingKeyListenerAttached) {
        document.removeEventListener('keydown', handleShippingKeydown);
        shippingKeyListenerAttached = false;
      }
      const shouldRestoreFocus = options.restoreFocus !== false;
      if (shouldRestoreFocus && shippingLastFocus && typeof shippingLastFocus.focus === 'function') {
        shippingLastFocus.focus();
        window.scrollTo(0, shippingScrollY);
      }
      pendingShippingIntent = null;
      shippingLastFocus = null;
    }

    function confirmShippingSelection() {
      if (!selectedCountry || !selectedZone || !pendingShippingIntent) {
        return;
      }
      const { packageName, price, packageKey, triggerEl } = pendingShippingIntent;
      const checkoutUrl = getCheckoutUrlForPackage(selectedZone, packageKey);
      closeShippingConfirmation({ restoreFocus: false });
      openPreorderConfirmation(packageName, price, checkoutUrl, triggerEl, { zone: selectedZone, packageKey });
    }

    function initShippingModalControls() {
      if (shippingControlsBound) {
        return;
      }
      if (!shippingOverlay) {
        return;
      }
      if (shippingConfirmBtn) {
        shippingConfirmBtn.addEventListener('click', confirmShippingSelection);
      }
      if (shippingCloseBtn) {
        shippingCloseBtn.addEventListener('click', () => closeShippingConfirmation());
      }
      shippingOverlay.addEventListener('click', event => {
        if (event.target === shippingOverlay) {
          closeShippingConfirmation();
        }
      });
      shippingControlsBound = true;
    }
    initShippingModalControls();
    document.addEventListener('DOMContentLoaded', initShippingModalControls);

    function openPreorderConfirmation(packageName, price, checkoutUrl, triggerEl, opts = {}) {
      if (!checkoutUrl) {
        return;
      }
      if (!preorderOverlay || !preorderDialog || !preorderContinueBtn) {
        window.location.href = checkoutUrl;
        return;
      }

      const copyEl = preorderDialog.querySelector('.preorder-modal-copy');
      if (copyEl) {
        const basePrice = Number(price);
        const delivery = getDeliveryAmountForZone(opts.zone || selectedZone || 'ZONE_1');
        const total = (Number.isFinite(basePrice) ? basePrice : 0) + delivery;
        copyEl.textContent = `Your total will be ${formatUsd(total)} (incl. $5.40 shipping). You'll receive a receipt after checkout.`;
      }

      const titleEl = document.getElementById('preorderConfirmTitle');
      if (titleEl) {
        const flag = selectedCountry && COUNTRY_MAP[selectedCountry] ? COUNTRY_MAP[selectedCountry].flag : '';
        titleEl.innerHTML = flag
          ? `<span class="preorder-title-flag" aria-hidden="true">${flag}</span> Ready to order?`
          : 'Ready to order?';
      }

      const paypalUrl = opts.zone && opts.packageKey && PAYPAL_LINKS[opts.zone] && PAYPAL_LINKS[opts.zone][opts.packageKey]
        ? PAYPAL_LINKS[opts.zone][opts.packageKey]
        : null;
      if (preorderPaypalSection) {
        preorderPaypalSection.hidden = !paypalUrl;
      }
      pendingPreorder = { checkoutUrl, paypalUrl };
      preorderLastFocus = triggerEl || document.activeElement || null;
      preorderScrollY = window.scrollY || window.pageYOffset || 0;

      preorderOverlay.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      preorderOverlay.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
        if (preorderContinueBtn) {
          preorderContinueBtn.focus();
        } else {
          preorderDialog.focus();
        }
        window.scrollTo(0, preorderScrollY);
      }, 30);

      if (!preorderKeyListenerAttached) {
        document.addEventListener('keydown', handlePreorderKeydown);
        preorderKeyListenerAttached = true;
      }
    }

    function closePreorderConfirmation(options = {}) {
      if (!preorderOverlay) {
        return;
      }
      preorderOverlay.hidden = true;
      preorderOverlay.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (preorderKeyListenerAttached) {
        document.removeEventListener('keydown', handlePreorderKeydown);
        preorderKeyListenerAttached = false;
      }
      const shouldRestoreFocus = options.restoreFocus !== false;
      if (shouldRestoreFocus && preorderLastFocus && typeof preorderLastFocus.focus === 'function') {
        preorderLastFocus.focus();
        window.scrollTo(0, preorderScrollY);
      }
      pendingPreorder = null;
      preorderLastFocus = null;
    }

    function confirmPreorderCheckout() {
      if (!pendingPreorder || !pendingPreorder.checkoutUrl) {
        closePreorderConfirmation();
        return;
      }
      const targetUrl = pendingPreorder.checkoutUrl;
      closePreorderConfirmation({ restoreFocus: false });
      window.location.href = targetUrl;
    }

    function initPreorderModalControls() {
      if (preorderControlsBound) {
        return;
      }
      if (!preorderOverlay) {
        return;
      }
      if (preorderContinueBtn) {
        preorderContinueBtn.addEventListener('click', confirmPreorderCheckout);
      }
      if (preorderCloseBtn) {
        preorderCloseBtn.addEventListener('click', () => closePreorderConfirmation());
      }
      if (preorderPaypalBtn) {
        preorderPaypalBtn.addEventListener('click', () => {
          if (!pendingPreorder || !pendingPreorder.paypalUrl) return;
          const targetUrl = pendingPreorder.paypalUrl;
          closePreorderConfirmation({ restoreFocus: false });
          window.location.href = targetUrl;
        });
      }
      preorderOverlay.addEventListener('click', event => {
        if (event.target === preorderOverlay) {
          closePreorderConfirmation();
        }
      });
      preorderControlsBound = true;
    }
    initPreorderModalControls();
    document.addEventListener('DOMContentLoaded', initPreorderModalControls);

    function setDropdownLabel(primaryText, zoneText = '') {
      const labelEl = document.getElementById('countryDropdownLabel');
      if (!labelEl) return;
      labelEl.innerHTML = `
        <span class="country-option-left">${primaryText}</span>
        <span class="zone-label">${zoneText}</span>
      `;
    }

    function getDeliveryLabelForZone(zone) {
      switch (zone) {
        case 'ZONE_1':
          return '($5.40 Shipping)';
        case 'ZONE_2':
          return '($12.20 Shipping)';
        default:
          return '';
      }
    }

    function getDeliveryAmountForZone(zone) {
      switch (zone) {
        case 'ZONE_1':
          return 5.40;
        case 'ZONE_2':
          return 12.20;
        default:
          return 0;
      }
    }

    function formatUsd(amount) {
      const numeric = Number(amount);
      if (!Number.isFinite(numeric)) {
        return '$0.00';
      }
      return `$${numeric.toFixed(2)}`;
    }

    function persistStoredCountry(code) {
      try {
        localStorage.setItem(LAST_COUNTRY_STORAGE_KEY, code);
      } catch (_) {
        /* noop */
      }
    }

    function clearStoredCountry() {
      try {
        localStorage.removeItem(LAST_COUNTRY_STORAGE_KEY);
      } catch (_) {
        /* noop */
      }
    }

    function getStoredCountry() {
      try {
        const stored = localStorage.getItem(LAST_COUNTRY_STORAGE_KEY);
        return stored && COUNTRY_MAP[stored] ? stored : null;
      } catch (_) {
        return null;
      }
    }

    function resetCountrySelection() {
      const hiddenInput = document.getElementById('countryAvailabilitySelector');
      if (hiddenInput) {
        hiddenInput.value = '';
      }
      setDropdownLabel('Choose a shipping location', '');
      highlightActiveCountryOption(null);
    }

    function renderCountryDropdown(options = filteredCountryOptions) {
      const list = document.getElementById('countryDropdownList');
      if (!list) return;
      list.innerHTML = '';
      let renderSet = Array.isArray(options) ? options : filteredCountryOptions;
      // Pin United States at the top when not searching.
      const searchInput = document.getElementById('countrySearchInput');
      const query = searchInput ? (searchInput.value || '').trim() : '';
      if (!query && Array.isArray(renderSet) && renderSet.length) {
        const usOption = renderSet.find(option => option.code === 'US');
        if (usOption) {
          renderSet = [usOption, ...renderSet.filter(option => option.code !== 'US')];
        }
      }
      if (!renderSet.length) {
        const emptyState = document.createElement('li');
        emptyState.className = 'country-option empty-state';
        emptyState.setAttribute('role', 'status');
        emptyState.tabIndex = -1;
        emptyState.textContent = 'No countries match your search.';
        list.appendChild(emptyState);
        return;
      }
      renderSet.forEach(option => {
        const item = document.createElement('li');
        item.className = 'country-option';
        item.dataset.value = option.code;
        item.dataset.zone = option.zone;
        item.setAttribute('role', 'option');
        item.tabIndex = -1;
        item.innerHTML = `
          <span class="country-option-left">${option.flag} ${option.label}</span>
          <span class="zone-label">${getDeliveryLabelForZone(option.zone)}</span>
        `;
        item.addEventListener('click', () => selectCountry(option.code));
        item.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectCountry(option.code);
          }
        });
        list.appendChild(item);
      });
    }

    function highlightActiveCountryOption(code) {
      document.querySelectorAll('.country-option').forEach(optionEl => {
        const isActive = optionEl.dataset.value === code;
        optionEl.classList.toggle('active', isActive);
        optionEl.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function openCountryDropdown() {
      const dropdown = document.getElementById('countryDropdown');
      const toggle = document.getElementById('countryDropdownToggle');
      if (!dropdown || !toggle) return;
      dropdown.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      positionCountryDropdownList();
    }

    function closeCountryDropdown() {
      const dropdown = document.getElementById('countryDropdown');
      const toggle = document.getElementById('countryDropdownToggle');
      if (!dropdown || !toggle) return;
      dropdown.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      const list = document.getElementById('countryDropdownList');
      if (list) {
        list.style.position = '';
        list.style.left = '';
        list.style.width = '';
        list.style.zIndex = '';
        list.style.maxHeight = '';
        list.style.top = '';
        list.style.bottom = '';
      }
    }

    function positionCountryDropdownList() {
      const dropdown = document.getElementById('countryDropdown');
      const list = document.getElementById('countryDropdownList');
      if (!dropdown || !list || !dropdown.classList.contains('open')) {
        return;
      }
      const rect = dropdown.getBoundingClientRect();
      // visualViewport.height is accurate on mobile (excludes browser chrome/keyboard);
      // window.innerHeight can over-report on iOS Safari.
      const viewportHeight = (window.visualViewport ? window.visualViewport.height : 0)
        || window.innerHeight
        || document.documentElement.clientHeight
        || 0;
      const margin = 8;
      const bottomSafe = 16; // keep the list off the very bottom edge
      const maxListHeight = Math.floor(viewportHeight * 0.42); // never taller than ~42% of viewport
      const spaceBelow = Math.min(maxListHeight, Math.max(0, viewportHeight - rect.bottom - margin - bottomSafe));
      const spaceAbove = Math.min(maxListHeight, Math.max(0, rect.top - margin - bottomSafe));
      const minHeight = 180;

      const openDown = spaceBelow >= minHeight || spaceBelow >= spaceAbove;

      // Use position:fixed so the list is anchored to viewport coordinates and
      // can never be clipped or displaced by modal overflow, transforms, or animations.
      list.style.position = 'fixed';
      list.style.left = rect.left + 'px';
      list.style.width = rect.width + 'px';
      list.style.zIndex = '1100';

      if (openDown) {
        list.style.top = (rect.bottom + margin) + 'px';
        list.style.bottom = 'auto';
        list.style.maxHeight = spaceBelow + 'px';
      } else {
        list.style.top = 'auto';
        list.style.bottom = (viewportHeight - rect.top + margin) + 'px';
        list.style.maxHeight = spaceAbove + 'px';
      }
    }

    function setupCountryDropdownInteractions() {
      const dropdown = document.getElementById('countryDropdown');
      const toggle = document.getElementById('countryDropdownToggle');
      const list = document.getElementById('countryDropdownList');
      if (!dropdown || !toggle || !list) return;

      const toggleDropdown = () => {
        const willOpen = !dropdown.classList.contains('open');
        dropdown.classList.toggle('open', willOpen);
        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (willOpen) {
          positionCountryDropdownList();
        }
        if (willOpen) {
          const active = list.querySelector('.country-option.active') || list.querySelector('.country-option');
          if (active) {
            active.focus();
          }
        }
      };

      toggle.addEventListener('click', toggleDropdown);
      toggle.addEventListener('keydown', event => {
        if (['ArrowDown','Enter',' '].includes(event.key)) {
          event.preventDefault();
          toggleDropdown();
        }
      });

      list.addEventListener('keydown', event => {
        const options = Array.from(list.querySelectorAll('.country-option'));
        const currentIndex = options.indexOf(document.activeElement);
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const next = options[(currentIndex + 1) % options.length];
          if (next) next.focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prev = options[(currentIndex - 1 + options.length) % options.length];
          if (prev) prev.focus();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          closeCountryDropdown();
          toggle.focus();
        }
      });

      document.addEventListener('click', event => {
        if (!dropdown.contains(event.target)) {
          closeCountryDropdown();
        }
      });

      window.addEventListener('resize', () => positionCountryDropdownList());
      window.addEventListener('scroll', () => positionCountryDropdownList(), true);
    }

    // Filter the available countries as the user types in the search box.
    function handleCountrySearch(query) {
      const normalized = (query || '').trim().toLowerCase();
      if (!normalized) {
        filteredCountryOptions = COUNTRY_OPTIONS.slice();
      } else {
        filteredCountryOptions = COUNTRY_OPTIONS.filter(option => {
          const haystack = `${option.label} ${option.code} ${option.zone}`.toLowerCase();
          return haystack.includes(normalized);
        });
      }
      renderCountryDropdown(filteredCountryOptions);
      highlightActiveCountryOption(selectedCountry);
    }

    // Wire up interactions for the search input so it always surfaces visible results.
    function setupCountrySearch() {
      const searchInput = document.getElementById('countrySearchInput');
      if (!searchInput) return;

      searchInput.addEventListener('input', event => {
        handleCountrySearch(event.target.value);
        openCountryDropdown();
      });

      searchInput.addEventListener('focus', () => {
        openCountryDropdown();
        if (!searchInput.value) {
          handleCountrySearch('');
        }
      });

      searchInput.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const firstOption = document.querySelector('.country-option:not(.empty-state)');
          if (firstOption) {
            firstOption.focus();
          }
        } else if (event.key === 'Escape') {
          closeCountryDropdown();
        }
      });
    }

    function selectCountry(countryCode, options = {}) {
      const option = COUNTRY_MAP[countryCode];
      if (!option) return false;
      const hiddenInput = document.getElementById('countryAvailabilitySelector');
      if (hiddenInput) {
        hiddenInput.value = countryCode;
      }
      setDropdownLabel(`${option.flag} ${option.label}`, getDeliveryLabelForZone(option.zone));
      highlightActiveCountryOption(countryCode);
      closeCountryDropdown();
      handleCountrySelection(countryCode);
      if (!options.skipStorage) {
        persistStoredCountry(countryCode);
      }
      return true;
    }

    function promptForCountrySelection() {
      // Reset label/state first so a missing helper can't prevent visual reset.
      resetCountrySelection();
      updateShippingConfirmState();
    }

    function updatePaymentLinks(zone) {
      const zoneLinks = PAYMENT_LINKS[zone];
      if (!zoneLinks) {
        return;
      }
      const linkMap = {
        base: zoneLinks.BASE_GAME,
        extended: zoneLinks.EXTENDED_EDITION,
        founders: zoneLinks.FOUNDERS_EDITION
      };
      document.querySelectorAll('.package-btn').forEach(btn => {
        const pkg = btn.dataset.package;
        if (pkg && linkMap[pkg]) {
          btn.dataset.checkoutUrl = linkMap[pkg];
          btn.setAttribute('data-zone', zone);
          if (!btn.classList.contains('disabled')) {
            btn.href = linkMap[pkg];
          }
        }
      });
    }

    function updateButtonStates(enabled) {
      document.querySelectorAll('.package-btn').forEach(btn => {
        if (enabled) {
          const checkoutUrl = btn.dataset.checkoutUrl || '#';
          btn.href = checkoutUrl;
          btn.classList.remove('disabled');
          btn.classList.add('armed');
        } else {
          // Keep package buttons visually clickable; shipping/zone is confirmed in the modal.
          btn.href = '#';
          btn.classList.remove('disabled');
          btn.classList.remove('armed');
          btn.removeAttribute('data-zone');
        }
        btn.setAttribute('aria-disabled', 'false');
      });
    }

    function handleCountrySelection(countryCode) {
      selectedCountry = countryCode || null;
      const dropdown = document.getElementById('countryDropdown');
      if (!selectedCountry) {
        selectedZone = null;
        updateButtonStates(false);
        promptForCountrySelection();
        if (dropdown) {
          dropdown.classList.remove('has-selection');
        }
        updateShippingConfirmState();
        return;
      }
      selectedZone = getShippingZone(selectedCountry);
      if (!selectedZone) {
        updateButtonStates(false);
        promptForCountrySelection();
        if (dropdown) {
          dropdown.classList.remove('has-selection');
        }
        return;
      }

      if (dropdown) {
        dropdown.classList.add('has-selection');
      }

      updatePaymentLinks(selectedZone);
      updateButtonStates(true);
      updateShippingConfirmState();
    }

    function normalizeCountryCode(code) {
      if (!code || typeof code !== 'string') {
        return null;
      }
      const normalized = code.trim().toUpperCase();
      return normalized.length === 2 ? normalized : null;
    }

    function withTimeout(promise, timeoutMs = DETECTION_TIMEOUT_MS) {
      return new Promise(resolve => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve(null);
          }
        }, timeoutMs);
        Promise.resolve(promise)
          .then(value => {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timer);
            resolve(value);
          })
          .catch(() => {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timer);
            resolve(null);
          });
      });
    }

    function firstSuccessful(promises, evaluator) {
      return new Promise(resolve => {
        if (!promises.length) {
          resolve(false);
          return;
        }
        let pending = promises.length;
        let completed = false;
        promises.forEach(promise => {
          Promise.resolve(promise)
            .then(value => {
              if (completed) {
                return;
              }
              if (evaluator(value)) {
                completed = true;
                resolve(true);
              } else {
                pending -= 1;
                if (pending === 0) {
                  resolve(false);
                }
              }
            })
            .catch(() => {
              if (completed) {
                return;
              }
              pending -= 1;
              if (pending === 0) {
                resolve(false);
              }
            });
        });
      });
    }

    async function lookupCountryViaIpApi() {
      const resp = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error('ipapi lookup failed');
      }
      const data = await resp.json();
      return data && data.country_code ? data.country_code : null;
    }

    async function lookupCountryViaIpWhois() {
      const resp = await fetch('https://ipwho.is/?fields=country_code', { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error('ipwho.is lookup failed');
      }
      const data = await resp.json();
      return data && data.country_code ? data.country_code : null;
    }

    function geolocateByBrowser() {
      return new Promise(resolve => {
        if (!('geolocation' in navigator)) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          position => {
            const coords = position.coords || {};
            const latitude = typeof coords.latitude === 'number' ? coords.latitude : null;
            const longitude = typeof coords.longitude === 'number' ? coords.longitude : null;
            if (latitude == null || longitude == null) {
              resolve(null);
              return;
            }
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
            fetch(url)
              .then(resp => resp.ok ? resp.json() : null)
              .then(data => resolve(data && data.countryCode ? data.countryCode : null))
              .catch(() => resolve(null));
          },
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
        );
      });
    }

    async function detectCountry(options = {}) {
      // Default to NOT using browser geolocation to avoid triggering a permission prompt.
      const { silent = false, allowGeolocationPrompt = false } = options;
      const runId = ++detectionRunId;
      if (!silent && !selectedCountry) {
        setDropdownLabel('Choose a shipping location', '');
      }

      const applySelection = code => {
        if (runId !== detectionRunId || suppressAutoDetectSelection) {
          return false;
        }
        const normalized = normalizeCountryCode(code);
        if (normalized && COUNTRY_MAP[normalized]) {
          selectCountry(normalized);
          return true;
        }
        return false;
      };

      const detectionAttempts = [];
      if (allowGeolocationPrompt) {
        detectionAttempts.push(withTimeout(geolocateByBrowser(), DETECTION_TIMEOUT_MS));
      }
      detectionAttempts.push(
        withTimeout(lookupCountryViaIpApi(), DETECTION_TIMEOUT_MS),
        withTimeout(lookupCountryViaIpWhois(), DETECTION_TIMEOUT_MS)
      );

      const detected = await firstSuccessful(detectionAttempts, applySelection);

      // Only fall back to prompting when nothing is selected.
      if (!detected && !selectedCountry) {
        promptForCountrySelection();
      }
    }

    function clearShippingSelection(options = {}) {
      const { openPicker = false } = options;
      suppressAutoDetectSelection = true;
      detectionRunId += 1;
      clearStoredCountry();

      selectedCountry = null;
      selectedZone = null;

      const dropdown = document.getElementById('countryDropdown');
      if (dropdown) {
        dropdown.classList.remove('has-selection');
      }

      const searchInput = document.getElementById('countrySearchInput');
      if (searchInput) {
        searchInput.value = '';
      }

      // Force the label back to the default prompt immediately.
      resetCountrySelection();

      handleCountrySearch('');
      updateButtonStates(false);
      promptForCountrySelection();

      if (openPicker) {
        openCountryDropdown();
        if (searchInput) {
          searchInput.focus();
        }
      } else {
        closeCountryDropdown();
      }
    }

    function changeShippingLocation(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      // Reset to the same state as a fresh page load (no selected country).
      clearShippingSelection({ openPicker: false });
      return false;
    }

    function attachPackageGuards() {
      // No-op: package buttons open the shipping modal via inline onclick.
    }

    function trackPreOrderClick(event, packageName, price) {
      const trigger = event ? (event.currentTarget || event.target) : null;
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const zoneLabel = (trigger && trigger.dataset && trigger.dataset.zone) || selectedZone || 'unknown';

      // Always collect/confirm shipping via modal first (instead of inline selector).
      const packageKey = trigger && trigger.dataset && trigger.dataset.package ? trigger.dataset.package : null;
      pendingShippingIntent = { packageName, price, packageKey, triggerEl: trigger };
      if (typeof gtag !== 'undefined') {
        gtag('event', 'preorder_button_clicked', {
          event_category: 'conversion',
          event_label: packageName,
          value: price,
          currency: 'USD',
          shipping_zone: zoneLabel
        });
        gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: price,
          items: [{
            item_id: packageName.toLowerCase().replace(/ /g, '_'),
            item_name: packageName,
            price: price,
            quantity: 1
          }]
        });
      }

      if (typeof rdt !== 'undefined') {
        rdt('track', 'Purchase', {
          value: price,
          currency: 'USD',
          content_name: packageName,
          content_type: 'product'
        });
      }

      const checkoutUrl = getCheckoutUrlForPackage('ZONE_1', packageKey);
      openPreorderConfirmation(packageName, price, checkoutUrl, trigger, { zone: 'ZONE_1', packageKey });
      return false;
    }

    let inlineStoreInitialized = false;
    function initInlineStore() {
      if (inlineStoreInitialized) {
        return;
      }
      inlineStoreInitialized = true;

      renderCountryDropdown();
      setupCountryDropdownInteractions();
      setupCountrySearch();
      updateButtonStates(false);
      setDropdownLabel('Choose a shipping location', '');
      const changeBtn = document.getElementById('countryChangeBtn');
      if (changeBtn) {
        changeBtn.addEventListener('click', event => {
          changeShippingLocation(event);
        });
      }
      // Do not auto-detect country on page load. We only detect once the user clicks
      // a package button and needs to pick a shipping location.
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initInlineStore);
    } else {
      initInlineStore();
    }

    window.trackPreOrderClick = trackPreOrderClick;
    window.changeShippingLocation = changeShippingLocation;
