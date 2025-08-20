// ===== KICKSTARTER COUNTDOWN =====
function initCountdown() {
  // Kickstarter launch date: October 1st, 2025 at 12:00 PM EST
  const launchDate = new Date('2025-10-01T16:00:00.000Z'); // 12 PM EST = 4 PM UTC
  
  function updateCountdown() {
    const now = new Date().getTime();
    const timeLeft = launchDate.getTime() - now;
    
    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      const daysEl = document.getElementById('days');
      const hoursEl = document.getElementById('hours');
      const minutesEl = document.getElementById('minutes');
      const secondsEl = document.getElementById('seconds');
      
      // Helper function to update with animation
      function updateWithAnimation(element, newValue) {
        if (!element) return;
        const currentValue = element.textContent;
        const formattedValue = newValue.toString().padStart(2, '0');
        
        if (currentValue !== formattedValue && currentValue !== '--') {
          // Add glow animation only (no scaling)
          element.style.animation = 'countdown-glow 0.6s ease-in-out';
          
          // Remove animation after it completes
          setTimeout(() => {
            element.style.animation = '';
          }, 600);
        }
        
        element.textContent = formattedValue;
      }
      
      updateWithAnimation(daysEl, days);
      updateWithAnimation(hoursEl, hours);
      updateWithAnimation(minutesEl, minutes);
      updateWithAnimation(secondsEl, seconds);
    } else {
      // Launch day reached
      const countdownBanner = document.querySelector('.countdown-banner');
      if (countdownBanner) {
        countdownBanner.innerHTML = `
          <div class="countdown-content">
            <span class="countdown-label">🎉 Kickstarter is LIVE! 🎉</span>
            <a href="#" class="btn" style="background: var(--bg); color: var(--gold); margin-top: 8px; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700;">
              Back on Kickstarter Now!
            </a>
          </div>
        `;
      }
    }
  }
  
  // Update immediately and then every second
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ===== COUNTRY DETECTION & BACKGROUND =====
const countryBackgrounds = {
  'US': 'us-bg.png',
  'DE': 'germany-bg.png',
  'CA': 'canada-bg.png',
  'NL': 'netherlands-bg.png',
  'SE': 'sweden-bg.png',
  'FR': 'france-bg.png',
  'GB': 'uk-bg.png',
  'CH': 'switzerland-bg.png',
  'PL': 'poland-bg.png',
  'NO': 'norway-bg.png',
  'RU': 'russia-bg.png',
  'RO': 'romania-bg.png',
  'MX': 'mexico-bg.png',
  'IT': 'italy-bg.png',
  'AU': 'australia-bg.png',
  'CA': 'canada-bg.png',
  'UA': 'ukraine-bg.png',
  'TR': 'turkey-bg.png',
  'CN': 'china-bg.png',
  'JP': 'japan-bg.png'
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
  { src: 'us.png', webp: 'us.webp', alt: 'United States card' },
  { src: 'canada.png', webp: 'canada.webp', alt: 'Canada card' },
  { src: 'netherlands.png', webp: 'netherlands.webp', alt: 'Netherlands card' },
  { src: 'germany.png', webp: 'germany.webp', alt: 'Germany card' },
  { src: 'sweden.png', webp: 'sweden.webp', alt: 'Sweden card' },
  { src: 'uk.png', webp: 'uk.webp', alt: 'United Kingdom card' },
  { src: 'switzerland.png', webp: 'switzerland.webp', alt: 'Switzerland card' },
  { src: 'poland.png', webp: 'poland.webp', alt: 'Poland card' },
  { type: 'email-cta', alt: 'Email signup card' }
];

// ===== CAROUSEL =====
const track = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('carouselDots');

let currentSlide = 0;
const totalSlides = cardData.length;

function initializeCarousel(){
  track.innerHTML = '';
  dotsContainer.innerHTML = '';
  cardData.forEach((card, index) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    
    if (card.type === 'email-cta') {
      // Create email signup CTA card
      slide.innerHTML = `
        <div class="card email-cta-card">
          <div class="email-cta-content">
            <p class="email-cta-more-text">...and many more!</p>
            <div class="email-cta-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <h3 class="email-cta-title">Stay Updated!</h3>
            <p class="email-cta-description">Get notified when we launch on Kickstarter</p>
            <button class="email-cta-button" onclick="showEmailModal(); trackCarouselEmailCTA();">
              Sign Up for Updates
            </button>
          </div>
        </div>
      `;
    } else {
      // Create regular card
      const imgPerf = index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low" decoding="async"';
      slide.innerHTML = `
        <div class="card">
          <picture>
            <source srcset="${card.webp}" type="image/webp">
            <img ${imgPerf} alt="${card.alt}" src="${card.src}">
          </picture>
        </div>
      `;
    }
    
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
  trackCarouselInteraction('next_slide', cardData[currentSlide].alt);
}
function prevSlide(){ 
  currentSlide=(currentSlide-1+totalSlides)%totalSlides; 
  updateCarousel(); 
  trackCarouselInteraction('prev_slide', cardData[currentSlide].alt);
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
    // Skip 3D effects for the email CTA card
    if (card.classList.contains('email-cta-card')) {
      return;
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

  function setText(el, text){ 
    if(el){ 
      el.textContent = text; 
      if(text && el.parentElement && el.classList.contains('btn-count')){ 
        el.style.display='block'; 
        el.parentElement.classList.add('has-count'); 
      } 
    } 
  }
  
  function formatCount(n){
    if(n==null || isNaN(n)) return '---';
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
      if(cached.discord!=null) setText(discordCountEl, formatCount(cached.discord));
      if(cached.reddit!=null) setText(redditCountEl, formatCount(cached.reddit));
    }
    const [d, r] = await Promise.all([fetchDiscord(), fetchReddit()]);
    const result = { discord: d ?? (cached && cached.discord) ?? null, reddit: r ?? (cached && cached.reddit) ?? null };
    writeCache(result);
    if(result.discord!=null) setText(discordCountEl, formatCount(result.discord));
    if(result.reddit!=null) setText(redditCountEl, formatCount(result.reddit));
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

// Auto-scroll carousel with pause on user interaction
let autoScrollInterval;
let lastUserInteraction = 0;

function startAutoScroll() {
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

function handleUserInteraction() {
  lastUserInteraction = Date.now();
  // Don't need to clear interval, just update timestamp
}

// Start auto-scroll when page loads
if (carousel && cardData.length > 1) {
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  function showMessage(message, type) {
    formMessage.className = `form-message ${type}`;
    formMessage.textContent = message;
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
      showMessage('Please enter your email address.', 'error');
      emailInput.focus();
      return;
    }
    
    if (!validateEmail(email)) {
      showMessage('Please enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    showMessage('', '');
    
    try {
      // Check for duplicate emails locally first
      const emails = JSON.parse(localStorage.getItem('countryball_emails') || '[]');
      
      if (emails.includes(email)) {
        showMessage('You\'re already subscribed! 🎉', 'success');
      } else {
        // Send email via PHP backend (reliable fallback)
        console.log('Sending email via backend...');
        
        const response = await fetch('https://mineward.us.to/countryball_cards/backend/subscribe.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            source: 'homepage_modal'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Backend response:', result);

        if (result.success) {
          // Store email locally to prevent duplicates
          emails.push(email);
          localStorage.setItem('countryball_emails', JSON.stringify(emails));
          
          showMessage('Success! You\'ll be notified when we launch! 🚀', 'success');
          console.log('Email sent successfully via backend');
          
          // Track successful signup
          try {
            if (window.rdt) rdt('track', 'SignUp', {
              event_name: 'EmailSignup',
              content_name: 'Newsletter',
              content_category: 'Email Marketing',
              content_ids: ['email_signup'],
              content_type: 'signup'
            });
          } catch (_) {}
          
          try {
            if (window.rdt) rdt('track', 'Custom', {
              customEventName: 'EmailSignup',
              content_name: 'Newsletter'
            });
          } catch (_) {}
        } else {
          throw new Error(result.message || 'Email submission failed');
        }
      }
      
      // Show success state
      submitBtn.classList.remove('loading');
      submitBtn.classList.add('success');
      submitBtn.querySelector('.submit-text').textContent = 'Subscribed!';
      
      // Hide bottom popup since user signed up
      dismissBottomPopup();
      
      // Update main button state
      setTimeout(() => {
        const mainEmailBtn = document.getElementById('emailBtn');
        if (mainEmailBtn) {
          const originalContent = mainEmailBtn.innerHTML;
          mainEmailBtn.innerHTML = `
            <span class="btn-row">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span class="btn-label">✅ You're In!</span>
            </span>
          `;
          mainEmailBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          
          // Reset after 3 seconds
          setTimeout(() => {
            mainEmailBtn.innerHTML = originalContent;
            mainEmailBtn.style.background = '';
          }, 3000);
        }
        
        // Close modal after showing success
        setTimeout(close, 2000);
      }, 1000);
      
    } catch (error) {
      console.error('Email submission error:', error);
      
      // More specific error messages
      if (error.message && error.message.includes('Failed to fetch')) {
        showMessage('Connection error. Please check your internet connection and try again.', 'error');
      } else if (error.message && error.message.includes('HTTP error')) {
        showMessage('Server error. Please try again in a moment.', 'error');
      } else {
        showMessage('Unable to submit email. Please try again or contact support.', 'error');
      }
      
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  }
  
  // Event listeners
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (emailForm) emailForm.addEventListener('submit', handleSubmit);
  
  // Open the modal
  open();
}

// Boot
initCountdown();
initializeCarousel();
updateCarousel();
detectCountryAndSetBackground();
startAutoScroll();
// Enable 3D tilt only on devices with a precise pointer and hover (i.e., desktops)
const supports3DTilt = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (supports3DTilt) {
  setTimeout(()=>{ init3DCardEffects(); initializeImageQuality(); },100);
} else {
  setTimeout(()=>{ initializeImageQuality(); },100);
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
setInterval(trackTimeOnPage, 1000);

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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  function showInlineMessage(message, type) {
    inlineFormMessage.className = `inline-form-message ${type}`;
    inlineFormMessage.textContent = message;
  }
  
  async function handleInlineSubmit(e) {
    e.preventDefault();
    
    const email = inlineEmailInput.value.trim();
    
    if (!email) {
      showInlineMessage('Please enter your email address.', 'error');
      inlineEmailInput.focus();
      return;
    }
    
    if (!validateEmail(email)) {
      showInlineMessage('Please enter a valid email address.', 'error');
      inlineEmailInput.focus();
      return;
    }
    
    // Show loading state
    inlineSubmitBtn.disabled = true;
    inlineSubmitBtn.classList.add('loading');
    showInlineMessage('', '');
    
    try {
      // Check for duplicate emails locally first
      const emails = JSON.parse(localStorage.getItem('countryball_emails') || '[]');
      
      if (emails.includes(email)) {
        showInlineMessage('You\'re already subscribed! 🎉', 'success');
      } else {
        // Send email via PHP backend (reliable fallback)
        console.log('Sending email via backend...');
        
        const response = await fetch('https://mineward.us.to/countryball_cards/backend/subscribe.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            source: 'homepage_inline'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Backend response (inline form):', result);

        if (result.success) {
          // Store email locally to prevent duplicates
          emails.push(email);
          localStorage.setItem('countryball_emails', JSON.stringify(emails));
          
          showInlineMessage('Success! You\'ll be notified when we launch! 🚀', 'success');
          console.log('Email sent successfully via backend (inline form)');
          
          // Track successful signup
          try {
            if (window.rdt) rdt('track', 'SignUp', {
              event_name: 'EmailSignup',
              content_name: 'Newsletter',
              content_category: 'Email Marketing',
              content_ids: ['inline_email_signup'],
              content_type: 'signup'
            });
          } catch (_) {}
          
          try {
            if (window.gtag) {
              gtag('event', 'email_signup', {
                event_category: 'conversion',
                event_label: 'inline_form',
                value: 1
              });
            }
          } catch (_) {}
          
          // Clear the form
          inlineEmailInput.value = '';
          
        } else {
          throw new Error(result.message || 'Email submission failed');
        }
      }
    } catch (error) {
      console.error('Inline email signup error:', error);
      
      if (error.message && error.message.includes('Failed to fetch')) {
        showInlineMessage('Connection error. Please try again.', 'error');
      } else {
        showInlineMessage('Something went wrong. Please try again later.', 'error');
      }
    } finally {
      // Reset button state
      inlineSubmitBtn.disabled = false;
      inlineSubmitBtn.classList.remove('loading');
    }
  }
  
  inlineEmailForm.addEventListener('submit', handleInlineSubmit);
  
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
    console.log('Floating arrow element not found');
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
      console.log('Showing floating arrow');
      floatingArrow.style.display = 'flex';
      setTimeout(() => {
        floatingArrow.style.opacity = '1';
      }, 100);
      isVisible = true;
    } else if (!shouldShow && isVisible) {
      console.log('Hiding floating arrow');
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
