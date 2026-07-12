/* Connect form: voluntary contact sharing. Separate from net.js on purpose —
   connecting must work even when tracking is off (Do Not Track, blocked storage). */
(function () {
  "use strict";

  // Set after first deploy of the portfolio-net worker.
  var API = "https://portfolio-net.alyananwar.workers.dev/api/connect";
  var SITEKEY = "TURNSTILE_SITEKEY";

  var dialog = document.getElementById("connect-dialog");
  var triggers = document.querySelectorAll("[data-connect]");
  var configured = API.indexOf("PORTFOLIO_NET_HOST") === -1;

  // Triggers ship hidden in the markup; only reveal once the backend is live
  // and <dialog> is supported. No backend = feature invisible, site unchanged.
  if (!configured || !dialog || !dialog.showModal) return;
  triggers.forEach(function (t) {
    t.hidden = false;
  });

  var form = dialog.querySelector("form");
  var errEl = dialog.querySelector(".connect-error");
  var submitBtn = form.querySelector('button[type="submit"]');
  var turnstileLoaded = false;
  var turnstileWidget = null;

  function loadTurnstile() {
    if (turnstileLoaded || SITEKEY.indexOf("TURNSTILE") === 0) return;
    turnstileLoaded = true;
    var s = document.createElement("script");
    s.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__netTsReady";
    s.async = true;
    window.__netTsReady = function () {
      turnstileWidget = window.turnstile.render(
        dialog.querySelector(".connect-turnstile"),
        {
          sitekey: SITEKEY,
          size: "flexible",
        },
      );
    };
    document.head.appendChild(s);
  }

  triggers.forEach(function (t) {
    t.addEventListener("click", function (e) {
      e.preventDefault();
      dialog.showModal();
      loadTurnstile();
    });
  });

  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close(); // backdrop click
  });
  dialog.querySelector(".connect-close").addEventListener("click", function () {
    dialog.close();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var data = {};
    new FormData(form).forEach(function (val, key) {
      if (typeof val === "string" && val.trim()) data[key] = val.trim();
    });
    try {
      data.v = localStorage.getItem("net_vid") || undefined;
    } catch (err) {
      /* tracking off; connect still works */
    }
    if (turnstileWidget !== null && window.turnstile) {
      data.token = window.turnstile.getResponse(turnstileWidget);
    }

    fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().catch(function () {
          return { ok: false };
        });
      })
      .then(function (body) {
        if (body.ok) {
          form.hidden = true;
          dialog.querySelector(".connect-success").hidden = false;
        } else {
          showError(body.error || "Something went wrong. Please try again.");
        }
      })
      .catch(function () {
        showError("Network error. Please try again, or just email me.");
      });
  });

  function showError(msg) {
    errEl.textContent = msg;
    errEl.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Send";
    if (turnstileWidget !== null && window.turnstile)
      window.turnstile.reset(turnstileWidget);
  }
})();
