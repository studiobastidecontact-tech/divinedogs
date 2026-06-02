/* ==========================================================================
   Divine Dogs Admin — Interface Utilisateur
   ========================================================================== */

(function() {
  'use strict';

  // ============ State global ============
  const state = {
    data: null,
    originalData: null,
    sha: null,
    dirty: false,
    saving: false,
    currentSection: 'meta',
    user: null
  };

  // ============ Helpers ============
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function toast(msg, type = 'info', duration = 3500) {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const iconMap = { success: 'check', error: 'x', warning: 'shield', info: 'message' };
    el.innerHTML = `${window.icon(iconMap[type] || 'message', 18)} <span>${esc(msg)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(120%)';
      setTimeout(() => el.remove(), 350);
    }, duration);
  }

  function modal({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false }) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <h2>${esc(title)}</h2>
          <p>${esc(message)}</p>
          <div class="actions">
            <button class="btn btn-ghost" data-action="cancel">${esc(cancelLabel)}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${esc(confirmLabel)}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => {
        if (e.target === overlay || e.target.dataset.action === 'cancel') {
          overlay.remove();
          resolve(false);
        } else if (e.target.dataset.action === 'confirm') {
          overlay.remove();
          resolve(true);
        }
      });
    });
  }

  function markDirty() {
    state.dirty = true;
    updateSaveStatus();
  }

  function updateSaveStatus() {
    const status = $('#save-status');
    const saveBtn = $('#save-btn');
    if (!status) return;
    
    status.classList.remove('saved', 'error');
    if (state.saving) {
      status.innerHTML = `<span class="dot"></span> <span>Enregistrement…</span>`;
      saveBtn.disabled = true;
    } else if (state.dirty) {
      status.innerHTML = `<span class="dot"></span> <span>Modifications non publiées</span>`;
      saveBtn.disabled = false;
    } else {
      status.innerHTML = `<span class="dot"></span> <span>Tout est à jour</span>`;
      status.classList.add('saved');
      saveBtn.disabled = true;
    }
  }

  // ============ LOGIN ============
  function renderLogin() {
    document.body.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <div class="login-logo">
            <div class="mark">${window.icon('paw')}</div>
            <div class="text">
              <span class="name">Divine Dogs</span>
              <span class="sub">admin</span>
            </div>
          </div>
          <h1>Connexion</h1>
          <p class="subtitle">Espace réservé à la gestion du site</p>
          <form class="login-form" id="login-form">
            <div>
              <label>Email</label>
              <input type="email" id="email" placeholder="vous@exemple.com" required autocomplete="username">
            </div>
            <div>
              <label>Token GitHub Personnel</label>
              <input type="password" id="token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" required autocomplete="current-password">
              <p class="hint">
                Comment obtenir un token : <br>
                1. <a href="https://github.com/settings/tokens/new?scopes=repo&description=Divine%20Dogs%20Admin" target="_blank" rel="noopener">Cliquez ici</a> (vous serez redirigé vers GitHub)<br>
                2. Cochez "repo" → Generate token<br>
                3. Copiez-collez le token dans le champ ci-dessus<br>
                <strong>Le token est stocké uniquement sur ce navigateur.</strong>
              </p>
            </div>
            <div id="login-error" style="display:none"></div>
            <button type="submit" class="btn btn-primary" style="justify-content:center;padding:.85rem">
              ${window.icon('logout', 16)}<span style="transform:rotate(180deg);display:inline-flex">${''}</span>
              Se connecter
            </button>
          </form>
        </div>
      </div>
    `;

    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#email').value.trim();
      const token = $('#token').value.trim();
      const errorEl = $('#login-error');
      errorEl.style.display = 'none';

      try {
        // Stocker temporairement pour la vérification
        window.DD_GH.saveSession(token, email);
        const { user } = await window.DD_GH.verifyAccess();
        state.user = user;
        await initAdmin();
      } catch (err) {
        window.DD_GH.clearSession();
        errorEl.className = 'login-error';
        errorEl.style.display = 'block';
        errorEl.textContent = '❌ ' + err.message;
      }
    });
  }

  // ============ APP SHELL ============
  function renderShell() {
    document.body.innerHTML = `
      <div class="admin-layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">
              <div class="mark">${window.icon('paw')}</div>
              <span class="name">Divine Dogs</span>
            </div>
            <div class="sidebar-meta">Panneau d'administration</div>
          </div>
          <ul class="sidebar-nav" id="nav-tabs">
            <li><button data-section="meta">${window.icon('settings')} <span>Général</span></button></li>
            <li><button data-section="theme">${window.icon('palette')} <span>Couleurs & polices</span></button></li>
            <li><button data-section="hero">${window.icon('image')} <span>Accueil (hero)</span></button></li>
            <li><button data-section="approach">${window.icon('eye')} <span>L'approche</span></button></li>
            <li><button data-section="services">${window.icon('layout')} <span>Services</span></button></li>
            <li><button data-section="pricing">${window.icon('type')} <span>Tarifs</span></button></li>
            <li><button data-section="testimonials">${window.icon('star')} <span>Avis clients</span></button></li>
            <li><button data-section="contact">${window.icon('mail')} <span>Contact</span></button></li>
            <li><button data-section="footer">${window.icon('link')} <span>Footer & légal</span></button></li>
          </ul>
          <div class="sidebar-footer">
            <div class="save-status saved" id="save-status">
              <span class="dot"></span> <span>Tout est à jour</span>
            </div>
            <div class="actions">
              <button id="logout-btn">${window.icon('logout', 14)} Sortir</button>
              <button class="primary" id="save-btn" disabled>${window.icon('save', 14)} Publier</button>
            </div>
          </div>
        </aside>
        <main class="main-content" id="main-content"></main>
      </div>
      <div class="toast-container" id="toast-container"></div>
    `;

    $$('[data-section]').forEach(btn => {
      btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    $('#save-btn').addEventListener('click', publishChanges);
    $('#logout-btn').addEventListener('click', async () => {
      if (state.dirty) {
        const ok = await modal({
          title: 'Quitter sans publier ?',
          message: 'Vous avez des modifications non publiées. Si vous vous déconnectez, elles seront perdues.',
          confirmLabel: 'Quitter quand même',
          danger: true
        });
        if (!ok) return;
      }
      window.DD_GH.clearSession();
      location.reload();
    });

    // Avertissement avant de quitter
    window.addEventListener('beforeunload', (e) => {
      if (state.dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  function switchSection(name) {
    state.currentSection = name;
    $$('[data-section]').forEach(b => b.classList.toggle('active', b.dataset.section === name));
    renderSection(name);
  }

  // ============ SECTION RENDERING ============
  function renderSection(name) {
    const main = $('#main-content');
    if (!main) return;

    const renderers = {
      meta: renderMeta,
      theme: renderTheme,
      hero: renderHero,
      approach: renderApproach,
      services: renderServices,
      pricing: renderPricing,
      testimonials: renderTestimonials,
      contact: renderContact,
      footer: renderFooter
    };

    main.innerHTML = (renderers[name] || (() => '<p>Section inconnue</p>'))();
    attachFieldListeners();
  }

  function sectionHeader(title, subtitle) {
    return `
      <div class="section-header">
        <div>
          <h1>${esc(title)}</h1>
          <p class="subtitle">${esc(subtitle)}</p>
        </div>
        <a href="../" target="_blank" class="preview-link">${window.icon('upRight')} Voir le site</a>
      </div>
    `;
  }

  function textField(label, path, opts = {}) {
    const value = getByPath(state.data, path) || '';
    const help = opts.help ? `<p class="help">${esc(opts.help)}</p>` : '';
    return `
      <div class="field">
        <label>${esc(label)}</label>
        <input type="${opts.type || 'text'}" data-bind="${esc(path)}" value="${esc(value)}" placeholder="${esc(opts.placeholder || '')}">
        ${help}
      </div>
    `;
  }

  function textareaField(label, path, opts = {}) {
    const value = getByPath(state.data, path) || '';
    const help = opts.help ? `<p class="help">${esc(opts.help)}</p>` : '';
    return `
      <div class="field">
        <label>${esc(label)}</label>
        <textarea data-bind="${esc(path)}" rows="${opts.rows || 3}" placeholder="${esc(opts.placeholder || '')}">${esc(value)}</textarea>
        ${help}
      </div>
    `;
  }

  function imageField(label, path, opts = {}) {
    const value = getByPath(state.data, path) || '';
    const help = opts.help ? `<p class="help">${esc(opts.help)}</p>` : '';
    return `
      <div class="field">
        <label>${esc(label)}</label>
        <div class="image-field">
          <div class="image-preview">
            ${value ? `<img src="${esc(value)}" alt="">` : `<div class="empty">${window.icon('image', 32)} <span>Aucune image</span></div>`}
          </div>
          <div class="image-actions">
            <input type="file" accept="image/*" data-upload="${esc(path)}" style="display:none" id="upload-${esc(path).replace(/[^a-z0-9]/gi,'_')}">
            <label for="upload-${esc(path).replace(/[^a-z0-9]/gi,'_')}" class="btn btn-secondary btn-sm">
              ${window.icon('upload', 14)} Uploader une image
            </label>
            <input type="text" data-bind="${esc(path)}" value="${esc(value)}" placeholder="…ou collez une URL ici" style="flex:1;min-width:200px">
          </div>
          ${help}
        </div>
      </div>
    `;
  }

  function toggleField(label, path, help) {
    const value = getByPath(state.data, path) !== false;
    return `
      <div class="field">
        <label class="toggle">
          <input type="checkbox" data-bind-bool="${esc(path)}" ${value ? 'checked' : ''}>
          <span class="slider"></span>
          <span class="label">${esc(label)}</span>
        </label>
        ${help ? `<p class="help" style="margin-left:60px;margin-top:.25rem">${esc(help)}</p>` : ''}
      </div>
    `;
  }

  function colorField(label, key) {
    const value = state.data.theme?.colors?.[key] || '#000000';
    const safeId = `col-${key}`;
    return `
      <label class="color-field" for="${safeId}">
        <div class="swatch" style="background:${esc(value)}"></div>
        <div class="info">
          <div class="name">${esc(label)}</div>
          <div class="value">${esc(value)}</div>
        </div>
        <input type="color" id="${safeId}" data-color="${esc(key)}" value="${esc(value)}">
      </label>
    `;
  }

  // ====== SECTION : GÉNÉRAL ======
  function renderMeta() {
    return `
      ${sectionHeader('Réglages généraux', 'Nom du site, descriptions, SEO, favicon')}
      <div class="panel">
        <h2 class="panel-title">${window.icon('settings')} Identité du site</h2>
        ${textField('Nom du site', 'meta.siteName')}
        ${textField('Slogan court (sous le logo)', 'meta.tagline', { help: 'Apparaît sous le nom dans le header et footer' })}
        ${textField('Titre de l\'onglet (SEO)', 'meta.pageTitle', { help: 'Ce qui apparaît dans l\'onglet du navigateur et dans Google' })}
        ${textareaField('Description SEO', 'meta.description', { rows: 2, help: 'Description affichée par Google sous le lien' })}
      </div>
    `;
  }

  // ====== SECTION : THÈME ======
  function renderTheme() {
    return `
      ${sectionHeader('Couleurs & polices', 'Personnalisez l\'apparence visuelle du site')}
      <div class="panel">
        <h2 class="panel-title">${window.icon('palette')} Palette de couleurs</h2>
        <p class="panel-desc">Cliquez sur une couleur pour la modifier. Les changements sont visibles instantanément sur l'aperçu.</p>
        <div class="field-row">
          ${colorField('Espresso (sombre principal)', 'espresso')}
          ${colorField('Espresso profond (très sombre)', 'espressoDeep')}
        </div>
        <div class="field-row">
          ${colorField('Espresso doux (texte secondaire)', 'espressoSoft')}
          ${colorField('Beurre (clair principal)', 'butter')}
        </div>
        <div class="field-row">
          ${colorField('Beurre profond (dégradé)', 'butterDeep')}
          ${colorField('Beurre doux (très clair)', 'butterSoft')}
        </div>
        <div class="field-row">
          ${colorField('Crème (fond formulaires)', 'cream')}
          ${colorField('Accent (doré)', 'accent')}
        </div>
        <div class="field">
          ${colorField('Accent chaud (étoiles, hovers)', 'accentWarm')}
        </div>
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Polices d'écriture</h2>
        <p class="panel-desc">Toutes les polices sont chargées depuis Google Fonts.</p>
        <div class="field">
          <label>Police principale (titres et corps)</label>
          <select data-bind="theme.fonts.display" onchange="document.querySelector('[data-bind=\\'theme.fonts.body\\']').value=this.value;document.querySelector('[data-bind=\\'theme.fonts.body\\']').dispatchEvent(new Event('change'))">
            ${fontOption('Zalando Sans SemiExpanded', state.data.theme.fonts.display)}
            ${fontOption('Fraunces', state.data.theme.fonts.display)}
            ${fontOption('Playfair Display', state.data.theme.fonts.display)}
            ${fontOption('Inter', state.data.theme.fonts.display)}
            ${fontOption('Manrope', state.data.theme.fonts.display)}
            ${fontOption('DM Serif Display', state.data.theme.fonts.display)}
            ${fontOption('Cormorant Garamond', state.data.theme.fonts.display)}
            ${fontOption('Outfit', state.data.theme.fonts.display)}
          </select>
        </div>
        <div class="field" style="display:none">
          <input type="text" data-bind="theme.fonts.body" value="${esc(state.data.theme.fonts.body)}">
        </div>
        <div class="field">
          <label>Police manuscrite (accents)</label>
          <select data-bind="theme.fonts.hand">
            ${fontOption('Caveat', state.data.theme.fonts.hand)}
            ${fontOption('Dancing Script', state.data.theme.fonts.hand)}
            ${fontOption('Indie Flower', state.data.theme.fonts.hand)}
            ${fontOption('Kalam', state.data.theme.fonts.hand)}
            ${fontOption('Shadows Into Light', state.data.theme.fonts.hand)}
          </select>
        </div>
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('settings')} Options</h2>
        ${toggleField('Afficher l\'effet "grain" en surimpression', 'theme.options.showGrainOverlay', 'Donne un aspect texturé subtil au site')}
        ${toggleField('Activer les animations au scroll', 'theme.options.enableAnimations', 'Les éléments apparaissent en fondu en défilant')}
      </div>
    `;
  }

  function fontOption(name, current) {
    return `<option value="${esc(name)}" ${name === current ? 'selected' : ''}>${esc(name)}</option>`;
  }

  // ====== SECTION : HERO ======
  function renderHero() {
    return `
      ${sectionHeader('Accueil (Hero)', 'La grande section avec photo en fond et titre principal')}
      <div class="panel">
        ${toggleField('Afficher la section', 'hero.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('image')} Image de fond</h2>
        ${imageField('Photo en fond (grand format recommandé)', 'hero.backgroundImage', { help: 'Format paysage, minimum 2000px de large pour un bon rendu sur grand écran' })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Textes</h2>
        ${textField('Petit texte au-dessus du titre (eyebrow)', 'hero.eyebrow', { placeholder: 'ex : une relation, pas une méthode' })}
        <div class="field-row">
          ${textField('Titre — 1ère partie', 'hero.titlePart1', { placeholder: 'Comprendre votre chien,' })}
          ${textField('Titre — 2ème partie (avant emphase)', 'hero.titlePart2', { placeholder: 'changer ' })}
        </div>
        <div class="field-row">
          ${textField('Titre — Partie en italique', 'hero.titleEmphasis', { placeholder: 'votre quotidien' })}
          ${textField('Titre — Fin', 'hero.titlePart3', { placeholder: '.' })}
        </div>
        ${textareaField('Sous-titre (paragraphe explicatif)', 'hero.subtitle', { rows: 3 })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('arrowRight')} Boutons d'action</h2>
        <div class="field-row">
          ${textField('Bouton principal — Texte', 'hero.ctaPrimaryLabel')}
          ${textField('Bouton principal — Lien', 'hero.ctaPrimaryAnchor', { help: '#section ou URL complète' })}
        </div>
        <div class="field-row">
          ${textField('Bouton secondaire — Texte', 'hero.ctaSecondaryLabel')}
          ${textField('Bouton secondaire — Lien', 'hero.ctaSecondaryAnchor')}
        </div>
        ${textField('Indication de défilement (bas du hero)', 'hero.scrollHint', { placeholder: 'défiler' })}
      </div>
    `;
  }

  // ====== SECTION : APPROACH ======
  function renderApproach() {
    return `
      ${sectionHeader('L\'approche', 'Section "à propos" avec photo et présentation')}
      <div class="panel">
        ${toggleField('Afficher la section', 'approach.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('image')} Photo et badge</h2>
        ${imageField('Photo principale (format portrait recommandé)', 'approach.image')}
        ${textField('Description de la photo (accessibilité)', 'approach.imageAlt')}
        ${textareaField('Badge rond (Esprit Dog)', 'approach.badge', { rows: 2, help: 'Texte qui apparaît dans le cercle rotatif. Saut de ligne autorisé.' })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Textes</h2>
        ${textField('Eyebrow', 'approach.eyebrow')}
        <div class="field-row-3">
          ${textField('Titre — début', 'approach.titlePart1')}
          ${textField('Titre — italique', 'approach.titleEmphasis')}
          ${textField('Titre — fin', 'approach.titlePart2')}
        </div>
        ${renderList('Paragraphes', 'approach.paragraphs', 'string', { rows: 3 })}
        ${renderList('Certifications (badges)', 'approach.credentials', 'string')}
      </div>
    `;
  }

  // ====== SECTION : SERVICES ======
  function renderServices() {
    return `
      ${sectionHeader('Services', 'Les prestations que vous proposez')}
      <div class="panel">
        ${toggleField('Afficher la section', 'services.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} En-tête de section</h2>
        ${textField('Eyebrow', 'services.eyebrow')}
        <div class="field-row-3">
          ${textField('Titre — début', 'services.titlePart1')}
          ${textField('Titre — italique', 'services.titleEmphasis')}
          ${textField('Titre — fin', 'services.titlePart2')}
        </div>
        ${textareaField('Introduction', 'services.intro', { rows: 2 })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('layout')} Les services</h2>
        ${renderItemsList('services.items', 'service', s => s.title)}
        <button class="btn btn-secondary btn-sm" data-add="services.items" data-template="service" style="margin-top:1rem">
          ${window.icon('plus', 14)} Ajouter un service
        </button>
      </div>
    `;
  }

  // ====== SECTION : PRICING ======
  function renderPricing() {
    return `
      ${sectionHeader('Tarifs', 'Section tarifs (à compléter quand l\'entreprise sera immatriculée)')}
      <div class="panel">
        ${toggleField('Afficher la section', 'pricing.enabled')}
        ${toggleField('Afficher "tarifs à venir" (au lieu des tarifs détaillés)', 'pricing.showAsComingSoon')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Textes</h2>
        ${textField('Titre — ligne 1', 'pricing.titlePart1')}
        ${textField('Titre — ligne 2', 'pricing.titlePart2')}
        ${textareaField('Description', 'pricing.description', { rows: 3 })}
        <div class="field-row">
          ${textField('Bouton — Texte', 'pricing.ctaLabel')}
          ${textField('Bouton — Lien', 'pricing.ctaAnchor')}
        </div>
      </div>
    `;
  }

  // ====== SECTION : TESTIMONIALS ======
  function renderTestimonials() {
    return `
      ${sectionHeader('Avis clients', 'Les témoignages affichés sur le site')}
      <div class="panel">
        ${toggleField('Afficher la section', 'testimonials.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} En-tête</h2>
        ${textField('Eyebrow', 'testimonials.eyebrow')}
        <div class="field-row-3">
          ${textField('Titre — début', 'testimonials.titlePart1')}
          ${textField('Titre — italique', 'testimonials.titleEmphasis')}
          ${textField('Titre — fin', 'testimonials.titlePart2')}
        </div>
        <div class="field-row">
          ${textField('Bouton "Laisser un avis" — Texte', 'testimonials.ctaLabel')}
          ${textField('Bouton — Lien', 'testimonials.ctaUrl')}
        </div>
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('star')} Les témoignages</h2>
        ${renderItemsList('testimonials.items', 'testimonial', t => `${t.author} — "${(t.text||'').substring(0,40)}…"`)}
        <button class="btn btn-secondary btn-sm" data-add="testimonials.items" data-template="testimonial" style="margin-top:1rem">
          ${window.icon('plus', 14)} Ajouter un témoignage
        </button>
      </div>
    `;
  }

  // ====== SECTION : CONTACT ======
  function renderContact() {
    return `
      ${sectionHeader('Contact', 'Informations de contact et formulaire')}
      <div class="panel">
        ${toggleField('Afficher la section', 'contact.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('mail')} Coordonnées</h2>
        ${textField('Email de contact', 'contact.email', { type: 'email' })}
        <div class="field-row">
          ${textField('URL Instagram', 'contact.instagramUrl', { type: 'url' })}
          ${textField('Pseudo Instagram', 'contact.instagramHandle', { placeholder: '@divinedogs' })}
        </div>
        <div class="field-row">
          ${textField('URL Facebook', 'contact.facebookUrl', { type: 'url' })}
          ${textField('Nom Facebook', 'contact.facebookHandle')}
        </div>
        ${textField('URL TikTok', 'contact.tiktokUrl', { type: 'url' })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Textes</h2>
        ${textField('Eyebrow', 'contact.eyebrow')}
        <div class="field-row-3">
          ${textField('Titre — début', 'contact.titlePart1')}
          ${textField('Titre — italique', 'contact.titleEmphasis')}
          ${textField('Titre — fin', 'contact.titlePart2')}
        </div>
        ${textareaField('Description', 'contact.description', { rows: 3 })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('send')} Formulaire</h2>
        ${textField('Endpoint Formspree (pour recevoir les emails)', 'contact.formspreeEndpoint', { placeholder: 'https://formspree.io/f/xxxx', help: 'Créez un endpoint gratuit sur formspree.io, puis collez ici l\'URL fournie. Sans ça, le formulaire ne fonctionne pas.' })}
        ${renderList('Sujets disponibles dans le menu déroulant', 'contact.formSubjects', 'string')}
      </div>
    `;
  }

  // ====== SECTION : FOOTER ======
  function renderFooter() {
    return `
      ${sectionHeader('Footer & légal', 'Bas de page et liens légaux')}
      <div class="panel">
        ${textareaField('Description (à gauche du footer)', 'footer.description', { rows: 3 })}
        ${textField('Année du copyright', 'footer.year')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('link')} Liens légaux</h2>
        ${renderItemsList('footer.legalLinks', 'legalLink', l => l.label)}
        <button class="btn btn-secondary btn-sm" data-add="footer.legalLinks" data-template="legalLink" style="margin-top:1rem">
          ${window.icon('plus', 14)} Ajouter un lien
        </button>
      </div>
    `;
  }

  // ============ LISTS ============
  function renderList(label, path, type, opts = {}) {
    const arr = getByPath(state.data, path) || [];
    return `
      <div class="field">
        <label>${esc(label)}</label>
        <div class="items-list" data-list="${esc(path)}">
          ${arr.map((item, i) => `
            <div class="item-card" data-list-item="${esc(path)}.${i}">
              <div class="item-header">
                <span class="item-drag">${window.icon('drag', 16)}</span>
                <div style="flex:1">
                  ${type === 'string'
                    ? `<input type="text" data-bind="${esc(path)}.${i}" value="${esc(item)}" style="border:none;background:transparent;width:100%;padding:.4rem 0;font-weight:500">`
                    : ''
                  }
                </div>
                <div class="item-actions">
                  <button data-remove="${esc(path)}.${i}" class="danger" title="Supprimer">${window.icon('trash', 16)}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" data-add="${esc(path)}" data-template="string" style="margin-top:.75rem">${window.icon('plus', 14)} Ajouter</button>
      </div>
    `;
  }

  function renderItemsList(path, template, labelFn) {
    const arr = getByPath(state.data, path) || [];
    return `
      <div class="items-list" data-list="${esc(path)}">
        ${arr.map((item, i) => `
          <div class="item-card" data-item-idx="${i}">
            <div class="item-header has-content" data-toggle="${i}">
              <span class="item-drag">${window.icon('drag', 16)}</span>
              <div class="item-info">
                <div class="title">${esc(labelFn(item))}</div>
              </div>
              <div class="item-actions">
                <button data-remove="${esc(path)}.${i}" class="danger" title="Supprimer">${window.icon('trash', 16)}</button>
              </div>
            </div>
            <div class="item-body">
              ${renderItemFields(template, `${path}.${i}`, item)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderItemFields(template, path, item) {
    if (template === 'service') {
      return `
        <div class="field-row">
          <div class="field"><label>Titre</label><input type="text" data-bind="${path}.title" value="${esc(item.title)}"></div>
          <div class="field"><label>Icône</label><select data-bind="${path}.icon">
            ${['paw','heart','clock','message','shield','star'].map(i => `<option value="${i}" ${item.icon===i?'selected':''}>${i}</option>`).join('')}
          </select></div>
        </div>
        <div class="field"><label>Description</label><textarea data-bind="${path}.description" rows="2">${esc(item.description)}</textarea></div>
      `;
    }
    if (template === 'testimonial') {
      return `
        <div class="field"><label>Message du client</label><textarea data-bind="${path}.text" rows="3">${esc(item.text)}</textarea></div>
        <div class="field-row-3">
          <div class="field"><label>Nom de l'auteur</label><input type="text" data-bind="${path}.author" value="${esc(item.author)}"></div>
          <div class="field"><label>Nom du chien / contexte</label><input type="text" data-bind="${path}.dog" value="${esc(item.dog)}"></div>
          <div class="field"><label>Étoiles</label><select data-bind-num="${path}.stars">
            ${[1,2,3,4,5].map(n => `<option value="${n}" ${item.stars===n?'selected':''}>${n} étoile${n>1?'s':''}</option>`).join('')}
          </select></div>
        </div>
      `;
    }
    if (template === 'legalLink') {
      return `
        <div class="field-row">
          <div class="field"><label>Texte affiché</label><input type="text" data-bind="${path}.label" value="${esc(item.label)}"></div>
          <div class="field"><label>URL</label><input type="text" data-bind="${path}.url" value="${esc(item.url)}"></div>
        </div>
      `;
    }
    return '';
  }

  // ============ DATA BINDINGS ============
  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => {
      if (o == null) return undefined;
      // Si la clé est un nombre, c'est un index d'array
      const isNum = /^\d+$/.test(k);
      return isNum ? o[parseInt(k, 10)] : o[k];
    }, obj);
  }

  function setByPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => {
      const isNum = /^\d+$/.test(k);
      const key = isNum ? parseInt(k, 10) : k;
      if (o[key] == null) o[key] = /^\d+$/.test(keys[keys.indexOf(k)+1] || last) ? [] : {};
      return o[key];
    }, obj);
    const lastKey = /^\d+$/.test(last) ? parseInt(last, 10) : last;
    target[lastKey] = value;
  }

  function attachFieldListeners() {
    // Text/textarea/select
    $$('[data-bind]').forEach(el => {
      el.addEventListener('input', (e) => {
        setByPath(state.data, el.dataset.bind, e.target.value);
        markDirty();
      });
      el.addEventListener('change', (e) => {
        setByPath(state.data, el.dataset.bind, e.target.value);
        markDirty();
      });
    });

    // Bool
    $$('[data-bind-bool]').forEach(el => {
      el.addEventListener('change', (e) => {
        setByPath(state.data, el.dataset.bindBool, e.target.checked);
        markDirty();
      });
    });

    // Num
    $$('[data-bind-num]').forEach(el => {
      el.addEventListener('change', (e) => {
        setByPath(state.data, el.dataset.bindNum, parseInt(e.target.value, 10));
        markDirty();
      });
    });

    // Color
    $$('[data-color]').forEach(el => {
      el.addEventListener('input', (e) => {
        const key = el.dataset.color;
        state.data.theme.colors[key] = e.target.value;
        const card = el.closest('.color-field');
        if (card) {
          card.querySelector('.swatch').style.background = e.target.value;
          card.querySelector('.value').textContent = e.target.value;
        }
        markDirty();
      });
    });

    // Add
    $$('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => addItem(btn.dataset.add, btn.dataset.template));
    });

    // Remove
    $$('[data-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await modal({
          title: 'Confirmer la suppression',
          message: 'Cet élément sera supprimé. Vous pourrez toujours annuler en ne publiant pas.',
          confirmLabel: 'Supprimer',
          danger: true
        });
        if (ok) removeItem(btn.dataset.remove);
      });
    });

    // Upload
    $$('[data-upload]').forEach(input => {
      input.addEventListener('change', (e) => handleUpload(e.target, input.dataset.upload));
    });
  }

  function addItem(path, template) {
    const arr = getByPath(state.data, path) || [];
    let newItem;
    if (template === 'string') newItem = '';
    else if (template === 'service') newItem = { id: 'service-' + Date.now(), icon: 'paw', title: 'Nouveau service', description: '' };
    else if (template === 'testimonial') newItem = { id: 't-' + Date.now(), stars: 5, text: '', author: '', dog: '' };
    else if (template === 'legalLink') newItem = { label: 'Nouveau lien', url: '#' };
    else newItem = {};
    
    arr.push(newItem);
    setByPath(state.data, path, arr);
    markDirty();
    renderSection(state.currentSection);
  }

  function removeItem(path) {
    const keys = path.split('.');
    const idx = parseInt(keys.pop(), 10);
    const arr = getByPath(state.data, keys.join('.'));
    arr.splice(idx, 1);
    markDirty();
    renderSection(state.currentSection);
  }

  // ============ UPLOAD ============
  async function handleUpload(input, targetPath) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast('L\'image dépasse 5 Mo. Compressez-la avant l\'upload.', 'error', 5000);
      return;
    }

    toast('Upload en cours…', 'info');

    try {
      // Compression côté navigateur
      const compressed = await compressImage(file);
      const path = await window.DD_GH.uploadImage(compressed, file.name);
      setByPath(state.data, targetPath, path);
      toast('Image uploadée avec succès', 'success');
      markDirty();
      renderSection(state.currentSection);
    } catch (err) {
      toast('Erreur upload : ' + err.message, 'error', 5000);
    }
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 2400;
          let { width, height } = img;
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => {
            const compressed = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(compressed);
          }, 'image/jpeg', 0.85);
        };
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ============ PUBLISH ============
  async function publishChanges() {
    if (!state.dirty || state.saving) return;
    
    state.saving = true;
    updateSaveStatus();
    toast('Publication en cours…', 'info');

    try {
      // Mettre à jour le timestamp
      state.data.lastUpdated = new Date().toISOString();
      
      const newSha = await window.DD_GH.saveData(state.data, state.sha);
      state.sha = newSha;
      state.dirty = false;
      state.saving = false;
      state.originalData = JSON.parse(JSON.stringify(state.data));
      
      updateSaveStatus();
      toast('Publié ! Les changements seront visibles en ~1 minute sur le site.', 'success', 5000);
    } catch (err) {
      state.saving = false;
      updateSaveStatus();
      const status = $('#save-status');
      if (status) status.classList.add('error');
      toast('Erreur publication : ' + err.message, 'error', 6000);
    }
  }

  // ============ INIT ============
  async function initAdmin() {
    try {
      const result = await window.DD_GH.loadData();
      state.data = result.data;
      state.originalData = JSON.parse(JSON.stringify(result.data));
      state.sha = result.sha;
      
      renderShell();
      switchSection('meta');
    } catch (err) {
      toast('Erreur chargement : ' + err.message, 'error', 6000);
      setTimeout(() => {
        window.DD_GH.clearSession();
        location.reload();
      }, 3000);
    }
  }

  // ============ BOOT ============
  function boot() {
    const session = window.DD_GH.getSession();
    if (session?.token) {
      initAdmin();
    } else {
      renderLogin();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
