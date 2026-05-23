// ===== STORE STATUS COUNTDOWN =====
function initCountdown() {
  const launchDate = new Date('2025-10-01T20:15:00.000Z');
  const dayEl = document.getElementById('countdownDays');
  const hourEl = document.getElementById('countdownHours');
  const minuteEl = document.getElementById('countdownMinutes');
  const secondEl = document.getElementById('countdownSeconds');
  const statusEl = document.getElementById('countdownStatus');

  function setValue(el, value) {
    if (el) {
      el.textContent = String(value).padStart(2, '0');
    }
  }

  function updateCountdown() {
    const now = Date.now();
    const timeLeft = launchDate.getTime() - now;

    if (timeLeft <= 0) {
      setValue(dayEl, 0);
      setValue(hourEl, 0);
      setValue(minuteEl, 0);
      setValue(secondEl, 0);
      if (statusEl) {
        statusEl.textContent = 'Available Now';
        statusEl.classList.add('countdown-status--live');
      }
      return;
    }

    const seconds = Math.floor((timeLeft / 1000) % 60);
    const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

    setValue(dayEl, days);
    setValue(hourEl, hours);
    setValue(minuteEl, minutes);
    setValue(secondEl, seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

const cardData = Array.isArray(window.cardData) ? window.cardData : [];
let heroCarouselEl = document.querySelector('.carousel');
let heroTrack = document.querySelector('.carousel-track');
let heroDots = document.querySelector('.carousel-dots');
let heroPrevBtn = document.querySelector('.carousel-prev');
let heroNextBtn = document.querySelector('.carousel-next');
let currentSlide = 0;
let totalSlides = 0;

function initializeCarousel() {
  heroCarouselEl = document.querySelector('.carousel') || heroCarouselEl;
  heroTrack = document.querySelector('.carousel-track') || heroTrack;
  heroDots = document.querySelector('.carousel-dots') || heroDots;
  heroPrevBtn = document.querySelector('.carousel-prev') || heroPrevBtn;
  heroNextBtn = document.querySelector('.carousel-next') || heroNextBtn;

  if (!heroCarouselEl || !heroTrack || !heroDots || !cardData.length) {
    totalSlides = 0;
    return;
  }

  heroTrack.innerHTML = '';
  heroDots.innerHTML = '';
  cardData.forEach((card, index) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';

    const cardShell = document.createElement('div');
    cardShell.className = 'card';
    if (card.extraClass) {
      cardShell.classList.add(card.extraClass);
    }

    const picture = document.createElement('picture');
    if (card.webp) {
      const source = document.createElement('source');
      source.srcset = card.webp;
      source.type = 'image/webp';
      picture.appendChild(source);
    }

    const img = document.createElement('img');
    img.src = card.src;
    img.alt = card.alt || 'Countryball card';
    img.loading = card.priority ? 'eager' : 'lazy';
    img.decoding = 'async';
    picture.appendChild(img);
    cardShell.appendChild(picture);

    if (card.cta === 'email') {
      cardShell.classList.add('email-cta-card');
      const ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className = 'email-cta-btn';
      ctaBtn.textContent = card.ctaLabel || 'Get Updates';
      ctaBtn.addEventListener('click', () => {
        if (typeof trackCarouselEmailCTA === 'function') {
          trackCarouselEmailCTA();
        }
        showEmailModal();
      });
      cardShell.appendChild(ctaBtn);
    }

    slide.appendChild(cardShell);
    heroTrack.appendChild(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
    dot.dataset.slide = index;
    dot.addEventListener('click', () => {
      currentSlide = index;
      updateCarousel();
      handleUserInteraction();
    });
    heroDots.appendChild(dot);
  });

  totalSlides = cardData.length;
  currentSlide = 0;

  if (heroPrevBtn) {
    if (!heroPrevBtn.dataset.carouselNavBound) {
      heroPrevBtn.dataset.carouselNavBound = '1';
      heroPrevBtn.addEventListener('click', () => {
        prevSlide();
        handleUserInteraction();
      });
    }
  }

  if (heroNextBtn) {
    if (!heroNextBtn.dataset.carouselNavBound) {
      heroNextBtn.dataset.carouselNavBound = '1';
      heroNextBtn.addEventListener('click', () => {
        nextSlide();
        handleUserInteraction();
      });
    }
  }
}

function getSlideWidth() {
  if (heroCarouselEl && heroCarouselEl.clientWidth) {
    return heroCarouselEl.clientWidth;
  }
  return window.innerWidth;
}

function updateCarousel() {
  if (!heroTrack || !totalSlides) {
    return;
  }

  const translateX = -currentSlide * getSlideWidth();
  heroTrack.style.transform = `translateX(${translateX}px)`;

  if (heroDots) {
    heroDots.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }
}

function nextSlide() {
  if (!totalSlides) {
    return;
  }
  currentSlide = (currentSlide + 1) % totalSlides;
  updateCarousel();
  if (cardData[currentSlide] && typeof trackCarouselInteraction === 'function') {
    trackCarouselInteraction('next_slide', cardData[currentSlide].alt);
  }
}

function prevSlide() {
  if (!totalSlides) {
    return;
  }
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateCarousel();
  if (cardData[currentSlide] && typeof trackCarouselInteraction === 'function') {
    trackCarouselInteraction('prev_slide', cardData[currentSlide].alt);
  }
}

// 3D hover effects
function init3DCardEffects(){
  const cards = document.querySelectorAll('.carousel-slide .card');
  cards.forEach(card=>{
    if (card && card.dataset && card.dataset.tiltBound === '1') {
      return;
    }
    // Skip 3D effects for the email CTA card
    if (card.classList.contains('email-cta-card')) {
      return;
    }
    if (card && card.dataset) {
      card.dataset.tiltBound = '1';
    }
    card.onmousemove=(e)=>{
      const r=card.getBoundingClientRect();
      const x=e.clientX-r.left, y=e.clientY-r.top;
      const cx=r.width/2, cy=r.height/2;
      const rotateX=((y-cy)/cy)*-12;
      const rotateY=((x-cx)/cx)*12;
      const dist=Math.hypot(x-cx,y-cy), max=Math.hypot(cx,cy);
      const lift=(1-dist/max)*15+8;
      card.style.transform=`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${lift}px) scale(1.01)`;
      card.style.transition='none';
      const img=card.querySelector('img');
      if(img){ img.style.imageRendering='auto'; img.style.filter='none'; img.style.transform='translateZ(1px)'; img.style.backfaceVisibility='hidden'; img.style.webkitBackfaceVisibility='hidden'; }
    };
    card.onmouseleave=()=>{
      card.style.transition='transform .4s cubic-bezier(.23,1,.32,1)';
      card.style.transform='perspective(1200px) rotateX(0) rotateY(0) translateZ(0) scale(1)';
      const img=card.querySelector('img');
      if(img){ img.style.transform='translateZ(0)'; }
    };
  });
}

function initializeImageQuality(){
  document.querySelectorAll('.carousel-slide .card img, .carousel-slide .card picture img').forEach(img=>{
    if (img && img.dataset && img.dataset.imageQualitySet === '1') {
      return;
    }
    if (img && img.dataset) {
      img.dataset.imageQualitySet = '1';
    }
    img.style.imageRendering='auto';
    img.style.filter='none';
    img.draggable = false;
    img.style.transform='translateZ(1px)';
    img.style.backfaceVisibility='hidden';
    img.style.webkitBackfaceVisibility='hidden';
  });
}

function decorateProjectCards(track) {
  if (!track) {
    return;
  }

  track.querySelectorAll('img.card-peek-image[data-project-card]').forEach(img => {
    if (img.closest('.card-peek-card')) {
      return;
    }

    const wrapper = document.createElement('span');
    wrapper.className = 'card-peek-card';
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    const projectCard = document.createElement('img');
    projectCard.className = 'project-card-stitch';
    projectCard.src = img.dataset.projectCard;
    projectCard.alt = '';
    projectCard.width = 192;
    projectCard.height = 192;
    projectCard.loading = 'lazy';
    projectCard.decoding = 'async';
    projectCard.fetchPriority = 'low';
    projectCard.draggable = false;
    projectCard.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(projectCard);
  });
}

function getCardPeekItems(track, includeClones = false) {
  if (!track) {
    return [];
  }

  return Array.from(track.children).filter(item => {
    const isCard = item.classList?.contains('card-peek-card') || item.classList?.contains('card-peek-image');
    if (!isCard) {
      return false;
    }
    return includeClones || !item.dataset.cardPeekClone;
  });
}

// ===== CARD PEEK CAROUSEL =====
function initCardPeekCarousel() {
  const viewport = document.querySelector('.card-peek-window');
  const track = document.getElementById('cardPeekTrack');
  const prevBtn = document.getElementById('cardPeekPrev');
  const nextBtn = document.getElementById('cardPeekNext');
  if (!viewport || !track || !prevBtn || !nextBtn) {
    return;
  }

  decorateProjectCards(track);

  const originalCards = getCardPeekItems(track);
  if (!originalCards.length) {
    return;
  }

  originalCards.forEach(card => {
    card.draggable = false;
    card.querySelectorAll?.('img').forEach(img => {
      img.draggable = false;
    });
  });

  if (track.dataset.cardPeekLoopReady !== '1') {
    const beforeClones = originalCards.map(card => {
      const clone = card.cloneNode(true);
      clone.dataset.cardPeekClone = 'before';
      clone.setAttribute('aria-hidden', 'true');
      clone.draggable = false;
      clone.querySelectorAll?.('img').forEach(img => {
        img.draggable = false;
      });
      return clone;
    });
    const afterClones = originalCards.map(card => {
      const clone = card.cloneNode(true);
      clone.dataset.cardPeekClone = 'after';
      clone.setAttribute('aria-hidden', 'true');
      clone.draggable = false;
      clone.querySelectorAll?.('img').forEach(img => {
        img.draggable = false;
      });
      return clone;
    });

    beforeClones.reverse().forEach(clone => {
      track.insertBefore(clone, track.firstChild);
    });
    afterClones.forEach(clone => {
      track.appendChild(clone);
    });
    track.dataset.cardPeekLoopReady = '1';
  }

  function visibleCards() {
    return getCardPeekItems(track);
  }

  function loopMetrics() {
    const originals = visibleCards();
    const allCards = getCardPeekItems(track, true);
    const firstOriginal = originals[0];
    const firstAfterClone = allCards[originals.length * 2];

    if (!firstOriginal || !firstAfterClone) {
      return null;
    }

    const centerInset = Math.max(0, (viewport.clientWidth - firstOriginal.offsetWidth) / 2);

    return {
      start: firstOriginal.offsetLeft - centerInset,
      end: firstAfterClone.offsetLeft - centerInset,
      width: firstAfterClone.offsetLeft - firstOriginal.offsetLeft
    };
  }

  function setScrollLeftInstantly(value) {
    const previousScrollBehavior = viewport.style.scrollBehavior;
    const previousScrollSnapType = viewport.style.scrollSnapType;
    viewport.style.scrollBehavior = 'auto';
    viewport.style.scrollSnapType = 'none';
    viewport.scrollLeft = value;
    viewport.style.scrollBehavior = previousScrollBehavior;
    viewport.style.scrollSnapType = previousScrollSnapType;
  }

  function normalizeLoopPosition() {
    const metrics = loopMetrics();
    if (!metrics || metrics.width <= 0) {
      return 0;
    }

    const originalScrollLeft = viewport.scrollLeft;
    let nextScrollLeft = originalScrollLeft;

    while (nextScrollLeft < metrics.start) {
      nextScrollLeft += metrics.width;
    }
    while (nextScrollLeft >= metrics.end) {
      nextScrollLeft -= metrics.width;
    }

    if (nextScrollLeft !== originalScrollLeft) {
      setScrollLeftInstantly(nextScrollLeft);
      return nextScrollLeft - originalScrollLeft;
    }

    return 0;
  }

  function centeredScrollLeft(card) {
    if (!card) {
      return 0;
    }
    const centerInset = Math.max(0, (viewport.clientWidth - card.offsetWidth) / 2);
    return Math.round(card.offsetLeft - centerInset);
  }

  function startLoopAtCard() {
    const metrics = loopMetrics();
    if (!metrics || metrics.width <= 0) {
      return;
    }

    const targetCard = visibleCards().find(card => {
      const image = card.matches?.('img.card-peek-image') ? card : card.querySelector?.('img.card-peek-image');
      const source = image?.dataset?.fullSrc || image?.getAttribute('src') || '';
      return /switzerland\.webp(?:$|\?)/.test(source);
    });

    setScrollLeftInstantly(targetCard ? centeredScrollLeft(targetCard) : Math.round(metrics.start));
    normalizeLoopPosition();
  }

  function scrollAmount() {
    const base = viewport.clientWidth || 300;
    // On <=600px we use snap points; scroll exactly one card per click (no half cards).
    if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
      const firstCard = visibleCards()[0];
      if (firstCard) {
        const cardWidth = firstCard.getBoundingClientRect().width;
        if (cardWidth > 0) {
          const styles = window.getComputedStyle(track);
          const gapValue = styles.columnGap || styles.gap || styles.rowGap || '0';
          const gap = parseFloat(gapValue) || 0;
          return Math.max(1, cardWidth + gap);
        }
      }
      return base;
    }
    return Math.max(150, base * 0.85);
  }

  function scrollByDirection(direction) {
    normalizeLoopPosition();
    viewport.scrollBy({
      left: direction * scrollAmount(),
      behavior: 'smooth'
    });
    window.setTimeout(normalizeLoopPosition, 420);
  }

  prevBtn.addEventListener('click', () => scrollByDirection(-1));
  nextBtn.addEventListener('click', () => scrollByDirection(1));

  viewport.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      viewport.scrollBy({ left: event.deltaY, behavior: 'auto' });
      normalizeLoopPosition();
    }
  }, { passive: false });

  let scrollRaf = 0;
  viewport.addEventListener('scroll', () => {
    if (scrollRaf) {
      return;
    }
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      normalizeLoopPosition();
    });
  }, { passive: true });

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let isDragging = false;
  let suppressClick = false;

  viewport.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = viewport.scrollLeft;
    isDragging = false;
    viewport.classList.add('is-pointer-down');
  });

  viewport.addEventListener('pointermove', event => {
    if (pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!isDragging) {
      if (Math.abs(deltaX) < 5) {
        return;
      }
      if (event.pointerType !== 'mouse' && Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }
      isDragging = true;
      viewport.classList.add('is-dragging');
      if (viewport.setPointerCapture) {
        viewport.setPointerCapture(pointerId);
      }
    }

    event.preventDefault();
    setScrollLeftInstantly(startScrollLeft - deltaX);
    startScrollLeft += normalizeLoopPosition();
  }, { passive: false });

  function endDrag(event) {
    if (pointerId !== event.pointerId) {
      return;
    }

    if (isDragging) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 300);
    }

    viewport.classList.remove('is-pointer-down', 'is-dragging');
    if (viewport.releasePointerCapture) {
      viewport.releasePointerCapture(pointerId);
    }
    pointerId = null;
    isDragging = false;
    normalizeLoopPosition();
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', () => {
    viewport.classList.remove('is-pointer-down', 'is-dragging');
    pointerId = null;
    isDragging = false;
    normalizeLoopPosition();
  });

  viewport.addEventListener('dragstart', event => event.preventDefault());
  viewport.addEventListener('selectstart', event => event.preventDefault());
  track.addEventListener('click', event => {
    if (!suppressClick) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);

  requestAnimationFrame(startLoopAtCard);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCardPeekCarousel);
} else {
  initCardPeekCarousel();
}

// Opportunistically warm up off-screen card art once the main work is done.
const cardPeekWarmup = (() => {
  let idleHandle = null;
  let queue = [];
  let started = false;

  const slowTypes = new Set(['slow-2g', '2g']);

  function shouldWarmup() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) {
      return true;
    }
    if (conn.saveData) {
      return false;
    }
    if (conn.effectiveType && slowTypes.has(conn.effectiveType)) {
      return false;
    }
    return true;
  }

  function primeQueue() {
    const track = document.getElementById('cardPeekTrack');
    if (!track) {
      return [];
    }
    return Array.from(track.querySelectorAll('img.card-peek-image[loading="lazy"]'))
      .filter(img => !img.dataset.prefetched);
  }

  function preload(img) {
    if (!img) {
      return;
    }
    const source = img.currentSrc || img.src;
    if (!source) {
      return;
    }
    img.dataset.prefetched = 'true';
    const preloader = new Image();
    preloader.decoding = 'async';
    preloader.src = source;
  }

  function processQueue(deadline) {
    while (queue.length && (deadline.timeRemaining() > 7 || deadline.didTimeout)) {
      const nextImage = queue.shift();
      if (nextImage?.complete && nextImage.naturalWidth > 0) {
        nextImage.dataset.prefetched = 'true';
        continue;
      }
      preload(nextImage);
    }
    if (queue.length) {
      schedule();
    }
  }

  function schedule() {
    if ('requestIdleCallback' in window) {
      idleHandle = requestIdleCallback(processQueue, { timeout: 1500 });
    } else {
      idleHandle = setTimeout(() => {
        processQueue({ timeRemaining: () => 0, didTimeout: true });
      }, 600);
    }
  }

  function start() {
    if (started) {
      return;
    }
    if (!shouldWarmup()) {
      started = true;
      return;
    }
    queue = primeQueue();
    if (!queue.length) {
      started = true;
      return;
    }
    started = true;
    schedule();
  }

  return { start };
})();

if (document.readyState === 'complete') {
  cardPeekWarmup.start();
} else {
  window.addEventListener('load', () => cardPeekWarmup.start(), { once: true });
}

// ===== COMMUNITY COUNTS =====
(function(){
  const discordCountEl = document.getElementById('discordCount');
  const redditCountEl = document.getElementById('redditCount');

  // If the page doesn't render these counters, avoid any work/network.
  if (!discordCountEl && !redditCountEl) {
    return;
  }

  const cacheKey = 'cbc_counts_v1';
  const cacheTtlMs = 5*60*1000; // 5 minutes

  function setText(el, text){ 
    if(el){ 
      el.textContent = text; 
      if(text && el.parentElement && el.classList.contains('btn-count')){ 
        el.style.display='inline'; 
        el.parentElement.classList.add('has-count'); 
      } 
    } 
  }
  
  function formatCount(n){
    if(n==null || isNaN(n)) return '---';
    try{ return Number(n).toLocaleString(); }catch(_){ return String(n); }
  }

  function readCache(){
    try{
      const raw = localStorage.getItem(cacheKey);
      if(!raw) return null;
      const obj = JSON.parse(raw);
      if(Date.now() - obj.t > cacheTtlMs) return null;
      return obj;
    }catch(_){ return null; }
  }
  function writeCache(data){
    try{ localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), ...data })); }catch(_){ }
  }

  async function fetchDiscord(){
    // Using Discord vanity invite endpoint to get approximate member counts
    try{
      const res = await fetch('https://discord.com/api/v9/invites/GVkrHXvzf8?with_counts=true&with_expiration=false');
      if(!res.ok) throw new Error('discord status '+res.status);
      const json = await res.json();
      // prefer approximate counts when available
      const n = json.approximate_member_count || (json.guild && json.guild.approximate_member_count) || null;
      return n;
    }catch(_){ return null; }
  }

  async function fetchReddit(){
    try{
      const res = await fetch('https://www.reddit.com/r/countryball_cards/about.json', {
        mode: 'cors',
        cache: 'no-cache'
      });
      if(!res.ok) throw new Error('reddit status '+res.status);
      const json = await res.json();
      const n = json?.data?.subscribers ?? null;
      return n;
    }catch(error){ 
      // Reddit API might be blocked by CORS - this is expected
      return null; 
    }
  }

  async function loadCounts(){
    const cached = readCache();
    if(cached){
      if(cached.discord!=null) setText(discordCountEl, formatCount(cached.discord));
      if(cached.reddit!=null) setText(redditCountEl, formatCount(cached.reddit));
    }
    const [d, r] = await Promise.all([fetchDiscord(), fetchReddit()]);
    const result = { discord: d ?? (cached && cached.discord) ?? null, reddit: r ?? (cached && cached.reddit) ?? null };
    writeCache(result);
    if(result.discord!=null) setText(discordCountEl, formatCount(result.discord));
    if(result.reddit!=null) setText(redditCountEl, formatCount(result.reddit));
  }

  // Kick off when the main thread is idle so we don't compete with rendering.
  const kickoff = () => { try { loadCounts(); } catch (_) { /* noop */ } };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(kickoff, { timeout: 1500 });
  } else {
    setTimeout(kickoff, 400);
  }
})();

// Resize alignment
let resizeRaf;
window.addEventListener('resize', ()=>{
  if(resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf=requestAnimationFrame(updateCarousel);
});

// Touch/swipe
let touchStartX=0, touchEndX=0, isSwiping=false;
if(heroCarouselEl){
  heroCarouselEl.addEventListener('touchstart', (e)=>{ touchStartX=e.changedTouches[0].screenX; isSwiping=true; }, {passive:true});
  heroCarouselEl.addEventListener('touchend', (e)=>{ touchEndX=e.changedTouches[0].screenX; if(isSwiping){ handleSwipe(); isSwiping=false; } }, {passive:true});
}
function handleSwipe(){
  const t=50, d=touchEndX-touchStartX;
  if(Math.abs(d)>t){ if(d>0){ prevSlide(); } else { nextSlide(); } handleUserInteraction(); }
}

// Auto-scroll carousel with pause on user interaction
let autoScrollInterval;
let lastUserInteraction = 0;

function startAutoScroll() {
  if (totalSlides < 2) {
    return;
  }

  if (autoScrollInterval) clearInterval(autoScrollInterval);
  
  autoScrollInterval = setInterval(() => {
    // Pause auto-scroll for 15 seconds after user interaction
    if (Date.now() - lastUserInteraction < 15000) return;
    
    // Don't auto-scroll if user is not viewing the page
    if (document.hidden) return;
    
    try {
      nextSlide();
    } catch (error) {
      console.warn('Auto-scroll error:', error);
    }
  }, 4000); // Change slide every 4 seconds
}

// ===== FAQ ACCORDION (Homepage) =====
function initFaqAccordion() {
  const questionButtons = document.querySelectorAll('.faq-section .faq-question');
  if (!questionButtons.length) {
    return;
  }

  questionButtons.forEach(button => {
    if (!button || button.dataset.faqBound === '1') {
      return;
    }
    button.dataset.faqBound = '1';

    const toggle = () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const answer = button.nextElementSibling;
      const toggleEl = button.querySelector('.faq-toggle');

      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (toggleEl) {
        toggleEl.textContent = expanded ? '+' : '-';
      }
      if (answer) {
        answer.hidden = expanded;
      }
    };

    button.addEventListener('click', toggle);

    // Ensure Space works reliably even if nested elements exist.
    button.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggle();
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFaqAccordion);
} else {
  initFaqAccordion();
}

function handleUserInteraction() {
  lastUserInteraction = Date.now();
  // Don't need to clear interval, just update timestamp
}

// Start auto-scroll when page loads
if (heroCarouselEl && cardData.length > 1) {
  startAutoScroll();
}

// CTA conversion hooks
const discordBtn=document.getElementById('discordBtn');
const redditBtn=document.getElementById('redditBtn');
const emailBtn=document.getElementById('emailBtn');

// Enhanced email button with success state
if(emailBtn){
  emailBtn.addEventListener('click', function(){
    showEmailModal();
  });
}

if(discordBtn){
  discordBtn.addEventListener('click', function(e){
    e.preventDefault();
    try{ if(window.rdt) rdt('track','Lead',{event_name:'DiscordJoin',content_name:'Discord Community',content_category:'Community',content_ids:['discord_join'],content_type:'community'}); }catch(_){ }
    try{ if(window.rdt) rdt('track','Custom',{customEventName:'DiscordJoin',content_name:'Discord Community'}); }catch(_){ }
    setTimeout(()=>window.open('https://discord.gg/GVkrHXvzf8','_blank'),400);
  });
}

if(redditBtn){
  redditBtn.addEventListener('click', function(e){
    e.preventDefault();
    try{ if(window.rdt) rdt('track','Lead',{event_name:'RedditJoin',content_name:'Reddit Community',content_category:'Community',content_ids:['reddit_join'],content_type:'community'}); }catch(_){ }
    try{ if(window.rdt) rdt('track','Custom',{customEventName:'RedditJoin',content_name:'Reddit Community'}); }catch(_){ }
    setTimeout(()=>window.open('https://reddit.com/r/countryball_cards','_blank'),400);
  });
}

// Roadmap modal
(function(){
  const openBtn=document.getElementById('roadmapBtn');
  const overlay=document.getElementById('roadmapOverlay');
  const dialog=overlay?overlay.querySelector('.modal'):null;
  const closeBtn=document.getElementById('roadmapCloseBtn');
  if(!openBtn||!overlay||!dialog||!closeBtn) return;
  let lastFocus=null;
  const getFocusable=()=>dialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
  function open(){
    lastFocus=document.activeElement;
    overlay.hidden=false; overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    try{ if(window.rdt) rdt('track','Custom',{customEventName:'RoadmapOpen'}); }catch(_){ }
    const f=getFocusable(); if(f.length) f[0].focus(); else dialog.focus();
    document.addEventListener('keydown', onKeyDown);
    overlay.addEventListener('click', onOverlayClick);
  }
  function close(){
    overlay.hidden=true; overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    document.removeEventListener('keydown', onKeyDown);
    overlay.removeEventListener('click', onOverlayClick);
    if(lastFocus && typeof lastFocus.focus==='function') lastFocus.focus();
  }
  function onOverlayClick(e){ if(e.target===overlay) close(); }
  function onKeyDown(e){
    if(e.key==='Escape'){ e.preventDefault(); close(); return; }
    if(e.key==='Tab'){
      const f=Array.from(getFocusable()); if(!f.length) return;
      const first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  }
  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
})();

// Email modal
function showEmailModal() {
  const overlay = document.getElementById('emailOverlay');
  const dialog = overlay ? overlay.querySelector('.modal') : null;
  const closeBtn = document.getElementById('emailCloseBtn');
  const emailForm = document.getElementById('emailForm');
  const emailInput = document.getElementById('emailInput');
  const submitBtn = document.getElementById('emailSubmitBtn');
  const formMessage = document.getElementById('formMessage');
  
  if (!overlay || !dialog) return;
  
  let lastFocus = null;
  
  function open() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Track modal open
    trackEmailSignup();
    
    // Focus the email input
    setTimeout(() => emailInput.focus(), 100);
    
    document.addEventListener('keydown', onKeyDown);
    overlay.addEventListener('click', onOverlayClick);
  }
  
  function close() {
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeyDown);
    overlay.removeEventListener('click', onOverlayClick);
    
    // Reset form
    emailForm.reset();
    formMessage.className = 'form-message';
    formMessage.textContent = '';
    submitBtn.className = 'email-submit-btn';
    submitBtn.disabled = false;
    
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }
  
  function onOverlayClick(e) {
    if (e.target === overlay) close();
  }
  
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
  }
  
  function validateEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.length >= 5 && email.length <= 254;
  }
  
  function showMessage(message, type) {
    formMessage.className = `form-message ${type}`;
    formMessage.textContent = message;
  }
  
  // Form submission handler
  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const email = emailInput.value.trim();
    
    if (!email) {
      showMessage('Please enter your email address.', 'error');
      emailInput.focus();
      return false;
    }
    
    if (!validateEmail(email)) {
      showMessage('Please enter a valid email address.', 'error');
      emailInput.focus();
      return false;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    showMessage('Sending...', 'info');
    
    // Create hidden iframe for form submission to avoid CORS
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'modalEmailSubmissionFrame';
    document.body.appendChild(iframe);
    
    // Set form target to iframe
    emailForm.target = 'modalEmailSubmissionFrame';
    
    // Submit form normally
    emailForm.submit();
    
    // Show success message after delay
    setTimeout(() => {
      showMessage('âœ“ Success! You\'ll be notified when we launch!', 'success');
      emailInput.value = '';
      submitBtn.classList.add('success');
      
      // Track successful signup
      if (typeof gtag !== 'undefined') {
        gtag('event', 'email_signup', {
          event_category: 'conversion',
          event_label: 'homepage_modal',
          value: 1
        });
      }
      
      // Clean up and close
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        close();
      }, 2000);
    }, 1500);
    
    return false;
  }
  
  // Event listeners
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (emailForm) emailForm.addEventListener('submit', handleSubmit);
  
  // Open the modal
  open();
}

// Inline email signup forms (footer + updates card)
function initInlineEmailSignupForm(config) {
  const form = document.getElementById(config.formId);
  const input = document.getElementById(config.inputId);
  const submitBtn = document.getElementById(config.submitBtnId);
  const messageEl = document.getElementById(config.messageId);
  if (!form || !input || !submitBtn || !messageEl) return;

  function validateEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.length >= 5 && email.length <= 254;
  }

  function showMessage(msg, type) {
    messageEl.className = 'footer-form-message ' + type;
    messageEl.textContent = msg;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const email = input.value.trim();
    if (!email) {
      showMessage('Please enter your email address.', 'error');
      input.focus();
      return;
    }
    if (!validateEmail(email)) {
      showMessage('Please enter a valid email address.', 'error');
      input.focus();
      return;
    }

    submitBtn.disabled = true;
    showMessage('Sending...', 'info');

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = config.framePrefix + '_' + Date.now();
    document.body.appendChild(iframe);
    form.target = iframe.name;
    form.submit();

    setTimeout(function() {
      showMessage(config.successMessage || "You're in! We'll keep you updated.", 'success');
      input.value = '';
      submitBtn.classList.add('success');
      if (typeof gtag !== 'undefined') {
        gtag('event', 'email_signup', {
          event_category: 'conversion',
          event_label: config.eventLabel,
          value: 1
        });
      }
      setTimeout(function() {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        form.removeAttribute('target');
        submitBtn.disabled = false;
        submitBtn.classList.remove('success');
      }, 3000);
    }, 1500);
  });
}

initInlineEmailSignupForm({
  formId: 'footerEmailForm',
  inputId: 'footerEmailInput',
  submitBtnId: 'footerEmailSubmitBtn',
  messageId: 'footerFormMessage',
  framePrefix: 'footerEmailSubmissionFrame',
  eventLabel: 'homepage_footer'
});

initInlineEmailSignupForm({
  formId: 'updatesEmailForm',
  inputId: 'updatesEmailInput',
  submitBtnId: 'updatesEmailSubmitBtn',
  messageId: 'updatesFormMessage',
  framePrefix: 'updatesEmailSubmissionFrame',
  eventLabel: 'homepage_updates_section'
});

// Boot
initCountdown();

// Enable 3D tilt only on devices with a precise pointer and hover (i.e., desktops)
const supports3DTilt = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function runAfterFirstPaint(fn) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  } else {
    setTimeout(fn, 0);
  }
}

function initScrollSpawnAnimations() {
  if (window.__scrollSpawnInitialized) {
    return;
  }
  window.__scrollSpawnInitialized = true;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sectionSelector = [
    '.logo-section',
    '.card-peek-section',
    '.game-explainer',
    '.packages-comparison',
    '.email-updates-section',
    '.faq-section',
    'body > .hero-video.hero-video-cta',
    '.site-footer'
  ].join(',');

  const sections = Array.from(document.querySelectorAll(sectionSelector));

  sections.forEach(section => {
    section.classList.add('scroll-spawn-section');
    section.dataset.spawnAnim = section.matches('.logo-section, .site-footer') ? 'fade' : 'rise';
    section.style.setProperty('--spawn-delay', '0ms');
  });

  const reveal = element => {
    element.classList.add('is-visible');
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    sections.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return;
      }
      reveal(entry.target);
      currentObserver.unobserve(entry.target);
    });
  }, {
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.12
  });

  sections.forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      reveal(element);
      return;
    }
    observer.observe(element);
  });
}

initScrollSpawnAnimations();

runAfterFirstPaint(() => {
  try {
    initializeCarousel();
    updateCarousel();
    startAutoScroll();
    initializeImageQuality();
    initScrollSpawnAnimations();
    if (supports3DTilt) {
      init3DCardEffects();
    }
  } catch (error) {
    console.warn('Boot error:', error);
  }
});

// Country/background detection is page-specific; don't hard-fail if absent.
if (typeof detectCountryAndSetBackground === 'function') {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => { try { detectCountryAndSetBackground(); } catch (_) { /* noop */ } }, { timeout: 2000 });
  } else {
    setTimeout(() => { try { detectCountryAndSetBackground(); } catch (_) { /* noop */ } }, 1200);
  }
}

// ===== ADVANCED TRACKING =====
function trackAdvancedEvent(eventName, parameters = {}) {
  try {
    // Google Analytics 4
    if (window.gtag) {
      gtag('event', eventName, {
        event_category: 'user_engagement',
        event_label: parameters.label || '',
        value: parameters.value || 0,
        custom_parameter_1: parameters.custom1 || '',
        custom_parameter_2: parameters.custom2 || '',
        ...parameters
      });
    }
    
    // Reddit Pixel
    if (window.rdt) {
      rdt('track', 'Custom', {
        customEventName: eventName,
        content_name: parameters.content_name || eventName,
        content_category: parameters.content_category || 'engagement',
        ...parameters
      });
    }
  } catch (error) {
    console.warn('Tracking error:', error);
  }
}

// Scroll depth tracking
let maxScrollDepth = 0;
const scrollMilestones = [25, 50, 75, 90, 100];
let trackedMilestones = new Set();

function trackScrollDepth() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = Math.round((scrollTop / documentHeight) * 100);
  
  maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
  
  scrollMilestones.forEach(milestone => {
    if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
      trackedMilestones.add(milestone);
      trackAdvancedEvent('scroll_depth', {
        label: `${milestone}%`,
        value: milestone,
        content_category: 'scroll_tracking'
      });
    }
  });
}

// Time on page tracking
let startTime = Date.now();

function trackTimeOnPage() {
  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  
  // Track at specific intervals
  if ([30, 60, 120, 300].includes(timeSpent)) {
    trackAdvancedEvent('time_on_page', {
      label: `${timeSpent}s`,
      value: timeSpent,
      content_category: 'engagement_time'
    });
  }
}

// Initialize advanced tracking
window.addEventListener('scroll', trackScrollDepth, { passive: true });

// Track time-on-page milestones without a 1s interval.
const timeMilestones = [30, 60, 120, 300];
let nextTimeMilestoneIndex = 0;
function scheduleNextTimeMilestone() {
  if (nextTimeMilestoneIndex >= timeMilestones.length) return;
  const targetSeconds = timeMilestones[nextTimeMilestoneIndex];
  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
  const delayMs = Math.max(0, (targetSeconds - elapsedSeconds) * 1000);

  setTimeout(() => {
    trackAdvancedEvent('time_on_page', {
      label: `${targetSeconds}s`,
      value: targetSeconds,
      content_category: 'engagement_time'
    });
    nextTimeMilestoneIndex += 1;
    scheduleNextTimeMilestone();
  }, delayMs);
}
scheduleNextTimeMilestone();

// ===== TRACKING FUNCTIONS =====
function trackPackagesClick() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'packages_button_clicked', {
      event_category: 'engagement',
      event_label: 'view_packages_cta',
      value: 1
    });
  }
}

function trackRulesClick() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'rules_button_clicked', {
      event_category: 'engagement',
      event_label: 'view_rules_cta',
      value: 1
    });
  }
}

function trackDiscordClick() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'discord_clicked', {
      event_category: 'social',
      event_label: 'join_discord',
      value: 1
    });
  }
}

function trackRedditClick() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'reddit_clicked', {
      event_category: 'social',
      event_label: 'join_subreddit',
      value: 1
    });
  }
}

function trackEmailSignup() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'email_signup_clicked', {
      event_category: 'conversion',
      event_label: 'get_updates',
      value: 1
    });
  }
}

function trackRoadmapView() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'roadmap_viewed', {
      event_category: 'engagement',
      event_label: 'roadmap_modal',
      value: 1
    });
  }
}

function trackDiceClick() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'dice_page_clicked', {
      event_category: 'navigation',
      event_label: 'dice_roller',
      value: 1
    });
  }
}

function trackFreePrintPlayClick() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'free_print_play_clicked', {
      event_category: 'navigation',
      event_label: 'from_homepage',
      value: 1
    });
  }
  
  // Track with Reddit Pixel if available
  if (typeof rdt !== 'undefined') {
    rdt('track', 'Custom', {
      customEventName: 'FreePrintPlayClick',
      content_name: 'Free Print and Play Button'
    });
  }
}

function trackBottomEmailClick() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'bottom_email_cta_clicked', {
      event_category: 'conversion',
      event_label: 'bottom_of_page',
      value: 1
    });
  }
  
  // Track with Reddit Pixel if available
  if (typeof rdt !== 'undefined') {
    rdt('track', 'Lead');
  }
}

function trackCarouselInteraction(action, cardName) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'carousel_interaction', {
      event_category: 'engagement',
      event_label: action,
      custom_parameter: cardName,
      value: 1
    });
  }
}

function trackCarouselEmailCTA() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'carousel_email_cta_clicked', {
      event_category: 'conversion',
      event_label: 'email_signup_carousel',
      value: 1
    });
  }
}

function trackCountryDetection(country) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'country_detected', {
      event_category: 'user_data',
      event_label: country,
      value: 1
    });
  }
}

function trackKickstarterClick(source) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'kickstarter_clicked', {
      event_category: 'conversion',
      event_label: source,
      value: 1
    });
  }
  
  // Track with Reddit Pixel if available
  if (typeof rdt !== 'undefined') {
    rdt('track', 'Lead', {
      event_name: 'KickstarterClick',
      content_name: 'Kickstarter Campaign',
      content_category: 'Campaign',
      content_ids: ['kickstarter_campaign'],
      content_type: 'campaign',
      source: source
    });
  }
}

// ===== BOTTOM POPUP FUNCTIONALITY =====
function showBottomPopup() {
  const popup = document.getElementById('bottomPopup');
  if (!popup) {
    console.log('Bottom popup element not found');
    return;
  }
  
  // Check if user has already dismissed or signed up
  const dismissed = localStorage.getItem('bottom_popup_dismissed');
  const emails = JSON.parse(localStorage.getItem('countryball_emails') || '[]');
  
  console.log('Bottom popup check:', { dismissed, emailCount: emails.length });
  
  if (dismissed || emails.length > 0) {
    console.log('Bottom popup blocked - user already dismissed or signed up');
    return;
  }
  
  console.log('Showing bottom popup');
  popup.hidden = false;
  popup.classList.add('show');
  
  // Track popup show
  trackBottomPopupShow();
}

function dismissBottomPopup() {
  const popup = document.getElementById('bottomPopup');
  if (!popup) return;
  
  popup.classList.add('hide');
  setTimeout(() => {
    popup.hidden = true;
    popup.classList.remove('show', 'hide');
  }, 300);
  
  // Remember that user dismissed it
  localStorage.setItem('bottom_popup_dismissed', 'true');
}

// Debug function to reset popup state (for testing)
function resetBottomPopup() {
  localStorage.removeItem('bottom_popup_dismissed');
  localStorage.removeItem('countryball_emails');
  console.log('Bottom popup state reset - refresh page to test');
}

// Make reset function available globally for testing
window.resetBottomPopup = resetBottomPopup;

// Show bottom popup after user has been on page for 10 seconds
setTimeout(() => {
  // Only show if user hasn't scrolled much (still at top)
  if (window.pageYOffset < 200) {
    showBottomPopup();
  }
}, 10000);

// Show bottom popup when user scrolls to 70% of page
function checkScrollForPopup() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / documentHeight) * 100;
  
  if (scrollPercent >= 70) {
    showBottomPopup();
    window.removeEventListener('scroll', checkScrollForPopup);
  }
}

window.addEventListener('scroll', checkScrollForPopup, { passive: true });

function trackBottomPopupShow() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'bottom_popup_shown', {
      event_category: 'engagement',
      event_label: 'email_signup_popup',
      value: 1
    });
    
    // Additional GA4 event for popup frequency tracking
    gtag('event', 'popup_display', {
      event_category: 'conversion_funnel',
      event_label: 'bottom_email_popup',
      popup_type: 'bottom_signup',
      popup_trigger: 'timer_or_scroll',
      value: 1
    });
  }
}

function trackBottomPopupClick(action) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'bottom_popup_clicked', {
      event_category: 'engagement',
      event_label: action,
      value: 1
    });
  }
}

// Inline Email Form Handler
document.addEventListener('DOMContentLoaded', function() {
  const inlineEmailForm = document.getElementById('inlineEmailForm');
  const inlineEmailInput = document.getElementById('inlineEmailInput');
  const inlineSubmitBtn = document.getElementById('inlineEmailSubmitBtn');
  const inlineFormMessage = document.getElementById('inlineFormMessage');
  
  if (!inlineEmailForm || !inlineEmailInput || !inlineSubmitBtn || !inlineFormMessage) {
    return;
  }
  
  function validateEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.length >= 5 && email.length <= 254;
  }
  
  function showInlineMessage(message, type) {
    // Show message on button instead of in message div
    const submitText = inlineSubmitBtn.querySelector('.inline-submit-text');
    const submitIcon = inlineSubmitBtn.querySelector('.inline-submit-icon');
    
    if (type === 'info') {
      // Sending state
      submitText.textContent = 'Sending...';
      submitIcon.style.display = 'none';
      inlineSubmitBtn.style.opacity = '0.7';
    } else if (type === 'success') {
      // Success state
      submitText.textContent = 'âœ“ Sent!';
      submitIcon.style.display = 'none';
      inlineSubmitBtn.style.background = 'linear-gradient(135deg, #7ED321, #6BCF0F)';
      inlineSubmitBtn.disabled = true; // Make unclickable
      inlineSubmitBtn.style.cursor = 'not-allowed';
      
      // Reset button after 3 seconds
      setTimeout(() => {
        submitText.textContent = 'Get Updates';
        submitIcon.style.display = 'inline';
        inlineSubmitBtn.style.opacity = '1';
        inlineSubmitBtn.style.background = 'linear-gradient(135deg,var(--gold),#d4b866)';
        inlineSubmitBtn.disabled = false; // Make clickable again
        inlineSubmitBtn.style.cursor = 'pointer';
      }, 3000);
    } else if (type === 'error') {
      // Error state - still show in message div for errors
      inlineFormMessage.className = `inline-form-message ${type}`;
      inlineFormMessage.textContent = message;
    }
  }
  
  // Handle form submission with validation
  inlineEmailForm.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const email = inlineEmailInput.value.trim();
    
    if (!email) {
      showInlineMessage('Please enter your email address.', 'error');
      inlineEmailInput.focus();
      return false;
    }
    
    if (!validateEmail(email)) {
      showInlineMessage('Please enter a valid email address.', 'error');
      inlineEmailInput.focus();
      return false;
    }
    
    // Instead of fetch (which causes CORS), submit form normally but prevent redirect
    inlineSubmitBtn.disabled = true;
    inlineFormMessage.textContent = ''; // Clear any previous error messages
    showInlineMessage('Sending...', 'info');
    
    // Create hidden iframe for form submission to avoid redirect
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'emailSubmissionFrame';
    document.body.appendChild(iframe);
    
    // Set form target to iframe
    inlineEmailForm.target = 'emailSubmissionFrame';
    
    // Submit form normally
    inlineEmailForm.submit();
    
    // Show success message after short delay
    setTimeout(() => {
      showInlineMessage('âœ“ Success! You\'ll be notified when we launch!', 'success');
      inlineFormMessage.textContent = ''; // Clear message div
      inlineEmailInput.value = '';
      
      // Track successful signup
      if (typeof gtag !== 'undefined') {
        gtag('event', 'email_signup', {
          event_category: 'conversion',
          event_label: 'homepage_inline',
          value: 1
        });
      }
      
      // Clean up
      inlineSubmitBtn.disabled = false;
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 1500);
    
    return false;
  });
  
  // Focus and blur events for subtle styling (removed transform animation)
  inlineEmailInput.addEventListener('focus', function() {
    // Just add a subtle glow effect instead of scaling
    this.style.boxShadow = '0 0 0 4px rgba(199, 164, 85, 0.3)';
  });
  
  inlineEmailInput.addEventListener('blur', function() {
    this.style.boxShadow = '';
  });
});

// Floating Scroll Arrow Functionality
document.addEventListener('DOMContentLoaded', function() {
  const floatingArrow = document.getElementById('floatingScrollArrow');
  const bottomEmailCta = document.getElementById('bottomEmailCta');
  const bottomCtaBtn = document.querySelector('.bottom-cta-btn');
  let isVisible = false;
  
  if (!floatingArrow) {
    // Floating arrow element not found - this is optional
    return;
  }
  
  // Show/hide arrow based on scroll position and screen size
  function updateArrowVisibility() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Check if at bottom of page (within 100px)
    const isAtBottom = scrollTop + windowHeight >= documentHeight - 100;
    
    // Show on mobile/tablet and not at bottom
    const shouldShow = window.innerWidth <= 1024 && !isAtBottom;
    
    if (shouldShow && !isVisible) {
      floatingArrow.style.display = 'flex';
      setTimeout(() => {
        floatingArrow.style.opacity = '1';
      }, 100);
      isVisible = true;
    } else if (!shouldShow && isVisible) {
      floatingArrow.style.opacity = '0';
      setTimeout(() => {
        floatingArrow.style.display = 'none';
      }, 300);
      isVisible = false;
    }
  }
  
  // Click handler for the floating arrow
  floatingArrow.addEventListener('click', function() {
    // Scroll to bottom of page
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
    
    // Flash the bottom signup button after a short delay
    setTimeout(() => {
      if (bottomCtaBtn) {
        bottomCtaBtn.classList.add('bottom-cta-flash');
        // Remove the flash class after animation completes
        setTimeout(() => {
          bottomCtaBtn.classList.remove('bottom-cta-flash');
        }, 3000); // 3 flashes * 1s each
      }
    }, 1000); // Wait 1s for scroll to complete
    
    // Track the click
    if (typeof gtag !== 'undefined') {
      gtag('event', 'view_more_clicked', {
        event_category: 'navigation',
        event_label: 'scroll_to_bottom',
        value: 1
      });
    }
  });
  
  // Initial setup
  floatingArrow.style.opacity = '0';
  floatingArrow.style.transition = 'opacity 0.3s ease';
  
  // Show arrow initially if on mobile/tablet
  updateArrowVisibility();
  
  // Add scroll listener to hide when at bottom
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(updateArrowVisibility, 10);
  });
  
  // Handle resize to show/hide arrow based on screen size
  window.addEventListener('resize', updateArrowVisibility);
});

// Mobile floating preorder CTA
document.addEventListener('DOMContentLoaded', function() {
  const floatingPreorder = document.getElementById('mobileFloatingPreorder');
  const editionComparison = document.getElementById('editionComparison');
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  let ticking = false;

  if (!floatingPreorder || !editionComparison) {
    return;
  }

  function isOverlayOpen() {
    return Array.from(document.querySelectorAll('.modal-overlay')).some(overlay => !overlay.hidden);
  }

  function isElementMeaningfullyVisible(element) {
    if (!element || element === floatingPreorder) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = (window.visualViewport && window.visualViewport.height) || window.innerHeight || document.documentElement.clientHeight;
    const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const visibleArea = visibleWidth * visibleHeight;
    const elementArea = Math.max(1, rect.width * rect.height);

    return visibleHeight >= 28 && visibleArea >= 600 && visibleArea / elementArea >= 0.16;
  }

  function hasVisiblePreorderCta() {
    const preorderCtas = document.querySelectorAll('.hero-buy-btn, .package-btn');
    return Array.from(preorderCtas).some(isElementMeaningfullyVisible);
  }

  function updateFloatingPreorder() {
    ticking = false;
    const shouldShow = mobileQuery.matches && !isOverlayOpen() && !hasVisiblePreorderCta();
    floatingPreorder.classList.toggle('is-visible', shouldShow);
    floatingPreorder.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    floatingPreorder.tabIndex = shouldShow ? 0 : -1;
  }

  function requestUpdate() {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(updateFloatingPreorder);
  }

  floatingPreorder.addEventListener('click', function(event) {
    event.preventDefault();
    if (typeof trackStoreClick === 'function') {
      trackStoreClick('mobile_floating_preorder');
    }
    editionComparison.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', '#editionComparison');
    }
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', requestUpdate);
    window.visualViewport.addEventListener('scroll', requestUpdate);
  }
  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', requestUpdate);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(requestUpdate);
  }

  const modalObserver = new MutationObserver(requestUpdate);
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    modalObserver.observe(overlay, { attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });
  });

  requestUpdate();
});

// ===== ANALYTICS VERIFICATION =====
// Track that main.js fully loaded and executed
document.addEventListener('DOMContentLoaded', function() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'main_js_loaded', {
      event_category: 'technical',
      event_label: 'main_script_executed',
      value: 1
    });
  }

  // Verify country detection is being called
  setTimeout(function() {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'analytics_verification', {
        event_category: 'technical',
        event_label: `gtag_available_${typeof gtag !== 'undefined'}_fetch_${typeof fetch !== 'undefined'}`,
        value: 1
      });
    }
  }, 1000);
});


