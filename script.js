// Scroll reveal with staggered timing
const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // Stagger siblings within the same parent
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

// Nav border + subtle shadow on scroll
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

// Parallax-like effect on hero content
const heroContent = document.querySelector('.hero-content');
const heroGlow = document.querySelector('.hero::before');

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  if (scrolled < window.innerHeight) {
    const opacity = 1 - (scrolled / (window.innerHeight * 0.8));
    const translate = scrolled * 0.3;
    heroContent.style.opacity = Math.max(0, opacity);
    heroContent.style.transform = `translateY(${translate}px)`;
  }
}, { passive: true });

// ── Particle Network (Hero) ──────────────────────────────────────────────────
const canvas = document.getElementById('particle-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const COUNT = 65;
  const CONNECT_DIST = 140;
  const REPEL_DIST = 110;
  const ACCENT = '184, 196, 212';
  let particles = [];
  let rafId = null;
  let mouse = { x: null, y: null };

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x  = Math.random() * canvas.width;
      this.y  = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.r  = Math.random() * 1.5 + 0.5;
      this.a  = Math.random() * 0.45 + 0.15;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width)  this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;

      if (mouse.x !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < REPEL_DIST) {
          const f = (REPEL_DIST - d) / REPEL_DIST;
          this.x += (dx / d) * f * 2.5;
          this.y += (dy / d) * f * 2.5;
        }
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT}, ${this.a})`;
      ctx.fill();
    }
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${ACCENT}, ${(1 - d / CONNECT_DIST) * 0.25})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => { p.update(); p.draw(); });
    rafId = requestAnimationFrame(tick);
  }

  // Only animate when hero is visible — save CPU when scrolled away
  const heroSection = document.querySelector('.hero');
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!rafId) rafId = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }).observe(heroSection);

  // Track mouse relative to canvas
  heroSection.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  heroSection.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  window.addEventListener('resize', () => {
    resize();
    particles.forEach(p => p.init());
  }, { passive: true });

  resize();
  particles = Array.from({ length: COUNT }, () => new Particle());
  rafId = requestAnimationFrame(tick);
}

// ── Cursor Spotlight ──────────────────────────────────────────────────────────
const spotlight = document.createElement('div');
spotlight.className = 'cursor-spotlight';
document.body.appendChild(spotlight);
spotlight.style.opacity = '0';

document.addEventListener('mousemove', e => {
  spotlight.style.left    = e.clientX + 'px';
  spotlight.style.top     = e.clientY + 'px';
  spotlight.style.opacity = '1';
}, { passive: true });

document.addEventListener('mouseleave', () => {
  spotlight.style.opacity = '0';
});

// ── Magnetic hover effect on skill tags ──────────────────────────────────────
// Magnetic hover effect on skill tags
document.querySelectorAll('.skill-tag').forEach(tag => {
  tag.addEventListener('mousemove', (e) => {
    const rect = tag.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    tag.style.transform = `translateY(-2px) translate(${x * 0.1}px, ${y * 0.1}px)`;
  });

  tag.addEventListener('mouseleave', () => {
    tag.style.transform = '';
  });
});
