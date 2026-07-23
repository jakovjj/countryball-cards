(function(){
  var OPEN_DELAY_MS = 650;
  var CLICK_COOLDOWN_MS = 4000;
  var GLIMMER_DURATION_MS = 1200;
  var cardArt = document.querySelector('.card-detail-page .card-page-art');
  var lastClickGlimmer = 0;
  var glimmerTimer = 0;

  if (!cardArt || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  function runGlimmer(){
    window.clearTimeout(glimmerTimer);
    cardArt.classList.remove('card-glimmer-active');
    void cardArt.offsetWidth;
    cardArt.classList.add('card-glimmer-active');
    glimmerTimer = window.setTimeout(function(){
      cardArt.classList.remove('card-glimmer-active');
    }, GLIMMER_DURATION_MS);
  }

  window.setTimeout(runGlimmer, OPEN_DELAY_MS);

  cardArt.addEventListener('click', function(){
    var now = Date.now();
    if (now - lastClickGlimmer < CLICK_COOLDOWN_MS) {
      return;
    }

    lastClickGlimmer = now;
    runGlimmer();
  });
})();
