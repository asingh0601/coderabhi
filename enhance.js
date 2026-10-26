/* Progressive extras: scroll progress, cursor spotlight, a timeline that
   fills as you scroll, and a Cmd/Ctrl-K command palette.

   Everything here is additive. Each block checks for what it needs and
   returns quietly if the page does not have it, so one missing element never
   stops the rest, and a page without this script is exactly what it was. */
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress ---------- */
  (function scrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      bar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  })();

  /* ---------- cursor spotlight on cards ---------- */
  (function spotlight() {
    var cards = document.querySelectorAll('.card, .panel, .sk, .feature');
    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  })();

  /* ---------- the timeline fills as you scroll past it ---------- */
  (function timelineFill() {
    var timeline = document.querySelector('.timeline');
    if (!timeline || reduced) return;

    var update = function () {
      var r = timeline.getBoundingClientRect();
      var travelled = (window.innerHeight * 0.55) - r.top;
      var pct = Math.max(0, Math.min(1, travelled / r.height));
      timeline.style.setProperty('--fill', (pct * (r.height - 20)) + 'px');
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  })();

  /* ---------- section rail ----------
     A dot per section down the right edge. Built from the sections that are
     actually on the page, and only where the page numbers them, so the
     library pages are untouched. */
  (function rail() {
    var main = document.querySelector('main.numbered');
    if (!main) return;

    var sections = main.querySelectorAll(':scope > section[id]');
    if (sections.length < 3) return;

    var nav = document.createElement('nav');
    nav.className = 'rail';
    nav.setAttribute('aria-label', 'Sections');

    var links = {};
    Array.prototype.forEach.call(sections, function (sec) {
      var head = sec.querySelector('.kicker');
      var a = document.createElement('a');
      a.href = '#' + sec.id;
      // the kicker is the section's own label; contact has none, and its
      // heading is a sentence, so the id reads better there
      a.textContent = head
        ? head.textContent.trim()
        : sec.id.charAt(0).toUpperCase() + sec.id.slice(1);
      a.setAttribute('title', a.textContent);
      nav.appendChild(a);
      links[sec.id] = a;
    });

    document.body.appendChild(nav);

    if (!('IntersectionObserver' in window)) return;

    // The topmost section still on screen wins, so the dot matches what you
    // are reading rather than whatever crossed the line last.
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        visible[en.target.id] = en.isIntersecting;
      });
      var current = null;
      Array.prototype.forEach.call(sections, function (sec) {
        if (!current && visible[sec.id]) current = sec.id;
      });
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle('on', id === current);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });

    Array.prototype.forEach.call(sections, function (sec) { io.observe(sec); });
  })();

  /* ---------- command palette ---------- */
  (function palette() {
    // Section links are read from the page itself, so every page offers its
    // own correct hrefs instead of a list that has to be kept in step.
    var items = [];
    var menu = document.getElementById('menu');
    if (menu) {
      Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
        items.push({ label: a.textContent.trim(), href: a.getAttribute('href'), kind: 'Go to' });
      });
    }

    var here = location.pathname.split('/').pop() || 'index.html';
    [
      { label: 'Home', href: 'index.html', kind: 'Page' },
      { label: 'Blog', href: 'blog/index.html', kind: 'Page' },
      { label: 'Microservices that dont fall over', href: 'blog/microservices.html', kind: 'Post' },
      { label: 'C# design patterns that still earn their place', href: 'blog/csharp-design-patterns.html', kind: 'Post' },
      { label: 'Agentic AI for development, from someone who built one', href: 'blog/agentic-ai-development.html', kind: 'Post' },
      { label: 'Microfrontends: when splitting the UI is worth it', href: 'blog/microfrontends.html', kind: 'Post' },
      { label: 'Docker, Kubernetes and Azure without the cargo cult', href: 'blog/cloud-azure-kubernetes-docker.html', kind: 'Post' },
      { label: 'Observability and reliability: knowing before your users do', href: 'blog/observability-reliability.html', kind: 'Post' },
      { label: 'Forge Pilot', href: 'forge-pilot.html', kind: 'Page' },
      { label: 'ng-typed-routes', href: 'ng-typed-routes.html', kind: 'Page' },
      { label: 'ngx-circle-chart', href: 'ngx-circle-chart.html', kind: 'Page' },
      { label: 'ngx-modern-calendar', href: 'ngx-modern-calendar.html', kind: 'Page' },
      { label: 'ngx-easy-captcha', href: 'ngx-easy-captcha.html', kind: 'Page' }
    ].forEach(function (p) {
      if (p.href !== here) items.push(p);
    });

    [
      { label: 'GitHub', href: 'https://github.com/asingh0601' },
      { label: 'npm packages', href: 'https://www.npmjs.com/~onlyabhishek' },
      { label: 'VS Code Marketplace', href: 'https://marketplace.visualstudio.com/publishers/er-abhishek' },
      { label: 'AITranslate', href: 'https://aitranslate.in' },
      { label: 'Buy me a coffee', href: 'https://buymeacoffee.com/er.abhishek' }
    ].forEach(function (l) {
      items.push({ label: l.label, href: l.href, kind: 'Open', external: true });
    });

    if (!items.length) return;

    var overlay = document.createElement('div');
    overlay.className = 'cmdk-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Quick navigation">' +
      '<input class="cmdk-input" type="text" autocomplete="off" spellcheck="false"' +
      ' placeholder="Jump to a section, page or link" aria-label="Search">' +
      '<ul class="cmdk-list" role="listbox"></ul>' +
      '<div class="cmdk-foot"><span>Enter to open</span><span>Esc to close</span></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = overlay.querySelector('.cmdk-input');
    var list = overlay.querySelector('.cmdk-list');
    var shown = [];
    var active = 0;
    var lastFocus = null;

    function render(query) {
      var q = query.trim().toLowerCase();
      shown = q
        ? items.filter(function (i) {
          return (i.label + ' ' + i.kind).toLowerCase().indexOf(q) !== -1;
        })
        : items.slice();
      active = 0;
      list.innerHTML = '';

      if (!shown.length) {
        var empty = document.createElement('li');
        empty.className = 'cmdk-empty';
        empty.textContent = 'Nothing matches that.';
        list.appendChild(empty);
        return;
      }

      shown.forEach(function (item, i) {
        var li = document.createElement('li');
        li.className = 'cmdk-item';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === 0));

        var label = document.createElement('span');
        label.textContent = item.label;
        var kind = document.createElement('span');
        kind.className = 'cmdk-kind';
        kind.textContent = item.kind;

        li.appendChild(label);
        li.appendChild(kind);
        li.addEventListener('click', function () { go(item); });
        li.addEventListener('pointermove', function () { select(i); });
        list.appendChild(li);
      });
    }

    function select(i) {
      var nodes = list.querySelectorAll('.cmdk-item');
      if (!nodes.length) return;
      active = (i + nodes.length) % nodes.length;
      Array.prototype.forEach.call(nodes, function (n, idx) {
        n.setAttribute('aria-selected', String(idx === active));
      });
      nodes[active].scrollIntoView({ block: 'nearest' });
    }

    function go(item) {
      close();
      if (item.external) window.open(item.href, '_blank', 'noopener');
      else location.href = item.href;
    }

    function open() {
      lastFocus = document.activeElement;
      overlay.hidden = false;
      input.value = '';
      render('');
      input.focus();
    }

    function close() {
      overlay.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault();
        if (overlay.hidden) open(); else close();
        return;
      }
      if (overlay.hidden) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); select(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); select(active - 1); }
      else if (e.key === 'Enter' && shown[active]) { e.preventDefault(); go(shown[active]); }
    });

    input.addEventListener('input', function () { render(input.value); });
    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay) close();
    });

    // A shortcut nobody is told about is a shortcut nobody uses.
    var right = document.querySelector('.head-right');
    if (right) {
      var hint = document.createElement('button');
      hint.type = 'button';
      hint.className = 'kbd-hint';
      hint.setAttribute('aria-label', 'Open quick navigation');
      hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘ K' : 'Ctrl K';
      hint.addEventListener('click', open);
      right.insertBefore(hint, right.firstChild);
    }
  })();

  /* ---------- a note for whoever opens the console ---------- */
  try {
    console.log('%cHello there.',
      'font:600 16px/1.4 ui-sans-serif,system-ui;color:#6c9bff');
    console.log('%cYou opened the console, so you are my kind of visitor.\n'
      + 'Press Ctrl+K (or Cmd+K) for the quick nav.\n'
      + 'Source: https://github.com/asingh0601/coderabhi',
      'color:#97a1bb;font:13px/1.6 ui-monospace,monospace');
  } catch (e) { /* a console note is never worth an exception */ }
})();
