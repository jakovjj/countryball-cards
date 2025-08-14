// ===== COUNTRY DETECTION & BACKGROUND =====
const countryBackgrounds = {
  'US': 'us-bg.png',
  'DE': 'germany-bg.png',
  'CA': 'canada-bg.png',
  'NL': 'netherlands-bg.png',
  'SE': 'sweden-bg.png',
  'FR': 'france-bg.png',
  'GB': 'britain-bg.png',
  'CH': 'switzerland-bg.png',
  'PL': 'poland-bg.png'
};

async function detectCountryAndSetBackground(){
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code;
    
    // Track country detection
    trackCountryDetection(countryCode);
    
    let backgroundImage = countryBackgrounds[countryCode] || countryBackgrounds['PL'];
    const img = new Image();
    img.onload = () => {
      document.body.style.backgroundImage = `url('${backgroundImage}')`;
      document.body.style.backgroundSize = 'auto 70vh';
      document.body.style.backgroundPosition = 'top 10px right -200px';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(to right, rgba(21,21,21,.95), rgba(21,21,21,.8), rgba(21,21,21,.4));z-index:-1;pointer-events:none;`;
      document.body.appendChild(overlay);
    };
    img.src = backgroundImage;
  } catch (e) {
    const backgroundImage = countryBackgrounds['PL'];
    const img = new Image();
    img.onload = () => {
      document.body.style.backgroundImage = `url('${backgroundImage}')`;
      document.body.style.backgroundSize = 'auto 70vh';
      document.body.style.backgroundPosition = 'top 10px right -200px';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(to right, rgba(21,21,21,.95), rgba(21,21,21,.8), rgba(21,21,21,.4));z-index:-1;pointer-events:none;`;
      document.body.appendChild(overlay);
    };
    img.src = backgroundImage;
  }
}

// ===== CARD CONFIGURATION =====
const cardData = [
  { src: 'us.png', alt: 'United States card' },
  { src: 'canada.png', alt: 'Canada card' },
  { src: 'netherlands.png', alt: 'Netherlands card' },
  { src: 'germany.png', alt: 'Germany card' },
  { src: 'sweden.png', alt: 'Sweden card' },
  { src: 'france.png', alt: 'France card' },
  { src: 'uk.png', alt: 'United Kingdom card' },
  { src: 'switzerland.png', alt: 'Switzerland card' },
  { src: 'japan.png', alt: 'Japan card' },
  { src: 'poland.png', alt: 'Poland card' }
];

// ===== CAROUSEL =====
const track = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('carouselDots');

let currentSlide = 0;
const totalSlides = cardData.length;
let autoScrollInterval;
let userInteractionTimeout;

function initializeCarousel(){
  track.innerHTML = '';
  dotsContainer.innerHTML = '';
  cardData.forEach((card, index) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    const imgPerf = index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low" decoding="async"';
    slide.innerHTML = `<div class="card"><img ${imgPerf} alt="${card.alt}" src="${card.src}"></div>`;
    track.appendChild(slide);
    const dot = document.createElement('button');
    dot.className = `carousel-dot ${index===0?'active':''}`;
    dot.setAttribute('data-slide', index);
    dotsContainer.appendChild(dot);
  });
  setTimeout(initializeImageQuality,10);
}

function getSlideWidth(){
  const el=document.querySelector('.carousel');
  return el?el.clientWidth:window.innerWidth;
}

function updateCarousel(){
  const translateX = -currentSlide * getSlideWidth();
  track.style.transform = `translateX(${translateX}px)`;
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot,i)=>dot.classList.toggle('active', i===currentSlide));
  setTimeout(init3DCardEffects,50);
}

function nextSlide(){ 
  currentSlide=(currentSlide+1)%totalSlides; 
  updateCarousel(); 
  trackCarouselInteraction('next_slide', countryBalls[currentSlide].name);
}
function prevSlide(){ 
  currentSlide=(currentSlide-1+totalSlides)%totalSlides; 
  updateCarousel(); 
  trackCarouselInteraction('prev_slide', countryBalls[currentSlide].name);
}

function handleUserInteraction(){
  if(userInteractionTimeout) clearTimeout(userInteractionTimeout);
  if(autoScrollInterval) clearInterval(autoScrollInterval);
  userInteractionTimeout=setTimeout(startAutoScroll,10000);
}
function startAutoScroll(){ autoScrollInterval=setInterval(nextSlide,4000); }

// 3D hover effects
function init3DCardEffects(){
  const cards = document.querySelectorAll('.carousel-slide .card');
  cards.forEach(card=>{
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
  document.querySelectorAll('.carousel-slide .card img').forEach(img=>{
    img.style.imageRendering='auto';
    img.style.filter='none';
    img.style.transform='translateZ(1px)';
    img.style.backfaceVisibility='hidden';
    img.style.webkitBackfaceVisibility='hidden';
  });
}

// ===== COMMUNITY COUNTS =====
(function(){
  const discordCountEl = document.getElementById('discordCount');
  const redditCountEl = document.getElementById('redditCount');

  const cacheKey = 'cbc_counts_v1';
  const cacheTtlMs = 5*60*1000; // 5 minutes

  function setText(el, text){ if(el){ el.textContent = text; if(text && el.parentElement && el.classList.contains('btn-count')){ el.style.display='block'; el.parentElement.classList.add('has-count'); } } }
  function formatCount(n){
    if(n==null || isNaN(n)) return '';
    if(n < 1000) return n.toString();
    if(n < 10000) return (n/1000).toFixed(1).replace(/\.0$/,'') + 'k';
    if(n < 1000000) return Math.round(n/1000) + 'k';
    return (n/1000000).toFixed(1).replace(/\.0$/,'') + 'M';
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
      const res = await fetch('https://www.reddit.com/r/countryball_cards/about.json');
      if(!res.ok) throw new Error('reddit status '+res.status);
      const json = await res.json();
      const n = json?.data?.subscribers ?? null;
      return n;
    }catch(_){ return null; }
  }

  async function loadCounts(){
    const cached = readCache();
    if(cached){
      if(cached.discord!=null) setText(discordCountEl, `${formatCount(cached.discord)} members`);
      if(cached.reddit!=null) setText(redditCountEl, `${formatCount(cached.reddit)} subscribers`);
    }
    const [d, r] = await Promise.all([fetchDiscord(), fetchReddit()]);
    const result = { discord: d ?? (cached && cached.discord) ?? null, reddit: r ?? (cached && cached.reddit) ?? null };
    writeCache(result);
    if(result.discord!=null) setText(discordCountEl, `${formatCount(result.discord)} members`);
    if(result.reddit!=null) setText(redditCountEl, `${formatCount(result.reddit)} subscribers`);
  }

  // kick off when DOM is ready (defer ensures this runs after parse)
  loadCounts();
})();

// Events
nextBtn.addEventListener('click', ()=>{ nextSlide(); handleUserInteraction(); });
prevBtn.addEventListener('click', ()=>{ prevSlide(); handleUserInteraction(); });

dotsContainer.addEventListener('click', (e)=>{
  if(e.target.classList.contains('carousel-dot')){
    currentSlide=parseInt(e.target.getAttribute('data-slide'));
    updateCarousel();
    handleUserInteraction();
  }
});

// Resize alignment
let resizeRaf;
window.addEventListener('resize', ()=>{
  if(resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf=requestAnimationFrame(updateCarousel);
});

// Touch/swipe
let touchStartX=0, touchEndX=0, isSwiping=false;
const carousel=document.querySelector('.carousel');
if(carousel){
  carousel.addEventListener('touchstart', (e)=>{ touchStartX=e.changedTouches[0].screenX; isSwiping=true; }, {passive:true});
  carousel.addEventListener('touchend', (e)=>{ touchEndX=e.changedTouches[0].screenX; if(isSwiping){ handleSwipe(); isSwiping=false; } }, {passive:true});
}
function handleSwipe(){
  const t=50, d=touchEndX-touchStartX;
  if(Math.abs(d)>t){ if(d>0){ prevSlide(); } else { nextSlide(); } handleUserInteraction(); }
}

// CTA conversion hooks
const discordBtn=document.getElementById('discordBtn');
const redditBtn=document.getElementById('redditBtn');
const emailBtn=document.getElementById('emailBtn');
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
if(emailBtn){
  emailBtn.addEventListener('click', function(){
    try{ if(window.rdt) rdt('track','SignUp',{event_name:'EmailSignup',content_name:'Newsletter',content_category:'Email Marketing',content_ids:['email_signup'],content_type:'signup'}); }catch(_){ }
    try{ if(window.rdt) rdt('track','Custom',{customEventName:'EmailSignup',content_name:'Newsletter'}); }catch(_){ }
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

// Boot
initializeCarousel();
updateCarousel();
detectCountryAndSetBackground();
startAutoScroll();
setTimeout(()=>{ init3DCardEffects(); initializeImageQuality(); },100);

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

function trackCountryDetection(country) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'country_detected', {
      event_category: 'user_data',
      event_label: country,
      value: 1
    });
  }
}
