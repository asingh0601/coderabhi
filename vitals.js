/* Fills the footer strip with what this page actually cost the visitor,
   measured in their own browser through the Performance API.

   Nothing here is typed in by hand, which is the whole point: if the page
   gets heavier, the number on the page gets worse by itself. The strip
   stays hidden unless every figure can be measured, so a browser without
   the API shows nothing rather than a row of dashes. */
(function () {
  var strip = document.getElementById('vitals');
  if (!strip || !window.performance || !performance.getEntriesByType) return;

  function set(name, value) {
    var el = strip.querySelector('[data-vital="' + name + '"]');
    if (el) el.textContent = value;
  }

  function kb(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return Math.round(bytes / 1024) + ' KB';
  }

  function measure() {
    var resources = performance.getEntriesByType('resource') || [];
    var nav = (performance.getEntriesByType('navigation') || [])[0];

    // Only same-origin responses report transferSize, so third-party bytes
    // (the font CSS) are counted as a request but not as weight. Say
    // "transferred" rather than "page weight" because of exactly that.
    // encodedBodySize rather than transferSize: transferSize drops to ~0 for
    // anything served from cache, so a reload would report a weight the page
    // never actually has. Body size is what this page costs cold, every time.
    var size = function (r) { return r.encodedBodySize || r.transferSize || 0; };
    var bytes = resources.reduce(function (sum, r) {
      return sum + size(r);
    }, nav ? size(nav) : 0);

    if (!bytes) return false;

    set('weight', kb(bytes));
    set('requests', String(resources.length + 1));

    // Both of these are claims about the page, so check them rather than
    // assert them. A framework would have left a global behind.
    var frameworkGlobals = ['React', 'Vue', 'ng', 'angular', 'jQuery', '$', 'Alpine', 'Svelte'];
    var frameworks = frameworkGlobals.filter(function (g) {
      return typeof window[g] !== 'undefined';
    }).length;
    set('frameworks', frameworks === 0 ? 'no framework' : frameworks + ' framework(s)');

    var trackerHosts = /google-analytics|googletagmanager|doubleclick|facebook|hotjar|segment|mixpanel|clarity\.ms/i;
    var trackers = resources.filter(function (r) { return trackerHosts.test(r.name); }).length;
    set('trackers', trackers === 0 ? 'no trackers' : trackers + ' tracker(s)');

    strip.hidden = false;
    return true;
  }

  // Resource timings keep arriving after load, so measure once the browser
  // has gone quiet rather than racing it.
  function run() {
    if (!measure()) setTimeout(measure, 1200);
  }

  if (document.readyState === 'complete') setTimeout(run, 400);
  else addEventListener('load', function () { setTimeout(run, 400); });
})();
