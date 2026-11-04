/* Alyan · site behavior. Vanilla, no build. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Backdrop: crossfade to the painting of the window in view ---------- */
  (function backdrop() {
    var layers = document.querySelectorAll(".backdrop-layer");
    var windows = document.querySelectorAll(".window[data-bg]");
    if (layers.length !== 2 || !windows.length) return;

    var front = 0;
    var current = windows[0].dataset.bg;
    var pending = null;

    function show(url) {
      if (url === current) return;
      current = url;
      pending = url;
      var img = new Image();
      img.src = url;
      (img.decode ? img.decode() : Promise.resolve())
        .catch(function () {}) // decode failure: fade anyway, browser retries the load
        .then(function () {
          if (pending !== url) return; // a newer section won
          var next = 1 - front;
          layers[next].style.backgroundImage = "url(" + url + ")";
          layers[next].classList.add("is-on");
          layers[front].classList.remove("is-on");
          front = next;
        });
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) show(e.target.dataset.bg);
        });
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    windows.forEach(function (w) {
      io.observe(w);
    });
  })();

  /* ---------- Work: rotating file reel ---------- */
  (function reel() {
    var reelEl = document.getElementById("reel");
    var ring = document.getElementById("ring");
    if (!reelEl || !ring) return;

    var files = Array.prototype.slice.call(ring.querySelectorAll(".file"));
    var infos = document.querySelectorAll(".file-info article");
    var n = files.length;
    var step = 360 / n;
    var flat = window.matchMedia("(max-width: 760px)");

    var AUTO_SPEED = 0.05; // deg per frame, about 3 deg/s
    var DRAG_GAIN = 0.28; // deg per px dragged
    var IDLE_RESUME_MS = 5000;

    var rot = 0;
    var target = null;
    var hoverKey = null;
    var frontIndex = -1;
    var pointerInside = false;
    var lastTouch = 0;
    var running = false;
    var drag = null;
    var justDragged = false;

    ring.style.setProperty("--step", step);
    files.forEach(function (f, i) {
      f.style.setProperty("--i", i);
    });

    function setRadius() {
      var w = files[0].offsetWidth || 220;
      var r = Math.round(w / 2 / Math.tan(Math.PI / n)) + 36;
      ring.style.setProperty("--radius", r + "px");
      // keep the front card's size steady however many files there are
      reelEl.style.perspective = Math.round(r * 4.2) + "px";
    }

    function mod(a, m) {
      return ((a % m) + m) % m;
    }

    function showInfo(key) {
      infos.forEach(function (a) {
        a.hidden = a.dataset.for !== key;
      });
    }

    function paint() {
      ring.style.setProperty("--rot", rot.toFixed(2));
      var fi = mod(Math.round(-rot / step), n);
      files.forEach(function (f, i) {
        var a = mod(i * step + rot, 360);
        var d = Math.min(a, 360 - a); // degrees away from front
        f.style.opacity = d > 95 ? 0 : (1 - (d / 95) * 0.55).toFixed(3);
        f.style.pointerEvents = d > 80 ? "none" : "";
        f.tabIndex = d > 80 ? -1 : 0;
      });
      if (fi !== frontIndex) {
        if (frontIndex >= 0) files[frontIndex].classList.remove("is-front");
        frontIndex = fi;
        files[fi].classList.add("is-front");
        if (!hoverKey) showInfo(files[fi].dataset.key);
      }
    }

    function idle() {
      return Date.now() - lastTouch > IDLE_RESUME_MS;
    }

    function tick() {
      if (!running) return;
      if (target !== null) {
        rot += (target - rot) * 0.12;
        if (Math.abs(target - rot) < 0.05) {
          rot = target;
          target = null;
        }
      } else if (!drag && !pointerInside && idle() && !reduceMotion.matches) {
        rot -= AUTO_SPEED;
      }
      paint();
      requestAnimationFrame(tick);
    }

    function goTo(index) {
      // shortest way round to put `index` in front
      var want = -index * step;
      var delta = mod(want - rot + 180, 360) - 180;
      target = rot + delta;
      lastTouch = Date.now();
    }

    function nudge(dir) {
      // step from where the ring is heading, so quick repeat clicks stack up
      var base =
        target !== null ? mod(Math.round(-target / step), n) : frontIndex;
      goTo(mod(base + dir, n));
    }

    /* Desktop ring */
    function startRing() {
      setRadius();
      paint();
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    }

    reelEl.addEventListener("pointerenter", function () {
      pointerInside = true;
    });
    reelEl.addEventListener("pointerleave", function () {
      pointerInside = false;
    });

    reelEl.addEventListener("pointerdown", function (e) {
      if (flat.matches || e.button !== 0) return;
      justDragged = false;
      drag = { x: e.clientX, rot: rot, moved: false };
      target = null;
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 5) {
        drag.moved = true;
        reelEl.classList.add("is-dragging");
      }
      if (drag.moved) rot = drag.rot + dx * DRAG_GAIN;
    });
    window.addEventListener("pointerup", function () {
      if (!drag) return;
      var moved = drag.moved;
      drag = null;
      reelEl.classList.remove("is-dragging");
      lastTouch = Date.now();
      if (moved) {
        target = Math.round(rot / step) * step;
        justDragged = true; // the click that ends a drag shouldn't open a project
      }
    });
    ring.addEventListener(
      "click",
      function (ev) {
        if (justDragged) ev.preventDefault();
        justDragged = false;
      },
      true,
    );

    files.forEach(function (f, i) {
      f.addEventListener("pointerenter", function () {
        hoverKey = f.dataset.key;
        showInfo(hoverKey);
      });
      f.addEventListener("pointerleave", function () {
        hoverKey = null;
        if (frontIndex >= 0) showInfo(files[frontIndex].dataset.key);
      });
      f.addEventListener("focus", function () {
        if (!flat.matches) goTo(i);
      });
    });

    document.querySelectorAll(".reel-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        nudge(Number(b.dataset.dir));
      });
    });
    reelEl.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") nudge(1);
      else if (e.key === "ArrowLeft") nudge(-1);
      else return;
      e.preventDefault();
      var f = files[mod(frontIndex + (e.key === "ArrowRight" ? 1 : -1), n)];
      f.focus({ preventScroll: true });
    });

    /* Phone: flat swipe row, info follows the card nearest the center */
    var scrollQueued = false;
    ring.addEventListener("scroll", function () {
      if (!flat.matches || scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(function () {
        scrollQueued = false;
        var mid = ring.scrollLeft + ring.clientWidth / 2;
        var best = 0;
        var bestD = Infinity;
        files.forEach(function (f, i) {
          var d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - mid);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        showInfo(files[best].dataset.key);
      });
    });

    function applyMode() {
      if (flat.matches) {
        running = false;
        files.forEach(function (f) {
          f.style.opacity = "";
          f.style.pointerEvents = "";
          f.tabIndex = 0;
        });
        showInfo(files[0].dataset.key);
      } else {
        startRing();
      }
    }

    // Only animate while the reel is on screen
    new IntersectionObserver(function (entries) {
      if (flat.matches) return;
      if (entries[0].isIntersecting) startRing();
      else running = false;
    }).observe(reelEl);

    window.addEventListener("resize", function () {
      if (!flat.matches) setRadius();
    });
    flat.addEventListener("change", applyMode);
    applyMode();
  })();

  /* ---------- Gallery lightbox ---------- */
  (function lightbox() {
    var box = document.getElementById("lightbox");
    if (!box || !box.showModal) return;
    var img = box.querySelector("img");
    var cap = box.querySelector(".lightbox-cap");

    function open(src, caption) {
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      cap.textContent = caption || src.alt || "";
      box.showModal();
    }
    document.querySelectorAll(".shot-open").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var fig = btn.closest("figure");
        var caption = fig && fig.querySelector("figcaption");
        open(btn.querySelector("img"), caption && caption.textContent);
      });
    });
    // project page galleries
    document.querySelectorAll(".gallery-item img").forEach(function (el) {
      el.addEventListener("click", function () {
        open(el);
      });
    });
    box.querySelector(".lightbox-close").addEventListener("click", function () {
      box.close();
    });
    box.addEventListener("click", function (e) {
      if (e.target === box) box.close(); // click outside the photo
    });
  })();

  /* ---------- Email: copy on click, mailto as fallback ---------- */
  (function email() {
    var link = document.getElementById("email-copy-btn");
    if (!link) return;
    var address = "a_anwar5@u.pacific.edu";
    link.addEventListener("click", function (e) {
      if (!navigator.clipboard) return;
      e.preventDefault();
      navigator.clipboard.writeText(address).then(
        function () {
          var toast = document.querySelector(".toast");
          if (!toast) {
            toast = document.createElement("div");
            toast.className = "toast";
            toast.setAttribute("role", "status");
            document.body.appendChild(toast);
          }
          toast.textContent = "Email copied";
          toast.classList.add("show");
          clearTimeout(toast._t);
          toast._t = setTimeout(function () {
            toast.classList.remove("show");
          }, 2200);
        },
        function () {
          window.location.href = "mailto:" + address; // clipboard denied
        },
      );
    });
  })();
})();
