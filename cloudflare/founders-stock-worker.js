// Founder's Edition stock counter — Cloudflare Worker.
//
// countryballcards.com is GitHub Pages (static only, no PHP), but the domain
// is proxied through Cloudflare, so this Worker answers the same URL the
// page already fetches (/founders-stock.php) before the request ever
// reaches GitHub Pages. The OmniFill API key lives in an encrypted Worker
// secret and never reaches the browser.
//
// Setup (Cloudflare dashboard, ~5 minutes):
//   1. Workers & Pages → Create → Worker → name it e.g. "founders-stock",
//      paste this file as the code, Deploy.
//   2. Worker → Settings → Variables and Secrets → add secret
//      OMNIFILL_AGENT_TOKEN = <your omn_key_... from OmniFill →
//      Settings → API keys>.
//   3. Worker → Settings → Domains & Routes → Add route:
//        countryballcards.com/founders-stock.php   (zone: countryballcards.com)
//      and, if www serves the site too:
//        www.countryballcards.com/founders-stock.php
//
// Verify: https://countryballcards.com/founders-stock.php
//   → {"remaining":44,"total":100}

const STOCK_URL = 'https://omnifill.net/api/products/stock';
const FOUNDERS_SKU = 'CBC-FOUNDER';
const FOUNDERS_TOTAL = 100;
const CACHE_TTL_SECONDS = 120;

// Stock response is a bare array of {id, name, sku, track_stock, stock_qty,
// assigned_qty, remaining_stock}; match by exact SKU with a "founder"
// name/sku substring fallback.
function extractFoundersRemaining(json) {
  let products = null;
  if (Array.isArray(json)) {
    products = json;
  } else if (json && typeof json === 'object') {
    for (const key of ['products', 'data', 'items']) {
      if (Array.isArray(json[key])) {
        products = json[key];
        break;
      }
    }
  }
  if (!products) return null;

  let fallback = null;
  for (const product of products) {
    if (!product || typeof product !== 'object') continue;
    const sku = typeof product.sku === 'string' ? product.sku : '';
    const qty = product.remaining_stock ?? product.stock_qty;
    if (typeof qty !== 'number' || !isFinite(qty)) continue;
    if (sku.toUpperCase() === FOUNDERS_SKU) return Math.round(qty);
    const label = (sku + ' ' + (typeof product.name === 'string' ? product.name : '')).toLowerCase();
    if (fallback === null && label.includes('founder')) fallback = Math.round(qty);
  }
  return fallback;
}

export default {
  async fetch(request, env, ctx) {
    // Serve from the edge cache so OmniFill sees at most one request
    // per CACHE_TTL_SECONDS per Cloudflare location.
    const cache = caches.default;
    const cacheKey = new Request('https://countryballcards.com/__founders-stock-cache');
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    let remaining = null;

    try {
      const upstream = await fetch(STOCK_URL, {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + env.OMNIFILL_AGENT_TOKEN,
        },
      });
      if (upstream.ok) {
        remaining = extractFoundersRemaining(await upstream.json());
      }
    } catch (e) {
      // fall through to 503
    }

    const status = remaining !== null ? 200 : 503;
    const body = remaining !== null
      ? { remaining: Math.max(0, Math.min(FOUNDERS_TOTAL, remaining)), total: FOUNDERS_TOTAL }
      : { error: 'stock unavailable' };

    const response = new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': status === 200 ? 'public, max-age=' + CACHE_TTL_SECONDS : 'no-store',
      },
    });
    if (status === 200) ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};
