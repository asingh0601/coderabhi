/* Live package stats.
   Download and install counts are read from the registries at page load, so
   the numbers on the page are whatever the registry reports right now and
   never need updating by hand.

   Both endpoints send Access-Control-Allow-Origin: *, so the browser can call
   them directly. A badge stays hidden until its number arrives, and stays
   hidden for good if the request fails, so a registry being down shows nothing
   rather than a broken or stale figure. */
(function () {
  var NPM_RANGE = "last-month";

  function format(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function groupBy(attr) {
    var map = {};
    Array.prototype.forEach.call(document.querySelectorAll("[" + attr + "]"), function (el) {
      var key = el.getAttribute(attr);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(el);
    });
    return map;
  }

  function show(els, text, title) {
    els.forEach(function (el) {
      el.textContent = text;
      el.setAttribute("title", title);
      el.hidden = false;
    });
  }

  function asJson(res) {
    return res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status));
  }

  /* npm registry: the version currently published. Scoped names have to be
     encoded, because the slash in @scope/name is a path separator otherwise. */
  var npmVer = groupBy("data-npm-version");
  Object.keys(npmVer).forEach(function (pkg) {
    fetch("https://registry.npmjs.org/" + pkg.replace("/", "%2F") + "/latest")
      .then(asJson)
      .then(function (data) {
        if (!data || !data.version) return;
        show(
          npmVer[pkg],
          "● v" + data.version,
          "Version " + data.version + ", live from the npm registry"
        );
      })
      .catch(function () { /* leave the badge hidden */ });
  });

  /* npm registry: one request per distinct package, however many badges use it. */
  var npm = groupBy("data-npm");
  Object.keys(npm).forEach(function (pkg) {
    fetch("https://api.npmjs.org/downloads/point/" + NPM_RANGE + "/" + pkg)
      .then(asJson)
      .then(function (data) {
        if (typeof data.downloads !== "number") return;
        show(
          npm[pkg],
          format(data.downloads) + " downloads/month",
          data.downloads.toLocaleString() + " downloads in the last 30 days, live from the npm registry"
        );
      })
      .catch(function () { /* leave the badge hidden */ });
  });

  /* Visual Studio Marketplace: filterType 7 is "extension id", flags 914 asks
     for the statistics block alongside the latest version. */
  var vsx = groupBy("data-vsx");
  var vsxVer = groupBy("data-vsx-version");
  Object.keys(vsxVer).forEach(function (id) {
    if (!vsx[id]) vsx[id] = [];   // make sure the one request below is made
  });

  Object.keys(vsx).forEach(function (id) {
    fetch("https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json;api-version=3.0-preview.1"
      },
      body: JSON.stringify({
        filters: [{ criteria: [{ filterType: 7, value: id }] }],
        flags: 914
      })
    })
      .then(asJson)
      .then(function (data) {
        var results = data && data.results && data.results[0];
        var ext = results && results.extensions && results.extensions[0];
        if (!ext) return;

        var version = ext.versions && ext.versions[0] && ext.versions[0].version;
        if (version && vsxVer[id]) {
          show(
            vsxVer[id],
            "v" + version,
            "Version " + version + ", live from the Visual Studio Marketplace"
          );
        }

        if (!ext.statistics) return;

        var installs = null;
        ext.statistics.forEach(function (stat) {
          if (stat.statisticName === "install") installs = stat.value;
        });
        if (typeof installs !== "number") return;

        show(
          vsx[id],
          format(installs) + (installs === 1 ? " install" : " installs"),
          installs.toLocaleString() + " installs, live from the Visual Studio Marketplace"
        );
      })
      .catch(function () { /* leave the badge hidden */ });
  });
})();
