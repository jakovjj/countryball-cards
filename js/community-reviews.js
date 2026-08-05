(() => {
  const API = '/api/community';
  const cardId = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '').toLowerCase();
  const hero = document.querySelector('.card-page-hero');
  if (!hero || !cardId) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '../community.css?v=2026080304';
  document.head.appendChild(stylesheet);

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
  const formatDate = value => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
    .format(new Date(`${value.replace(' ', 'T')}Z`));
  const editionDetails = {
    'CBC-BASE': { name: 'Base Edition' },
    'CBC-EXTENDED': {
      name: 'Extended Edition',
      image: '../extended_badge.webp',
      tooltip: 'Extended Edition'
    },
    'CBC-FOUNDERS': {
      name: "Founder's Edition",
      image: '../founders_badge.webp',
      tooltip: "Founder's Edition"
    }
  };
  const editionBadges = (tags) => (Array.isArray(tags) ? tags : [])
    .filter(tag => tag !== 'CBC-BASE')
    .map(tag => {
      const edition = editionDetails[tag];
      if (!edition?.image) {
        return `<span class="community-edition-badge" data-edition="${escapeHtml(tag)}">${escapeHtml(edition?.name || tag)}</span>`;
      }
      return `<span class="community-edition-sticker community-tooltip" data-edition="${escapeHtml(tag)}" data-tooltip="${escapeHtml(edition.tooltip)}" role="img" tabindex="0" aria-label="${escapeHtml(edition.tooltip)}"><img src="${edition.image}" alt="" width="64" height="64" loading="lazy" decoding="async"></span>`;
    })
    .join('');
  const adminBadge = user => {
    let hasAdminMarker = false;
    try { hasAdminMarker = localStorage.getItem('countryball-council-admin') === '1'; } catch (_) {}
    const signedInAdmin = Object.values(session.user || {}).some(value =>
      typeof value === 'string' && value.trim().toLowerCase() === 'jakov@jandric.com'
    ) || hasAdminMarker
      || String(session.user?.display_name || '').trim().toLowerCase() === 'jacob';
    const sameProfile = String(user?.display_name || '').trim().toLowerCase()
      === String(session.user?.display_name || '').trim().toLowerCase()
      && (!user?.avatar_slug || !session.user?.avatar_slug || user.avatar_slug === session.user.avatar_slug);
    const isSignedInUser = (user?.user_id && user.user_id === session.user?.id)
      || (user?.id && user.id === session.user?.id)
      || sameProfile;
    const isKnownAdminProfile = String(user?.display_name || '').trim().toLowerCase() === 'jacob';
    return String(user?.role || '').toLowerCase() === 'admin' || isKnownAdminProfile || (signedInAdmin && isSignedInUser)
      ? `<span class="community-edition-sticker community-admin-badge" title="Countryball Cards administrator" role="img" aria-label="Administrator"><img src="../admin_badge.webp?v=2026080401" alt="" width="400" height="400" loading="lazy" decoding="async"></span>`
      : '';
  };
  const avatar = review => {
    const slug = /^[a-z_]+$/.test(review.avatar_slug || '') ? review.avatar_slug : 'poland';
    return `<span class="card-review-avatar" aria-hidden="true"><img src="../cb/${slug}.webp" alt="" width="80" height="80" loading="lazy" decoding="async"></span>`;
  };
  let session = { csrf: '', user: null };
  const section = document.createElement('section');
  section.className = 'card-reviews';
  section.setAttribute('aria-labelledby', 'cardReviewsTitle');
  hero.insertAdjacentElement('afterend', section);

  async function request(action, options = {}) {
    const params = new URLSearchParams(options.query || {});
    params.set('action', action);
    const init = { credentials: 'same-origin', headers: {} };
    if (options.body) {
      init.method = 'POST';
      init.headers['Content-Type'] = 'application/json';
      init.headers['X-CSRF-Token'] = session.csrf;
      init.body = JSON.stringify(options.body);
    }
    const response = await fetch(`${API}?${params}`, init);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  function stars(rating) {
    return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
  }

  async function render() {
    section.innerHTML = '<div class="community-loading">Loading player reviews…</div>';
    try {
      const data = await request('reviews', { query: { card: cardId } });
      const own = data.my_review;
      section.innerHTML = `
        <div class="card-reviews-head">
          <div><span class="community-eyebrow">Verified owners</span><h2 id="cardReviewsTitle">Player reviews</h2></div>
          <div class="card-reviews-summary">
            <strong>${data.summary.average === null ? 'New' : `${data.summary.average} / 5`}</strong>
            ${data.summary.count} review${data.summary.count === 1 ? '' : 's'}
          </div>
        </div>
        ${session.user ? `<form class="card-review-compose" id="cardReviewForm">
          <strong>${own ? 'Update your review' : 'Review this card'}</strong>
          <div class="card-review-stars" aria-label="Rating">
            ${[5,4,3,2,1].map(value => `<input id="reviewStar${value}" type="radio" name="rating" value="${value}" ${Number(own?.rating) === value ? 'checked' : ''} required><label for="reviewStar${value}" title="${value} stars">★</label>`).join('')}
          </div>
          <textarea name="body" rows="3" minlength="5" maxlength="1200" required placeholder="How does this card play at your table?">${escapeHtml(own?.body || '')}</textarea>
          <p class="community-form-error" data-review-error></p>
          <button class="community-primary-button" type="submit">${own ? 'Save changes' : 'Post review'}</button>
        </form>` : `<div class="card-review-compose">Own the game? <a href="../forum.html#login">Log in to leave a review.</a></div>`}
        <div class="card-review-list">
          ${data.reviews.length ? data.reviews.map(review => `
            <article class="card-review">
              <div class="card-review-meta">
                ${avatar(review)}
                <span><strong>${escapeHtml(review.display_name)} <span title="Verified owner">✓</span></strong><span class="community-edition-badges">${editionBadges(review.edition_tags)}${adminBadge(review)}</span></span>
                <span class="card-review-rating" aria-label="${review.rating} out of 5 stars">${stars(review.rating)}</span>
              </div>
              <p>${escapeHtml(review.body)}</p>
              <time class="community-post-time">${formatDate(review.updated_at || review.created_at)}</time>
            </article>`).join('') : '<div class="community-empty">No reviews yet. Be the first player to rate this card.</div>'}
        </div>`;
      document.getElementById('cardReviewForm')?.addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const error = form.querySelector('[data-review-error]');
        const data = Object.fromEntries(new FormData(form));
        error.textContent = '';
        try {
          await request('review', { body: { card_id: cardId, rating: Number(data.rating), body: data.body } });
          await render();
        } catch (exception) { error.textContent = exception.message; }
      });
    } catch (error) {
      section.innerHTML = `<div class="community-empty">${escapeHtml(error.message)}</div>`;
    }
  }

  (async () => {
    try { session = await request('session'); } catch (_) {}
    await render();
  })();
})();
