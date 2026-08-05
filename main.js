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
const slowConnectionTypes = new Set(['slow-2g', '2g']);
const warmedResourceUrls = new Set();
const warmingImages = new Set();
const componentShowcaseAssets = [
  'components/showcase/closed_box.webp',
  'components/showcase/box_open.webp',
  'components/showcase/cards_main.webp',
  'components/showcase/project_cards.webp',
  'components/showcase/extended_opp.webp',
  'components/showcase/coins.webp',
  'components/showcase/resource_dice.webp',
  'components/showcase/combat_die.webp'
];
let componentShowcaseAssetsWarmed = false;

function canWarmupAssets() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) {
    return true;
  }
  if (conn.saveData) {
    return false;
  }
  return !conn.effectiveType || !slowConnectionTypes.has(conn.effectiveType);
}

function toAbsoluteUrl(url) {
  if (!url) {
    return '';
  }
  try {
    return new URL(url, window.location.href).href;
  } catch (_) {
    return '';
  }
}

function warmResource(url, options = {}) {
  if (!canWarmupAssets()) {
    return false;
  }

  const absoluteUrl = toAbsoluteUrl(url);
  if (!absoluteUrl || warmedResourceUrls.has(absoluteUrl)) {
    return false;
  }

  warmedResourceUrls.add(absoluteUrl);

  if (options.decode === true) {
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = options.priority || 'low';
    img.onload = img.onerror = () => warmingImages.delete(img);
    warmingImages.add(img);
    img.src = absoluteUrl;
  } else {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = options.as || 'image';
    link.href = absoluteUrl;
    link.fetchPriority = options.priority || 'low';
    document.head.appendChild(link);
  }

  warmResourcesInServiceWorker([absoluteUrl]);
  return true;
}

function warmComponentShowcaseAssets(options = {}) {
  const includePieces = options.includePieces !== false;
  const priority = options.priority || 'low';
  const urls = includePieces ? componentShowcaseAssets : componentShowcaseAssets.slice(0, 2);

  urls.forEach((url) => warmResource(url, { decode: true, priority }));

  if (includePieces) {
    componentShowcaseAssetsWarmed = true;
  }
}

function warmResourcesInServiceWorker(urls) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller || !Array.isArray(urls) || !urls.length) {
    return;
  }

  try {
    navigator.serviceWorker.controller.postMessage({
      type: 'warm_cache',
      urls
    });
  } catch (_) {
    // Warming is opportunistic; the page works normally without it.
  }
}

function initComponentShowcase() {
  const showcase = document.querySelector('.component-showcase');
  const stage = document.querySelector('.component-box-stage');
  const title = document.getElementById('componentShowcaseTitle');
  const items = document.getElementById('componentShowcaseItems');

  if (!showcase || !stage) {
    return;
  }

  stage.querySelectorAll('img').forEach((img) => {
    img.loading = 'eager';
  });

  warmComponentShowcaseAssets({ includePieces: false, priority: 'high' });

  const warmAllShowcaseAssets = (priority = 'low') => {
    if (!componentShowcaseAssetsWarmed) {
      warmComponentShowcaseAssets({ priority });
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        warmAllShowcaseAssets('high');
        observer.disconnect();
      }
    }, { rootMargin: '1200px 0px' });

    observer.observe(showcase);
  } else {
    warmAllShowcaseAssets('low');
  }

  ['pointerenter', 'focus', 'touchstart'].forEach((eventName) => {
    stage.addEventListener(eventName, () => warmAllShowcaseAssets('high'), {
      once: true,
      passive: true
    });
  });

  const openShowcase = () => {
    if (showcase.classList.contains('is-open') || showcase.classList.contains('is-shaking')) {
      return;
    }

    warmAllShowcaseAssets('high');

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const openDelay = prefersReducedMotion ? 0 : 300;
    showcase.classList.add('is-shaking');

    window.setTimeout(() => {
      showcase.classList.remove('is-shaking');
      showcase.classList.add('is-open');
      if (title) {
        title.textContent = "what's inside";
      }
      stage.setAttribute('aria-expanded', 'true');
      if (items) {
        items.setAttribute('aria-hidden', 'false');
      }

      requestAnimationFrame(() => {
        showcase.classList.add('is-unpacked');
      });
    }, openDelay);
  };

  stage.addEventListener('click', openShowcase);
}

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

  warmHeroCarouselNeighbors();
}

function warmHeroCarouselNeighbors() {
  if (!totalSlides || !canWarmupAssets()) {
    return;
  }

  const offsets = [0, 1, -1, 2];
  offsets.forEach((offset, index) => {
    const slideIndex = (currentSlide + offset + totalSlides) % totalSlides;
    const card = cardData[slideIndex];
    if (!card) {
      return;
    }
    warmResource(card.webp || card.src, { decode: index <= 1 });
  });
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


  function visibleCards() {
    return getCardPeekItems(track);
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

  // Clamps scrollLeft to the left-most stop (1st card centered). Cached
  // since it only depends on layout that changes on resize, not on every
  // drag/scroll frame -- recomputing it per pointermove was forcing a
  // synchronous layout on every frame and was the main source of drag jank.
  let cachedMinScrollLeft = null;

  function invalidateMinScrollLeft() {
    cachedMinScrollLeft = null;
  }

  function centeredScrollLeft(card) {
    if (!card) {
      return 0;
    }
    const centerInset = Math.max(0, (viewport.clientWidth - card.offsetWidth) / 2);
    return Math.round(card.offsetLeft - centerInset);
  }

  function minScrollLeft() {
    if (cachedMinScrollLeft === null) {
      cachedMinScrollLeft = Math.max(0, centeredScrollLeft(visibleCards()[0]));
    }
    return cachedMinScrollLeft;
  }

  function normalizeLoopPosition() {
    const originalScrollLeft = viewport.scrollLeft;
    const clampedMin = minScrollLeft();

    if (originalScrollLeft < clampedMin) {
      setScrollLeftInstantly(clampedMin);
      return clampedMin - originalScrollLeft;
    }

    return 0;
  }

  function startingCard() {
    const cards = visibleCards();
    if (!cards.length) {
      return null;
    }
    // On narrow phones only ~1 card fits, so centering the very first card leaves
    // an empty gap beside it. Start on the 2nd card instead so the 1st still peeks in.
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
    return (isMobile && cards[1]) ? cards[1] : cards[0];
  }

  function startLoopAtCard(attempt) {
    attempt = attempt || 0;
    const card = startingCard();
    if (!card || !card.offsetWidth) {
      // Layout not ready yet (common in Instagram/Facebook in-app browsers). Retry.
      if (attempt < 8) {
        const delay = attempt < 3 ? 0 : (attempt < 6 ? 50 : 150);
        if (delay === 0) {
          requestAnimationFrame(function() { startLoopAtCard(attempt + 1); });
        } else {
          window.setTimeout(function() { startLoopAtCard(attempt + 1); }, delay);
        }
      }
      return;
    }

    setScrollLeftInstantly(centeredScrollLeft(card));
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
    let target = viewport.scrollLeft + direction * scrollAmount();
    if (direction < 0) {
      target = Math.max(target, minScrollLeft());
    }
    viewport.scrollTo({
      left: target,
      behavior: 'smooth'
    });
    window.setTimeout(normalizeLoopPosition, 420);
    window.setTimeout(normalizeLoopPosition, 900);
    window.setTimeout(normalizeLoopPosition, 1400);
  }

  prevBtn.addEventListener('click', () => {
    scrollByDirection(-1);
    cardPeekWarmup.warmAroundViewport();
  });
  nextBtn.addEventListener('click', () => {
    scrollByDirection(1);
    cardPeekWarmup.warmAroundViewport();
  });

  viewport.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      viewport.scrollBy({ left: event.deltaY, behavior: 'auto' });
      normalizeLoopPosition();
    }
  }, { passive: false });

  function updateNavVisibility() {
    prevBtn.style.display = viewport.scrollLeft <= minScrollLeft() + 2 ? 'none' : '';
    nextBtn.style.display = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 2 ? 'none' : '';
  }

  let scrollRaf = 0;
  viewport.addEventListener('scroll', () => {
    if (scrollRaf) {
      return;
    }
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      normalizeLoopPosition();
      cardPeekWarmup.warmAroundViewport();
      updateNavVisibility();
    });
  }, { passive: true });

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let isDragging = false;
  let suppressClick = false;
  let pendingDeltaX = 0;
  let dragRaf = 0;

  // Applying the scroll write + clamp once per animation frame (instead of
  // once per raw pointermove, which can fire far faster than the display
  // refresh rate) is what makes the drag feel smooth instead of janky.
  function applyDragFrame() {
    dragRaf = 0;
    setScrollLeftInstantly(startScrollLeft - pendingDeltaX);
    startScrollLeft += normalizeLoopPosition();
  }

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
    pendingDeltaX = deltaX;
    if (!dragRaf) {
      dragRaf = requestAnimationFrame(applyDragFrame);
    }
  }, { passive: false });

  function endDrag(event) {
    if (pointerId !== event.pointerId) {
      return;
    }

    if (dragRaf) {
      cancelAnimationFrame(dragRaf);
      applyDragFrame();
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
  window.addEventListener('resize', invalidateMinScrollLeft);
  track.addEventListener('click', event => {
    if (!suppressClick) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);

  requestAnimationFrame(startLoopAtCard);
  requestAnimationFrame(updateNavVisibility);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCardPeekCarousel);
} else {
  initCardPeekCarousel();
}

// Opportunistically warm up off-screen card art once the main work is done.
const cardPeekWarmup = (() => {
  let queue = [];
  let started = false;
  let scheduled = false;
  const queuedResourceUrls = new Set();
  const nearbyOffsets = [0, 1, -1, 2, -2, 3, -3];

  function getOriginalImages() {
    const track = document.getElementById('cardPeekTrack');
    if (!track) {
      return [];
    }

    return getCardPeekItems(track)
      .map(item => item.matches?.('img.card-peek-image') ? item : item.querySelector?.('img.card-peek-image'))
      .filter(Boolean);
  }

  function getCenteredIndex(images) {
    const viewport = document.querySelector('.card-peek-window');
    if (!viewport || !images.length) {
      return 0;
    }

    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
    let bestIndex = 0;
    let bestDistance = Infinity;

    images.forEach((img, index) => {
      const card = img.closest('.card-peek-card') || img;
      const center = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  function enqueueUrl(url, decode = false) {
    const absoluteUrl = toAbsoluteUrl(url);
    if (!absoluteUrl || warmedResourceUrls.has(absoluteUrl) || queuedResourceUrls.has(absoluteUrl)) {
      return;
    }
    queuedResourceUrls.add(absoluteUrl);
    queue.push({ url: absoluteUrl, decode });
  }

  function enqueueImage(img, decode = false, includeFull = false) {
    if (!img) {
      return;
    }

    enqueueUrl(img.currentSrc || img.src, decode);

    const fullSrc = img.dataset.fullSrc;
    if (includeFull && fullSrc) {
      enqueueUrl(fullSrc, decode);
    }
  }

  function primeQueue() {
    const images = getOriginalImages();
    const centeredIndex = getCenteredIndex(images);
    const seenIndexes = new Set();
    const orderedImages = [];

    nearbyOffsets.forEach(offset => {
      if (!images.length) {
        return;
      }
      const index = (centeredIndex + offset + images.length) % images.length;
      if (!seenIndexes.has(index)) {
        seenIndexes.add(index);
        orderedImages.push(images[index]);
      }
    });

    images.forEach((img, index) => {
      if (!seenIndexes.has(index)) {
        seenIndexes.add(index);
        orderedImages.push(img);
      }
    });

    orderedImages.forEach((img, index) => {
      const isNearby = index < nearbyOffsets.length;
      enqueueImage(img, isNearby, isNearby);
    });
  }

  function processQueue(deadline) {
    scheduled = false;
    const swBatch = [];
    let processed = 0;

    while (queue.length && processed < 4 && (deadline.timeRemaining() > 7 || deadline.didTimeout)) {
      const next = queue.shift();
      if (next) {
        queuedResourceUrls.delete(next.url);
      }
      if (!next || warmedResourceUrls.has(next.url)) {
        continue;
      }

      warmedResourceUrls.add(next.url);
      swBatch.push(next.url);
      processed += 1;

      if (next.decode) {
        const img = new Image();
        img.decoding = 'async';
        img.fetchPriority = 'low';
        img.src = next.url;
      } else {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = next.url;
        link.fetchPriority = 'low';
        document.head.appendChild(link);
      }
    }

    warmResourcesInServiceWorker(swBatch);

    if (queue.length) {
      schedule();
    }
  }

  function schedule() {
    if (scheduled) {
      return;
    }
    scheduled = true;
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processQueue, { timeout: 1800 });
    } else {
      setTimeout(() => {
        processQueue({ timeRemaining: () => 0, didTimeout: true });
      }, 600);
    }
  }

  function start() {
    if (started) {
      return;
    }
    if (!canWarmupAssets()) {
      started = true;
      return;
    }
    primeQueue();
    if (!queue.length) {
      started = true;
      return;
    }
    started = true;
    schedule();
  }

  function warmAroundViewport() {
    if (!canWarmupAssets()) {
      return;
    }
    const images = getOriginalImages();
    const centeredIndex = getCenteredIndex(images);
    nearbyOffsets.forEach(offset => {
      if (!images.length) {
        return;
      }
      const index = (centeredIndex + offset + images.length) % images.length;
      enqueueImage(images[index], true, true);
    });
    if (queue.length) {
      schedule();
    }
  }

  return { start, warmAroundViewport };
})();

if (document.readyState === 'complete') {
  cardPeekWarmup.start();
} else {
  window.addEventListener('load', () => cardPeekWarmup.start(), { once: true });
}
window.warmCardPeekAroundViewport = () => cardPeekWarmup.warmAroundViewport();

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
  const kickoff = () => {
    if (!canWarmupAssets()) {
      return;
    }
    try { loadCounts(); } catch (_) { /* noop */ }
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(kickoff, { timeout: 5000 });
  } else {
    setTimeout(kickoff, 2500);
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

// ===== REVIEWS CAROUSEL (Homepage) =====
function initReviewsCarousel() {
  const carousel = document.querySelector('[data-reviews-carousel]');
  if (!carousel || carousel.dataset.reviewsBound === '1') {
    return;
  }

  const viewport = carousel.querySelector('.reviews-viewport');
  const cards = Array.from(carousel.querySelectorAll('.review-card'));
  const prevButton = carousel.querySelector('[data-reviews-prev]');
  const nextButton = carousel.querySelector('[data-reviews-next]');
  const dotsWrap = carousel.querySelector('[data-reviews-dots]');

  if (!viewport || cards.length < 2 || !dotsWrap) {
    return;
  }

  carousel.dataset.reviewsBound = '1';
  let activeIndex = 0;
  let autoTimer = null;
  let userPausedUntil = 0;

  const getCardGap = () => {
    const track = carousel.querySelector('.reviews-track');
    const styles = track ? window.getComputedStyle(track) : null;
    return styles ? parseFloat(styles.columnGap || styles.gap || '0') || 0 : 0;
  };

  const getStepSize = () => (cards[0] ? cards[0].getBoundingClientRect().width + getCardGap() : viewport.clientWidth);
  const getMaxIndex = () => {
    const stepSize = getStepSize();
    if (stepSize <= 0) {
      return 0;
    }
    return Math.max(0, Math.ceil((viewport.scrollWidth - viewport.clientWidth) / stepSize));
  };
  const clampIndex = (index) => Math.max(0, Math.min(getMaxIndex(), index));
  const rebuildDots = () => {
    const pageCount = getMaxIndex() + 1;
    dotsWrap.innerHTML = '';
    for (let index = 0; index < pageCount; index += 1) {
      const dot = document.createElement('button');
      dot.className = 'reviews-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show reviews page ${index + 1}`);
      dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
      dot.addEventListener('click', () => {
        noteUserInteraction();
        goToReview(index);
      });
      dotsWrap.appendChild(dot);
    }
  };

  const setActiveDot = () => {
    const stepSize = getStepSize();
    const nextIndex = stepSize > 0 ? clampIndex(Math.round(viewport.scrollLeft / stepSize)) : 0;
    activeIndex = nextIndex;
    Array.from(dotsWrap.children).forEach((dot, index) => {
      dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
    });
  };

  const goToReview = (index, behavior = 'smooth') => {
    activeIndex = clampIndex(index);
    const targetCard = cards[activeIndex];
    if (!targetCard) {
      return;
    }
    const track = carousel.querySelector('.reviews-track');
    const trackStart = track ? track.offsetLeft : 0;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const targetLeft = Math.max(0, targetCard.offsetLeft - trackStart);
    viewport.scrollTo({ left: Math.min(targetLeft, maxScroll), behavior });
    setActiveDot();
  };

  const noteUserInteraction = () => {
    userPausedUntil = Date.now() + 10000;
  };

  rebuildDots();
  goToReview(0, 'auto');

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      noteUserInteraction();
      goToReview(activeIndex <= 0 ? getMaxIndex() : activeIndex - 1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      noteUserInteraction();
      goToReview(activeIndex >= getMaxIndex() ? 0 : activeIndex + 1);
    });
  }

  viewport.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    noteUserInteraction();
    goToReview(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });

  viewport.addEventListener('scroll', () => {
    window.requestAnimationFrame(setActiveDot);
  }, { passive: true });

  window.addEventListener('resize', () => {
    window.requestAnimationFrame(() => {
      activeIndex = clampIndex(activeIndex);
      rebuildDots();
      goToReview(activeIndex, 'auto');
    });
  });

  autoTimer = window.setInterval(() => {
    if (document.hidden || Date.now() < userPausedUntil) {
      return;
    }
    goToReview(activeIndex >= getMaxIndex() ? 0 : activeIndex + 1);
  }, 5500);

  carousel.addEventListener('pointerdown', noteUserInteraction, { passive: true });
  carousel.addEventListener('focusin', noteUserInteraction);
  window.addEventListener('beforeunload', () => {
    if (autoTimer) {
      window.clearInterval(autoTimer);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReviewsCarousel);
} else {
  initReviewsCarousel();
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

if(discordBtn){
  discordBtn.addEventListener('click', function(e){
    e.preventDefault();
    try{ if(typeof fbq==='function') fbq('track','Lead',{content_name:'Discord Community',content_category:'Community',content_ids:['discord_join'],content_type:'community'},{eventID:'lead_'+Date.now()+'_'+Math.random().toString(36).slice(2,10)}); }catch(_){ }
    setTimeout(()=>window.open('https://discord.gg/GVkrHXvzf8','_blank'),400);
  });
}

if(redditBtn){
  redditBtn.addEventListener('click', function(e){
    e.preventDefault();
    try{ if(typeof fbq==='function') fbq('track','Lead',{content_name:'Reddit Community',content_category:'Community',content_ids:['reddit_join'],content_type:'community'},{eventID:'lead_'+Date.now()+'_'+Math.random().toString(36).slice(2,10)}); }catch(_){ }
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

// Extended cards modal (+10 upsell)
(function(){
  const openTrigger=document.getElementById('cardPeekUpsell');
  const overlay=document.getElementById('extendedCardsOverlay');
  const dialog=overlay?overlay.querySelector('.modal'):null;
  const closeBtn=document.getElementById('extendedCardsCloseBtn');
  const grid=document.getElementById('extendedCardsGrid');
  if(!openTrigger||!overlay||!dialog||!closeBtn) return;
  let lastFocus=null;
  const getFocusable=()=>dialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
  function open(){
    lastFocus=document.activeElement;
    overlay.hidden=false; overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    if(typeof trackSiteLinkClick==='function') trackSiteLinkClick('extended_cards_upsell');
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
  openTrigger.addEventListener('click', open);
  openTrigger.addEventListener('keydown', function(e){
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(); }
  });
  closeBtn.addEventListener('click', close);
  if(grid){
    grid.addEventListener('click', function(e){
      const img=e.target.closest('.extended-card-image');
      if(img && typeof window.openCardZoom==='function') window.openCardZoom(img.dataset.fullSrc || img.currentSrc || img.src, img.alt);
    });
  }
})();

// Pricing table detail tooltips
(function(){
  const triggers=document.querySelectorAll('.compare-info-btn[data-package-detail]');
  if(!triggers.length) return;

  const details={
    extended:{
      html:'<img class="package-detail-image" src="components/showcase/extended_opp.webp" alt="Extended Edition extra countryball cards preview" width="760" height="461" loading="lazy" decoding="async"><p>The 10 extra Countryballs are Switzerland, Spain, Croatia, Czechia, Hungary, Finland, Belgium, Norway, Austria, and Portugal. The Extended Edition also adds 5 extra Project Cards for more deck variety.</p>'
    },
    certificate:{
      html:"<p>Each Founder&apos;s Edition includes a numbered holographic certificate. You will receive a random number between 1 and 100. No future Founder&apos;s Certificate will ever be made, so this numbered run stays limited to the original 100.</p>"
    },
    holographic:{
      html:'<p>These 5 holographic Countryball Cards are early prototype versions of the cards, with slightly different abilities from the final versions. The set includes USA, France, Poland, Germany, and the Netherlands.</p>'
    }
  };

  const tooltip=document.createElement('div');
  tooltip.id='packageDetailTooltip';
  tooltip.className='package-detail-tooltip';
  tooltip.setAttribute('role','tooltip');
  tooltip.hidden=true;
  tooltip.style.position='fixed';
  tooltip.style.zIndex='1200';
  document.body.appendChild(tooltip);

  let activeTrigger=null;
  let closeTimer=0;
  let pinned=false;

  function placeTooltip(){
    if(!activeTrigger||tooltip.hidden) return;
    const rect=activeTrigger.getBoundingClientRect();
    const tooltipRect=tooltip.getBoundingClientRect();
    const gap=12;
    const margin=10;
    let top=rect.bottom+gap;
    let left=rect.left+(rect.width/2)-(tooltipRect.width/2);
    let placement='bottom';

    if(top+tooltipRect.height>window.innerHeight-margin&&rect.top-tooltipRect.height-gap>margin){
      top=rect.top-tooltipRect.height-gap;
      placement='top';
    }

    left=Math.max(margin,Math.min(left,window.innerWidth-tooltipRect.width-margin));
    tooltip.style.left=left+'px';
    tooltip.style.top=top+'px';
    tooltip.style.position='fixed';
    tooltip.style.zIndex='1200';
    tooltip.style.setProperty('--tooltip-arrow-left',(rect.left+(rect.width/2)-left)+'px');
    tooltip.dataset.placement=placement;
  }

  function open(trigger, pin){
    const key=trigger.dataset.packageDetail;
    const detail=details[key];
    if(!detail) return;
    window.clearTimeout(closeTimer);
    if(activeTrigger&&activeTrigger!==trigger){
      activeTrigger.setAttribute('aria-expanded','false');
      activeTrigger.removeAttribute('aria-describedby');
    }
    activeTrigger=trigger;
    pinned=Boolean(pin);
    tooltip.innerHTML=detail.html;
    tooltip.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    trigger.setAttribute('aria-describedby',tooltip.id);
    if(typeof trackSiteLinkClick==='function') trackSiteLinkClick('pricing_detail_'+key);
    placeTooltip();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', placeTooltip);
    window.addEventListener('scroll', placeTooltip, true);
  }

  function close(immediate){
    window.clearTimeout(closeTimer);
    const finish=function(){
      tooltip.hidden=true;
      tooltip.innerHTML='';
      if(activeTrigger){
        activeTrigger.setAttribute('aria-expanded','false');
        activeTrigger.removeAttribute('aria-describedby');
      }
      activeTrigger=null;
      pinned=false;
    };
    if(immediate) finish();
    else closeTimer=window.setTimeout(finish,180);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('resize', placeTooltip);
    window.removeEventListener('scroll', placeTooltip, true);
  }

  function onPointerDown(e){
    if(e.target.closest('.compare-info-btn[data-package-detail]')||tooltip.contains(e.target)) return;
    close(true);
  }

  function onKeyDown(e){
    if(e.key==='Escape'){ e.preventDefault(); close(true); }
  }

  triggers.forEach(trigger=>{
    trigger.setAttribute('aria-expanded','false');
    trigger.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if(activeTrigger===trigger&&!tooltip.hidden&&pinned) close(true);
      else open(trigger, true);
    });
    trigger.addEventListener('mouseenter', function(){ open(trigger, false); });
    trigger.addEventListener('mouseleave', function(){ if(!pinned) close(false); });
    trigger.addEventListener('focus', function(){ open(trigger, false); });
    trigger.addEventListener('blur', function(){ if(!pinned) close(false); });
  });

  tooltip.addEventListener('mouseenter', function(){ window.clearTimeout(closeTimer); });
  tooltip.addEventListener('mouseleave', function(){
    if(!pinned&&activeTrigger!==document.activeElement) close(false);
  });
  tooltip.addEventListener('load', function(e){
    if(e.target&&e.target.tagName==='IMG') placeTooltip();
  }, true);
  tooltip.addEventListener('click', function(e){
    const img=e.target.closest('.package-detail-image');
    if(img&&typeof window.openCardZoom==='function'){
      window.openCardZoom(img.currentSrc||img.src,img.alt);
    }
  });
})();

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

runAfterFirstPaint(() => {
  try {
    initializeCarousel();
    initComponentShowcase();
    updateCarousel();
    startAutoScroll();
    initializeImageQuality();
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
}

function trackBottomEmailClick() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'bottom_email_cta_clicked', {
      event_category: 'conversion',
      event_label: 'bottom_of_page',
      value: 1
    });
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
