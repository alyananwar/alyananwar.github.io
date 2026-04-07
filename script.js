// Scroll reveal with staggered timing
const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const parent = entry.target.parentElement;
      const siblings = Array.from(parent.querySelectorAll('.reveal'));
      const index = siblings.indexOf(entry.target);

      setTimeout(() => {
        entry.target.classList.add('visible');
      }, index * 120);

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
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Parallax-like fade on hero content
const heroInner = document.querySelector('.hero-inner');

if (heroInner) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight) {
      const opacity = 1 - (scrolled / (window.innerHeight * 0.8));
      const translate = scrolled * 0.3;
      heroInner.style.opacity = Math.max(0, opacity);
      heroInner.style.transform = `translateY(${translate}px)`;
    }
  }, { passive: true });
}

// ── ASCII Character Grid Background ──────────────────────────────────────────
const canvas = document.getElementById('particle-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const CHARS = '!"#$%&\'*+,-./:;<=>?@[\\]^_|~§¶•¥€$¢©®™□○◇';
  const SZ = 14;
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
    ctx.font          = `${SZ - 2}px 'JetBrains Mono', monospace`;
    ctx.textAlign     = 'left';
    ctx.textBaseline  = 'top';

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (ts > cell.next) {
        cell.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        cell.a    = Math.random() * 0.12 + 0.04;
        cell.next = ts + 2000 + Math.random() * 8000;
      }
      const c = i % cols;
      const r = Math.floor(i / cols);
      ctx.fillStyle = `rgba(57, 255, 20, ${cell.a})`;
      ctx.fillText(cell.char, c * SZ, r * SZ);
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(tick);
}

// ── Custom Cursor (dot + ring) ────────────────────────────────────────────────
const dot  = document.createElement('div');
dot.className  = 'cursor-dot';
const ring = document.createElement('div');
ring.className = 'cursor-ring';
document.body.appendChild(dot);
document.body.appendChild(ring);

let mx = -100, my = -100;
let rx = -100, ry = -100;
dot.style.opacity  = '0';
ring.style.opacity = '0';

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  dot.style.opacity  = '1';
  ring.style.opacity = '1';
}, { passive: true });

document.addEventListener('mouseleave', () => {
  dot.style.opacity  = '0';
  ring.style.opacity = '0';
});

// Expand ring on interactive elements
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => ring.classList.remove('cursor-hover'));
});

(function cursorLoop() {
  dot.style.left  = mx + 'px';
  dot.style.top   = my + 'px';

  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';

  requestAnimationFrame(cursorLoop);
})();

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
