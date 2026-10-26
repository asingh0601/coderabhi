/* Skills, measured rather than asserted.

   Two sources, in this order:

     1. data-years on a chip — Abhishek's own figure for how long he has
        worked with that thing. Only he knows it, so it is written on the
        page as data rather than guessed at here.
     2. the timeline below, for everything else: each role carries its dates
        and its stack, so a skill tagged on a role can be measured from the
        dates already on the page.

   What the script does with that: ranks every chip, prints the duration on
   it, draws the bar chart above the cards, and wires both the chips and the
   bars to filter the timeline down to the roles behind them.

   Nothing is hardcoded here. Change a figure in the HTML or a role's dates
   and everything follows. A skill with neither a figure nor a role gets no
   number and no click, rather than an invented one. */
(function () {
  var chips = document.querySelectorAll('#skills .chip');
  var jobs = document.querySelectorAll('.timeline .job');
  var timeline = document.querySelector('.timeline');
  if (!chips.length || !jobs.length || !timeline) return;

  var MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  /* Genuine synonyms only — two names for one thing. Nothing that would
     stretch a skill into a role that did not use it. */
  var ALIASES = {
    'kubernetes': ['aks'],                          // AKS is Azure's Kubernetes
    'system design': ['architecture'],
    'c#': ['.net', '.net core', 'asp.net core'],    // a .NET role is a C# role
    'typescript': ['angular']                       // an Angular role is a TypeScript one
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
    roles.push({
      el: job,
      tags: tags,
      months: Math.max(1, (to.y - from.y) * 12 + (to.m - from.m))
    });
  });
  if (!roles.length) return;

  /* Loose on purpose: the chip says ".NET Core" where a role is tagged
     ".NET". Either containing the other counts, plus the alias table. */
  function matches(skill, tags) {
    var s = skill.toLowerCase();
    var extra = ALIASES[s] || [];
    return tags.some(function (t) {
      // a tag may be more specific than the chip ("ASP.NET Core" satisfies
      // ".NET Core") but not less: a bare ".NET" tag must not light up the
      // ".NET Core" chip, because .NET Core is the narrower claim
      if (t === s || t.indexOf(s) !== -1) return true;
      return extra.indexOf(t) !== -1;
    });
  }

  function duration(months) {
    if (months < 12) return months + 'mo';
    var years = months / 12;
    return (months < 24 ? years.toFixed(1).replace('.0', '') : Math.round(years)) + 'y';
  }

  // The stated figure wins where there is one; otherwise the roles answer.
  function profile(skill, declared) {
    var hits = roles.filter(function (r) { return matches(skill, r.tags); });
    var months = declared
      ? declared * 12
      : hits.reduce(function (a, r) { return a + r.months; }, 0);
    return { roles: hits, months: months, stated: !!declared };
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
    Array.prototype.forEach.call(
      document.querySelectorAll('#skills .chip.on, .span-row.on'),
      function (n) {
        n.classList.remove('on');
        if (n.classList.contains('span-row')) n.setAttribute('aria-pressed', 'false');
      });
  }

  function apply(skill, from) {
    if (current === skill) { clear(); return; }
    clear();
    current = skill;

    Array.prototype.forEach.call(document.querySelectorAll('[data-skill]'), function (n) {
      if (n.getAttribute('data-skill') !== skill) return;
      n.classList.add('on');
      if (n.classList.contains('span-row')) n.setAttribute('aria-pressed', 'true');
    });

    var hits = roles.filter(function (r) { return matches(skill, r.tags); });
    roles.forEach(function (r) {
      r.el.classList.add(hits.indexOf(r) !== -1 ? 'match' : 'dim');
    });

    banner.hidden = false;
    banner.innerHTML = '';
    // Deliberately a count, not a sum: the roles listed on this page are the
    // ones that tag the skill, which need not add up to the years above.
    var text = document.createElement('span');
    text.textContent = hits.length + (hits.length === 1 ? ' role used ' : ' roles used ') + skill;
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'skill-filter-clear';
    clearBtn.textContent = 'clear';
    clearBtn.addEventListener('click', clear);
    banner.appendChild(text);
    banner.appendChild(clearBtn);

    var anchor = document.getElementById('experience');
    if (anchor && from !== 'row') anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- chips: duration, ranking, click ---------- */
  var tracked = [];

  Array.prototype.forEach.call(document.querySelectorAll('#skills .chips'), function (group) {
    var list = Array.prototype.slice.call(group.querySelectorAll('.chip'));

    list.forEach(function (chip) {
      var skill = chip.textContent.trim();
      var p = profile(skill, +chip.dataset.years || 0);
      chip.dataset.months = p.months;

      if (!p.months) return;   // nothing behind it, so no number and no click

      chip.classList.add('linked');
      chip.dataset.skill = skill;

      var badge = document.createElement('b');
      badge.className = 'chip-yrs';
      badge.textContent = duration(p.months);
      chip.appendChild(document.createTextNode(' '));
      chip.appendChild(badge);

      if (p.roles.length) {
        chip.setAttribute('role', 'button');
        chip.setAttribute('tabindex', '0');
        chip.setAttribute('title', duration(p.months) + ' — click for the '
          + p.roles.length + (p.roles.length === 1 ? ' role' : ' roles') + ' behind it');
        chip.addEventListener('click', function () { apply(skill, 'chip'); });
        chip.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(skill, 'chip'); }
        });
      } else {
        chip.classList.add('static');
      }

      if (!tracked.some(function (t) { return t.skill === skill; })) {
        tracked.push({ skill: skill, months: p.months, roles: p.roles.length });
      }
    });

    // Longest first, so each card ranks itself instead of listing in the
    // order I happened to type.
    list.sort(function (a, b) {
      return (+b.dataset.months || 0) - (+a.dataset.months || 0);
    }).forEach(function (chip) { group.appendChild(chip); });
  });

  /* ---------- the bar chart ---------- */
  (function barChart() {
    var fig = document.getElementById('skillSpans');
    var grid = document.getElementById('skillSpanGrid');
    if (!fig || !grid || !tracked.length) return;

    tracked.sort(function (a, b) { return b.months - a.months; });
    var longest = tracked[0].months;

    tracked.forEach(function (t) {
      var row = document.createElement(t.roles ? 'button' : 'div');
      row.className = 'span-row' + (t.roles ? '' : ' static');
      row.dataset.skill = t.skill;

      var name = document.createElement('span');
      name.className = 'span-name';
      name.textContent = t.skill;

      var track = document.createElement('span');
      track.className = 'span-track';
      var fill = document.createElement('span');
      fill.className = 'span-fill';
      fill.style.setProperty('--pct', (t.months / longest * 100).toFixed(1) + '%');
      track.appendChild(fill);

      var total = document.createElement('span');
      total.className = 'span-total';
      total.textContent = duration(t.months);

      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(total);

      if (t.roles) {
        row.type = 'button';
        row.setAttribute('aria-pressed', 'false');
        row.setAttribute('title', 'Show the ' + t.roles
          + (t.roles === 1 ? ' role' : ' roles') + ' that used ' + t.skill);
        row.addEventListener('click', function () { apply(t.skill, 'row'); });
      }

      grid.appendChild(row);
    });

    fig.hidden = false;
  })();

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current) clear();
  });
})();
