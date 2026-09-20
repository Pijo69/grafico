/* Additive motion layer. Does not modify existing gallery/i18n logic —
   it only observes the DOM they already produce. Safe if disabled:
   the .js-anim guard class means nothing is ever hidden by CSS unless
   this script actually runs, and everything self-heals via a timeout. */

(function () {
  var SELECTOR =
    '.hero, .home-quote, .page-title-wrap, .gallery-item, .grabado-feature, ' +
    '.editorial-item, .contact-cta, .cv-intro, .cv-biography, .cv-list, ' +
    '.contact-info, .contact-form, .site-footer';

  var prefersReduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function revealAnimated(el) {
    el.classList.add('is-visible');
  }

  function revealInstant(el) {
    el.classList.add('no-anim', 'is-visible');
  }

  function revealAllInstant(nodes) {
    Array.prototype.forEach.call(nodes, revealInstant);
  }

  function setupObserver(nodes) {
    if (!('IntersectionObserver' in window)) {
      revealAllInstant(nodes);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            revealAnimated(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    Array.prototype.forEach.call(nodes, function (el) {
      observer.observe(el);
    });

    // Safety net: nothing should stay invisible forever.
    window.setTimeout(function () {
      Array.prototype.forEach.call(nodes, function (el) {
        if (!el.classList.contains('is-visible')) revealAnimated(el);
      });
    }, 2500);
  }

  function init() {
    var nodes = document.querySelectorAll(SELECTOR);
    if (!nodes.length) return;

    if (prefersReduced) {
      revealAllInstant(nodes);
      return;
    }

    setupObserver(nodes);
  }

  function watchDynamicGalleries() {
    if (!('MutationObserver' in window)) return;
    var containers = document.querySelectorAll('[data-gallery]');
    Array.prototype.forEach.call(containers, function (container) {
      var mo = new MutationObserver(function () {
        revealAllInstant(container.querySelectorAll('.gallery-item'));
      });
      mo.observe(container, { childList: true });
    });
  }

  function start() {
    init();
    watchDynamicGalleries();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
