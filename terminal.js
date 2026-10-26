/* The "at a glance" card, but you can type in it.

   The card already looked like a terminal, which felt like a promise the
   page was not keeping. So it is one now: a small shell whose commands
   answer from the page itself — skills reads the years off the chart, roles
   reads the timeline, oss reads the cards. Nothing is duplicated here, so
   nothing here can go stale while the page moves on.

   It is an addition, not a replacement. Without JavaScript, or for anyone
   who would rather just read, the glance rows are still the first thing in
   the card and the prompt is ignorable. */
(function () {
  var card = document.getElementById('profile');
  var form = document.getElementById('termForm');
  var input = document.getElementById('termIn');
  var out = document.getElementById('termOut');
  var rows = document.getElementById('glance');
  if (!card || !form || !input || !out || !rows) return;

  var history = [];
  var cursor = -1;

  /* ---------- output helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function write(html, cls) {
    var line = document.createElement('div');
    line.className = 'tl' + (cls ? ' ' + cls : '');
    line.innerHTML = html;
    out.appendChild(line);
  }

  function table(pairs) {
    return pairs.map(function (p) {
      return '<span class="tk">' + esc(p[0]) + '</span>'
        + '<span class="tv">' + esc(p[1]) + '</span>';
    }).join('<br>');
  }

  function scrollOut() {
    out.scrollTop = out.scrollHeight;
  }

  /* ---------- reading the page ---------- */
  function glance() {
    return Array.prototype.map.call(rows.querySelectorAll('.prow'), function (r) {
      var dd = r.querySelector('dd').cloneNode(true);
      var sub = dd.querySelector('.sub');
      if (sub) sub.remove();
      return [r.querySelector('dt').textContent.trim(), dd.textContent.trim()];
    });
  }

  function skills(limit) {
    var list = Array.prototype.map.call(document.querySelectorAll('.span-row'), function (r) {
      return [r.querySelector('.span-total').textContent.trim(),
      r.querySelector('.span-name').textContent.trim()];
    });
    return limit ? list.slice(0, limit) : list;
  }

  function roles() {
    return Array.prototype.map.call(document.querySelectorAll('.timeline .job'), function (j) {
      return [j.querySelector('.when').textContent.trim().replace(/\s+/g, ' '),
      j.querySelector('h3').textContent.trim()];
    });
  }

  function oss() {
    return Array.prototype.map.call(document.querySelectorAll('#opensource .card'), function (c) {
      return [c.getAttribute('href').replace('.html', ''),
      c.querySelector('.desc').textContent.trim()];
    });
  }

  /* ---------- where things are ---------- */
  var SECTIONS = ['about', 'skills', 'experience', 'projects', 'opensource', 'contact'];

  var LINKS = {
    aitranslate: 'https://aitranslate.in',
    github: 'https://github.com/asingh0601',
    npm: 'https://www.npmjs.com/~onlyabhishek',
    marketplace: 'https://marketplace.visualstudio.com/publishers/er-abhishek',
    coffee: 'https://buymeacoffee.com/er.abhishek'
  };

  var PAGES = {
    blog: 'blog/index.html',
    'forge-pilot': 'forge-pilot.html',
    'ng-typed-routes': 'ng-typed-routes.html',
    'ngx-circle-chart': 'ngx-circle-chart.html',
    'ngx-modern-calendar': 'ngx-modern-calendar.html',
    'ngx-easy-captcha': 'ngx-easy-captcha.html'
  };

  function go(id) {
    var el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  /* ---------- the commands ---------- */
  var COMMANDS = {
    help: {
      about: 'this list',
      run: function () {
        write('<span class="tc">Commands</span>');
        write(table(Object.keys(COMMANDS).map(function (name) {
          return [name, COMMANDS[name].about];
        })));
        write('<span class="tm">Arrow keys walk the history, Tab completes, '
          + 'Ctrl+K opens the quick nav.</span>');
      }
    },

    whoami: {
      about: 'the short version',
      run: function () {
        write(table(glance()));
      }
    },

    skills: {
      about: 'years per skill — skills 5 for the top five',
      run: function (args) {
        var n = parseInt(args[0], 10);
        var list = skills(n > 0 ? n : 0);
        if (!list.length) return write('<span class="te">the chart has not loaded yet</span>');
        write(table(list));
        write('<span class="tm">' + list.length + ' shown · goto skills for the chart</span>');
      }
    },

    roles: {
      about: 'where the time went',
      run: function () {
        write(table(roles()));
      }
    },

    oss: {
      about: 'what I have published',
      run: function () {
        write(table(oss()));
        write('<span class="tm">open &lt;name&gt; to read about one</span>');
      }
    },

    open: {
      about: 'open a page or link — open github',
      run: function (args) {
        var what = (args[0] || '').toLowerCase();
        if (!what) return write('<span class="te">open what? try: '
          + Object.keys(LINKS).concat(Object.keys(PAGES)).join(', ') + '</span>');
        if (LINKS[what]) {
          write('opening <span class="tk2">' + esc(LINKS[what]) + '</span> in a new tab');
          window.open(LINKS[what], '_blank', 'noopener');
          return;
        }
        if (PAGES[what]) {
          write('loading <span class="tk2">' + esc(PAGES[what]) + '</span>…');
          setTimeout(function () { location.href = PAGES[what]; }, 320);
          return;
        }
        write('<span class="te">no such thing: ' + esc(what) + '</span>');
      }
    },

    goto: {
      about: 'jump to a section — goto experience',
      run: function (args) {
        var id = (args[0] || '').toLowerCase();
        if (!id) return write('<span class="te">sections: ' + SECTIONS.join(', ') + '</span>');
        if (go(id)) return write('↓ ' + esc(id));
        write('<span class="te">no section called ' + esc(id) + '</span>');
      }
    },

    ls: {
      about: 'list the sections of this page',
      run: function () {
        write(SECTIONS.map(function (s) {
          return '<span class="tk2">' + s + '/</span>';
        }).join('  '));
      }
    },

    contact: {
      about: 'jump to the form and start typing',
      run: function () {
        go('contact');
        var name = document.getElementById('name');
        if (name) setTimeout(function () { name.focus(); }, 600);
        write('the form is yours — it reaches me directly');
      }
    },

    uptime: {
      about: 'how long I have been doing this',
      run: function () {
        // counted from the oldest role on the page, not from a number typed here
        var all = document.querySelectorAll('.timeline .job .when');
        var first = all.length ? all[all.length - 1].textContent : '';
        var year = (first.match(/(\d{4})/) || [])[1];
        if (!year) return write('<span class="te">could not read the timeline</span>');
        var years = ((Date.now() - new Date(+year, 4, 1)) / 31557600000).toFixed(1);
        write('up <span class="tk2">' + years + ' years</span>, load average: 1 deploy, '
          + '2 open PRs, 1 coffee');
      }
    },

    coffee: {
      about: 'the honest answer',
      run: function () {
        write('brewing… <span class="tm">(this terminal cannot actually make coffee)</span>');
        write('but you can buy me one: <span class="tk2">' + LINKS.coffee + '</span>');
      }
    },

    sudo: {
      about: 'no',
      run: function (args) {
        write('<span class="te">abhishek is not in the sudoers file. '
          + 'This incident has been reported.</span>');
        if (args.length) write('<span class="tm">(it has not, really)</span>');
      }
    },

    clear: {
      about: 'wipe the output',
      run: function () {
        out.innerHTML = '';
        card.classList.remove('typing');
      }
    }
  };

  /* ---------- running one ---------- */
  function run(raw) {
    var text = raw.trim();
    if (!text) return;

    history.unshift(text);
    cursor = -1;

    card.classList.add('typing');
    write('<span class="tp">$</span> ' + esc(text), 'tin');

    var parts = text.split(/\s+/);
    var name = parts[0].toLowerCase();
    var cmd = COMMANDS[name];

    if (cmd) {
      cmd.run(parts.slice(1));
    } else if (go(name)) {
      // a bare section name is obviously meant as a jump
      write('↓ ' + esc(name));
    } else {
      write('<span class="te">' + esc(name) + ': command not found</span>'
        + '<br><span class="tm">type help</span>');
    }

    scrollOut();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!history.length) return;
      e.preventDefault();
      cursor += e.key === 'ArrowUp' ? 1 : -1;
      cursor = Math.max(-1, Math.min(history.length - 1, cursor));
      input.value = cursor < 0 ? '' : history[cursor];
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }

    if (e.key === 'Tab') {
      var typed = input.value.trim().toLowerCase();
      if (!typed || typed.indexOf(' ') !== -1) return;
      var hit = Object.keys(COMMANDS).filter(function (c) {
        return c.indexOf(typed) === 0;
      });
      if (hit.length) {
        e.preventDefault();
        input.value = hit.length === 1 ? hit[0] + ' ' : typed;
        if (hit.length > 1) {
          card.classList.add('typing');
          write(hit.join('  '), 'tm');
          scrollOut();
        }
      }
      return;
    }

    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      COMMANDS.clear.run([]);
    }
  });

  // clicking anywhere in the card puts the caret where it belongs
  card.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) return;
    if (window.getSelection && String(window.getSelection())) return;
    input.focus();
  });
})();
