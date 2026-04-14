const navToggle = document.getElementById('nav-toggle');
const header = document.querySelector('.site-header');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
  });
}

const navLinks = document.querySelectorAll('.nav a');
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
  });
});

window.addEventListener('scroll', () => {
  if (window.scrollY > 24) {
    header.classList.add('shadow');
  } else {
    header.classList.remove('shadow');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');

  // Add scroll-fade class to all non-hero animated elements
  const scrollTargets = document.querySelectorAll(
    '.section-grid > div, .skill-card, .project-card, .contact-card'
  );

  scrollTargets.forEach((el, i) => {
    el.classList.add('scroll-fade');
    // Stagger within each row of up to 4
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  });

  // Reveal elements as they enter the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  scrollTargets.forEach((el) => observer.observe(el));
});
