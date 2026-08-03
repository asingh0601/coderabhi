/* Shared behaviour for the sub-pages: footer year, mobile menu, scroll reveal.
   index.html keeps its own inline script because it also runs the typewriter
   and the scroll-spy, neither of which the sub-pages have. */
(function () {
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var header = document.getElementById('siteHeader');
  if (header) {
    addEventListener('scroll', function () {
      header.classList.toggle('stuck', scrollY > 8);
    }, { passive: true });
  }

  var menu = document.getElementById('menu');
  var toggle = document.getElementById('menuToggle');
  if (menu && toggle) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '✕' : '☰';
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      }
    });
  }

  // Reveal on scroll. Falls back to showing everything if the observer never
  // fires, so the page can never be stranded at opacity 0.
  var els = document.querySelectorAll('.reveal');
  var showAll = function () {
    Array.prototype.forEach.call(els, function (el) { el.classList.add('in'); });
  };

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px' });

    Array.prototype.forEach.call(els, function (el, i) {
      el.style.transitionDelay = Math.min(i % 5, 4) * 55 + 'ms';
      io.observe(el);
    });
    setTimeout(showAll, 3000);
  } else {
    showAll();
  }
})();
