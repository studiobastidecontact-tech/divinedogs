/* ==========================================================================
   Divine Dogs v3 — Moteur de rendu
   ========================================================================== */

(function() {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Surligne les mots impactants en rose dans un texte
  function highlightWords(text, highlights) {
    if (!text || !highlights || !highlights.length) return esc(text);
    let result = esc(text);
    // Trier par longueur décroissante pour éviter les conflits (ex: "Divine" vs "Divine Dogs")
    const sorted = [...highlights].sort((a, b) => b.length - a.length);
    sorted.forEach(word => {
      const escWord = esc(word);
      // Échapper les caractères regex
      const safe = escWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${safe})`, 'g');
      result = result.replace(regex, '<span class="hl">$1</span>');
    });
    return result;
  }

  // Récupère le bloc i18n actif
  function lang(data, key) {
    const currentLang = window.DD_LANG || data.defaultLang || 'fr';
    if (key) {
      return (data[key] && data[key][currentLang]) || (data[key] && data[key].fr) || {};
    }
    return currentLang;
  }

  // ============ THÈME ============
  function applyTheme(theme) {
    const root = document.documentElement;
    const c = theme.colors || {};
    Object.entries({
      '--jet-black': c.jetBlack,
      '--espresso': c.espresso,
      '--espresso-deep': c.espressoDeep,
      '--espresso-soft': c.espressoSoft,
      '--hazelnut': c.hazelnut,
      '--hazelnut-soft': c.hazelnutSoft,
      '--hazelnut-deep': c.hazelnutDeep,
      '--cream': c.cream,
      '--rose': c.rose,
      '--rose-deep': c.roseDeep,
      '--ink': c.espresso,
      '--ink-soft': c.espressoSoft,
      '--bg': c.cream
    }).forEach(([k, v]) => { if (v) root.style.setProperty(k, v); });
  }

  // ============ NAVIGATION ============
  function renderNav(data) {
    const m = data.meta || {};
    const navData = lang(data, 'nav');
    const links = navData.links || [];
    const currentLang = lang(data);

    return `
      <a href="#" class="logo" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">${esc(m.siteName || 'DIVINE DOGS')}</a>
      <div class="nav-right">
        <ul class="nav-links" id="navLinks">
          ${links.map(l => `
            <li><a href="${esc(l.anchor)}"${l.cta ? ' class="nav-cta"' : ''}>${esc(l.label)}</a></li>
          `).join('')}
        </ul>
        <button class="lang-toggle" id="langToggle" aria-label="Changer de langue">
          ${window.icon('globe', 14)}
          <span><span class="active-lang">${currentLang.toUpperCase()}</span> / ${currentLang === 'fr' ? 'EN' : 'FR'}</span>
        </button>
        <button class="menu-toggle" id="menuToggle" aria-label="Menu">${window.icon('menu', 28)}</button>
      </div>
    `;
  }

  // ============ HERO ============
  function renderHero(data) {
    const h = data.hero || {};
    if (h.enabled === false) return '';
    const l = lang(data, 'hero');
    return `
      <section class="hero">
        <div class="hero-bg">
          <img src="${esc(h.backgroundImage)}" alt="" loading="eager">
        </div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1>${highlightWords(l.title || '', l.highlights || [])}</h1>
          ${l.subtitle ? `<p class="hero-sub">${esc(l.subtitle)}</p>` : ''}
        </div>
      </section>
    `;
  }

  // ============ PRÉSENTATION QUINCONCE ============
  function renderPresentation(data) {
    const p = data.presentation || {};
    if (p.enabled === false) return '';
    const l = lang(data, 'presentation');
    const blocks = l.blocks || [];

    return `
      <section class="section presentation">
        <div class="container">
          <div class="presentation-grid">
            ${blocks.map(b => `
              <div class="pres-block align-${esc(b.align || 'left')} reveal">
                <p>${highlightWords(b.text || '', b.highlights || [])}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // ============ ACCORDÉON "Ce que Divine Dogs n'est pas" ============
  function renderNotWhat(data) {
    const n = data.notWhat || {};
    if (n.enabled === false) return '';
    const l = lang(data, 'notWhat');
    return `
      <section class="not-what">
        <div class="not-what-container">
          <div class="accordion" id="notWhatAccordion">
            <div class="accordion-header" onclick="document.getElementById('notWhatAccordion').classList.toggle('open')">
              <h2 class="accordion-title">${esc(l.title || '')}</h2>
              <span class="accordion-icon">${window.icon('chevronDown', 16)}</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-content">
                <ul>
                  ${(l.items || []).map(item => `<li>${esc(item)}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ============ SERVICES (coming soon) ============
  function renderServices(data) {
    const s = data.services || {};
    if (s.enabled === false) return '';
    const l = lang(data, 'services');
    return `
      <section class="section services" id="services">
        <div class="container">
          <div class="services-coming reveal">
            <span class="section-eyebrow">${esc(l.eyebrow || '')}</span>
            <h2>${esc(l.title || '')}</h2>
            <p>${esc(l.description || '')}</p>
          </div>
        </div>
      </section>
    `;
  }

  // ============ CONTACT FORM ============
  function renderContact(data) {
    const c = data.contact || {};
    if (c.enabled === false) return '';
    const l = lang(data, 'contact');
    const f = l.fields || {};

    return `
      <section class="section contact" id="contact">
        <div class="container">
          <div class="contact-header reveal">
            <h2>${highlightWords(l.title || '', l.highlights || [])}</h2>
            ${l.description ? `<p>${esc(l.description)}</p>` : ''}
          </div>
          <form class="contact-form reveal" id="contactForm" ${c.formspreeEndpoint ? `action="${esc(c.formspreeEndpoint)}" method="POST"` : ''}>
            <div class="form-success" id="formSuccess">
              <div class="check">${window.icon('check', 36)}</div>
              <h3>Merci !</h3>
              <p>${esc(f.success || '')}</p>
            </div>

            <div class="form-fields" id="formFields">
              <div class="form-section-label">${esc(f.contactNote || '')}</div>
              <div class="form-double">
                <div class="form-row">
                  <label>${esc(f.firstName)}<span class="required">*</span></label>
                  <input type="text" name="firstName" required>
                </div>
                <div class="form-row">
                  <label>${esc(f.lastName)}<span class="required">*</span></label>
                  <input type="text" name="lastName" required>
                </div>
              </div>
              <div class="form-double">
                <div class="form-row">
                  <label>${esc(f.email)}</label>
                  <input type="email" name="email">
                </div>
                <div class="form-row">
                  <label>${esc(f.phone)}</label>
                  <input type="tel" name="phone">
                </div>
              </div>

              <div class="form-section-label">${esc(f.dogSection || '')}</div>
              <div class="form-triple">
                <div class="form-row">
                  <label>${esc(f.dogName)}</label>
                  <input type="text" name="dogName">
                </div>
                <div class="form-row">
                  <label>${esc(f.dogAge)}</label>
                  <input type="text" name="dogAge">
                </div>
                <div class="form-row">
                  <label>${esc(f.dogBreed)}</label>
                  <input type="text" name="dogBreed">
                </div>
              </div>

              <div class="form-row" style="margin-top:1.5rem">
                <label>${esc(f.message)}<span class="required">*</span></label>
                <textarea name="message" required></textarea>
              </div>

              <button type="submit" class="btn btn-primary">${esc(f.submit)} ${window.icon('send', 16)}</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  // ============ TÉMOIGNAGES ============
  function renderTestimonials(data) {
    const t = data.testimonials || {};
    if (t.enabled === false) return '';
    const l = lang(data, 'testimonials');
    const items = (t.items || []).slice(0, 5);
    const currentLang = lang(data);

    return `
      <section class="section testimonials" id="avis">
        <div class="container">
          <div class="testimonials-header reveal">
            <span class="section-eyebrow">${esc(l.eyebrow || '')}</span>
            <h2 class="section-title">${highlightWords(l.title || '', l.highlights || [])}</h2>
          </div>
          <div class="testimonials-grid">
            ${items.map(it => {
              const tx = it[currentLang] || it.fr || {};
              return `
                <div class="testimonial reveal">
                  <div class="testimonial-quote">"</div>
                  <div class="testimonial-stars">
                    ${Array(it.stars || 5).fill().map(() => window.icon('starFilled', 16)).join('')}
                  </div>
                  <p class="testimonial-text">${esc(tx.text)}</p>
                  <div class="testimonial-author">
                    <div class="testimonial-avatar">${esc((tx.author || '?').charAt(0))}</div>
                    <div>
                      <div class="testimonial-name">${esc(tx.author || '')}</div>
                      ${tx.dog ? `<div class="testimonial-dog">${esc(tx.dog)}</div>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // ============ SOCIAL ============
  function renderSocial(data) {
    const s = data.social || {};
    if (s.enabled === false) return '';
    const l = lang(data, 'social');
    return `
      <section class="social">
        <div class="container">
          <h2>${highlightWords(l.title || '', l.highlights || [])}</h2>
          <div class="social-icons">
            ${s.instagramUrl ? `<a href="${esc(s.instagramUrl)}" target="_blank" rel="noopener" class="social-icon" aria-label="Instagram">${window.icon('instagram', 22)}</a>` : ''}
            ${s.facebookUrl ? `<a href="${esc(s.facebookUrl)}" target="_blank" rel="noopener" class="social-icon" aria-label="Facebook">${window.icon('facebook', 22)}</a>` : ''}
            ${s.tiktokUrl ? `<a href="${esc(s.tiktokUrl)}" target="_blank" rel="noopener" class="social-icon" aria-label="TikTok">${window.icon('tiktok', 22)}</a>` : ''}
          </div>
        </div>
      </section>
    `;
  }

  // ============ FOOTER ============
  function renderFooter(data) {
    const m = data.meta || {};
    const f = data.footer || {};
    const l = lang(data, 'footer');
    return `
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="#" class="logo" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">${esc(m.siteName || 'DIVINE DOGS')}</a>
          ${l.tagline ? `<p class="footer-tagline">${esc(l.tagline)}</p>` : ''}
        </div>
        <div class="footer-legal">
          <h4>${esc(l.legalTitle || 'Légal')}</h4>
          <ul>
            ${(l.legalLinks || []).map(li => `<li><a href="${esc(li.url)}">${esc(li.label)}</a></li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        © ${esc(f.year || '2026')} ${esc(m.siteName || 'DIVINE DOGS')}
      </div>
    `;
  }

  // ============ BACK TO TOP ============
  function renderBackTop() {
    return `<button class="back-top" id="backTop" aria-label="Retour en haut">${window.icon('paw', 26)}</button>`;
  }

  // ============ RENDU COMPLET ============
  function renderAll(data) {
    if (!data) return;

    // META selon langue active
    const m = data.meta || {};
    const currentLang = lang(data);
    const localMeta = m[currentLang] || m.fr || {};
    if (localMeta.pageTitle) document.title = localMeta.pageTitle;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl && localMeta.description) descEl.content = localMeta.description;
    document.documentElement.lang = currentLang;

    // THÈME
    if (data.theme) applyTheme(data.theme);

    const nav = document.getElementById('nav');
    const main = document.getElementById('main');
    const footer = document.getElementById('footer');
    const extras = document.getElementById('extras');

    if (nav) nav.innerHTML = renderNav(data);
    if (main) main.innerHTML = [
      renderHero(data),
      renderPresentation(data),
      renderNotWhat(data),
      renderServices(data),
      renderContact(data),
      renderTestimonials(data),
      renderSocial(data)
    ].join('');
    if (footer) footer.innerHTML = renderFooter(data);
    if (extras) extras.innerHTML = renderBackTop();
  }

  window.DD_RENDER = { all: renderAll, theme: applyTheme, esc: esc, highlightWords: highlightWords };
})();
