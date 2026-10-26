/* Skills, counted rather than claimed.

   A skills section is normally a wall of pills, and a pill is only an
   assertion. The timeline right below it already holds the evidence: each
   role carries its dates and the stack it was built on. So this script reads
   the timeline and uses it twice —

     1. a span chart: one row per skill, one cell per calendar year, filled
        where a role using that skill was running. Gaps are left visible,
        because a gap is information too.
     2. a duration on every chip, and the chips sorted longest-first, so the
        six group cards rank themselves.

   Clicking either a chip or a chart row highlights the roles behind it.

   Nothing is hardcoded: the numbers come from the dates on the page, so
   editing a role updates the chart. */
(function () {
  var chips = document.querySelectorAll('#skills .chip');
  var jobs = document.querySelectorAll('.timeline .job');
  var timeline = document.querySelector('.timeline');
  if (!chips.length || !jobs.length || !timeline) return;

  var MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  /* Genuine synonyms only — two names for one thing. Anything that would
     stretch a skill into a role that did not use it stays out. */
  var ALIASES = {
    'kubernetes': ['aks'],                    // AKS is Azure's Kubernetes service
    'system design': ['architecture'],
    'c#': ['.net', '.net core', 'asp.net core'],   // a .NET role is a C# role
    'typescript': ['angular']                 // and an Angular role is a TypeScript one
  };

  /* ---------- read the timeline ---------- */
  function point(text) {
    var s = String(text).trim().toLowerCase();
    if (!s || s === 'now' || s === 'present') return null;   // still running
    var m = s.match(/([a-z]{3})[a-z]*\s+(\d{4})/);
    if (m && m[1] in MONTHS) return { y: +m[2], m: MONTHS[m[1]] };
    var y = s.match(/(\d{4})/);
    return y ? { y: +y[1], m: 0 } : null;
  }

  var today = new Date();
  var nowPoint = { y: today.getFullYear(), m: today.getMonth() };

  var roles = [];
  Array.prototype.forEach.call(jobs, function (job) {
    var whenEl = job.querySelector('.when');
    var tags = Array.prototype.map.call(job.querySelectorAll('.j-tags li'), function (li) {
      return li.textContent.trim().toLowerCase();
    });
    if (!whenEl || !tags.length) return;

    var parts = whenEl.textContent.split(/[—–-]/);
    var from = point(parts[0]);
    var to = parts.length > 1 ? point(parts[1]) : null;
    if (!from) return;
    if (!to) to = nowPoint;

    // A role that started this month is one month of work, not zero.
    var months = Math.max(1, (to.y - from.y) * 12 + (to.m - from.m));

    roles.push({ el: job, tags: tags, from: from, to: to, months: months });
  });
  if (!roles.length) return;

  /* Loose on purpose: the chip says ".NET Core" where a role is tagged
     ".NET". Either containing the other counts, plus the alias table. */
  function matches(skill, tags) {
    var s = skill.toLowerCase();
    var extra = ALIASES[s] || [];
    return tags.some(function (t) {
      if (t === s || t.indexOf(s) !== -1 || s.indexOf(t) !== -1) return true;
      return extra.indexOf(t) !== -1;
    });
  }

  function duration(months) {
    if (months < 12) return months + 'mo';
    var years = months / 12;
    return (months < 24 ? years.toFixed(1).replace('.0', '') : Math.round(years)) + 'y';
  }

  /* ---------- what each skill adds up to ---------- */
  var first = roles.reduce(function (a, r) { return Math.min(a, r.from.y); }, 9999);
  var last = roles.reduce(function (a, r) { return Math.max(a, r.to.y); }, 0);
  var span = [];
  for (var y = first; y <= last; y++) span.push(y);

  function profile(skill) {
    var hits = roles.filter(function (r) { return matches(skill, r.tags); });
    var months = hits.reduce(function (a, r) { return a + r.months; }, 0);
    var years = {};
    hits.forEach(function (r) {
      for (var y = r.from.y; y <= r.to.y; y++) years[y] = true;
    });
    return { roles: hits, months: months, years: years };
  }

  /* ---------- filtering ---------- */
  var banner = document.createElement('div');
  banner.className = 'skill-filter';
  banner.hidden = true;
  timeline.parentNode.insertBefore(banner, timeline);

  var current = null;

  function clear() {
    current = null;
    banner.hidden = true;
    banner.textContent = '';
    Array.prototype.forEach.call(jobs, function (j) {
      j.classList.remove('dim', 'match');
    });
    document.querySelectorAll('#skills .chip.on, .span-row.on').forEach(function (n) {
      n.classList.remove('on');
      if (n.classList.contains('span-row')) n.setAttribute('aria-pressed', 'false');
    });
  }

  function apply(skill, trigger) {
    if (current === skill) { clear(); return; }
    clear();
    current = skill;

    document.querySelectorAll('[data-skill]').forEach(function (n) {
      if (n.getAttribute('data-skill') === skill) {
        n.classList.add('on');
        if (n.classList.contains('span-row')) n.setAttribute('aria-pressed', 'true');
      }
    });

    var p = profile(skill);
    roles.forEach(function (r) {
      if (p.roles.indexOf(r) !== -1) r.el.classList.add('match');
      else r.el.classList.add('dim');
    });

    banner.hidden = false;
    banner.innerHTML = '';
    var text = document.createElement('span');
    text.textContent = p.roles.length + (p.roles.length === 1 ? ' role used ' : ' roles used ')
      + skill + ' · ' + duration(p.months);
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'skill-filter-clear';
    clearBtn.textContent = 'clear';
    clearBtn.addEventListener('click', clear);
    banner.appendChild(text);
    banner.appendChild(clearBtn);

    var anchor = document.getElementById('experience');
    if (anchor && trigger !== 'row') anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- chips: duration, ranking, click ---------- */
  var tracked = [];

  Array.prototype.forEach.call(document.querySelectorAll('#skills .chips'), function (group) {
    var list = Array.prototype.slice.call(group.querySelectorAll('.chip'));

    list.forEach(function (chip) {
      var skill = chip.textContent.trim();
      var p = profile(skill);
      chip.dataset.months = p.months;

      if (!p.roles.length) return;   // no evidence, so no claim and no click

      chip.classList.add('linked');
      chip.dataset.skill = skill;
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('title', duration(p.months) + ' across '
        + p.roles.length + (p.roles.length === 1 ? ' role' : ' roles') + ' — click to see which');

      var badge = document.createElement('b');
      badge.className = 'chip-yrs';
      badge.textContent = duration(p.months);
      chip.appendChild(document.createTextNode(' '));
      chip.appendChild(badge);

      chip.addEventListener('click', function () { apply(skill, 'chip'); });
      chip.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(skill, 'chip'); }
      });

      if (!tracked.some(function (t) { return t.skill === skill; })) {
        tracked.push({ skill: skill, months: p.months, years: p.years, roles: p.roles.length });
      }
    });

    // Longest first, so each card ranks itself instead of listing in the
    // order I happened to type.
    list.sort(function (a, b) {
      return (+b.dataset.months || 0) - (+a.dataset.months || 0);
    }).forEach(function (chip) { group.appendChild(chip); });
  });

  /* ---------- the span chart ---------- */
  (function spanChart() {
    var fig = document.getElementById('skillSpans');
    var grid = document.getElementById('skillSpanGrid');
    if (!fig || !grid || !tracked.length) return;

    grid.style.setProperty('--years', span.length);

    var axis = document.createElement('div');
    axis.className = 'span-axis';
    axis.appendChild(cell('span-name', ''));
    span.forEach(function (y) {
      axis.appendChild(cell('span-yr', String(y).slice(2)));
    });
    axis.appendChild(cell('span-total', ''));
    grid.appendChild(axis);

    tracked.sort(function (a, b) { return b.months - a.months; }).forEach(function (t) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'span-row';
      row.dataset.skill = t.skill;
      row.setAttribute('aria-pressed', 'false');
      row.setAttribute('title', 'Show the ' + t.roles
        + (t.roles === 1 ? ' role' : ' roles') + ' that used ' + t.skill);

      row.appendChild(cell('span-name', t.skill));
      span.forEach(function (y) {
        var c = cell('span-cell' + (t.years[y] ? ' on' : ''), '');
        c.setAttribute('title', t.skill + ' · ' + y + (t.years[y] ? '' : ' · not in a role'));
        row.appendChild(c);
      });
      row.appendChild(cell('span-total', duration(t.months)));

      row.addEventListener('click', function () { apply(t.skill, 'row'); });
      grid.appendChild(row);
    });

    fig.hidden = false;

    function cell(cls, text) {
      var el = document.createElement('span');
      el.className = cls;
      if (text) el.textContent = text;
      return el;
    }
  })();

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current) clear();
  });
})();
