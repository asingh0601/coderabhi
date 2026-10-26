/* Send a request through the diagram.

   The row of boxes was a picture of a pipeline, which is the least
   interesting thing a pipeline can be. Press the button and a request walks
   it hop by hop, each box reporting what it cost, with a running total at
   the end.

   The point it makes is the one the caption promises: the same request
   costs about thirty milliseconds when the cache answers and about five
   times that when it has to go all the way to disk. The numbers are
   illustrative. The shape is not. */
(function () {
  var fig = document.getElementById('flow');
  if (!fig) return;

  var nodes = Array.prototype.slice.call(fig.querySelectorAll('.flow-node'));
  var links = Array.prototype.slice.call(fig.querySelectorAll('.flow-link'));
  var runBtn = fig.querySelector('#flowRun');
  var readout = fig.querySelector('#flowOut');
  var modeBtns = fig.querySelectorAll('[data-flow-mode]');
  if (!nodes.length || !runBtn || !readout) return;

  var reduced = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var mode = 'hit';
  var running = false;
  var timers = [];

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function after(ms, fn) {
    timers.push(setTimeout(fn, ms));
  }

  function reset() {
    clearTimers();
    nodes.forEach(function (n) {
      n.classList.remove('lit', 'done', 'skipped');
      var ms = n.querySelector('.fn-ms');
      if (ms) ms.remove();
    });
    links.forEach(function (l) { l.classList.remove('lit', 'done'); });
    readout.className = 'flow-out';
    readout.textContent = '';
  }

  // which hops a request actually makes, and what each one costs
  function plan() {
    return nodes.map(function (node) {
      var cost = parseInt(node.getAttribute('data-ms-' + mode), 10);
      return {
        el: node,
        ms: isNaN(cost) ? 0 : cost,
        // a cache hit answers before the queue and the database are touched
        skipped: mode === 'hit' && node.hasAttribute('data-skip-on-hit')
      };
    });
  }

  function label(step) {
    var tag = document.createElement('span');
    tag.className = 'fn-ms' + (step.ms >= 60 ? ' slow' : '');
    tag.textContent = step.skipped ? 'not touched' : step.ms + ' ms';
    step.el.appendChild(tag);
  }

  function finish(total) {
    readout.className = 'flow-out ' + (mode === 'hit' ? 'fast' : 'slow');
    readout.innerHTML = '<span class="fo-k">' + (mode === 'hit'
      ? 'cache hit' : 'cache miss') + '</span>'
      + '<span class="fo-v">' + total + ' ms</span>'
      + '<span class="fo-n">' + (mode === 'hit'
        ? 'answered from memory — the database never heard about it'
        : 'the database did the work, and everyone waited for it') + '</span>';
    running = false;
    runBtn.disabled = false;
    runBtn.textContent = 'Send another';
  }

  function run() {
    if (running) return;
    reset();
    running = true;
    runBtn.disabled = true;
    runBtn.textContent = 'In flight…';

    var steps = plan();
    var total = 0;
    var at = 0;

    steps.forEach(function (step, i) {
      // the wait before a hop roughly tracks what that hop costs, so the
      // database visibly takes its time
      var dwell = reduced ? 0 : Math.min(620, Math.max(170, step.ms * 2.4));
      if (step.skipped) dwell = reduced ? 0 : 90;

      after(at, function () {
        if (step.skipped) {
          step.el.classList.add('skipped');
          label(step);
          return;
        }
        step.el.classList.add('lit');
        if (links[i - 1]) links[i - 1].classList.add('lit');
      });

      after(at + dwell, function () {
        if (!step.skipped) {
          step.el.classList.remove('lit');
          step.el.classList.add('done');
          if (links[i - 1]) {
            links[i - 1].classList.remove('lit');
            links[i - 1].classList.add('done');
          }
          total += step.ms;
          label(step);
        }
      });

      at += dwell + (reduced ? 0 : 60);
    });

    after(at + 120, function () {
      finish(steps.reduce(function (a, s) {
        return a + (s.skipped ? 0 : s.ms);
      }, 0));
    });
  }

  runBtn.addEventListener('click', run);

  Array.prototype.forEach.call(modeBtns, function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-flow-mode');
      Array.prototype.forEach.call(modeBtns, function (o) {
        var on = o === b;
        o.classList.toggle('on', on);
        o.setAttribute('aria-selected', String(on));
      });
      running = false;
      runBtn.disabled = false;
      runBtn.textContent = 'Send a request';
      reset();
    });
  });
})();
