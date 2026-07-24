const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataFile = path.join(root, 'js', 'gallery-cards.js');
const abilityFile = path.join(root, 'tools', 'card-abilities.txt');
const cardsDir = path.join(root, 'cards');
const sitemapFile = path.join(root, 'sitemap.xml');
const siteUrl = 'https://countryballcards.com';
const lastmod = '2026-07-22';

function loadCards() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(dataFile, 'utf8'), context, { filename: dataFile });
  return context.window.countryballGalleryCards;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeText(value) {
  return String(value)
    .replace(/45\S*C/g, '45 C')
    .replace(/GRANDE\s+ARM\S+E/g, 'GRANDE ARMEE');
}

function escapeRulesHtml(value) {
  return escapeHtml(normalizeText(value))
    .replace(/45 C/g, '45&deg;C')
    .replace(/GRANDE ARMEE/g, 'GRANDE ARM&Eacute;E');
}

function humanizeAllCaps(value) {
  return normalizeText(value).replace(/[A-Z][A-Z0-9'&-]*/g, (word) => {
    if (word === 'I') return word;
    return word.toLowerCase();
  });
}

function titleCaseAbility(value) {
  const smallWords = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to']);
  return humanizeAllCaps(value).replace(/\b[A-Za-z][A-Za-z'&-]*\b/g, (word, index) => {
    const lower = word.toLowerCase();
    if (index > 0 && smallWords.has(lower)) return lower;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

function sentenceCaseRules(value) {
  const properWords = new Map([
    ['australia', 'Australia'],
    ['australian', 'Australian'],
    ['austria', 'Austria'],
    ['austrian', 'Austrian'],
    ['belgian', 'Belgian'],
    ['belgium', 'Belgium'],
    ['british', 'British'],
    ['canada', 'Canada'],
    ['canadian', 'Canadian'],
    ['china', 'China'],
    ['chinese', 'Chinese'],
    ['croatia', 'Croatia'],
    ['croatian', 'Croatian'],
    ['czech', 'Czech'],
    ['czechia', 'Czechia'],
    ['finland', 'Finland'],
    ['finnish', 'Finnish'],
    ['france', 'France'],
    ['french', 'French'],
    ['germany', 'Germany'],
    ['german', 'German'],
    ['hungarian', 'Hungarian'],
    ['hungary', 'Hungary'],
    ['india', 'India'],
    ['indian', 'Indian'],
    ['italian', 'Italian'],
    ['italy', 'Italy'],
    ['japan', 'Japan'],
    ['japanese', 'Japanese'],
    ['mexican', 'Mexican'],
    ['mexico', 'Mexico'],
    ['mongol', 'Mongol'],
    ['mongolia', 'Mongolia'],
    ['netherlands', 'Netherlands'],
    ['norway', 'Norway'],
    ['norwegian', 'Norwegian'],
    ['poland', 'Poland'],
    ['polish', 'Polish'],
    ['portugal', 'Portugal'],
    ['portuguese', 'Portuguese'],
    ['romanian', 'Romanian'],
    ['romania', 'Romania'],
    ['russia', 'Russia'],
    ['russian', 'Russian'],
    ['saudi', 'Saudi'],
    ['spain', 'Spain'],
    ['spanish', 'Spanish'],
    ['sweden', 'Sweden'],
    ['swedish', 'Swedish'],
    ['swiss', 'Swiss'],
    ['switzerland', 'Switzerland'],
    ['turkish', 'Turkish'],
    ['turkey', 'Turkey'],
    ['ukrainian', 'Ukrainian'],
    ['ukraine', 'Ukraine']
  ]);

  return humanizeAllCaps(value)
    .replace(/(^\s*|[.!?][*"'”’)]?\s+)([*"'“‘]?)([a-z])/g, (match, prefix, opener, letter) => (
      prefix + opener + letter.toUpperCase()
    ))
    .replace(/\b[a-z][a-z'-]*\b/g, (word) => properWords.get(word) || word);
}

function cardIdFromHeading(value) {
  const specialIds = {
    'SAUDI ARABIA': 'saudi_arabia',
    'UNITED KINGDOM': 'uk',
    'UNITED STATES': 'us'
  };
  return specialIds[value] || value.toLowerCase().replace(/\s+/g, '_');
}

function loadAbilities() {
  const text = normalizeText(fs.readFileSync(abilityFile, 'utf8'));
  const abilities = {};
  let currentId = null;
  let currentAbility = null;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const country = line.match(/^([A-Z ]+):$/);
    if (country) {
      currentId = cardIdFromHeading(country[1]);
      abilities[currentId] = [];
      currentAbility = null;
      return;
    }

    const ability = line.match(/^Ability \d+:\s*(.+)$/);
    if (ability && currentId) {
      currentAbility = { name: ability[1], cost: 'NONE', text: '', dice: 'NONE' };
      abilities[currentId].push(currentAbility);
      return;
    }

    if (!currentAbility) return;

    if (line.startsWith('COST:')) {
      currentAbility.cost = line.slice(5).trim();
    } else if (line.startsWith('DICE ROLL REQ:')) {
      currentAbility.dice = line.slice('DICE ROLL REQ:'.length).trim();
    } else {
      currentAbility.text = currentAbility.text ? `${currentAbility.text} ${line}` : line;
    }
  });

  return abilities;
}

function renderFlavorText(value) {
  const parts = sentenceCaseRules(value).split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return `<span class="ability-flavor">${escapeRulesHtml(part.slice(1, -1))}</span>`;
    }
    return escapeRulesHtml(part);
  }).join('');
}

const costIconMap = {
  coin: 'coin_resource.png',
  grain: 'grains_resource.png',
  horse: 'horse_resource.png',
  iron: 'iron_resource.png',
  oil: 'oil_resource.png'
};

function typeIconName(type) {
  if (type === 'attack') return 'offensive';
  if (type === 'defense') return 'defensive';
  return type || 'misc';
}

function parseCostToken(token) {
  const match = token.trim().match(/^(\d+)X\s+(.+)$/i);
  if (!match) return null;
  const resource = match[2].trim().toLowerCase();
  return {
    count: match[1],
    resource,
    icon: costIconMap[resource]
  };
}

function renderCost(cost) {
  if (!cost || cost.toUpperCase() === 'NONE') {
    return '<span class="ability-free-cost">No cost</span>';
  }

  return cost.split(',').map(parseCostToken).filter(Boolean).map((item) => {
    const label = `${item.count} ${item.resource}`;
    return `<span class="ability-cost-token" title="${escapeHtml(label)}"><span>${escapeHtml(item.count)}x</span><img src="../icons/${item.icon}" alt="${escapeHtml(item.resource)}" width="28" height="28" loading="lazy" decoding="async"></span>`;
  }).join('');
}

function renderDiceRequirement(value) {
  if (!value || value.toUpperCase() === 'NONE') return '';
  const label = escapeHtml(sentenceCaseRules(value))
    .replace(/&gt;=/g, '&ge;')
    .replace(/&lt;=/g, '&le;');
  return `<span class="ability-dice" title="Dice roll requirement"><img src="../icons/dice.png" alt="" aria-hidden="true" width="20" height="20" loading="lazy" decoding="async"><span>${label}</span></span>`;
}

function renderAbilities(card) {
  if (!card.abilities || !card.abilities.length) return '';

  return `<section class="card-abilities" aria-label="${escapeHtml(card.name)} abilities">
            <div class="ability-list">
              ${card.abilities.map((ability, index) => `<article class="ability-card">
                <div class="ability-card-header">
                  <h3>${escapeRulesHtml(titleCaseAbility(ability.name))}</h3>
                  <span class="ability-cost">${renderCost(ability.cost)}</span>
                </div>
                <p class="ability-text">${renderFlavorText(ability.text)} ${renderDiceRequirement(ability.dice)}</p>
              </article>`).join('\n')}
            </div>
          </section>`;
}

function pageHtml(card) {
  const name = escapeHtml(card.name);
  const metaDescription = `View the ${name} countryball card with larger art, ability descriptions, costs, dice requirements, and links back to the Countryball Cards gallery.`;
  const image = `../${card.image}`;
  const canonical = `${siteUrl}/cards/${card.id}.html`;

  return `<!doctype html>
<html lang="en">
<head>
  <title>${name} Card | Countryball Cards</title>
  <link rel="canonical" href="${canonical}" />
  <meta name="title" content="${name} Card | Countryball Cards" />
  <meta name="description" content="${metaDescription}" />
  <meta name="theme-color" content="#151515" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta name="robots" content="index,follow,max-image-preview:large" />

  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${name} Card | Countryball Cards">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:image" content="${siteUrl}/${card.image}">

  <link rel="icon" type="image/x-icon" href="../favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png">
  <link rel="stylesheet" href="../styles.css?v=2026072219">
</head>
<body class="gallery-page card-detail-page">
  <div class="countryball-silhouette-bg" aria-hidden="true">
    <img class="countryball-silhouette countryball-silhouette--left" src="../cb/poland.png" alt="" width="1024" height="1024" loading="eager" decoding="async">
    <img class="countryball-silhouette countryball-silhouette--right" src="../cb/us.png" alt="" width="1024" height="1024" loading="eager" decoding="async">
  </div>
  <script src="../js/site-header.js?v=2026072202"></script>

  <main class="wrap">
    <div class="frame">
      <a class="card-page-atlas-link" href="../gallery.html">
        <svg class="card-page-atlas-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M19 12H5m0 0 6-6m-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Back to Card Atlas</span>
      </a>

      <article class="card-page-hero">
        <div class="card-page-art" data-protect-card-image>
          <img src="${image}" alt="${name} countryball card large preview" width="400" height="600" loading="eager" decoding="async" draggable="false" oncontextmenu="return false">
        </div>
        <div class="card-page-copy">
          <div class="card-page-title-row">
            <h1>${name}</h1>
            <span class="tier-badge tier-badge-${String(card.tier).toLowerCase()}" aria-hidden="true">
              <span>${card.tier}</span>
            </span>
            <span class="type-badge type-badge-${card.type}" aria-hidden="true">
              <img src="../icons/${typeIconName(card.type)}.png" alt="" width="32" height="32" loading="lazy" decoding="async">
            </span>
            <span class="sr-only">${card.tier} tier, ${escapeHtml(card.typeLabel)} type</span>
          </div>
          ${renderAbilities(card)}
        </div>
      </article>
    </div>
  </main>

  <footer class="site-footer" role="contentinfo" aria-label="Site footer">
    <div class="site-footer-inner">
      <div class="site-footer-top">
        <div>
          <div class="site-footer-brand">
            <img src="../assets/glare-56.webp" alt="" aria-hidden="true" class="site-footer-logo" width="56" height="56" loading="lazy" decoding="async">
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
              <img src="../assets/ks.png" alt="" loading="lazy" decoding="async">
              <span>Kickstarter</span>
            </a>
            <a href="https://discord.gg/GVkrHXvzf8" target="_blank" rel="noopener" onclick="if (typeof trackDiscordClick==='function') trackDiscordClick();">
              <img src="../assets/discord.png" alt="" loading="lazy" decoding="async">
              <span>Discord</span>
            </a>
            <a href="https://reddit.com/r/countryball_cards" target="_blank" rel="noopener" onclick="if (typeof trackRedditClick==='function') trackRedditClick();">
              <img src="../assets/reddit.png" alt="" loading="lazy" decoding="async">
              <span>Reddit</span>
            </a>
            <a href="https://www.instagram.com/countryball_cards" target="_blank" rel="noopener">
              <img src="../assets/instagram.png" alt="" loading="lazy" decoding="async">
              <span>Instagram</span>
            </a>
          </div>
        </div>

        <div class="site-footer-col">
          <h3>Info</h3>
          <ul class="site-footer-list">
            <li><a href="../gallery.html">Card Gallery</a></li>
            <li><a href="../privacy-policy.html">Privacy Policy</a></li>
            <li><a href="../terms-and-conditions.html">Terms &amp; Conditions</a></li>
          </ul>
        </div>
      </div>

      <div class="site-footer-bottom">
        <span class="site-footer-copyright">
          <span>&copy; 2025-2026 Glare Studios, LLC</span>
          <img src="../assets/bar.png" alt="" class="site-footer-bottom-bar" width="2083" height="342" loading="lazy" decoding="async" aria-hidden="true">
        </span>
        <span>Need help? <a href="mailto:info@countryballcards.com">Email support</a> or <a href="https://discord.gg/GVkrHXvzf8" target="_blank" rel="noopener">join Discord</a>.</span>
      </div>
    </div>
  </footer>
  <script src="../js/protect-card-images.js"></script>
</body>
</html>
`;
}

function sitemapHtml(cards) {
  const staticUrls = [
    ['/', '2026-07-22', 'monthly', '1.0'],
    ['/gallery.html', '2026-07-22', 'monthly', '0.7'],
    ['/privacy-policy.html', '2025-12-18', 'yearly', '0.3'],
    ['/terms-and-conditions.html', '2025-12-18', 'yearly', '0.3']
  ];
  const cardUrls = cards.map(card => [`/cards/${card.id}.html`, lastmod, 'monthly', '0.6']);
  const urls = [...staticUrls, ...cardUrls].map(([url, modified, freq, priority]) => `  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${modified}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

const abilities = loadAbilities();
const cards = loadCards().map(card => ({ ...card, abilities: abilities[card.id] || [] }));
fs.mkdirSync(cardsDir, { recursive: true });
cards.forEach((card, index) => {
  fs.writeFileSync(path.join(cardsDir, `${card.id}.html`), pageHtml(card));
});
fs.writeFileSync(sitemapFile, sitemapHtml(cards));
console.log(`Generated ${cards.length} card pages.`);
