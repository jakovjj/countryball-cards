(function () {
  const protectedSelector = '[data-protect-card-image], [data-protect-card-image] *';

  function isProtectedCardImage(target) {
    return target instanceof Element && Boolean(target.closest('[data-protect-card-image]'));
  }

  function blockProtectedEvent(event) {
    if (isProtectedCardImage(event.target)) {
      event.preventDefault();
    }
  }

  function protectImages(root) {
    root.querySelectorAll('[data-protect-card-image] img').forEach((image) => {
      image.setAttribute('draggable', 'false');
      image.setAttribute('oncontextmenu', 'return false');
    });
  }

  ['contextmenu', 'dragstart', 'selectstart', 'copy'].forEach((eventName) => {
    document.addEventListener(eventName, blockProtectedEvent, true);
  });

  document.addEventListener('pointerdown', (event) => {
    if (isProtectedCardImage(event.target) && event.button !== 0) {
      event.preventDefault();
    }
  }, true);

  document.addEventListener('DOMContentLoaded', () => protectImages(document));

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          protectImages(node);
          if (node.matches(protectedSelector)) {
            protectImages(node.ownerDocument);
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
