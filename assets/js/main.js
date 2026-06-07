/* ==========================================================================
   Divine Dogs v3 — Bootstrap principal
   ========================================================================== */

(function() {
  'use strict';

  const LANG_KEY = 'dd_lang';

  async function loadData() {
    try {
      const url = 'data/data.json?t=' + Date.now();
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      console.error('Erreur chargement data.json:', err);
      document.body.innerHTML = `<div style="padding:3rem;font-family:sans-serif;text-align:center"><h1>Erreur</h1><p>${err.message}</p></div>`;
      return null;
    }
  }

  function getStoredLang() {
    return localStorage.getItem(LANG_KEY);
  }

  function setStoredLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
  }

  function attachBehaviors(data) {
    const nav = document.getElementById('nav');
    if (nav) {
      const onScroll = () => {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Mobile menu
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => links.classList.remove('open'))
      );
    }

    // Language toggle
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const newLang = window.DD_LANG === 'fr' ? 'en' : 'fr';
        window.DD_LANG = newLang;
        setStoredLang(newLang);
        // Re-render tout le site avec la nouvelle langue
        window.DD_RENDER.all(data);
        // Réattacher les comportements après re-render
        requestAnimationFrame(() => attachBehaviors(data));
      });
    }

    // Reveal animations
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 60);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
      reveals.forEach(el => observer.observe(el));
    }

    // Back to top
    const backTop = document.getElementById('backTop');
    if (backTop) {
      const onScrollBack = () => {
        if (window.scrollY > 600) backTop.classList.add('visible');
        else backTop.classList.remove('visible');
      };
      window.addEventListener('scroll', onScrollBack, { passive: true });
      backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      onScrollBack();
    }

    // Form: validation + success message
    const form = document.getElementById('contactForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        const email = form.querySelector('[name="email"]').value.trim();
        const phone = form.querySelector('[name="phone"]').value.trim();
        // Email OU téléphone obligatoire
        if (!email && !phone) {
          e.preventDefault();
          alert(window.DD_LANG === 'en'
            ? 'Please provide either an email or a phone number.'
            : 'Veuillez fournir un email ou un numéro de téléphone.');
          return;
        }

        // Si Formspree configuré → soumission AJAX
        if (form.action) {
          e.preventDefault();
          try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
              showFormSuccess();
            } else {
              throw new Error('Network error');
            }
          } catch (err) {
            alert(window.DD_LANG === 'en'
              ? 'An error occurred. Please try again or contact us directly.'
              : 'Une erreur est survenue. Veuillez réessayer ou nous contacter directement.');
          }
        } else {
          // Pas de Formspree, on simule un succès (mode démo)
          e.preventDefault();
          showFormSuccess();
        }
      });
    }
  }

  function showFormSuccess() {
    const fields = document.getElementById('formFields');
    const success = document.getElementById('formSuccess');
    if (fields) fields.style.display = 'none';
    if (success) success.classList.add('visible');
    // Scroll vers le formulaire pour bien voir le message
    document.getElementById('contactForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
      setTimeout(() => loading.remove(), 600);
    }
  }

  async function init() {
    const data = await loadData();
    if (!data) return;

    // Langue initiale : stockée > defaultLang > 'fr'
    window.DD_LANG = getStoredLang() || data.defaultLang || 'fr';
    window.DD_DATA = data;

    window.DD_RENDER.all(data);

    requestAnimationFrame(() => {
      attachBehaviors(data);
      hideLoading();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
