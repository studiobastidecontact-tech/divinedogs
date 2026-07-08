/* ==========================================================================
   Divine Dogs v3.1 — Bootstrap principal (accueil)
   ========================================================================== */
(function() {
  'use strict';
  const LANG_KEY = 'dd_lang';
  const ANNOUNCE_KEY = 'dd_announce_closed';

  async function loadData() {
    try {
      const res = await fetch('data/data.json?t=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      console.error('Erreur data.json:', err);
      document.body.innerHTML = `<div style="padding:3rem;font-family:sans-serif;text-align:center"><h1>Erreur de chargement</h1><p>${err.message}</p></div>`;
      return null;
    }
  }

  const getStoredLang = () => localStorage.getItem(LANG_KEY);
  const setStoredLang = (l) => localStorage.setItem(LANG_KEY, l);

  // Comportements partagés (réutilisés par les sous-pages via window.DD_BEHAVIORS)
  function attachCommon(data, opts = {}) {
    const nav = document.getElementById('nav');
    const announce = document.getElementById('announce');
    const hasAnnounce = announce && !announce.classList.contains('hidden');
    if (nav && hasAnnounce) nav.classList.add('with-announce');

    if (nav) {
      const onScroll = () => { nav.classList.toggle('scrolled', window.scrollY > 50); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Announce close
    const closeBtn = document.getElementById('announceClose');
    if (closeBtn && announce) {
      if (localStorage.getItem(ANNOUNCE_KEY) === '1') {
        announce.classList.add('hidden');
        if (nav) nav.classList.remove('with-announce');
      }
      closeBtn.addEventListener('click', () => {
        announce.classList.add('hidden');
        if (nav) nav.classList.remove('with-announce');
        localStorage.setItem(ANNOUNCE_KEY, '1');
      });
    }

    // Mobile menu
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
      const setMenu = (open) => {
        links.classList.toggle('open', open);
        if (nav) nav.classList.toggle('menu-open', open);
        document.body.classList.toggle('menu-open', open);
        toggle.innerHTML = window.icon(open ? 'x' : 'menu', 28);
      };
      toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
      links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    }

    // Lang toggle
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const newLang = window.DD_LANG === 'fr' ? 'en' : 'fr';
        window.DD_LANG = newLang;
        setStoredLang(newLang);
        if (opts.onLangChange) opts.onLangChange(data);
      });
    }

    // Reveal
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) { setTimeout(() => entry.target.classList.add('visible'), i * 60); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
      reveals.forEach(el => obs.observe(el));
    }

    // Back to top
    const backTop = document.getElementById('backTop');
    if (backTop) {
      const onScrollBack = () => { backTop.classList.toggle('visible', window.scrollY > 600); };
      window.addEventListener('scroll', onScrollBack, { passive: true });
      backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      onScrollBack();
    }
  }

  function attachForm(data) {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      const email = form.querySelector('[name="email"]').value.trim();
      const phone = form.querySelector('[name="phone"]').value.trim();
      if (!email && !phone) {
        e.preventDefault();
        alert(window.DD_LANG === 'en' ? 'Please provide either an email or a phone number.' : 'Veuillez fournir un email ou un numéro de téléphone.');
        return;
      }
      if (form.action) {
        e.preventDefault();
        try {
          const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } });
          if (res.ok) showFormSuccess(); else throw new Error('net');
        } catch (err) {
          alert(window.DD_LANG === 'en' ? 'An error occurred. Please try again or contact us directly.' : 'Une erreur est survenue. Réessayez ou contactez-nous directement.');
        }
      } else {
        e.preventDefault();
        showFormSuccess();
      }
    });
  }

  function showFormSuccess() {
    const fields = document.getElementById('formFields');
    const success = document.getElementById('formSuccess');
    if (fields) fields.style.display = 'none';
    if (success) success.classList.add('visible');
    document.getElementById('contactForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) { loading.classList.add('hidden'); setTimeout(() => loading.remove(), 600); }
  }

  function rerender(data) {
    window.DD_RENDER.all(data);
    requestAnimationFrame(() => { attachCommon(data, { onLangChange: rerender }); attachForm(data); });
  }

  async function init() {
    const data = await loadData();
    if (!data) return;
    window.DD_LANG = getStoredLang() || data.defaultLang || 'fr';
    window.DD_DATA = data;
    window.DD_RENDER.all(data);
    requestAnimationFrame(() => {
      attachCommon(data, { onLangChange: rerender });
      attachForm(data);
      hideLoading();
    });
  }

  // Exposé pour les sous-pages
  window.DD_BEHAVIORS = { attachCommon, hideLoading, loadData, getStoredLang, setStoredLang };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
