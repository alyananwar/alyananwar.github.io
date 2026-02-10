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
