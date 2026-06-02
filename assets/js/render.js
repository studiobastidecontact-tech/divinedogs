/* ==========================================================================
   Divine Dogs — Moteur de rendu
   Transforme data.json en HTML, applique les thèmes, gère les ré-renders
   ========================================================================== */

(function() {
  'use strict';

  // Helper : échappement HTML
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper : préserve les \n dans le texte
  function escMultiline(str) {
    return esc(str).replace(/\n/g, '<br>');
  }

  // ============ THÈME ============
  function applyTheme(theme) {
    const root = document.documentElement;
    const c = theme.colors || {};

    if (c.espresso) root.style.setProperty('--espresso', c.espresso);
    if (c.espressoDeep) root.style.setProperty('--espresso-deep', c.espressoDeep);
    if (c.espressoSoft) root.style.setProperty('--espresso-soft', c.espressoSoft);
    if (c.butter) root.style.setProperty('--butter', c.butter);
    if (c.butterDeep) root.style.setProperty('--butter-deep', c.butterDeep);
    if (c.butterSoft) root.style.setProperty('--butter-soft', c.butterSoft);
    if (c.cream) root.style.setProperty('--cream', c.cream);
    if (c.accent) root.style.setProperty('--accent', c.accent);
    if (c.accentWarm) root.style.setProperty('--accent-warm', c.accentWarm);

    // Ink reprend espresso si pas défini
    root.style.setProperty('--ink', c.espresso || '#3E2723');
    root.style.setProperty('--ink-soft', c.espressoSoft || '#5C3F3A');

    // Polices
    const f = theme.fonts || {};
    if (f.display) root.style.setProperty('--font-display', `'${f.display}', -apple-system, sans-serif`);
    if (f.body) root.style.setProperty('--font-body', `'${f.body}', -apple-system, sans-serif`);
    if (f.hand) root.style.setProperty('--font-hand', `'${f.hand}', cursive`);

    // Charger dynamiquement les polices Google
    if (f.display || f.body || f.hand) {
      loadGoogleFonts([f.display, f.body, f.hand].filter(Boolean));
    }

    // Options
    const opts = theme.options || {};
    document.body.classList.toggle('grain', opts.showGrainOverlay !== false);
  }

  function loadGoogleFonts(fonts) {
    const unique = [...new Set(fonts)];
    const families = unique.map(f => {
      const name = f.replace(/ /g, '+');
      // Polices avec italique
      if (f.includes('Zalando') || f.includes('Fraunces') || f.includes('Inter') || f.includes('Playfair')) {
        return `${name}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600`;
      }
      // Polices manuscrites
      if (f.includes('Caveat') || f.includes('Dancing') || f.includes('Indie')) {
        return `${name}:wght@400;500;700`;
      }
      return `${name}:wght@300;400;500;600;700`;
    }).join('&family=');

    const link = document.getElementById('font-link');
    if (link) {
      link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    }
  }

  // ============ NAVIGATION ============
  function renderNav(data) {
    const m = data.meta || {};
    const n = data.nav || {};
    const links = (n.links || []).filter(l => l.enabled !== false);

    return `
      <a href="#" class="logo" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;" aria-label="Retour en haut">
        <div class="logo-mark">${window.icon('paw')}</div>
        <div class="logo-text">
          <span class="name">${esc(m.siteName || 'Divine Dogs')}</span>
          <span class="sub">${esc(m.tagline || '')}</span>
        </div>
      </a>
      <ul class="nav-links" id="navLinks">
        ${links.map(l => `<li><a href="${esc(l.anchor)}">${esc(l.label)}</a></li>`).join('')}
        ${n.ctaLabel ? `<li><a href="${esc(n.ctaAnchor || '#contact')}" class="nav-cta">${esc(n.ctaLabel)}</a></li>` : ''}
      </ul>
      <button class="menu-toggle" id="menuToggle" aria-label="Menu">${window.icon('menu', 28)}</button>
    `;
  }

  // ============ HERO ============
  function renderHero(h) {
    if (!h || h.enabled === false) return '';
    return `
      <section class="hero">
        <div class="hero-bg">
          <img src="${esc(h.backgroundImage)}" alt="" loading="eager">
        </div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          ${h.eyebrow ? `<span class="hero-eyebrow">${esc(h.eyebrow)}</span>` : ''}
          <h1>${esc(h.titlePart1 || '')}<br>${esc(h.titlePart2 || '')}<em>${esc(h.titleEmphasis || '')}</em>${esc(h.titlePart3 || '')}</h1>
          ${h.subtitle ? `<p class="hero-sub">${esc(h.subtitle)}</p>` : ''}
          <div class="hero-cta-group">
            ${h.ctaPrimaryLabel ? `<a href="${esc(h.ctaPrimaryAnchor || '#contact')}" class="btn btn-primary">${esc(h.ctaPrimaryLabel)} ${window.icon('arrowRight', 16)}</a>` : ''}
            ${h.ctaSecondaryLabel ? `<a href="${esc(h.ctaSecondaryAnchor || '#services')}" class="btn btn-ghost">${esc(h.ctaSecondaryLabel)}</a>` : ''}
          </div>
        </div>
        ${h.scrollHint ? `<div class="scroll-indicator">${esc(h.scrollHint)}</div>` : ''}
      </section>
    `;
  }

  // ============ APPROACH ============
  function renderApproach(a) {
    if (!a || a.enabled === false) return '';
    return `
      <section class="section approach" id="approche">
        <div class="container">
          <div class="approach-grid">
            <div class="approach-image reveal">
              <img src="${esc(a.image)}" alt="${esc(a.imageAlt || '')}">
              ${a.badge ? `<div class="approach-badge">${escMultiline(a.badge)}</div>` : ''}
            </div>
            <div class="approach-text reveal">
              ${a.eyebrow ? `<span class="section-eyebrow">${esc(a.eyebrow)}</span>` : ''}
              <h2 class="section-title">${esc(a.titlePart1 || '')}<em>${esc(a.titleEmphasis || '')}</em>${esc(a.titlePart2 || '')}</h2>
              ${(a.paragraphs || []).map(p => `<p>${esc(p)}</p>`).join('')}
              ${(a.credentials || []).length ? `<div class="credentials">${a.credentials.map(c => `<span class="credential">${esc(c)}</span>`).join('')}</div>` : ''}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ============ SERVICES ============
  function renderServices(s) {
    if (!s || s.enabled === false) return '';
    return `
      <section class="section services" id="services">
        <div class="container">
          <div class="services-header reveal">
            ${s.eyebrow ? `<span class="section-eyebrow">${esc(s.eyebrow)}</span>` : ''}
            <h2 class="section-title">${esc(s.titlePart1 || '')}<em>${esc(s.titleEmphasis || '')}</em>${esc(s.titlePart2 || '')}</h2>
            ${s.intro ? `<p class="services-intro">${esc(s.intro)}</p>` : ''}
          </div>
          <div class="services-grid">
            ${(s.items || []).map(item => `
              <div class="service-card reveal">
                <div class="service-icon">${window.icon(item.icon || 'paw', 28)}</div>
                <h3>${esc(item.title)}</h3>
                <p>${esc(item.description)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // ============ PRICING ============
  function renderPricing(p) {
    if (!p || p.enabled === false) return '';
    return `
      <section class="section pricing">
        <div class="container">
          <div class="pricing-card reveal">
            <div class="pricing-paw">${window.icon('paw', 32)}</div>
            <h2>${esc(p.titlePart1 || '')}<br>${esc(p.titlePart2 || '')}</h2>
            ${p.description ? `<p>${esc(p.description)}</p>` : ''}
            ${p.ctaLabel ? `<a href="${esc(p.ctaAnchor || '#contact')}" class="btn btn-dark">${esc(p.ctaLabel)} ${window.icon('arrowRight', 16)}</a>` : ''}
          </div>
        </div>
      </section>
    `;
  }

  // ============ TESTIMONIALS ============
  function renderTestimonials(t) {
    if (!t || t.enabled === false) return '';
    return `
      <section class="section testimonials" id="avis">
        <div class="container">
          <div class="testimonials-header reveal">
            <div>
              ${t.eyebrow ? `<span class="section-eyebrow">${esc(t.eyebrow)}</span>` : ''}
              <h2 class="section-title">${esc(t.titlePart1 || '')}<em>${esc(t.titleEmphasis || '')}</em>${esc(t.titlePart2 || '')}</h2>
            </div>
            ${t.ctaLabel ? `<a href="${esc(t.ctaUrl || '#contact')}" class="testimonials-cta">${esc(t.ctaLabel)} ${window.icon('arrowRight', 14)}</a>` : ''}
          </div>
          <div class="testimonials-grid">
            ${(t.items || []).map(item => `
              <div class="testimonial reveal">
                <div class="testimonial-quote">"</div>
                <div class="testimonial-stars">
                  ${Array(item.stars || 5).fill().map(() => window.icon('starFilled', 16)).join('')}
                </div>
                <p class="testimonial-text">${esc(item.text)}</p>
                <div class="testimonial-author">
                  <div class="testimonial-avatar">${esc((item.author || '?').charAt(0))}</div>
                  <div>
                    <div class="testimonial-name">${esc(item.author || '')}</div>
                    ${item.dog ? `<div class="testimonial-dog">${esc(item.dog)}</div>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // ============ CONTACT ============
  function renderContact(c) {
    if (!c || c.enabled === false) return '';
    return `
      <section class="section contact" id="contact">
        <div class="container">
          <div class="contact-grid">
            <div class="contact-info reveal">
              ${c.eyebrow ? `<span class="section-eyebrow">${esc(c.eyebrow)}</span>` : ''}
              <h2>${esc(c.titlePart1 || '')}<em>${esc(c.titleEmphasis || '')}</em>${esc(c.titlePart2 || '')}</h2>
              ${c.description ? `<p>${esc(c.description)}</p>` : ''}
              <div class="contact-methods">
                ${c.email ? `
                  <a href="mailto:${esc(c.email)}" class="contact-method">
                    <div class="contact-method-icon">${window.icon('mail', 20)}</div>
                    <div class="contact-method-text">
                      <span class="contact-method-label">Email</span>
                      <span class="contact-method-value">${esc(c.email)}</span>
                    </div>
                  </a>
                ` : ''}
                ${c.instagramUrl ? `
                  <a href="${esc(c.instagramUrl)}" target="_blank" rel="noopener" class="contact-method">
                    <div class="contact-method-icon insta">${window.icon('instagram', 20)}</div>
                    <div class="contact-method-text">
                      <span class="contact-method-label">Instagram</span>
                      <span class="contact-method-value">${esc(c.instagramHandle || '')}</span>
                    </div>
                  </a>
                ` : ''}
                ${c.facebookUrl ? `
                  <a href="${esc(c.facebookUrl)}" target="_blank" rel="noopener" class="contact-method">
                    <div class="contact-method-icon fb">${window.icon('facebook', 20)}</div>
                    <div class="contact-method-text">
                      <span class="contact-method-label">Facebook</span>
                      <span class="contact-method-value">${esc(c.facebookHandle || '')}</span>
                    </div>
                  </a>
                ` : ''}
              </div>
            </div>
            <form class="contact-form reveal" ${c.formspreeEndpoint ? `action="${esc(c.formspreeEndpoint)}" method="POST"` : ''}>
              <div class="form-double">
                <div class="form-row">
                  <label for="firstname">Prénom</label>
                  <input type="text" id="firstname" name="firstname" required>
                </div>
                <div class="form-row">
                  <label for="lastname">Nom</label>
                  <input type="text" id="lastname" name="lastname" required>
                </div>
              </div>
              <div class="form-row">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
              </div>
              <div class="form-row">
                <label for="subject">Type de demande</label>
                <select id="subject" name="subject" required>
                  <option value="">Sélectionnez —</option>
                  ${(c.formSubjects || []).map(s => `<option>${esc(s)}</option>`).join('')}
                </select>
              </div>
              <div class="form-row">
                <label for="message">Votre message</label>
                <textarea id="message" name="message" placeholder="Parlez-moi de votre chien et de votre situation…" required></textarea>
              </div>
              <button type="submit" class="btn btn-dark">Envoyer ma demande ${window.icon('send', 16)}</button>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  // ============ FOOTER ============
  function renderFooter(data) {
    const m = data.meta || {};
    const f = data.footer || {};
    const c = data.contact || {};
    const n = data.nav || {};

    return `
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="#" class="logo" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">
            <div class="logo-mark">${window.icon('paw')}</div>
            <div class="logo-text">
              <span class="name">${esc(m.siteName)}</span>
              <span class="sub">${esc(m.tagline)}</span>
            </div>
          </a>
          ${f.description ? `<p>${esc(f.description)}</p>` : ''}
        </div>
        <div class="footer-col">
          <h4>${esc(f.navigationTitle || 'Navigation')}</h4>
          <ul>
            ${(n.links || []).filter(l => l.enabled !== false).map(l => `<li><a href="${esc(l.anchor)}">${esc(l.label)}</a></li>`).join('')}
            <li><a href="${esc(n.ctaAnchor || '#contact')}">${esc(n.ctaLabel || 'Contact')}</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>${esc(f.legalTitle || 'Légal')}</h4>
          <ul>
            ${(f.legalLinks || []).map(l => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copyright">© ${esc(f.year || '2026')} ${esc(m.siteName)} — Tous droits réservés</div>
        <div class="social-icons">
          ${c.instagramUrl ? `<a href="${esc(c.instagramUrl)}" target="_blank" rel="noopener" class="social-icon" aria-label="Instagram">${window.icon('instagram', 18)}</a>` : ''}
          ${c.facebookUrl ? `<a href="${esc(c.facebookUrl)}" target="_blank" rel="noopener" class="social-icon" aria-label="Facebook">${window.icon('facebook', 18)}</a>` : ''}
          ${c.tiktokUrl ? `<a href="${esc(c.tiktokUrl)}" target="_blank" rel="noopener" class="social-icon" aria-label="TikTok">${window.icon('tiktok', 18)}</a>` : ''}
        </div>
      </div>
    `;
  }

  // ============ RENDU COMPLET ============
  function renderAll(data) {
    if (!data) return;

    // META
    const m = data.meta || {};
    if (m.pageTitle) document.title = m.pageTitle;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && m.description) desc.content = m.description;

    // THÈME
    if (data.theme) applyTheme(data.theme);

    // STRUCTURE
    const nav = document.getElementById('nav');
    const main = document.getElementById('main');
    const footer = document.getElementById('footer');

    if (nav) nav.innerHTML = renderNav(data);
    if (main) main.innerHTML = [
      renderHero(data.hero),
      renderApproach(data.approach),
      renderServices(data.services),
      renderPricing(data.pricing),
      renderTestimonials(data.testimonials),
      renderContact(data.contact)
    ].join('');
    if (footer) footer.innerHTML = renderFooter(data);
  }

  // Expose globalement
  window.DD_RENDER = {
    all: renderAll,
    theme: applyTheme,
    esc: esc
  };
})();
