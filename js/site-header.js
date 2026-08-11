(function () {
  const script = document.currentScript;
  if (!script) return;

  // Prevent accidental image dragging across every public page.
  document.addEventListener('dragstart', (event) => {
    if (event.target instanceof Element && event.target.closest('img')) {
      event.preventDefault();
    }
  }, true);

  const scriptSrc = script.getAttribute('src') || '';
  const basePath = scriptSrc.includes('../') ? '../' : '';
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const currentPage = (pathParts[pathParts.length - 1] || 'index.html').toLowerCase();
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
          <a class="site-topbar-link" href="${buyHref}" aria-label="Shop" onclick="if (typeof trackSiteLinkClick === 'function') trackSiteLinkClick('header_buy_now');">
            <svg class="site-topbar-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 6h15l-2 8H8L6 6Zm0 0L5 3H2m6 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
            </svg>
            <span>Shop</span>
          </a>
          <a class="site-topbar-link${galleryActiveClass}" href="${basePath}gallery.html" aria-label="Open Card Atlas"${galleryCurrent}>
            <svg class="site-topbar-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106ZM15 5.764v15M9 3.236v15"/>
            </svg>
            <span>Card Atlas</span>
          </a>
          <a class="site-topbar-link" href="https://discord.gg/GVkrHXvzf8" target="_blank" rel="noopener" onclick="if (typeof trackDiscordClick === 'function') trackDiscordClick();">
            <svg class="site-topbar-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M20.3 4.4A17.1 17.1 0 0 0 16.1 3l-.2.4a15 15 0 0 0-.5 1 15.9 15.9 0 0 0-6.8 0 8 8 0 0 0-.7-1.4 17 17 0 0 0-4.2 1.4C1.1 8.2.4 11.9.7 15.5a17.3 17.3 0 0 0 5.2 2.7l.7-1.1.4-.7c-.8-.3-1.5-.7-2.2-1.1l.5-.4a12.2 12.2 0 0 0 13.4 0l.5.4c-.7.5-1.4.9-2.2 1.1l.4.7.7 1.1a17.3 17.3 0 0 0 5.2-2.7c.4-4.2-.7-7.8-3-11.1ZM8.3 13.3c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7.4 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/>
            </svg>
            <span>Discord</span>
          </a>
        </div>
      </nav>
    </div>
  </header>
  `);
  script.remove();
})();
