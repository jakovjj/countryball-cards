(() => {
  'use strict';

  const API = '/api/community';
  const state = { csrf: '', user: null };
  const content = document.getElementById('communityContent');
  const account = document.getElementById('communityAccount');
  const breadcrumbs = document.getElementById('communityBreadcrumbs');
  const notice = document.getElementById('communityNotice');
  const forumHero = document.querySelector('.forum-hero');
  const newThreadButton = document.getElementById('newThreadButton');
  const newRatingButton = document.getElementById('newRatingButton');
  const threadDialog = document.getElementById('threadDialog');
  const ratingDialog = document.getElementById('ratingDialog');
  const ratingForm = document.getElementById('ratingForm');
  const ratingCardGrid = document.getElementById('ratingCardGrid');
  const ratingTierGrid = document.getElementById('ratingTierGrid');
  const profileDialog = document.getElementById('profileDialog');
  const profileForm = document.getElementById('profileForm');
  const avatarGrid = document.getElementById('profileAvatarGrid');
  const galleryCards = Array.isArray(window.countryballGalleryCards) ? window.countryballGalleryCards : [];
  const ratingTiers = ['S', 'A', 'B', 'C', 'D'];
  const ADMIN_EMAIL = 'jakov@jandric.com';
  const ADMIN_DISPLAY_NAME = 'jacob';
  const ADMIN_MARKER = 'countryball-council-admin';
  const editionDetails = {
    'CBC-BASE': { name: 'Base Edition' },
    'CBC-EXTENDED': {
      name: 'Extended Edition',
      image: 'extended_badge.webp',
      tooltip: 'Extended Edition'
    },
    'CBC-FOUNDERS': {
      name: "Founder's Edition",
      image: 'founders_badge.webp',
      tooltip: "Founder's Edition"
    }
  };
  const avatars = [
    'australia','austria','belgium','canada','china','croatia','czechia','finland',
    'france','germany','hungary','india','italy','japan','mexico','mongolia',
    'netherlands','norway','poland','portugal','romania','russia','saudi_arabia',
    'spain','sweden','switzerland','turkey','uk','ukraine','us'
  ];

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
  const avatarName = slug => slug === 'uk' ? 'United Kingdom'
    : slug === 'us' ? 'United States'
      : slug.split('_').map(part => part[0].toUpperCase() + part.slice(1)).join(' ');
  const avatar = (user, className = 'forum-avatar') => {
    const slug = avatars.includes(user?.avatar_slug) ? user.avatar_slug : 'poland';
    return `<span class="${className}" aria-hidden="true"><img src="cb/${slug}.webp" alt="" width="80" height="80" loading="lazy" decoding="async"></span>`;
  };
  const editionBadges = tags => (Array.isArray(tags) ? tags : [])
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
    const hasAdminEmail = Object.values(user || {}).some(value =>
      typeof value === 'string' && value.trim().toLowerCase() === ADMIN_EMAIL
    );
    let hasAdminMarker = false;
    try { hasAdminMarker = localStorage.getItem(ADMIN_MARKER) === '1'; } catch (_) {}
    const signedInAdmin = Object.values(state.user || {}).some(value =>
      typeof value === 'string' && value.trim().toLowerCase() === ADMIN_EMAIL
    ) || hasAdminMarker
      || String(state.user?.display_name || '').trim().toLowerCase() === ADMIN_DISPLAY_NAME;
    const sameProfile = String(user?.display_name || '').trim().toLowerCase()
      === String(state.user?.display_name || '').trim().toLowerCase()
      && (!user?.avatar_slug || !state.user?.avatar_slug || user.avatar_slug === state.user.avatar_slug);
    const isSignedInUser = user === state.user
      || (user?.user_id && user.user_id === state.user?.id)
      || (user?.id && user.id === state.user?.id)
      || sameProfile;
    const isKnownAdminProfile = String(user?.display_name || '').trim().toLowerCase() === ADMIN_DISPLAY_NAME;
    const isAdmin = hasAdminEmail
      || String(user?.role || '').toLowerCase() === 'admin'
      || isKnownAdminProfile
      || (signedInAdmin && isSignedInUser);
    return isAdmin
      ? `<span class="community-edition-sticker community-admin-badge" title="Countryball Cards administrator" role="img" aria-label="Administrator"><img src="admin_badge.webp?v=2026080401" alt="" width="400" height="400" loading="lazy" decoding="async"></span>`
      : '';
  };
  const userBadges = user => `${editionBadges(user?.edition_tags)}${adminBadge(user)}`;
  const parsedDate = value => value
    ? new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
    : null;
  const fullDate = value => {
    const parsed = parsedDate(value);
    return parsed && !Number.isNaN(parsed.getTime())
      ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
      : 'Just now';
  };
  const relativeDate = value => {
    const parsed = parsedDate(value);
    if (!parsed || Number.isNaN(parsed.getTime())) return 'just now';
    const seconds = Math.round((parsed.getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    for (const [unit, size] of [
      ['year', 31536000], ['month', 2592000], ['week', 604800],
      ['day', 86400], ['hour', 3600], ['minute', 60]
    ]) {
      if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
    }
    return 'just now';
  };

  async function api(action, options = {}) {
    const params = new URLSearchParams(options.query || {});
    params.set('action', action);
    const request = { method: options.method || 'GET', credentials: 'same-origin', headers: {} };
    if (options.body) {
      request.method = 'POST';
      request.headers['X-CSRF-Token'] = state.csrf;
      if (options.body instanceof FormData) {
        request.body = options.body;
      } else {
        request.headers['Content-Type'] = 'application/json';
        request.body = JSON.stringify(options.body);
      }
    }
    const response = await fetch(`${API}?${params}`, request);
    const data = await response.json().catch(() => ({ ok: false, error: 'The forum returned an invalid response.' }));
    if (!response.ok || !data.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  function showNotice(message = '') {
    notice.textContent = message;
    notice.hidden = !message;
  }

  function addAttachments(formData, input) {
    Array.from(input?.files || []).slice(0, 4).forEach(file => formData.append('images[]', file));
  }

  const imageMarkup = item => `
    <a class="forum-inline-image" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" aria-label="Open image ${escapeHtml(item.name)}">
      <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.name)}" width="${Number(item.width) || 800}" height="${Number(item.height) || 600}" loading="lazy" decoding="async">
    </a>`;

  function postContentMarkup(body, attachments) {
    const images = Array.isArray(attachments) ? attachments : [];
    const usedImages = new Set();
    let html = escapeHtml(body)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\r?\n/g, '<br>');
    html = html.replace(/\[image:(\d+)\]/gi, (match, number) => {
      const index = Number(number) - 1;
      if (!images[index] || usedImages.has(index)) return '';
      usedImages.add(index);
      return imageMarkup(images[index]);
    });
    const legacyImages = images
      .map((item, index) => usedImages.has(index) ? '' : imageMarkup(item))
      .join('');
    return `<div class="forum-post-content">${html}${legacyImages
      ? `<div class="forum-post-images">${legacyImages}</div>`
      : ''}</div>`;
  }

  const cardName = id => galleryCards.find(card => card.id === id)?.name || escapeHtml(id || '');
  const ratingChipMarkup = (cardId, tier) => tier
    ? `<span class="forum-rating-chip" title="Council card rating: ${escapeHtml(cardName(cardId))}, ${escapeHtml(tier)} tier">
        <img src="cb/${escapeHtml(cardId)}.webp" alt="" width="20" height="20" loading="lazy" decoding="async">
        <span class="tier-badge tier-badge-${escapeHtml(String(tier).toLowerCase())}" aria-hidden="true"><span>${escapeHtml(tier)}</span></span>
      </span>`
    : '';
  const ratingPanelMarkup = post => post?.rating_tier ? `
    <div class="forum-rating-panel" data-tier="${escapeHtml(post.rating_tier)}">
      <span class="forum-rating-stamp">Council Rating</span>
      <div class="forum-rating-card">
        <img src="cb/${escapeHtml(post.rating_card_id)}.webp" alt="" width="80" height="80" loading="lazy" decoding="async">
      </div>
      <div class="forum-rating-details">
        <strong>${escapeHtml(cardName(post.rating_card_id))}</strong>
        <span class="tier-badge tier-badge-${escapeHtml(String(post.rating_tier).toLowerCase())}" aria-label="${escapeHtml(post.rating_tier)} tier"><span>${escapeHtml(post.rating_tier)}</span></span>
      </div>
    </div>` : '';

  const voteWidgetMarkup = post => `
    <div class="forum-post-votes" data-vote-widget="${post.id}">
      <button class="forum-vote-button forum-vote-up${post.my_vote === 1 ? ' is-active' : ''}" type="button" data-vote-post="${post.id}" data-vote-value="1" aria-pressed="${post.my_vote === 1 ? 'true' : 'false'}" aria-label="Upvote this post">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l8 9h-5v7h-6v-7H4z"/></svg>
      </button>
      <span class="forum-vote-score" data-vote-score>${post.vote_score ?? 0}</span>
      <button class="forum-vote-button forum-vote-down${post.my_vote === -1 ? ' is-active' : ''}" type="button" data-vote-post="${post.id}" data-vote-value="-1" aria-pressed="${post.my_vote === -1 ? 'true' : 'false'}" aria-label="Downvote this post">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20l-8-9h5V4h6v7h5z"/></svg>
      </button>
    </div>`;

  function wireVoteButtons(container) {
    container.querySelectorAll('[data-vote-post]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!state.user) { showNotice('Please log in to vote.'); return; }
        const postId = Number(button.dataset.votePost);
        const value = Number(button.dataset.voteValue);
        const widget = container.querySelector(`[data-vote-widget="${postId}"]`);
        const buttons = widget.querySelectorAll('[data-vote-post]');
        buttons.forEach(item => { item.disabled = true; });
        try {
          const result = await api('post_vote', {
            method: 'POST',
            body: { post_id: postId, value }
          });
          widget.querySelector('[data-vote-score]').textContent = result.score;
          buttons.forEach(item => {
            const isActive = Number(item.dataset.voteValue) === result.my_vote;
            item.classList.toggle('is-active', isActive);
            item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          });
        } catch (error) {
          showNotice(error.message);
        } finally {
          buttons.forEach(item => { item.disabled = false; });
        }
      });
    });
  }

  const editorToolbar = (id, includeImage = true) => `
    <div class="forum-editor-toolbar" role="toolbar" aria-label="Text formatting">
      <button type="button" data-editor-command="bold" aria-label="Bold" title="Bold"><strong>B</strong></button>
      <button type="button" data-editor-command="italic" aria-label="Italic" title="Italic"><em>I</em></button>
      ${includeImage ? `<button type="button" data-editor-image aria-label="Insert photo" title="Insert photo">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><circle cx="9" cy="10" r="2"/><path d="m4 17 4-4 3 3 3-4 6 6"/></svg>
        <span>Photo</span>
      </button>
      <input id="${id}Images" class="forum-file-input" name="images[]" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple tabindex="-1" aria-hidden="true">` : ''}
    </div>`;

  function editorFields(id, name, options = {}) {
    const value = options.value || '';
    return `
      <div class="forum-rich-editor" data-rich-editor data-minlength="${options.minlength || 2}" data-maxlength="5000">
        ${editorToolbar(id, options.images !== false)}
        <div id="${id}" class="forum-editor-surface" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="${escapeHtml(options.placeholder || 'Write your post…')}"></div>
        <textarea name="${name}" hidden>${escapeHtml(value)}</textarea>
        <p class="forum-editor-help">${options.images === false
          ? 'Select text to make it bold or italic.'
          : 'Add up to 4 photos (JPEG, PNG, WebP, or GIF · 5 MB each). Photos appear where you insert them.'}</p>
      </div>`;
  }

  function editorInitialMarkup(body, attachments) {
    const images = Array.isArray(attachments) ? attachments : [];
    const used = new Set();
    const figure = (item, index) => `<figure class="forum-editor-image" contenteditable="false" data-image-index="${index + 1}">
      <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.name)}">
    </figure>`;
    let html = escapeHtml(body)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\r?\n/g, '<br>');
    html = html.replace(/\[image:(\d+)\]/gi, (match, number) => {
      const index = Number(number) - 1;
      if (!images[index] || used.has(index)) return '';
      used.add(index);
      return figure(images[index], index);
    });
    images.forEach((item, index) => {
      if (!used.has(index)) html += figure(item, index);
    });
    return html;
  }

  function wireRichEditor(container, options = {}) {
    if (!container) return null;
    const surface = container.querySelector('.forum-editor-surface');
    const textarea = container.querySelector('textarea[name]');
    const input = container.querySelector('input[type="file"]');
    const minLength = Number(container.dataset.minlength) || 2;
    const maxLength = Number(container.dataset.maxlength) || 5000;
    const initialAttachments = Array.isArray(options.attachments) ? options.attachments : [];
    let files = [];
    let objectUrls = [];
    let savedRange = null;
    let fileSequence = 0;

    const selectionInside = () => {
      const selection = window.getSelection();
      return selection?.rangeCount && surface.contains(selection.anchorNode);
    };
    const saveRange = () => {
      if (selectionInside()) savedRange = window.getSelection().getRangeAt(0).cloneRange();
    };
    const restoreRange = () => {
      surface.focus();
      if (!savedRange) return;
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    };
    const setFiles = () => {
      if (!input || typeof DataTransfer === 'undefined') return;
      const transfer = new DataTransfer();
      files.forEach(item => transfer.items.add(item.file));
      input.files = transfer.files;
    };
    const reindexImages = () => {
      const figures = Array.from(surface.querySelectorAll('.forum-editor-image[data-new-image]'));
      files = figures
        .map(figure => files.find(item => item.id === figure.dataset.fileId))
        .filter(Boolean);
      figures.forEach((figure, index) => {
        figure.dataset.imageIndex = String(index + 1);
      });
      setFiles();
    };
    const serializeNode = node => {
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      if (node.matches('.forum-editor-image')) return `\n[image:${node.dataset.imageIndex}]\n`;
      const inner = Array.from(node.childNodes).map(serializeNode).join('');
      if (node.matches('strong,b')) return `**${inner}**`;
      if (node.matches('em,i')) return `*${inner}*`;
      if (node.matches('br')) return '\n';
      return node.matches('div,p') ? `${inner}\n` : inner;
    };
    const sync = () => {
      reindexImages();
      textarea.value = Array.from(surface.childNodes)
        .map(serializeNode)
        .join('')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      textarea.setCustomValidity(textarea.value.replace(/\[image:\d+\]/g, '').trim().length < minLength
        ? `Please write at least ${minLength} characters.`
        : textarea.value.length > maxLength ? `Please keep the post under ${maxLength} characters.` : '');
      return textarea.value;
    };
    const insertFigure = (src, name, fileId) => {
      restoreRange();
      const figure = document.createElement('figure');
      figure.className = 'forum-editor-image';
      figure.contentEditable = 'false';
      figure.dataset.newImage = 'true';
      figure.dataset.fileId = fileId;
      figure.innerHTML = `<img src="${escapeHtml(src)}" alt="${escapeHtml(name)}"><button type="button" aria-label="Remove ${escapeHtml(name)}">&times;</button>`;
      const range = window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null;
      if (range && surface.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(figure);
        range.setStartAfter(figure);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        savedRange = range.cloneRange();
      } else {
        surface.append(figure);
      }
      sync();
    };

    surface.innerHTML = editorInitialMarkup(textarea.value, initialAttachments);
    sync();

    surface.addEventListener('input', sync);
    surface.addEventListener('keyup', saveRange);
    surface.addEventListener('mouseup', saveRange);
    surface.addEventListener('focus', saveRange);
    surface.addEventListener('paste', event => {
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    });
    container.querySelectorAll('[data-editor-command]').forEach(button => {
      const format = event => {
        event.preventDefault();
        restoreRange();
        document.execCommand(button.dataset.editorCommand, false);
        saveRange();
        sync();
      };
      button.addEventListener('mousedown', format);
      button.addEventListener('click', event => {
        if (event.detail === 0) format(event);
      });
    });
    const imageButton = container.querySelector('[data-editor-image]');
    const chooseImage = event => {
      event.preventDefault();
      saveRange();
      input.click();
    };
    imageButton?.addEventListener('mousedown', chooseImage);
    imageButton?.addEventListener('click', event => {
      if (event.detail === 0) chooseImage(event);
    });
    input?.addEventListener('change', () => {
      const chosen = Array.from(input.files || []);
      if (files.length + chosen.length > 4) {
        input.value = '';
        container.querySelector('.forum-editor-help').textContent = 'You can add no more than 4 photos.';
        return;
      }
      chosen.forEach(file => {
        const item = { id: `photo-${Date.now()}-${fileSequence += 1}`, file };
        files.push(item);
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        insertFigure(url, file.name, item.id);
      });
      setFiles();
    });
    surface.addEventListener('click', event => {
      const remove = event.target.closest('.forum-editor-image button');
      if (!remove) return;
      const figure = remove.closest('.forum-editor-image');
      files = files.filter(item => item.id !== figure.dataset.fileId);
      figure.remove();
      setFiles();
      sync();
      surface.focus();
    });
    container.closest('form')?.addEventListener('reset', () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      objectUrls = [];
      files = [];
      window.setTimeout(() => {
        surface.innerHTML = '';
        sync();
      });
    });
    return { sync, surface, textarea };
  }

  function renderAccount() {
    if (!state.user) return;
    account.innerHTML = `
      ${avatar(state.user, 'forum-avatar forum-account-avatar')}
      <div class="forum-user-copy">
        <strong>${escapeHtml(state.user.display_name)}</strong>
        <span class="community-edition-badges">${userBadges(state.user)}</span>
      </div>
      <button id="editProfileButton" class="forum-account-action" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        <span>Edit profile</span>
      </button>
      <button id="logoutButton" class="forum-account-action" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>
        <span>Log out</span>
      </button>`;
    document.getElementById('editProfileButton').addEventListener('click', openProfile);
    document.getElementById('logoutButton').addEventListener('click', async () => {
      await api('logout', { method: 'POST', body: {} });
      try { localStorage.removeItem(ADMIN_MARKER); } catch (_) {}
      window.location.assign('forum.html');
    });
    newThreadButton.hidden = false;
    newRatingButton.hidden = false;
  }

  function openProfile() {
    profileForm.elements.display_name.value = state.user.display_name;
    avatarGrid.innerHTML = avatars.map(slug => `
      <label class="profile-avatar-option" title="${escapeHtml(avatarName(slug))}">
        <input type="radio" name="avatar_slug" value="${slug}" ${slug === state.user.avatar_slug ? 'checked' : ''}>
        <span><img src="cb/${slug}.webp" alt="" width="80" height="80" decoding="async"></span>
        <small>${escapeHtml(avatarName(slug))}</small>
      </label>`).join('');
    const profileBadges = document.getElementById('profileEditionBadges');
    const profileEdition = profileBadges.closest('.profile-current-edition');
    profileBadges.innerHTML = editionBadges(state.user?.edition_tags);
    profileEdition.hidden = !profileBadges.innerHTML;
    profileForm.querySelector('[data-profile-error]').textContent = '';
    profileDialog.showModal();
    window.setTimeout(() => profileForm.elements.display_name.focus(), 50);
  }

  function renderTopics(threads) {
    const replyTotal = threads.reduce((sum, thread) => sum + Math.max(0, thread.post_count - 1), 0);
    content.innerHTML = `
      <section class="forum-board" aria-label="Forum discussions">
        <header class="forum-board-head">
          <span>${threads.length} post${threads.length === 1 ? '' : 's'} · ${replyTotal} repl${replyTotal === 1 ? 'y' : 'ies'}</span>
          <span>Replies</span><span>Latest activity</span>
        </header>
        ${threads.length ? threads.map(thread => {
          const replies = Math.max(0, thread.post_count - 1);
          return `<a class="forum-topic" href="?thread=${thread.id}" data-thread-link="${thread.id}">
            <div class="forum-topic-main">${avatar(thread, 'forum-avatar forum-topic-avatar')}<div style="min-width:0">
              <div class="forum-topic-title">${thread.is_pinned ? '<span class="forum-pin">Pinned</span>' : ''}${ratingChipMarkup(thread.rating_card_id, thread.rating_tier)}${escapeHtml(thread.title)}</div>
              <div class="forum-topic-meta">Started by <strong>${escapeHtml(thread.display_name)}</strong> · ${fullDate(thread.created_at)}</div>
            </div></div>
            <div class="forum-reply-count"><strong>${replies}</strong><span>repl${replies === 1 ? 'y' : 'ies'}</span></div>
            <div class="forum-last-post"><strong>${escapeHtml(thread.display_name)}</strong><br>${relativeDate(thread.updated_at)}</div>
          </a>`;
        }).join('') : '<div class="forum-empty">No posts yet. Start the first conversation.</div>'}
      </section>`;

    content.querySelectorAll('[data-thread-link]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        history.pushState({}, '', `?thread=${link.dataset.threadLink}`);
        route();
      });
    });
  }

  async function renderHome() {
    breadcrumbs.innerHTML = '<span>Forum home</span>';
    renderTopics((await api('threads')).threads);
  }

  async function renderThread(id) {
    const thread = (await api('thread', { query: { id } })).thread;
    const originalPost = thread.posts[0];
    const isOriginalPoster = post => {
      if (originalPost?.user_id != null && post?.user_id != null) {
        return String(post.user_id) === String(originalPost.user_id);
      }
      return post === originalPost
        || String(post?.display_name || '').trim().toLowerCase()
          === String(originalPost?.display_name || '').trim().toLowerCase();
    };
    breadcrumbs.innerHTML = '<a href="forum.html" data-home-link>Forum home</a><span>Discussion</span>';
    content.innerHTML = `
      <article>
        <header class="forum-thread-title">
          <span class="forum-kicker">${thread.is_pinned ? 'Pinned discussion' : 'Discussion'}</span>
          <h1>${escapeHtml(thread.title)}</h1>
          <p>Started by ${escapeHtml(thread.display_name)} · ${fullDate(thread.created_at)}</p>
          ${thread.can_pin ? `
            <button class="forum-thread-pin-action" type="button" data-pin-thread="${thread.id}" aria-pressed="${thread.is_pinned ? 'true' : 'false'}">
              ${thread.is_pinned ? 'Unpin post' : 'Pin post'}
            </button>` : ''}
        </header>
        <div class="forum-post-list">
          ${thread.posts.map((post, index) => `
            <article class="forum-post" id="post-${post.id}">
              <aside class="forum-post-author">
                ${avatar(post)}
                <div><strong>${escapeHtml(post.display_name)}</strong>
                  ${isOriginalPoster(post) ? '<span>Original poster</span>' : ''}
                  <span class="community-edition-badges">${userBadges(post)}</span>
                </div>
                ${voteWidgetMarkup(post)}
              </aside>
              <div class="forum-post-body">
                ${ratingPanelMarkup(post)}
                <div data-post-content>${postContentMarkup(post.body, post.attachments)}</div>
                <footer class="forum-post-footer">
                  <span class="forum-post-timing">
                    <time datetime="${escapeHtml(post.created_at)}">${fullDate(post.created_at)}</time>
                  </span>
                  <span class="forum-post-footer-end">
                    ${post.can_edit
                      ? `<button class="forum-post-action" type="button" data-edit-post="${post.id}">Edit</button>`
                      : ''}
                    ${post.can_delete ? `
                      <button class="forum-post-action forum-post-delete" type="button" data-delete-post="${post.id}">
                        ${index === 0 ? 'Delete discussion' : 'Delete'}
                      </button>` : ''}
                    <span>#${index + 1}</span>
                  </span>
                </footer>
              </div>
            </article>`).join('')}
        </div>
        ${thread.is_locked ? '<div class="forum-empty">This discussion is locked.</div>' : `
          <form class="forum-reply" id="replyForm">
            <label for="replyBody">Join the conversation</label>
            ${editorFields('replyBody', 'body', { minlength: 2, placeholder: 'Write a reply…' })}
            <div class="forum-reply-actions">
              <p class="forum-form-error" data-form-error role="alert"></p>
              <button class="forum-submit-button" type="submit">Post reply</button>
            </div>
          </form>`}
      </article>`;

    wireVoteButtons(content);

    content.querySelector('[data-pin-thread]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      const pinned = !thread.is_pinned;
      button.disabled = true;
      button.textContent = pinned ? 'Pinning…' : 'Unpinning…';
      try {
        await api('set_pin', {
          method: 'POST',
          body: { thread_id: thread.id, pinned }
        });
        await renderThread(thread.id);
        showNotice(pinned
          ? 'The discussion is now pinned to the top of the Council.'
          : 'The discussion is no longer pinned.');
      } catch (error) {
        showNotice(error.message);
        button.disabled = false;
        button.textContent = thread.is_pinned ? 'Unpin post' : 'Pin post';
      }
    });

    content.querySelectorAll('[data-edit-post]').forEach(button => {
      button.addEventListener('click', () => {
        const post = thread.posts.find(item => item.id === Number(button.dataset.editPost));
        const article = button.closest('.forum-post');
        if (!post || !article || article.querySelector('.forum-post-editor')) return;
        const body = article.querySelector('.forum-post-body');
        const contentNode = article.querySelector('[data-post-content]');
        const footer = article.querySelector('.forum-post-footer');
        contentNode.hidden = true;
        footer.hidden = true;
        body.insertAdjacentHTML('afterbegin', `
          <form class="forum-post-editor">
            <label for="editPost${post.id}">Edit post</label>
            ${editorFields(`editPost${post.id}`, 'body', {
              value: post.body,
              minlength: post.id === thread.posts[0]?.id ? 10 : 2,
              placeholder: 'Edit your post…',
              images: false
            })}
            <div class="forum-post-editor-actions">
              <p class="forum-form-error" data-form-error role="alert"></p>
              <div>
                <button class="forum-cancel-button" type="button" data-cancel-edit>Cancel</button>
                <button class="forum-submit-button" type="submit">Save changes</button>
              </div>
            </div>
          </form>`);
        const editor = body.querySelector('.forum-post-editor');
        const richEditor = wireRichEditor(editor.querySelector('[data-rich-editor]'), { attachments: post.attachments });
        editor.querySelector('[data-cancel-edit]').addEventListener('click', () => {
          editor.remove();
          contentNode.hidden = false;
          footer.hidden = false;
        });
        editor.addEventListener('submit', async event => {
          event.preventDefault();
          richEditor.sync();
          if (!richEditor.textarea.checkValidity()) {
            editor.querySelector('[data-form-error]').textContent = richEditor.textarea.validationMessage;
            richEditor.surface.focus();
            return;
          }
          const errorNode = editor.querySelector('[data-form-error]');
          const submit = editor.querySelector('[type="submit"]');
          errorNode.textContent = '';
          submit.disabled = true;
          submit.textContent = 'Saving…';
          try {
            await api('edit_post', {
              method: 'POST',
              body: { post_id: post.id, body: editor.elements.body.value }
            });
            await renderThread(thread.id);
            document.getElementById(`post-${post.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (error) {
            errorNode.textContent = error.message;
            submit.disabled = false;
            submit.textContent = 'Save changes';
          }
        });
        richEditor.surface.focus();
      });
    });
    content.querySelectorAll('[data-delete-post]').forEach(button => {
      button.addEventListener('click', async () => {
        const postId = Number(button.dataset.deletePost);
        const isOriginalPost = postId === thread.posts[0]?.id;
        const prompt = isOriginalPost
          ? 'Delete this entire discussion and all of its replies? This cannot be undone.'
          : 'Delete this post? This cannot be undone.';
        if (!window.confirm(prompt)) return;
        button.disabled = true;
        button.textContent = 'Deleting…';
        try {
          const result = await api('delete_post', {
            method: 'POST',
            body: { post_id: postId }
          });
          if (result.deleted_thread) {
            history.pushState({}, '', 'forum.html');
            await route();
            showNotice('The discussion was deleted.');
          } else {
            await renderThread(thread.id);
            showNotice('The post was deleted.');
          }
        } catch (error) {
          showNotice(error.message);
          button.disabled = false;
          button.textContent = isOriginalPost ? 'Delete discussion' : 'Delete';
        }
      });
    });
    document.querySelector('[data-home-link]')?.addEventListener('click', event => {
      event.preventDefault();
      history.pushState({}, '', 'forum.html');
      route();
    });
    const replyForm = document.getElementById('replyForm');
    const replyEditor = replyForm ? wireRichEditor(replyForm.querySelector('[data-rich-editor]')) : null;
    replyForm?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      replyEditor.sync();
      if (!replyEditor.textarea.checkValidity()) {
        form.querySelector('[data-form-error]').textContent = replyEditor.textarea.validationMessage;
        replyEditor.surface.focus();
        return;
      }
      const errorNode = form.querySelector('[data-form-error]');
      const submit = form.querySelector('[type="submit"]');
      errorNode.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Posting…';
      try {
        const body = new FormData();
        body.set('thread_id', String(thread.id));
        body.set('body', form.elements.body.value);
        addAttachments(body, form.elements['images[]']);
        await api('reply', {
          method: 'POST',
          body
        });
        await renderThread(thread.id);
        document.querySelector('.forum-post:last-child')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (error) {
        errorNode.textContent = error.message;
        submit.disabled = false;
        submit.textContent = 'Post reply';
      }
    });
  }

  async function route() {
    showNotice('');
    content.innerHTML = '<div class="forum-loading"><span></span>Loading discussions…</div>';
    const threadId = Number(new URLSearchParams(location.search).get('thread'));
    forumHero.hidden = threadId > 0;
    try {
      if (threadId > 0) await renderThread(threadId);
      else await renderHome();
    } catch (error) {
      content.innerHTML = `<div class="forum-board"><div class="forum-empty">${escapeHtml(error.message)}</div></div>`;
    }
  }

  document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => threadDialog.close());
  });
  threadDialog.addEventListener('click', event => {
    if (event.target === threadDialog) threadDialog.close();
  });
  newThreadButton.addEventListener('click', () => {
    threadDialog.showModal();
    window.setTimeout(() => document.getElementById('threadTitle').focus(), 50);
  });
  const threadEditor = wireRichEditor(document.querySelector('#threadForm [data-rich-editor]'));
  document.getElementById('threadForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const errorNode = form.querySelector('[data-form-error]');
    const submit = form.querySelector('[type="submit"]');
    errorNode.textContent = '';
    threadEditor.sync();
    if (!threadEditor.textarea.checkValidity()) {
      errorNode.textContent = threadEditor.textarea.validationMessage;
      threadEditor.surface.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Publishing…';
    try {
      const body = new FormData();
      body.set('category', 'general');
      body.set('title', form.elements.title.value);
      body.set('body', form.elements.body.value);
      addAttachments(body, form.elements['images[]']);
      const result = await api('create_thread', {
        method: 'POST',
        body
      });
      form.reset();
      threadDialog.close();
      history.pushState({}, '', `?thread=${result.thread_id}`);
      await route();
    } catch (error) {
      errorNode.textContent = error.message;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Publish post';
    }
  });

  ratingCardGrid.innerHTML = galleryCards.map(card => `
    <label class="profile-avatar-option" title="${escapeHtml(card.name)}">
      <input type="radio" name="rating_card_id" value="${escapeHtml(card.id)}" required>
      <span><img src="cb/${escapeHtml(card.id)}.webp" alt="" width="80" height="80" decoding="async"></span>
      <small>${escapeHtml(card.name)}</small>
    </label>`).join('');
  ratingTierGrid.innerHTML = ratingTiers.map(tier => `
    <label class="rating-tier-option" title="${escapeHtml(tier)} tier">
      <input type="radio" name="rating_tier" value="${tier}" required>
      <span class="tier-badge tier-badge-${tier.toLowerCase()}" aria-hidden="true"><span>${tier}</span></span>
    </label>`).join('');
  document.querySelectorAll('[data-close-rating]').forEach(button => {
    button.addEventListener('click', () => ratingDialog.close());
  });
  ratingDialog.addEventListener('click', event => {
    if (event.target === ratingDialog) ratingDialog.close();
  });
  newRatingButton.addEventListener('click', () => {
    ratingForm.reset();
    ratingForm.querySelector('[data-form-error]').textContent = '';
    ratingDialog.showModal();
  });
  ratingForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const errorNode = form.querySelector('[data-form-error]');
    const submit = form.querySelector('[type="submit"]');
    const cardId = form.elements.rating_card_id.value;
    const tier = form.elements.rating_tier.value;
    errorNode.textContent = '';
    if (!cardId) { errorNode.textContent = 'Choose a card to rate.'; return; }
    if (!tier) { errorNode.textContent = 'Choose a tier from D to S.'; return; }
    submit.disabled = true;
    submit.textContent = 'Posting…';
    try {
      const result = await api('create_thread', {
        method: 'POST',
        body: {
          post_type: 'card_rating',
          category: 'ratings',
          rating_card_id: cardId,
          rating_tier: tier,
          body: form.elements.body.value,
        }
      });
      form.reset();
      ratingDialog.close();
      history.pushState({}, '', `?thread=${result.thread_id}`);
      await route();
    } catch (error) {
      errorNode.textContent = error.message;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Post rating';
    }
  });

  document.querySelectorAll('[data-close-profile]').forEach(button => {
    button.addEventListener('click', () => profileDialog.close());
  });
  profileDialog.addEventListener('click', event => {
    if (event.target === profileDialog) profileDialog.close();
  });
  profileForm.addEventListener('submit', async event => {
    event.preventDefault();
    const errorNode = profileForm.querySelector('[data-profile-error]');
    const submit = profileForm.querySelector('[type="submit"]');
    const chosenAvatar = new FormData(profileForm).get('avatar_slug');
    errorNode.textContent = '';
    submit.disabled = true;
    submit.textContent = 'Saving…';
    try {
      const result = await api('update_profile', {
        method: 'POST',
        body: {
          display_name: profileForm.elements.display_name.value,
          avatar_slug: chosenAvatar
        }
      });
      state.user = result.user;
      renderAccount();
      profileDialog.close();
      await route();
      showNotice('Your Council profile has been updated.');
    } catch (error) {
      errorNode.textContent = error.message;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Save profile';
    }
  });

  window.addEventListener('popstate', route);
  forumHero.hidden = Number(new URLSearchParams(location.search).get('thread')) > 0;
  (async () => {
    try {
      const session = await api('session');
      state.csrf = session.csrf;
      state.user = session.user;
      if (!state.user) return;
      renderAccount();
      await route();
    } catch (error) {
      account.textContent = 'Forum unavailable';
      content.innerHTML = `<div class="forum-empty">${escapeHtml(error.message)}</div>`;
    }
  })();
})();
