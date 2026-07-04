// Mark JS availability; landing zoom + reveal animations only run with this class
document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// ── Theme: dark "Ink & Pops" default, light "Paper & Pops" via toggle ────────
// The head snippet applies the stored theme pre-paint; this module handles
// the toggle, persistence, meta theme-color, and notifies canvas/ascii art.
const THEME_KEY = "theme";

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function applyTheme(theme, persist) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      // Storage unavailable (private mode); theme still applies this visit
    }
  }
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg")
    .trim();
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.setAttribute(
      "aria-label",
      theme === "light" ? "Switch to dark theme" : "Switch to light theme",
    );
    toggle.setAttribute("aria-pressed", String(theme === "light"));
  }
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    applyTheme(currentTheme() === "light" ? "dark" : "light", true);
  });
}
applyTheme(currentTheme(), false); // sync meta + toggle state on load

// ── Dot-matrix name (Arcilla-style warped mark) ──────────────────────────────
const nameCanvas = document.getElementById("name-canvas");

function renderNameCanvas() {
  if (!nameCanvas) return;
  const holder = nameCanvas.parentElement;
  const cssW = Math.min(holder.clientWidth * 0.88, 860);
  const cssH = cssW * 0.6;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  nameCanvas.width = Math.round(cssW * dpr);
  nameCanvas.height = Math.round(cssH * dpr);
  nameCanvas.style.width = cssW + "px";
  nameCanvas.style.height = cssH + "px";

  const ctx = nameCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Low-res sample grid: draw the words tiny, read pixels, draw dots big
  const cols = 96;
  const cell = cssW / cols;
  const rows = Math.round(cssH / cell);
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d", { willReadFrequently: true });
  octx.fillStyle = "#000";
  octx.textAlign = "center";
  octx.textBaseline = "middle";
  octx.font = `700 ${Math.round(rows * 0.44)}px "Space Grotesk", sans-serif`;
  octx.fillText("ALYAN", cols / 2, rows * 0.26);
  octx.fillText("ANWAR", cols / 2, rows * 0.72);
  const data = octx.getImageData(0, 0, cols, rows).data;

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--blue")
      .trim() || "#6b83ff";
  const warpAmp = cell * 1.9;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (data[(r * cols + c) * 4 + 3] < 120) continue;
      const warp = Math.sin((c / cols) * Math.PI * 2.1 + 0.5) * warpAmp;
      ctx.beginPath();
      ctx.arc(
        c * cell + cell / 2,
        r * cell + cell / 2 + warp,
        cell * 0.34,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
}

if (nameCanvas) {
  document.fonts.ready.then(renderNameCanvas);
  document.addEventListener("themechange", renderNameCanvas);
  let resizeTimer;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderNameCanvas, 150);
    },
    { passive: true },
  );
}

// ── Landing zoom-through controller ──────────────────────────────────────────
const landing = document.getElementById("landing");
const runway = document.getElementById("runway");
const landingCenter = document.getElementById("landing-center");
const stickers = Array.from(document.querySelectorAll(".sticker"));

if (landing && runway && !prefersReducedMotion) {
  // Precompute each sticker's fly-out direction (away from screen center)
  let flyDirs = [];
  function computeFlyDirs() {
    flyDirs = stickers.map((s) => {
      const r = s.getBoundingClientRect();
      const dx = r.left + r.width / 2 - window.innerWidth / 2;
      const dy = r.top + r.height / 2 - window.innerHeight / 2;
      const len = Math.hypot(dx, dy) || 1;
      return { x: dx / len, y: dy / len };
    });
  }
  computeFlyDirs();
  window.addEventListener("resize", computeFlyDirs, { passive: true });

  // Mouse parallax targets, lerped in the rAF loop
  let mouseX = 0;
  let mouseY = 0;
  let curX = 0;
  let curY = 0;
  document.addEventListener(
    "mousemove",
    (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true },
  );

  let lastProgress = -1;
  function landingFrame() {
    const travel = runway.offsetHeight - window.innerHeight * 0.15;
    const p = Math.min(Math.max(window.scrollY / travel, 0), 1);
    curX += (mouseX - curX) * 0.06;
    curY += (mouseY - curY) * 0.06;

    const active = p < 1 || lastProgress < 1;
    if (active) {
      // Name dives toward the camera
      const scale = 1 + Math.pow(p, 1.7) * 11;
      landingCenter.style.transform = `scale(${scale})`;
      landingCenter.style.opacity =
        p < 0.5 ? 1 : Math.max(0, 1 - (p - 0.5) / 0.35);

      // Landing sheet fades late so the site appears "inside" the zoom
      landing.style.opacity = p < 0.7 ? 1 : Math.max(0, 1 - (p - 0.7) / 0.25);
      landing.classList.toggle("landing-done", p >= 0.98);

      // Stickers fly past the camera + gentle mouse drift
      stickers.forEach((s, i) => {
        const d = flyDirs[i] || { x: 0, y: -1 };
        const fly = Math.pow(p, 1.4) * 900;
        const depth = 14 + (i % 3) * 10;
        s.style.transform = `translate3d(${d.x * fly + curX * depth}px, ${d.y * fly + curY * depth}px, 0)`;
        s.style.opacity = Math.max(0, 1 - p * 1.7);
      });

      document.body.classList.toggle("entered", p > 0.85);
      lastProgress = p;
    }
    requestAnimationFrame(landingFrame);
  }
  requestAnimationFrame(landingFrame);
} else if (landing) {
  // Reduced motion: landing is a static first section, nav always available
  document.body.classList.add("entered");
}

// Enter button: glide past the runway
const enterBtn = document.getElementById("enter-btn");
if (enterBtn && runway) {
  enterBtn.addEventListener("click", () => {
    const main = document.getElementById("main");
    if (prefersReducedMotion || !main) {
      if (main) main.scrollIntoView();
      return;
    }
    window.scrollTo({ top: runway.offsetHeight, behavior: "smooth" });
  });
}

// Navigate pill menu
const navigateBtn = document.getElementById("navigate-btn");
const landingMenu = document.getElementById("landing-menu");
if (navigateBtn && landingMenu) {
  const closeMenu = () => {
    landingMenu.classList.remove("open");
    navigateBtn.setAttribute("aria-expanded", "false");
  };
  navigateBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = landingMenu.classList.toggle("open");
    navigateBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!landingMenu.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  landingMenu.addEventListener("click", closeMenu);
}

// ── Nav border + scroll progress bar ─────────────────────────────────────────
const nav = document.querySelector(".nav");
const progressBar = document.getElementById("scroll-progress");
if (nav || progressBar) {
  window.addEventListener(
    "scroll",
    () => {
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 20);
      if (progressBar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
        progressBar.style.transform = `scaleX(${p})`;
      }
    },
    { passive: true },
  );
}

// ── Scroll reveal + stagger (respects prefers-reduced-motion via CSS) ─────────
const revealElements = document.querySelectorAll(".reveal");

// Stagger siblings: each .reveal gets a delay based on its position among
// sibling .reveal elements, so grids and timelines cascade in.
const STAGGER_STEP = 70; // ms
revealElements.forEach((el) => {
  const siblings = Array.from(el.parentElement.children).filter((c) =>
    c.classList.contains("reveal"),
  );
  const index = siblings.indexOf(el);
  if (index > 0) {
    el.style.setProperty("--reveal-delay", index * STAGGER_STEP + "ms");
  }
});

// Timelines also get .visible so the git-log line can draw itself in
const timelineElements = document.querySelectorAll(".timeline");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  revealElements.forEach((el) => observer.observe(el));
  timelineElements.forEach((el) => observer.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("visible"));
  timelineElements.forEach((el) => el.classList.add("visible"));
}

// ── Magnetic buttons (mouse only, skipped under reduced motion) ──────────────
if (window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion) {
  const MAGNET_X = 8; // max pull in px
  const MAGNET_Y = 5;
  document.querySelectorAll(".btn, .contact-btn").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2 * MAGNET_X;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2 * MAGNET_Y;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}

// ── ASCII portrait: generate real characters from the source image ───────────
const asciiFigure = document.querySelector(".ascii-gen");
const asciiPre = document.getElementById("ascii-pre");

if (asciiFigure && asciiPre) {
  const COLS = 104;
  const ROWS = 64; // near-square grid: COLS × 0.6 mono advance ÷ ~0.975 aspect
  const RAMP = " .:-=+*#%@";
  const GEN_DURATION = 2600; // matches the scanSweep / asciiReveal CSS timing
  let asciiLines = null;
  let asciiStarted = false;
  let asciiVisible = false;

  function sampleAsciiLines(img) {
    const canvas = document.createElement("canvas");
    canvas.width = COLS;
    canvas.height = ROWS;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    // Match the source's own aspect so the WHOLE portrait renders uncropped
    const targetAspect = (COLS * 0.6) / ROWS;
    let sw = img.naturalWidth;
    let sh = sw / targetAspect;
    let sx = 0;
    let sy = Math.max(0, (img.naturalHeight - sh) / 2);
    if (sh > img.naturalHeight) {
      sh = img.naturalHeight;
      sw = sh * targetAspect;
      sx = Math.max(0, (img.naturalWidth - sw) / 2);
      sy = 0;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, COLS, ROWS);
    const data = ctx.getImageData(0, 0, COLS, ROWS).data;
    // Normalize luminance to the full ramp so the portrait keeps its
    // contrast even when the source has a grey background
    const lums = [];
    let min = 1;
    let max = 0;
    for (let p = 0; p < COLS * ROWS; p++) {
      const i = p * 4;
      const lum =
        (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      lums.push(lum);
      if (lum < min) min = lum;
      if (lum > max) max = lum;
    }
    const range = max - min || 1;
    const lines = [];
    for (let r = 0; r < ROWS; r++) {
      let line = "";
      for (let c = 0; c < COLS; c++) {
        const norm = (lums[r * COLS + c] - min) / range;
        line += RAMP[Math.min(RAMP.length - 1, Math.floor(norm * RAMP.length))];
      }
      lines.push(line);
    }
    return lines;
  }

  function scrambleLine(line) {
    let out = "";
    for (const ch of line) {
      out +=
        ch === " "
          ? " "
          : RAMP[1 + Math.floor(Math.random() * (RAMP.length - 1))];
    }
    return out;
  }

  function playAsciiGeneration() {
    asciiFigure.classList.add("ascii-ready");
    if (prefersReducedMotion) {
      asciiPre.textContent = asciiLines.join("\n");
      return;
    }
    asciiFigure.classList.add("generating");
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / GEN_DURATION, 1);
      const done = Math.floor(progress * ROWS);
      const shown = asciiLines.slice(0, done);
      if (done < ROWS) shown.push(scrambleLine(asciiLines[done]));
      asciiPre.textContent =
        shown.join("\n") + "\n".repeat(Math.max(0, ROWS - shown.length));
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        asciiPre.textContent = asciiLines.join("\n");
        asciiFigure.classList.remove("generating");
      }
    }
    requestAnimationFrame(frame);
  }

  function maybeStartAscii() {
    if (asciiStarted || !asciiLines || !asciiVisible) return;
    asciiStarted = true;
    playAsciiGeneration();
  }

  const asciiSource = new Image();
  asciiSource.src = "images/ascii-full.png";
  asciiSource
    .decode()
    .then(() => {
      asciiLines = sampleAsciiLines(asciiSource);
      maybeStartAscii();
    })
    .catch(() => {
      // Sampling failed (e.g. tainted canvas on file://): the <img>
      // fallback keeps the old CSS clip-path reveal
    });

  if ("IntersectionObserver" in window) {
    const asciiObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            asciiVisible = true;
            maybeStartAscii();
            asciiObserver.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    asciiObserver.observe(asciiFigure);
  } else {
    asciiVisible = true;
    maybeStartAscii();
  }
}

// ── Copy email to clipboard ───────────────────────────────────────────────────
const emailBtn = document.getElementById("email-copy-btn");
if (emailBtn) {
  emailBtn.addEventListener("click", (e) => {
    if (!navigator.clipboard) return; // fall through to mailto
    e.preventDefault();
    navigator.clipboard.writeText("a_anwar5@u.pacific.edu").then(() => {
      let toast = document.querySelector(".toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
      }
      toast.textContent = "email copied · a_anwar5@u.pacific.edu";
      toast.classList.add("show");
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2500);
    });
  });
}
