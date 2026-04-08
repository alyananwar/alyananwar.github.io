// Scroll progress bar
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = pct + '%';
}, { passive: true });

// Typing animation for hero name
const nameEl = document.querySelector('.hero-name-text');
if (nameEl) {
  const text = 'ALYAN_ANWAR';
  let i = 0;
  setTimeout(() => {
    const interval = setInterval(() => {
      nameEl.textContent = text.slice(0, ++i);
      if (i === text.length) clearInterval(interval);
    }, 80);
  }, 400);
}

// Copy email to clipboard
const emailBtn = document.getElementById('email-copy-btn');
if (emailBtn) {
  emailBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('a_anwar5@u.pacific.edu').then(() => {
      let toast = document.querySelector('.toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
      }
      toast.textContent = 'email_copied_to_clipboard';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    });
  });
}

// Scroll reveal with staggered timing
const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const parent = entry.target.parentElement;
      const siblings = Array.from(parent.querySelectorAll('.reveal'));
      const index = siblings.indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('visible'), index * 120);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealElements.forEach(el => observer.observe(el));

// Nav border on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// Parallax fade on hero
const heroInner = document.querySelector('.hero-inner');
if (heroInner) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight) {
      heroInner.style.opacity   = Math.max(0, 1 - scrolled / (window.innerHeight * 0.8));
      heroInner.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
  }, { passive: true });
}

// ── Shared cursor state ───────────────────────────────────────────────────────
let mx = -100, my = -100;
let cursorHovering = false;
let trailPoints    = [];  // { x, y, ts }

const TRAIL_MS   = 750;   // how long a point glows (ms)
const TRAIL_R    = 80;    // influence radius in px
const TRAIL_R_SQ = TRAIL_R * TRAIL_R;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  trailPoints.push({ x: mx, y: my, ts: performance.now() });
  if (trailPoints.length > 80) trailPoints.shift();
}, { passive: true });

// Hover state for color switch (green → red)
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => { cursorHovering = true; });
  el.addEventListener('mouseleave', () => { cursorHovering = false; });
});

// ── ASCII Character Grid Background + Cursor Trail ────────────────────────────
const canvas = document.getElementById('particle-canvas');
if (canvas) {
  const ctx   = canvas.getContext('2d');
  const CHARS = '!"#$%&\'*+,-./:;<=>?@[\\]^_|~§¶•¥€$¢©®™□○◇';
  const SZ    = 14;
  let cols, rows, cells = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width  / SZ) + 1;
    rows = Math.ceil(canvas.height / SZ) + 1;
    cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
          a:    Math.random() * 0.12 + 0.04,
          next: Math.random() * 5000
        });
      }
    }
  }

  function tick(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font         = `${SZ - 2}px 'JetBrains Mono', monospace`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    // Purge expired trail points
    const now = performance.now();
    while (trailPoints.length && now - trailPoints[0].ts > TRAIL_MS) {
      trailPoints.shift();
    }

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];

      // Occasionally mutate character
      if (ts > cell.next) {
        cell.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        cell.a    = Math.random() * 0.12 + 0.04;
        cell.next = ts + 2000 + Math.random() * 8000;
      }

      const c  = i % cols;
      const r  = Math.floor(i / cols);
      const cx = c * SZ + SZ / 2;
      const cy = r * SZ + SZ / 2;

      // Find max glow influence from trail
      let glow = 0;
      for (const p of trailPoints) {
        const dx  = cx - p.x;
        const dy  = cy - p.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < TRAIL_R_SQ) {
          const age     = (now - p.ts) / TRAIL_MS;        // 0 = fresh, 1 = expired
          const spatial = 1 - Math.sqrt(dSq) / TRAIL_R;   // 1 = on point, 0 = edge
          glow = Math.max(glow, spatial * (1 - age * age)); // squared falloff feels smoother
        }
      }

      if (glow > 0.05) {
        const col = cursorHovering ? '255, 59, 59' : '57, 255, 20';
        ctx.fillStyle = `rgba(${col}, ${Math.min(glow * 0.9, 0.85)})`;
      } else {
        ctx.fillStyle = `rgba(160, 160, 160, ${cell.a})`;
      }

      ctx.fillText(cell.char, c * SZ, r * SZ);
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(tick);
}

// ── Custom Cursor (dot only — ring replaced by ASCII trail) ──────────────────
const dot = document.createElement('div');
dot.className = 'cursor-dot';
document.body.appendChild(dot);
dot.style.opacity = '0';

document.addEventListener('mousemove', e => {
  dot.style.left    = e.clientX + 'px';
  dot.style.top     = e.clientY + 'px';
  dot.style.opacity = '1';
}, { passive: true });

document.addEventListener('mouseleave', () => {
  dot.style.opacity = '0';
});

// ── Magnetic hover on skill tags ──────────────────────────────────────────────
document.querySelectorAll('.skill-tag').forEach(tag => {
  tag.addEventListener('mousemove', (e) => {
    const rect = tag.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width  / 2;
    const y = e.clientY - rect.top  - rect.height / 2;
    tag.style.transform = `translateY(-2px) translate(${x * 0.1}px, ${y * 0.1}px)`;
  });
  tag.addEventListener('mouseleave', () => {
    tag.style.transform = '';
  });
});
