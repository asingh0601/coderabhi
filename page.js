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

  // --- copy button on every code block -------------------------------------
  // Injected rather than written into each page's markup, so the three library
  // pages can't drift apart.
  var CLIP = '<svg class="clip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<rect x="9" y="9" width="12" height="12" rx="2"/>'
    + '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var TICK = '<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  function copyText(text) {
    // The async API rejects outside a secure context and whenever the document
    // isn't focused, so a rejection means "try the old way", not "give up".
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy rejected'));
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.code-block'), function (block) {
    var bar = block.querySelector('.cb-bar');
    var pre = block.querySelector('pre');
    if (!bar || !pre || bar.querySelector('.copy-btn')) return;

    var label = (bar.textContent || 'code').trim();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy the ' + label + ' snippet to the clipboard');
    btn.innerHTML = CLIP + TICK + '<span>Copy</span>';

    var revert;
    btn.addEventListener('click', function () {
      copyText(pre.textContent.trim()).then(function () {
        btn.classList.remove('failed');
        btn.classList.add('ok');
        btn.querySelector('span').textContent = 'Copied';
      }, function () {
        // Both clipboard paths need the document focused. If they fail, select
        // the snippet so the offered Ctrl+C actually has something to copy.
        try {
          var range = document.createRange();
          range.selectNodeContents(pre);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) { /* selection is a nicety, not required */ }
        btn.classList.remove('ok');
        btn.classList.add('failed');
        btn.querySelector('span').textContent = 'Press Ctrl+C';
      });
      clearTimeout(revert);
      revert = setTimeout(function () {
        btn.classList.remove('ok', 'failed');
        btn.querySelector('span').textContent = 'Copy';
      }, 1800);
    });

    bar.appendChild(btn);
  });

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
