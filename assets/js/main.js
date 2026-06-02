/* ==========================================================================
   Divine Dogs — Script principal
   Gère : nav scroll, menu mobile, animations reveal, formulaire
   ========================================================================== */

(function() {
  'use strict';

  // ============ NAV scroll effect ============
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    });
  }

  // ============ Menu mobile ============
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open'))
    );
  }

  // ============ Reveal animations on scroll ============
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(el => observer.observe(el));
  }

  // ============ Formulaire de contact ============
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // TODO : brancher Formspree, Brevo ou autre service d'envoi
      alert('Formulaire de démonstration — à connecter à un service d\'envoi (Formspree, Brevo, etc.)');
    });
  }

  // ============ Scroll-to-top via logo ============
  document.querySelectorAll('.logo').forEach(logo => {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

})();
