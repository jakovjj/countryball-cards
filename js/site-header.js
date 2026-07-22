(function () {
  const script = document.currentScript;
  if (!script) return;

  const scriptSrc = script.getAttribute('src') || '';
  const basePath = scriptSrc.includes('../') ? '../' : '';
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const inCardsSection = window.location.pathname.toLowerCase().includes('/cards/');
  const isHome = currentPage === 'index.html' || currentPage === '';
  const isGallery = currentPage === 'gallery.html';
  const buyHref = isHome ? '#editionComparison' : `${basePath}index.html#editionComparison`;
  const homeActiveClass = isHome ? ' site-topbar-link-active' : '';
  const homeCurrent = isHome ? ' aria-current="page"' : '';
  const galleryActiveClass = isGallery || inCardsSection ? ' site-topbar-link-active' : '';
  const galleryCurrent = isGallery ? ' aria-current="page"' : '';

  script.insertAdjacentHTML('beforebegin', `
  <header class="site-topbar" role="banner">
    <div class="site-topbar-inner">
      <nav class="site-topbar-nav" aria-label="Primary">
        <a class="site-topbar-brand" href="${basePath}index.html" aria-label="Countryball Cards home">
          <img class="site-topbar-brand-icon" src="${basePath}assets/site-icon-80.webp" alt="" width="80" height="80" loading="eager" decoding="async" fetchpriority="high">
          <img class="site-topbar-brand-title" src="${basePath}assets/title-240.webp" srcset="${basePath}assets/title-240.webp 240w, ${basePath}assets/title-360.webp 360w, ${basePath}assets/title.webp 671w" sizes="120px" alt="Countryball Cards" width="240" height="143" loading="eager" decoding="async" fetchpriority="high">
        </a>

        <div class="site-topbar-actions" aria-label="Links">
          <a class="site-topbar-link${homeActiveClass}" href="${basePath}index.html" aria-label="Home"${homeCurrent}>
            <svg class="site-topbar-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9.5 21v-6h5v6"/>
            </svg>
            <span>Home</span>
          </a>
          <a class="site-topbar-link" href="${buyHref}" aria-label="Buy now" onclick="if (typeof trackStoreClick === 'function') trackStoreClick('header_buy_now');">
            <svg class="site-topbar-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 6h15l-2 8H8L6 6Zm0 0L5 3H2m6 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
            </svg>
            <span>Buy Now</span>
          </a>
          <a class="site-topbar-link${galleryActiveClass}" href="${basePath}gallery.html" aria-label="Open Card Atlas"${galleryCurrent}>
            <svg class="site-topbar-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M8 3.5 19 6l-3 14.5-11-2.5L8 3.5Z"/>
              <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m8.8 7.2 6.8 1.5"/>
              <circle cx="11.7" cy="13" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
              <path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M9.6 13h4.2"/>
            </svg>
            <span>Card Atlas</span>
          </a>
          <a class="site-topbar-link" href="https://discord.gg/GVkrHXvzf8" target="_blank" rel="noopener" onclick="if (typeof trackDiscordClick === 'function') trackDiscordClick();">
            <svg class="site-topbar-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M20.3 4.4A17.1 17.1 0 0 0 16.1 3l-.2.4a15 15 0 0 0-.5 1 15.9 15.9 0 0 0-6.8 0 8 8 0 0 0-.7-1.4 17 17 0 0 0-4.2 1.4C1.1 8.2.4 11.9.7 15.5a17.3 17.3 0 0 0 5.2 2.7l.7-1.1.4-.7c-.8-.3-1.5-.7-2.2-1.1l.5-.4a12.2 12.2 0 0 0 13.4 0l.5.4c-.7.5-1.4.9-2.2 1.1l.4.7.7 1.1a17.3 17.3 0 0 0 5.2-2.7c.4-4.2-.7-7.8-3-11.1ZM8.3 13.3c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7.4 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/>
            </svg>
            <span>Discord</span>
          </a>
          <a class="site-topbar-link" href="https://reddit.com/r/countryball_cards" target="_blank" rel="noopener" onclick="if (typeof trackStoreClick === 'function') trackStoreClick('reddit_header');">
            <svg class="site-topbar-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M21.5 11.7c0-1.4-1.1-2.5-2.5-2.5-.7 0-1.3.3-1.8.8-1.3-.9-3-1.4-4.8-1.5l.8-3.7 2.6.6c.1 1 .9 1.7 1.9 1.7 1.1 0 1.9-.9 1.9-1.9s-.9-1.9-1.9-1.9c-.8 0-1.5.5-1.8 1.2l-3.1-.7c-.3-.1-.6.1-.6.4l-.9 4.3c-1.8.1-3.4.6-4.7 1.5-.5-.5-1.1-.8-1.8-.8-1.4 0-2.5 1.1-2.5 2.5 0 1 .6 1.9 1.5 2.3v.5c0 3.3 3.7 6 8.2 6s8.2-2.7 8.2-6V14c.8-.4 1.4-1.3 1.4-2.3ZM7.6 13.4c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4-.6 1.4-1.4 1.4-1.4-.6-1.4-1.4Zm7.9 3.8c-.9.9-2.7 1-3.5 1s-2.6-.1-3.5-1c-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 .6.6 2 .7 2.8.7s2.2-.1 2.8-.7c.2-.2.5-.2.7 0 .2.2.2.5 0 .7Zm-.5-2.4c-.8 0-1.4-.6-1.4-1.4S14.2 12 15 12s1.4.6 1.4 1.4-.6 1.4-1.4 1.4Z"/>
            </svg>
            <span>Reddit</span>
          </a>
        </div>
      </nav>
    </div>
  </header>
  `);
  script.remove();
})();
