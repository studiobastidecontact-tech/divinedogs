/* ==========================================================================
   Divine Dogs — Bootstrap principal
   Charge data.json, rend le site, attache les comportements
   ========================================================================== */

(function() {
  'use strict';

  // ============ Chargement des données ============
  async function loadData() {
    try {
      const url = 'data/data.json?t=' + Date.now(); // cache-bust
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      console.error('Erreur chargement data.json:', err);
      document.body.innerHTML = `
        <div style="padding:3rem;font-family:sans-serif;text-align:center">
          <h1>Erreur de chargement</h1>
          <p>Impossible de charger les données du site.</p>
          <p style="opacity:.6;font-size:.9em">${err.message}</p>
        </div>
      `;
      return null;
    }
  }

  // ============ Comportements interactifs ============
  function attachBehaviors() {
    // Nav scroll effect
    const nav = document.getElementById('nav');
    if (nav) {
      const onScroll = () => {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Menu mobile
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => links.classList.remove('open'))
      );
    }

    // Reveal animations
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length && 'IntersectionObserver' in window) {
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

    // Formulaire de contact (fallback si pas de Formspree configuré)
    const form = document.querySelector('.contact-form');
    if (form && !form.action) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Le formulaire n\'est pas encore connecté. Veuillez configurer un endpoint Formspree dans l\'admin.');
      });
    }
  }

  // ============ Hide loading ============
  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
      setTimeout(() => loading.remove(), 600);
    }
  }

  // ============ Init ============
  async function init() {
    const data = await loadData();
    if (!data) return;

    window.DD_DATA = data;
    window.DD_RENDER.all(data);
    
    // Attendre que le DOM soit stable puis attacher comportements
    requestAnimationFrame(() => {
      attachBehaviors();
      hideLoading();
    });
  }

  // Démarrage
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
