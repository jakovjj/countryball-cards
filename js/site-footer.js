(function () {
  const script = document.currentScript;
  if (!script) return;

  script.insertAdjacentHTML('beforebegin', `
  <footer class="site-footer" role="contentinfo" aria-label="Site footer">
    <div class="site-footer-inner">
      <div class="site-footer-top">
        <div>
          <div class="site-footer-brand">
            <img src="assets/glare-56.webp" alt="" aria-hidden="true" class="site-footer-logo" width="56" height="56" loading="lazy" decoding="async">
            <p class="site-footer-title">Glare Studios, LLC</p>
          </div>
          <p class="site-footer-tagline">Made for fans of countryballs &amp; strategy. Reach out any time. We typically respond within 24 hours.</p>
        </div>
      </div>

      <div class="site-footer-grid">
        <div class="site-footer-col">
          <h3>Reach out</h3>
          <div class="site-footer-meta">
            131 Continental Dr<br>
            Newark, DE, US
          </div>
          <ul class="site-footer-list" style="margin-top:10px">
            <li><a href="mailto:info@countryballcards.com">info@countryballcards.com</a></li>
            <li><a href="tel:+13026100190">+1 302 610 0190</a></li>
          </ul>
        </div>

        <div class="site-footer-col">
          <h3>Social</h3>
          <div class="site-footer-social">
            <a href="https://www.kickstarter.com/projects/glarestudios/countryball-cards" target="_blank" rel="noopener">
              <img src="assets/ks.png" alt="" loading="lazy" decoding="async">
              <span>Kickstarter</span>
            </a>
            <a href="https://discord.gg/GVkrHXvzf8" target="_blank" rel="noopener" onclick="if (typeof trackDiscordClick==='function') trackDiscordClick();">
              <img src="assets/discord.png" alt="" loading="lazy" decoding="async">
              <span>Discord</span>
            </a>
            <a href="https://reddit.com/r/countryball_cards" target="_blank" rel="noopener" onclick="if (typeof trackRedditClick==='function') trackRedditClick();">
              <img src="assets/reddit.png" alt="" loading="lazy" decoding="async">
              <span>Reddit</span>
            </a>
            <a href="https://www.instagram.com/countryball_cards" target="_blank" rel="noopener">
              <img src="assets/instagram.png" alt="" loading="lazy" decoding="async">
              <span>Instagram</span>
            </a>
          </div>
        </div>

        <div class="site-footer-col">
          <h3>Info</h3>
          <ul class="site-footer-list">
            <li><a href="gallery.html">Card Gallery</a></li>
            <li><a href="privacy-policy.html">Privacy Policy</a></li>
            <li><a href="terms-and-conditions.html">Terms &amp; Conditions</a></li>
          </ul>
        </div>
      </div>

      <div class="site-footer-bottom">
        <span class="site-footer-copyright">
          <span>&copy; 2025-2026 Glare Studios, LLC</span>
          <img src="assets/bar.png" alt="" class="site-footer-bottom-bar" width="2083" height="342" loading="lazy" decoding="async" aria-hidden="true">
        </span>
        <span>Need help? <a href="mailto:info@countryballcards.com">Email support</a> or <a href="https://discord.gg/GVkrHXvzf8" target="_blank" rel="noopener">join Discord</a>.</span>
      </div>
    </div>
  </footer>
  `);
  script.remove();
})();
