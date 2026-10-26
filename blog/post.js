/* What a 15,000-pixel article needs that a short page does not.

   Three things, all built from what the page already contains:

     1. the contents list, lifted out of the flow and pinned beside the text
        on a wide screen, with the section you are reading marked. Inline it
        is only useful before you start reading; pinned it is useful for the
        other twenty minutes. The inline copy stays for narrow screens.
     2. a link on every heading, so a section can be sent to someone.
     3. where to go next, from the post list below.

   Nothing here is required for the article to read correctly. */
(function () {
  var body = document.querySelector('.post-body');
  if (!body) return;

  var heads = Array.prototype.slice.call(body.querySelectorAll('h2[id]'));

  /* ---------- 1. the pinned contents ---------- */
  (function pinned() {
    var inline = document.querySelector('.toc');
    if (!inline || heads.length < 3) return;

    var rail = document.createElement('nav');
    rail.className = 'toc-rail';
    rail.setAttribute('aria-label', 'Sections of this article');

    var head = document.createElement('p');
    head.className = 'tr-head';
    head.textContent = 'Contents';
    rail.appendChild(head);

    var links = heads.map(function (h, i) {
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.innerHTML = '<b>' + String(i + 1).padStart(2, '0') + '</b>'
        + '<span></span>';
      a.querySelector('span').textContent = h.textContent.trim();
      rail.appendChild(a);
      return a;
    });

    document.body.appendChild(rail);

    if (!('IntersectionObserver' in window)) return;

    // The heading nearest the top of the viewport wins, so the marker
    // follows what is being read rather than whatever crossed a line last.
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });

      var current = null;
      heads.forEach(function (h) {
        if (!current && seen[h.id]) current = h.id;
      });
      // past the last heading nothing intersects; keep the last one lit
      if (!current) {
        for (var i = heads.length - 1; i >= 0; i--) {
          if (heads[i].getBoundingClientRect().top < 160) { current = heads[i].id; break; }
        }
      }

      links.forEach(function (a) {
        a.classList.toggle('on', a.getAttribute('href') === '#' + current);
      });
    }, { rootMargin: '-80px 0px -70% 0px' });

    heads.forEach(function (h) { io.observe(h); });
  })();

  /* ---------- 2. a link per heading ---------- */
  heads.forEach(function (h) {
    var a = document.createElement('a');
    a.className = 'h-anchor';
    a.href = '#' + h.id;
    a.setAttribute('aria-label', 'Link to this section');
    a.textContent = '#';
    a.addEventListener('click', function (e) {
      // copying is the point; the jump still happens either way
      var url = location.origin + location.pathname + '#' + h.id;
      if (navigator.clipboard && window.isSecureContext) {
        e.preventDefault();
        navigator.clipboard.writeText(url).then(function () {
          location.hash = h.id;
          a.classList.add('copied');
          setTimeout(function () { a.classList.remove('copied'); }, 1200);
        }, function () { location.hash = h.id; });
      }
    });
    h.appendChild(a);
  });

  /* ---------- 3. what to read next ---------- */
  (function next() {
    var POSTS = [
      ['ai-token-budget.html', 'Spending less on AI tokens without getting worse answers', 'AI'],
      ['auth-sessions.html', 'Sessions done properly', 'Security'],
      ['ef-core-sql-server.html', 'EF Core and SQL Server: the queries that kill you in production', 'Data'],
      ['distributed-systems.html', 'Distributed systems: the parts that bite after the diagram', 'Backend'],
      ['microservices.html', "Microservices that don't fall over", 'Backend'],
      ['agentic-ai-development.html', 'Agentic AI for development, from someone who built one', 'AI'],
      ['observability-reliability.html', 'Knowing before your users do', 'Reliability'],
      ['cloud-azure-kubernetes-docker.html', 'Docker, Kubernetes and Azure without the cargo cult', 'Cloud'],
      ['csharp-design-patterns.html', 'C# design patterns that still earn their place', 'C#'],
      ['microfrontends.html', 'Microfrontends: when splitting the UI is worth it', 'Frontend']
    ];

    var here = location.pathname.split('/').pop();
    var i = POSTS.findIndex(function (p) { return p[0] === here; });
    if (i === -1) return;

    var prev = POSTS[(i - 1 + POSTS.length) % POSTS.length];
    var nxt = POSTS[(i + 1) % POSTS.length];

    var wrap = document.createElement('nav');
    wrap.className = 'post-next';
    wrap.setAttribute('aria-label', 'More posts');
    wrap.innerHTML =
      '<a class="pn-card" href="' + prev[0] + '"><span class="pn-k">← Previous</span>'
      + '<b></b><em></em></a>'
      + '<a class="pn-card pn-r" href="' + nxt[0] + '"><span class="pn-k">Next →</span>'
      + '<b></b><em></em></a>';

    var cards = wrap.querySelectorAll('.pn-card');
    cards[0].querySelector('b').textContent = prev[1];
    cards[0].querySelector('em').textContent = prev[2];
    cards[1].querySelector('b').textContent = nxt[1];
    cards[1].querySelector('em').textContent = nxt[2];

    var back = body.querySelector('.back-link');
    var anchor = back ? back.parentNode : body;
    anchor.parentNode.insertBefore(wrap, anchor);
  })();
})();
