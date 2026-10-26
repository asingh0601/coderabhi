/* The ng-typed-routes demo.

   A routing library has nothing to show in a running app — its whole point
   happens in the editor, before the app runs at all. So this recreates the
   editor instead: rename a route and watch what each approach does about it.

   Four states, from two toggles: which approach, and whether the route has
   been renamed. The interesting one is strings + renamed, where everything
   still compiles and the break waits for a user to find it. */
(function () {
  var root = document.getElementById('trDemo');
  if (!root) return;

  var mode = 'typed';     // 'typed' | 'strings'
  var renamed = false;

  var OLD = 'users';
  var NEW = 'people';

  /* ---------- the three panes, per state ---------- */
  function routesFile() {
    var name = renamed ? NEW : OLD;
    return [
      '<span class="b">export const</span> routes: Routes = [',
      '  {',
      '    path: <span class="g">\'<span class="tr-hl">' + name + '</span>\'</span>,',
      '    children: [',
      '      { path: <span class="g">\':id\'</span>, component: UserDetail },',
      '    ],',
      '  },',
      '];'
    ].join('\n');
  }

  function tok(text) {
    // the call site still says the old name, so after a rename it is stale
    return renamed
      ? '<span class="tr-bad" title="Property \'' + OLD + '\' does not exist on type '
      + '\'RouteTree\'. Did you mean \'' + NEW + '\'?">' + text + '</span>'
      : text;
  }

  function usageFile() {
    if (mode === 'typed') {
      return [
        '<span class="b">import</span> { routes } <span class="b">from</span> '
        + '<span class="g">\'./routes.gen\'</span>;',
        '',
        '<span class="b">private readonly</span> router = inject(TypedRouter);',
        '',
        'open(id: <span class="y">string</span>) {',
        '  <span class="c">// a key on the generated tree, not a string</span>',
        '  <span class="b">this</span>.router.navigate(routes.' + tok(OLD) + '.$id, { id });',
        '}',
        '',
        'template: <span class="g">`',
        '  &lt;a [typedLink]="routes.' + tok(OLD) + '.$id" [params]="{ id: u.id }"&gt;',
        '    Open',
        '  &lt;/a&gt;',
        '`</span>'
      ].join('\n');
    }
    return [
      '<span class="b">private readonly</span> router = inject(Router);',
      '',
      'open(id: <span class="y">string</span>) {',
      '  <span class="c">// just an array of strings, as far as the compiler knows</span>',
      '  <span class="b">this</span>.router.navigate([<span class="g">\'/' + OLD
      + '\'</span>, id]);',
      '}',
      '',
      'template: <span class="g">`',
      '  &lt;a [routerLink]="[<span class="tr-plain">\'/' + OLD + '\'</span>, u.id]"&gt;',
      '    Open',
      '  &lt;/a&gt;',
      '`</span>'
    ].join('\n');
  }

  function problems() {
    if (!renamed) {
      return {
        tone: 'ok',
        lines: [
          '<span class="tr-cmd">$ npm run routes:check</span>',
          '<span class="tr-ok">✔</span> routes.gen.ts is up to date',
          '<span class="tr-cmd">$ tsc --noEmit</span>',
          '<span class="tr-ok">✔</span> 0 errors'
        ],
        note: 'Nothing renamed yet. Rename the route above and watch the two approaches diverge.'
      };
    }

    if (mode === 'typed') {
      return {
        tone: 'bad',
        lines: [
          '<span class="tr-cmd">$ ng-typed-routes generate</span>',
          '<span class="tr-ok">✔</span> wrote src/app/routes.gen.ts',
          '<span class="tr-cmd">$ tsc --noEmit</span>',
          '<span class="tr-err">✖</span> src/app/user-list.component.ts:7:24 — error '
          + '<span class="tr-code-id">TS2339</span>: Property <span class="tr-q">\'' + OLD
          + '\'</span> does not exist on type <span class="tr-q">\'RouteTree\'</span>. '
          + 'Did you mean <span class="tr-q">\'' + NEW + '\'</span>?',
          '<span class="tr-err">✖</span> src/app/user-list.component.ts:11:28 — error '
          + '<span class="tr-code-id">TS2339</span>: Property <span class="tr-q">\'' + OLD
          + '\'</span> does not exist on type <span class="tr-q">\'RouteTree\'</span>.',
          'Found 2 errors.'
        ],
        note: 'The build stops. Both stale links are named, with the line, the column and '
          + 'the spelling you probably meant.'
      };
    }

    return {
      tone: 'worse',
      lines: [
        '<span class="tr-cmd">$ tsc --noEmit</span>',
        '<span class="tr-ok">✔</span> 0 errors',
        '<span class="tr-cmd">$ ng build</span>',
        '<span class="tr-ok">✔</span> built successfully — shipped to production',
        '<span class="tr-cmd">// three days later, in a user\'s browser</span>',
        '<span class="tr-err">✖</span> <span class="tr-code-id">NG04002</span>: Cannot match '
        + 'any routes. URL Segment: <span class="tr-q">\'' + OLD + '/42\'</span>'
      ],
      note: 'Everything compiled. The strings are just strings, so nothing checked them — '
        + 'and the person who found the broken link was a customer.'
    };
  }

  /* ---------- render ---------- */
  var routesEl = root.querySelector('#trRoutes');
  var usageEl = root.querySelector('#trUsage');
  var usageBar = root.querySelector('#trUsageBar');
  var outEl = root.querySelector('#trOut');
  var noteEl = root.querySelector('#trNote');
  var renameBtn = root.querySelector('#trRename');
  var modeBtns = root.querySelectorAll('[data-mode]');

  function render() {
    routesEl.innerHTML = routesFile();
    usageEl.innerHTML = usageFile();
    usageBar.textContent = mode === 'typed'
      ? 'user-list.component.ts — with ng-typed-routes'
      : 'user-list.component.ts — with plain routerLink';

    var p = problems();
    outEl.className = 'tr-out ' + p.tone;
    outEl.innerHTML = p.lines.map(function (l) {
      return '<span class="tr-line">' + l + '</span>';
    }).join('');
    noteEl.textContent = p.note;

    renameBtn.textContent = renamed
      ? '↺  Undo — rename it back to ‘' + OLD + '’'
      : 'Rename the route to ‘' + NEW + '’';
    renameBtn.classList.toggle('undo', renamed);

    Array.prototype.forEach.call(modeBtns, function (b) {
      var on = b.getAttribute('data-mode') === mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    });
  }

  renameBtn.addEventListener('click', function () {
    renamed = !renamed;
    render();
    // a short flash on the renamed token, so the eye knows where to look
    var hl = routesEl.querySelector('.tr-hl');
    if (hl) {
      hl.classList.remove('flash');
      void hl.offsetWidth;
      hl.classList.add('flash');
    }
  });

  Array.prototype.forEach.call(modeBtns, function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-mode');
      render();
    });
  });

  render();
})();
