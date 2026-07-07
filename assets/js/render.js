/* ==========================================================================
   Divine Dogs v3.1 — Moteur de rendu
   ========================================================================== */
(function() {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function highlightWords(text, highlights) {
    if (!text || !highlights || !highlights.length) return esc(text);
    let result = esc(text);
    const sorted = [...highlights].sort((a, b) => b.length - a.length);
    sorted.forEach(word => {
      const safe = esc(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`(${safe})`, 'g'), '<span class="hl">$1</span>');
    });
    return result;
  }

  function lang(data, key) {
    const L = window.DD_LANG || data.defaultLang || 'fr';
    if (key) return (data[key] && data[key][L]) || (data[key] && data[key].fr) || {};
    return L;
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const c = theme.colors || {};
    const map = {
      '--jet-black': c.jetBlack, '--espresso': c.espresso, '--espresso-deep': c.espressoDeep,
      '--espresso-soft': c.espressoSoft, '--hazelnut': c.hazelnut, '--hazelnut-soft': c.hazelnutSoft,
      '--hazelnut-deep': c.hazelnutDeep, '--cream': c.cream, '--rose': c.rose, '--rose-deep': c.roseDeep,
      '--ink': c.espresso, '--ink-soft': c.espressoSoft
    };
    Object.entries(map).forEach(([k, v]) => { if (v) root.style.setProperty(k, v); });
  }

  function applyMeta(data) {
    const L = lang(data);
    const m = (data.meta && data.meta[L]) || (data.meta && data.meta.fr) || {};
    if (m.pageTitle) document.title = m.pageTitle;
    const d = document.querySelector('meta[name="description"]');
    if (d && m.description) d.content = m.description;
    document.documentElement.lang = L;
  }

  // ---- ANNOUNCE ----
  function renderAnnounce(data) {
    const a = data.announce || {};
    if (!a.enabled) return '';
    const l = lang(data, 'announce');
    if (!l.text) return '';
    return `<div class="announce" id="announce"><span>${esc(l.text)}</span><button class="close" id="announceClose" aria-label="Fermer">${window.icon('x', 16)}</button></div>`;
  }

  // ---- NAV ----
  function renderNav(data, activePage) {
    const m = data.meta || {};
    const navData = lang(data, 'nav');
    const L = lang(data);
    const links = navData.links || [];
    const homePrefix = (activePage === 'home') ? '' : '';
    return `
      <a href="index.html" class="logo">${esc(m.siteName || 'DIVINE DOGS')}</a>
      <div class="nav-right">
        <ul class="nav-links" id="navLinks">
          ${links.map(l => {
            const isActive = (l.id === activePage) ? ' active' : '';
            return `<li><a href="${esc(l.anchor)}" class="${l.cta ? 'nav-cta' : ''}${isActive}">${esc(l.label)}</a></li>`;
          }).join('')}
        </ul>
        <button class="lang-toggle" id="langToggle" aria-label="Langue">
          ${window.icon('globe', 14)}
          <span><span class="active-lang">${L.toUpperCase()}</span> / ${L === 'fr' ? 'EN' : 'FR'}</span>
        </button>
        <button class="menu-toggle" id="menuToggle" aria-label="Menu">${window.icon('menu', 28)}</button>
      </div>`;
  }

  // ---- FOOTER ----
  function renderFooter(data) {
    const m = data.meta || {};
    const f = data.footer || {};
    const l = lang(data, 'footer');
    const navData = lang(data, 'nav');
    return `
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="logo">${esc(m.siteName || 'DIVINE DOGS')}</a>
          ${l.tagline ? `<p class="footer-tagline">${esc(l.tagline)}</p>` : ''}
        </div>
        <div class="footer-col">
          <h4>Navigation</h4>
          <ul>${(navData.links || []).map(li => `<li><a href="${esc(li.anchor)}">${esc(li.label)}</a></li>`).join('')}</ul>
        </div>
        <div class="footer-col">
          <h4>${esc(l.legalTitle || 'Légal')}</h4>
          <ul>${(l.legalLinks || []).map(li => `<li><a href="${esc(li.url)}">${esc(li.label)}</a></li>`).join('')}</ul>
        </div>
      </div>
      <div class="footer-bottom">© ${esc(f.year || '2026')} ${esc(m.siteName || 'DIVINE DOGS')} — Tous droits réservés</div>`;
  }

  function renderBackTop() {
    return `<button class="back-top" id="backTop" aria-label="Retour en haut">${window.icon('paw', 26)}</button>`;
  }

  // ---- HERO ----
  function renderHero(data) {
    const h = data.hero || {};
    if (h.enabled === false) return '';
    const l = lang(data, 'hero');
    const contact = lang(data, 'nav').links?.find(x => x.id === 'contact');
    return `
      <section class="hero">
        <div class="hero-bg"><img src="${esc(h.backgroundImage)}" alt="Un chien complice avec sa famille" loading="eager"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1>${highlightWords(l.title || '', l.highlights || [])}</h1>
          ${l.subtitle ? `<p class="hero-sub">${esc(l.subtitle)}</p>` : ''}
          ${contact ? `<a href="${esc(contact.anchor)}" class="btn btn-light hero-cta">${esc(contact.label)} ${window.icon('arrowRight', 16)}</a>` : ''}
        </div>
      </section>`;
  }

  // ---- PRESENTATION ----
  function renderPresentation(data) {
    const p = data.presentation || {};
    if (p.enabled === false) return '';
    const l = lang(data, 'presentation');
    return `
      <section class="section presentation">
        <div class="container">
          <div class="presentation-grid">
            ${(l.blocks || []).map(b => `
              <div class="pres-block align-${esc(b.align || 'left')} reveal">
                <p>${highlightWords(b.text || '', b.highlights || [])}</p>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
  }

  // ---- VALUES ----
  function renderValues(data) {
    const v = data.values || {};
    if (v.enabled === false) return '';
    const l = lang(data, 'values');
    return `
      <section class="section values">
        <div class="container">
          <div class="values-header reveal">
            <span class="section-eyebrow">${esc(l.eyebrow || '')}</span>
            <h2 class="section-title">${highlightWords(l.title || '', l.highlights || [])}</h2>
          </div>
          <div class="values-grid">
            ${(l.items || []).map((it, i) => `
              <div class="value-card reveal"><span class="num">0${i + 1}</span><p>${esc(it)}</p></div>`).join('')}
          </div>
          ${l.devise ? `<p class="values-devise reveal">« ${esc(l.devise)} »</p>` : ''}
        </div>
      </section>`;
  }

  // ---- NOT WHAT (accordion) ----
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
            <div class="accordion-body"><div class="accordion-content">
              <ul>${(l.items || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>
            </div></div>
          </div>
        </div>
      </section>`;
  }

  // ---- CONTACT ----
  function renderContact(data) {
    const c = data.contact || {};
    if (c.enabled === false) return '';
    const l = lang(data, 'contact');
    const f = l.fields || {};
    const dp = c.dataPrivacy || {};
    const dpl = (dp[lang(data)]) || dp.fr || {};
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
              <h3>Merci !</h3><p>${esc(f.success || '')}</p>
            </div>
            <div class="form-fields" id="formFields">
              <div class="form-section-label">${esc(f.contactNote || '')}</div>
              <div class="form-double">
                <div class="form-row"><label>${esc(f.firstName)}<span class="required">*</span></label><input type="text" name="firstName" required></div>
                <div class="form-row"><label>${esc(f.lastName)}<span class="required">*</span></label><input type="text" name="lastName" required></div>
              </div>
              <div class="form-double">
                <div class="form-row"><label>${esc(f.email)}</label><input type="email" name="email"></div>
                <div class="form-row"><label>${esc(f.phone)}</label><input type="tel" name="phone"></div>
              </div>
              <div class="form-row"><label>${esc(f.city)}</label><input type="text" name="city"></div>
              <div class="form-section-label">${esc(f.dogSection || '')}</div>
              <div class="form-triple">
                <div class="form-row"><label>${esc(f.dogName)}</label><input type="text" name="dogName"></div>
                <div class="form-row"><label>${esc(f.dogAge)}</label><input type="text" name="dogAge"></div>
                <div class="form-row"><label>${esc(f.dogBreed)}</label><input type="text" name="dogBreed"></div>
              </div>
              <div class="form-row" style="margin-top:1.5rem"><label>${esc(f.message)}<span class="required">*</span></label><textarea name="message" required></textarea></div>
              <button type="submit" class="btn btn-primary">${esc(f.submit)} ${window.icon('send', 16)}</button>
            </div>
          </form>
          ${dp.enabled !== false && dpl.title ? `
          <div class="data-privacy-wrap reveal">
            <div class="accordion light" id="dpAccordion">
              <div class="accordion-header" onclick="document.getElementById('dpAccordion').classList.toggle('open')">
                <h2 class="accordion-title">${esc(dpl.title)}</h2>
                <span class="accordion-icon">${window.icon('chevronDown', 16)}</span>
              </div>
              <div class="accordion-body"><div class="accordion-content"><p>${esc(dpl.body || '')}</p></div></div>
            </div>
          </div>` : ''}
        </div>
      </section>`;
  }

  // ---- TESTIMONIALS ----
  function renderTestimonials(data) {
    const t = data.testimonials || {};
    if (t.enabled === false) return '';
    const l = lang(data, 'testimonials');
    const L = lang(data);
    const items = (t.items || []).slice(0, 5);
    return `
      <section class="section testimonials" id="avis">
        <div class="container">
          <div class="testimonials-header reveal">
            <span class="section-eyebrow">${esc(l.eyebrow || '')}</span>
            <h2 class="section-title">${highlightWords(l.title || '', l.highlights || [])}</h2>
          </div>
          <div class="testimonials-grid">
            ${items.map(it => {
              const tx = it[L] || it.fr || {};
              return `
                <div class="testimonial reveal">
                  <div class="testimonial-quote">"</div>
                  <div class="testimonial-stars">${Array(it.stars || 5).fill().map(() => window.icon('starFilled', 16)).join('')}</div>
                  <p class="testimonial-text">${esc(tx.text)}</p>
                  <div class="testimonial-author">
                    <div class="testimonial-avatar">${esc((tx.author || '?').charAt(0))}</div>
                    <div><div class="testimonial-name">${esc(tx.author || '')}</div>${tx.dog ? `<div class="testimonial-dog">${esc(tx.dog)}</div>` : ''}</div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </section>`;
  }

  // ---- PARTNER ----
  function renderPartner(data) {
    const p = data.partner || {};
    if (p.enabled === false) return '';
    const l = lang(data, 'partner');
    if (!l.name) return '';
    return `
      <section class="section partner-section">
        <div class="container-narrow">
          <div class="partner-card reveal">
            <span class="section-eyebrow">${esc(l.eyebrow || '')}</span>
            <h3 class="partner-name">${esc(l.name)}</h3>
            ${l.text ? `<p class="partner-text">${esc(l.text)}</p>` : ''}
            ${p.code ? `<div class="partner-code"><span>Code</span><strong>${esc(p.code)}</strong></div>` : ''}
            ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" class="btn btn-rose">${esc(l.cta || 'Découvrir')} ${window.icon('upRight', 16)}</a>` : ''}
          </div>
        </div>
      </section>`;
  }

  // ---- SOCIAL ----
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
      </section>`;
  }

  // ---- FULL HOME RENDER ----
  function renderAll(data) {
    if (!data) return;
    applyMeta(data);
    if (data.theme) applyTheme(data.theme);
    const announce = document.getElementById('announce-slot');
    const nav = document.getElementById('nav');
    const main = document.getElementById('main');
    const footer = document.getElementById('footer');
    const extras = document.getElementById('extras');
    if (announce) announce.innerHTML = renderAnnounce(data);
    if (nav) nav.innerHTML = renderNav(data, 'home');
    if (main) main.innerHTML = [
      renderHero(data), renderPresentation(data), renderValues(data),
      renderNotWhat(data), renderContact(data), renderTestimonials(data), renderPartner(data), renderSocial(data)
    ].join('');
    if (footer) footer.innerHTML = renderFooter(data);
    if (extras) extras.innerHTML = renderBackTop();
  }

  window.DD_RENDER = {
    all: renderAll, theme: applyTheme, meta: applyMeta, esc, highlightWords, lang,
    announce: renderAnnounce, nav: renderNav, footer: renderFooter, backTop: renderBackTop
  };
})();
