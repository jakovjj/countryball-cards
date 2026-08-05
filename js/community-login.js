(() => {
  'use strict';

  const API = '/api/community';
  const button = document.getElementById('googleLoginButton');
  const status = document.getElementById('communityLoginStatus');
  const loginShell = document.getElementById('communityLoginShell');
  const forumShell = document.getElementById('communityForumShell');
  let csrf = '';
  let googleClientId = '';
  let initialized = false;
  const ADMIN_EMAIL = 'jakov@jandric.com';
  const ADMIN_MARKER = 'countryball-council-admin';

  function credentialEmail(credential) {
    try {
      const encoded = credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
      const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0));
      return String(JSON.parse(new TextDecoder().decode(bytes)).email || '').trim().toLowerCase();
    } catch (_) {
      return '';
    }
  }

  function setStatus(message = '', kind = '') {
    status.textContent = message;
    status.className = `community-login-status${kind ? ` is-${kind}` : ''}`;
  }

  async function api(action, options = {}) {
    const response = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers: options.body ? {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf
      } : {},
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({
      ok: false,
      error: 'The community service returned an invalid response.'
    }));
    if (!response.ok || !data.ok) {
      const error = new Error(data.error || 'We could not sign you in.');
      error.code = data.code || '';
      throw error;
    }
    return data;
  }

  async function handleGoogleCredential(response) {
    if (!response?.credential) {
      setStatus('Google did not return a sign-in credential. Please try again.', 'error');
      return;
    }

    button.classList.add('is-busy');
    setStatus('Checking your community access…', 'checking');

    try {
      const email = credentialEmail(response.credential);
      const result = await api('google_login', {
        method: 'POST',
        body: { credential: response.credential }
      });
      try {
        if (email === ADMIN_EMAIL) localStorage.setItem(ADMIN_MARKER, '1');
        else localStorage.removeItem(ADMIN_MARKER);
      } catch (_) {}
      if (result.redirect) {
        window.location.assign(result.redirect);
        return;
      }
      setStatus('You’re signed in. Opening the community…', 'success');
      window.location.reload();
    } catch (error) {
      const messages = {
        access_pending: "We don't recognize that Google account yet.",
        purchase_not_found: 'No game order matched this Google account. Try the email used at checkout.',
        purchase_check_unavailable: 'Purchase checking is temporarily unavailable. Please try again shortly.'
      };
      const message = messages[error.code] || error.message;
      setStatus(message, 'error');
    } finally {
      button.classList.remove('is-busy');
    }
  }

  function initializeGoogleButton() {
    if (initialized || !googleClientId || !window.google?.accounts?.id) return false;
    initialized = true;
    button.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'popup'
    });
    // Google sizes the personalized button inside its iframe from this value.
    // Keep that SDK-owned width in sync with the iframe instead of stretching
    // the iframe later with CSS, which clips signed-in account details.
    const availableWidth = Math.floor(button.clientWidth);
    window.google.accounts.id.renderButton(button, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      locale: 'en',
      width: Math.min(400, Math.max(200, availableWidth))
    });
    return true;
  }

  async function boot() {
    try {
      const session = await api('session');
      csrf = session.csrf;
      googleClientId = session.oauth?.google_client_id || '';

      if (session.user) {
        loginShell.hidden = true;
        forumShell.hidden = false;
        return;
      }

      loginShell.hidden = false;
      forumShell.hidden = true;
      if (!googleClientId) {
        button.innerHTML = '<span class="community-login-unavailable">Google sign-in is being configured.</span>';
        setStatus('Please check back soon.', 'muted');
        return;
      }

      let attempts = 0;
      const waitForGoogle = window.setInterval(() => {
        attempts += 1;
        if (initializeGoogleButton() || attempts >= 50) {
          window.clearInterval(waitForGoogle);
          if (!initialized) {
            button.innerHTML = '<span class="community-login-unavailable">Google sign-in could not load.</span>';
            setStatus('Check your connection or content-blocking settings, then refresh.', 'error');
          }
        }
      }, 100);
    } catch (error) {
      button.innerHTML = '<span class="community-login-unavailable">Sign-in is temporarily unavailable.</span>';
      setStatus(error.message, 'error');
    }
  }

  boot();
})();
