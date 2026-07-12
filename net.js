/* Anonymous, consent-light visitor analytics for the portfolio.
   No cookies, no fingerprinting, no IP storage; respects Do Not Track.
   Random UUID in localStorage identifies the browser; identity only ever
   attaches if the visitor submits the Connect form. Details: /privacy.html */
(function () {
  "use strict";

  // Set after first deploy of the portfolio-net worker.
  var API = "https://portfolio-net.alyananwar.workers.dev/api/track";

  if (API.indexOf("PORTFOLIO_NET_HOST") !== -1) return; // not deployed yet
  if (navigator.doNotTrack === "1") return;
  if (!("sendBeacon" in navigator) || !window.crypto || !crypto.randomUUID)
    return;

  var vid, sid, isNewSession;
  try {
    vid = localStorage.getItem("net_vid");
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem("net_vid", vid);
    }
    sid = sessionStorage.getItem("net_sid");
    isNewSession = !sid;
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("net_sid", sid);
    }
  } catch (e) {
    return; // storage blocked = no tracking
  }

  var path = location.pathname;
  var queue = [];
  var sentMeta = !isNewSession;

  function meta() {
    var utm = new URLSearchParams(location.search);
    return {
      screen: screen.width + "x" + screen.height,
      lang: navigator.language,
      tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone,
      ref: document.referrer ? document.referrer.slice(0, 200) : undefined,
      utm: {
        s: utm.get("utm_source") || undefined,
        m: utm.get("utm_medium") || undefined,
        c: utm.get("utm_campaign") || undefined,
      },
    };
  }

  function push(type, m) {
    queue.push({ t: type, p: path, ts: Date.now(), m: m });
  }

  function flush() {
    if (!queue.length) return;
    var payload = { v: vid, s: sid, e: queue.splice(0, 30) };
    if (!sentMeta) {
      payload.d = meta();
      sentMeta = true;
    }
    try {
      navigator.sendBeacon(
        API,
        new Blob([JSON.stringify(payload)], { type: "text/plain" }),
      );
    } catch (e) {
      /* never surface tracking errors */
    }
  }

  push("pageview");
  if (path.indexOf("/projects/") === 0) {
    push("project_view", { slug: path.split("/").pop().replace(".html", "") });
  }

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("http") === 0 && href.indexOf(location.host) === -1) {
      push("click", { href: href.slice(0, 150), ext: 1 });
    } else if (href.indexOf("projects/") !== -1) {
      push("click", { href: href.slice(0, 150) });
    }
  });

  var maxScroll = 0;
  addEventListener(
    "scroll",
    function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      if (h <= 0) return;
      var pct = Math.min(100, Math.round((scrollY / h) * 100));
      if (pct > maxScroll) maxScroll = pct;
    },
    { passive: true },
  );

  // Duration is reported as deltas per visible stretch (dashboard sums them),
  // so tab-switching back and forth never loses time.
  var visibleSince = document.hidden ? null : Date.now();
  function reportVisibleTime() {
    if (!visibleSince) return;
    var ms = Date.now() - visibleSince;
    visibleSince = null;
    if (ms > 500) push("duration", { ms: ms });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      reportVisibleTime();
      flush();
    } else {
      visibleSince = Date.now();
    }
  });

  var scrollSent = false;
  addEventListener("pagehide", function () {
    reportVisibleTime();
    if (maxScroll > 0 && !scrollSent) {
      scrollSent = true;
      push("scroll_depth", { pct: maxScroll });
    }
    flush();
  });

  setInterval(flush, 15000);
})();
