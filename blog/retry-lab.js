/* The retry storm, run rather than described.

   The diagram above it shows the shape of the problem. This lets you cause
   it: turn jitter off, press run, and watch a hundred clients synchronise
   into waves that keep re-breaking a service that was trying to recover.
   Turn it on and the same hundred clients, the same backoff and the same
   failure spread out underneath the capacity line.

   Everything is simulated in one loop over a fixed timeline — there is no
   animation frame budget to blow and nothing to clean up. */
(function () {
  var root = document.getElementById('retryLab');
  if (!root) return;

  var canvas = root.querySelector('#rlCanvas');
  var runBtn = root.querySelector('#rlRun');
  var out = root.querySelector('#rlOut');
  var toggles = root.querySelectorAll('[data-rl]');
  if (!canvas || !runBtn || !out) return;

  var opts = { jitter: true, backoff: true };

  var CLIENTS = 120;
  var TICKS = 160;          // one tick is roughly 100 ms of wall clock
  var CAPACITY = 14;        // requests the service can absorb per tick
  var OUTAGE_ENDS = 42;     // the original fault clears here

  /* ---------- the model ---------- */
  function simulate() {
    var load = new Array(TICKS).fill(0);
    var served = new Array(TICKS).fill(0);
    var done = 0;
    var attemptsTotal = 0;

    for (var c = 0; c < CLIENTS; c++) {
      // clients arrive bunched, the way they do behind a load balancer
      var t = Math.floor(Math.random() * 10);
      var attempt = 0;

      while (t < TICKS && attempt < 8) {
        load[t]++;
        attemptsTotal++;

        // the service is down, and afterwards it can only take so much
        var overCapacity = load[t] > CAPACITY;
        var failed = t < OUTAGE_ENDS || overCapacity;

        if (!failed) {
          served[t]++;
          done++;
          break;
        }

        attempt++;
        var wait = opts.backoff ? Math.pow(2, attempt) : 4;
        if (opts.jitter) wait = Math.max(1, Math.round(wait * Math.random()));
        t += Math.max(1, Math.round(wait));
      }
    }

    return { load: load, served: served, done: done, attempts: attemptsTotal };
  }

  /* ---------- drawing ---------- */
  function draw(sim) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var g = canvas.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    var peak = Math.max(CAPACITY * 2, Math.max.apply(null, sim.load));
    var bw = w / TICKS;

    // the capacity line: everything above it is load the service refuses
    var capY = h - (CAPACITY / peak) * (h - 26);
    g.strokeStyle = 'rgba(151,161,187,.45)';
    g.setLineDash([4, 4]);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, capY);
    g.lineTo(w, capY);
    g.stroke();
    g.setLineDash([]);

    g.fillStyle = 'rgba(151,161,187,.75)';
    g.font = '10px ui-monospace, monospace';
    g.fillText('capacity', 6, capY - 6);

    // the outage window
    var ox = (OUTAGE_ENDS / TICKS) * w;
    g.fillStyle = 'rgba(247,118,142,.07)';
    g.fillRect(0, 0, ox, h);
    g.fillStyle = 'rgba(247,118,142,.7)';
    g.fillText('service down', 6, 14);

    for (var i = 0; i < TICKS; i++) {
      var v = sim.load[i];
      if (!v) continue;
      var bh = (v / peak) * (h - 26);
      var x = i * bw;
      // load the service could not take is the part that hurts
      g.fillStyle = v > CAPACITY ? 'rgba(247,118,142,.85)' : 'rgba(87,207,154,.85)';
      g.fillRect(x, h - bh, Math.max(1, bw - 1), bh);
    }
  }

  function report(sim) {
    var wasted = sim.attempts - sim.done;
    var lastServed = sim.served.reduce(function (acc, v, i) {
      return v ? i : acc;
    }, 0);

    var recovered = lastServed > OUTAGE_ENDS
      ? Math.round((lastServed - OUTAGE_ENDS) * 0.1 * 10) / 10
      : 0;

    out.className = 'rl-out ' + (opts.jitter ? 'good' : 'bad');
    out.innerHTML =
      '<span class="rl-k">' + sim.attempts + '</span><span class="rl-l">requests sent</span>'
      + '<span class="rl-k">' + wasted + '</span><span class="rl-l">wasted on retries</span>'
      + '<span class="rl-k">' + recovered.toFixed(1) + 's</span>'
      + '<span class="rl-l">to drain after the fault cleared</span>'
      + '<span class="rl-n">' + (opts.jitter
        ? 'Spread out, the queue drains as soon as the fault clears.'
        : 'Synchronised, every wave re-breaks the service that was recovering.')
      + '</span>';
  }

  function run() {
    var sim = simulate();
    draw(sim);
    report(sim);
  }

  runBtn.addEventListener('click', run);

  Array.prototype.forEach.call(toggles, function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-rl');
      opts[key] = !opts[key];
      b.classList.toggle('on', opts[key]);
      b.setAttribute('aria-pressed', String(opts[key]));
      run();
    });
  });

  addEventListener('resize', function () { run(); });

  // draw the healthy case first, so the panel is never empty
  run();
})();
