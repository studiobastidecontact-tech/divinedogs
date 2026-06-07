/* ==========================================================================
   Divine Dogs Admin v3 — Interface UI
   ========================================================================== */

(function() {
  'use strict';

  const state = {
    data: null,
    sha: null,
    dirty: false,
    saving: false,
    currentSection: 'meta',
    currentLang: 'fr',
    user: null
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function toast(msg, type = 'info', duration = 3500) {
    const container = $('#toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const iconMap = { success: 'check', error: 'x', warning: 'settings', info: 'edit' };
    el.innerHTML = `${window.icon(iconMap[type] || 'edit', 18)} <span>${esc(msg)}</span>`;
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
        if (e.target === overlay || e.target.dataset.action === 'cancel') { overlay.remove(); resolve(false); }
        else if (e.target.dataset.action === 'confirm') { overlay.remove(); resolve(true); }
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
      if (saveBtn) saveBtn.disabled = true;
    } else if (state.dirty) {
      status.innerHTML = `<span class="dot"></span> <span>Modifs non publiées</span>`;
      if (saveBtn) saveBtn.disabled = false;
    } else {
      status.innerHTML = `<span class="dot"></span> <span>Tout est à jour</span>`;
      status.classList.add('saved');
      if (saveBtn) saveBtn.disabled = true;
    }
  }

  // ============ LOGIN ============
  function renderLogin() {
    document.body.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <div class="login-logo">
            <span class="name">DIVINE DOGS</span>
          </div>
          <h1>Connexion</h1>
          <p class="subtitle">Espace réservé à la gestion du site</p>
          <form class="login-form" id="login-form">
            <div>
              <label>Email</label>
              <input type="email" id="email" placeholder="vous@exemple.com" required autocomplete="username">
            </div>
            <div>
              <label>Token GitHub</label>
              <input type="password" id="token" placeholder="ghp_..." required autocomplete="current-password">
              <p class="hint">
                <a href="https://github.com/settings/tokens/new?scopes=repo&description=Divine%20Dogs%20Admin" target="_blank" rel="noopener">Créer un token ici</a> · scope <strong>repo</strong> · expiration <strong>No expiration</strong>
              </p>
            </div>
            <div id="login-error" style="display:none"></div>
            <button type="submit" class="btn btn-primary" style="justify-content:center;padding:.85rem">Se connecter</button>
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
            <div class="sidebar-logo">DIVINE DOGS</div>
            <div class="sidebar-meta">Administration</div>
          </div>
          <div class="lang-switcher" id="langSwitcher">
            <button data-lang="fr" class="${state.currentLang === 'fr' ? 'active' : ''}">🇫🇷 FRANÇAIS</button>
            <button data-lang="en" class="${state.currentLang === 'en' ? 'active' : ''}">🇬🇧 ENGLISH</button>
          </div>
          <ul class="sidebar-nav" id="nav-tabs">
            <li><button data-section="meta">${window.icon('settings')} <span>Général</span></button></li>
            <li><button data-section="theme">${window.icon('palette')} <span>Couleurs</span></button></li>
            <li><button data-section="hero">${window.icon('image')} <span>Accueil</span></button></li>
            <li><button data-section="presentation">${window.icon('type')} <span>Présentation</span></button></li>
            <li><button data-section="notWhat">${window.icon('layout')} <span>Ce que DD n'est pas</span></button></li>
            <li><button data-section="services">${window.icon('layout')} <span>Services</span></button></li>
            <li><button data-section="contact">${window.icon('mail')} <span>Contact</span></button></li>
            <li><button data-section="testimonials">${window.icon('starFilled')} <span>Avis</span></button></li>
            <li><button data-section="social">${window.icon('instagram')} <span>Réseaux</span></button></li>
            <li><button data-section="footer">${window.icon('link')} <span>Footer</span></button></li>
          </ul>
          <div class="sidebar-footer">
            <div class="save-status saved" id="save-status"><span class="dot"></span> <span>Tout est à jour</span></div>
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
    $$('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => switchLang(btn.dataset.lang));
    });
    $('#save-btn').addEventListener('click', publishChanges);
    $('#logout-btn').addEventListener('click', async () => {
      if (state.dirty) {
        const ok = await modal({
          title: 'Quitter sans publier ?',
          message: 'Vos modifications seront perdues.',
          confirmLabel: 'Quitter',
          danger: true
        });
        if (!ok) return;
      }
      window.DD_GH.clearSession();
      location.reload();
    });

    window.addEventListener('beforeunload', (e) => {
      if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  function switchSection(name) {
    state.currentSection = name;
    $$('[data-section]').forEach(b => b.classList.toggle('active', b.dataset.section === name));
    renderSection(name);
  }

  function switchLang(lang) {
    state.currentLang = lang;
    $$('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    renderSection(state.currentSection);
  }

  // ============ SECTION RENDERING ============
  function renderSection(name) {
    const main = $('#main-content');
    if (!main) return;
    const renderers = {
      meta: renderMeta, theme: renderTheme, hero: renderHero,
      presentation: renderPresentation, notWhat: renderNotWhat,
      services: renderServices, contact: renderContact,
      testimonials: renderTestimonials, social: renderSocial, footer: renderFooter
    };
    main.innerHTML = (renderers[name] || (() => '<p>Section inconnue</p>'))();
    attachFieldListeners();
  }

  function sectionHeader(title, subtitle, hasI18n = true) {
    return `
      <div class="section-header">
        <div>
          <h1>${esc(title)}${hasI18n ? `<span class="lang-badge">${state.currentLang.toUpperCase()}</span>` : ''}</h1>
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

  function highlightsField(label, path, sourceTextPath) {
    const arr = getByPath(state.data, path) || [];
    return `
      <div class="highlights-field">
        <div class="label-mini">🌸 ${esc(label)} (apparaîtront en rose)</div>
        <div class="highlights-chips" data-chips="${esc(path)}">
          ${arr.map((w, i) => `
            <span class="highlight-chip">
              ${esc(w)}
              <button type="button" data-remove-chip="${esc(path)}.${i}">×</button>
            </span>
          `).join('')}
        </div>
        <div class="highlights-add">
          <input type="text" placeholder="Ajouter un mot/groupe à mettre en rose..." data-chip-input="${esc(path)}">
          <button type="button" data-add-chip="${esc(path)}">Ajouter</button>
        </div>
      </div>
    `;
  }

  function imageField(label, path, opts = {}) {
    const value = getByPath(state.data, path) || '';
    return `
      <div class="field">
        <label>${esc(label)}</label>
        <div class="image-field">
          <div class="image-preview">
            ${value ? `<img src="${esc(value)}" alt="">` : `<div class="empty">${window.icon('image', 32)} <span>Aucune image</span></div>`}
          </div>
          <div class="image-actions">
            <input type="file" accept="image/*" data-upload="${esc(path)}" style="display:none" id="up-${esc(path).replace(/[^a-z0-9]/gi,'_')}">
            <label for="up-${esc(path).replace(/[^a-z0-9]/gi,'_')}" class="btn btn-secondary btn-sm">${window.icon('upload', 14)} Uploader</label>
            <input type="text" data-bind="${esc(path)}" value="${esc(value)}" placeholder="…ou collez une URL" style="flex:1;min-width:200px">
          </div>
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
          <span>${esc(label)}</span>
        </label>
        ${help ? `<p class="help" style="margin-top:.4rem">${esc(help)}</p>` : ''}
      </div>
    `;
  }

  function colorField(label, key) {
    const value = state.data.theme?.colors?.[key] || '#000000';
    return `
      <label class="color-field" for="col-${key}">
        <div class="swatch" style="background:${esc(value)}"></div>
        <div class="info">
          <div class="name">${esc(label)}</div>
          <div class="value">${esc(value)}</div>
        </div>
        <input type="color" id="col-${key}" data-color="${esc(key)}" value="${esc(value)}">
      </label>
    `;
  }

  // ============ SECTIONS ============
  function renderMeta() {
    const L = state.currentLang;
    return `
      ${sectionHeader('Réglages généraux', 'Nom du site, descriptions SEO')}
      <div class="panel">
        <h2 class="panel-title">${window.icon('settings')} Identité</h2>
        ${textField('Nom du site (visible partout)', 'meta.siteName', { help: 'En majuscules pour respecter la charte Climate Crisis' })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('globe')} SEO ${L.toUpperCase()}</h2>
        ${textField('Titre onglet navigateur', `meta.${L}.pageTitle`)}
        ${textareaField('Description (Google)', `meta.${L}.description`, { rows: 2 })}
      </div>
    `;
  }

  function renderTheme() {
    return `
      ${sectionHeader('Couleurs & polices', 'Identité visuelle', false)}
      <div class="panel">
        <h2 class="panel-title">${window.icon('palette')} Palette Pantone</h2>
        <p class="panel-desc">Cliquez pour modifier. Les mots impactants utilisent le rose.</p>
        <div class="field-row">
          ${colorField('Jet Black', 'jetBlack')}
          ${colorField('Espresso', 'espresso')}
        </div>
        <div class="field-row">
          ${colorField('Espresso profond', 'espressoDeep')}
          ${colorField('Espresso doux', 'espressoSoft')}
        </div>
        <div class="field-row">
          ${colorField('Hazelnut', 'hazelnut')}
          ${colorField('Hazelnut doux', 'hazelnutSoft')}
        </div>
        <div class="field-row">
          ${colorField('Crème (fond principal)', 'cream')}
          ${colorField('🌸 Rose (mots impactants)', 'rose')}
        </div>
        <div class="field">
          ${colorField('🌸 Rose profond (hovers)', 'roseDeep')}
        </div>
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('settings')} Options</h2>
        ${toggleField('Activer les animations au scroll', 'theme.options.enableAnimations')}
      </div>
    `;
  }

  function renderHero() {
    const L = state.currentLang;
    return `
      ${sectionHeader('Accueil (Hero)', 'Bannière principale photo + titre')}
      <div class="panel">
        ${toggleField('Afficher la section', 'hero.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('image')} Image de fond</h2>
        ${imageField('Photo en fond', 'hero.backgroundImage')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Titre principal ${L.toUpperCase()}</h2>
        ${textField('Titre (visible en grand)', `hero.${L}.title`, { help: 'Court et percutant. Une phrase de 5-8 mots max.' })}
        ${highlightsField('Mots à mettre en rose dans le titre', `hero.${L}.highlights`)}
        ${textareaField('Sous-titre', `hero.${L}.subtitle`, { rows: 2 })}
      </div>
    `;
  }

  function renderPresentation() {
    const L = state.currentLang;
    const blocks = getByPath(state.data, `presentation.${L}.blocks`) || [];
    return `
      ${sectionHeader('Présentation (quinconce)', 'Blocs de texte alternés gauche/droite')}
      <div class="panel">
        ${toggleField('Afficher la section', 'presentation.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Blocs ${L.toUpperCase()}</h2>
        <p class="panel-desc">Chaque bloc apparaît alterné. Les mots dans "highlights" passent en rose automatiquement.</p>
        <div class="items-list">
          ${blocks.map((b, i) => `
            <div class="item-card">
              <div class="item-header has-content">
                <div class="item-info">
                  <div class="title">Bloc ${i + 1} — aligné ${b.align === 'right' ? 'à droite' : 'à gauche'}</div>
                </div>
                <div class="item-actions">
                  <button data-remove="presentation.${L}.blocks.${i}" class="danger">${window.icon('trash')}</button>
                </div>
              </div>
              <div class="item-body">
                <div class="field">
                  <label>Alignement</label>
                  <select data-bind="presentation.${L}.blocks.${i}.align">
                    <option value="left" ${b.align === 'left' ? 'selected' : ''}>Gauche</option>
                    <option value="right" ${b.align === 'right' ? 'selected' : ''}>Droite</option>
                  </select>
                </div>
                <div class="field">
                  <label>Texte du bloc</label>
                  <textarea data-bind="presentation.${L}.blocks.${i}.text" rows="4">${esc(b.text)}</textarea>
                </div>
                ${highlightsField('Mots impactants à mettre en rose', `presentation.${L}.blocks.${i}.highlights`)}
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" data-add="presentation.${L}.blocks" data-template="presBlock" style="margin-top:1rem">${window.icon('plus', 14)} Ajouter un bloc</button>
      </div>
    `;
  }

  function renderNotWhat() {
    const L = state.currentLang;
    const items = getByPath(state.data, `notWhat.${L}.items`) || [];
    return `
      ${sectionHeader('Ce que Divine Dogs n\'est pas', 'Section accordéon en bandeau noir')}
      <div class="panel">
        ${toggleField('Afficher la section', 'notWhat.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Contenu ${L.toUpperCase()}</h2>
        ${textField('Titre (cliquable)', `notWhat.${L}.title`)}
        <div class="field">
          <label>Points (1 par ligne)</label>
          <div class="items-list">
            ${items.map((it, i) => `
              <div class="item-card">
                <div class="item-header">
                  <span class="item-drag">${window.icon('drag', 16)}</span>
                  <div style="flex:1">
                    <input type="text" data-bind="notWhat.${L}.items.${i}" value="${esc(it)}" style="border:none;background:transparent;width:100%;padding:.4rem 0;font-weight:500">
                  </div>
                  <div class="item-actions">
                    <button data-remove="notWhat.${L}.items.${i}" class="danger">${window.icon('trash')}</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-secondary btn-sm" data-add="notWhat.${L}.items" data-template="string" style="margin-top:.75rem">${window.icon('plus', 14)} Ajouter</button>
        </div>
      </div>
    `;
  }

  function renderServices() {
    const L = state.currentLang;
    return `
      ${sectionHeader('Services', 'Section "en cours d\'affichage" pour le moment')}
      <div class="panel">
        ${toggleField('Afficher la section', 'services.enabled')}
        ${toggleField('Mode "à venir" (texte simple)', 'services.comingSoon')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Textes ${L.toUpperCase()}</h2>
        ${textField('Eyebrow (petit texte)', `services.${L}.eyebrow`)}
        ${textField('Titre principal', `services.${L}.title`)}
        ${textareaField('Description', `services.${L}.description`, { rows: 3 })}
      </div>
    `;
  }

  function renderContact() {
    const L = state.currentLang;
    return `
      ${sectionHeader('Formulaire de contact', 'Textes et configuration')}
      <div class="panel">
        ${toggleField('Afficher la section', 'contact.enabled')}
        ${textField('Endpoint Formspree (pour recevoir les emails)', 'contact.formspreeEndpoint', { placeholder: 'https://formspree.io/f/xxxx', help: 'Créez un compte gratuit sur formspree.io, créez un nouveau formulaire, et collez ici l\'URL fournie.' })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Textes ${L.toUpperCase()}</h2>
        ${textField('Titre', `contact.${L}.title`)}
        ${highlightsField('Mots à mettre en rose', `contact.${L}.highlights`)}
        ${textareaField('Description', `contact.${L}.description`, { rows: 2 })}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('settings')} Libellés du formulaire ${L.toUpperCase()}</h2>
        <div class="field-row">
          ${textField('Prénom', `contact.${L}.fields.firstName`)}
          ${textField('Nom', `contact.${L}.fields.lastName`)}
        </div>
        <div class="field-row">
          ${textField('Email', `contact.${L}.fields.email`)}
          ${textField('Téléphone', `contact.${L}.fields.phone`)}
        </div>
        ${textField('Note "email et/ou téléphone"', `contact.${L}.fields.contactNote`)}
        ${textField('Titre section "Votre chien"', `contact.${L}.fields.dogSection`)}
        <div class="field-row-3">
          ${textField('Prénom chien', `contact.${L}.fields.dogName`)}
          ${textField('Âge', `contact.${L}.fields.dogAge`)}
          ${textField('Race', `contact.${L}.fields.dogBreed`)}
        </div>
        ${textField('Label "votre besoin"', `contact.${L}.fields.message`)}
        ${textField('Bouton envoyer', `contact.${L}.fields.submit`)}
        ${textareaField('Message de succès', `contact.${L}.fields.success`, { rows: 2 })}
      </div>
    `;
  }

  function renderTestimonials() {
    const L = state.currentLang;
    const items = state.data.testimonials.items || [];
    return `
      ${sectionHeader('Avis clients', 'Maximum 5 témoignages affichés')}
      <div class="panel">
        ${toggleField('Afficher la section', 'testimonials.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} En-tête ${L.toUpperCase()}</h2>
        ${textField('Eyebrow', `testimonials.${L}.eyebrow`)}
        ${textField('Titre', `testimonials.${L}.title`)}
        ${highlightsField('Mots à mettre en rose', `testimonials.${L}.highlights`)}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('starFilled')} Témoignages</h2>
        <div class="items-list">
          ${items.map((t, i) => {
            const tx = t[L] || {};
            return `
              <div class="item-card">
                <div class="item-header has-content">
                  <div class="item-info">
                    <div class="title">${esc(tx.author || 'Nouveau')}</div>
                    <div class="preview">${esc((tx.text || '').substring(0, 60))}…</div>
                  </div>
                  <div class="item-actions">
                    <button data-remove="testimonials.items.${i}" class="danger">${window.icon('trash')}</button>
                  </div>
                </div>
                <div class="item-body">
                  <div class="field"><label>Texte du témoignage ${L.toUpperCase()}</label><textarea data-bind="testimonials.items.${i}.${L}.text" rows="3">${esc(tx.text)}</textarea></div>
                  <div class="field-row-3">
                    <div class="field"><label>Auteur</label><input type="text" data-bind="testimonials.items.${i}.${L}.author" value="${esc(tx.author)}"></div>
                    <div class="field"><label>Contexte (chien)</label><input type="text" data-bind="testimonials.items.${i}.${L}.dog" value="${esc(tx.dog)}"></div>
                    <div class="field"><label>Étoiles</label><select data-bind-num="testimonials.items.${i}.stars">
                      ${[1,2,3,4,5].map(n => `<option value="${n}" ${t.stars===n?'selected':''}>${n}</option>`).join('')}
                    </select></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" data-add="testimonials.items" data-template="testimonial" style="margin-top:1rem">${window.icon('plus', 14)} Ajouter un témoignage</button>
      </div>
    `;
  }

  function renderSocial() {
    const L = state.currentLang;
    return `
      ${sectionHeader('Réseaux sociaux', 'Section finale + footer')}
      <div class="panel">
        ${toggleField('Afficher la section', 'social.enabled')}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('type')} Phrase d'appel ${L.toUpperCase()}</h2>
        ${textareaField('Titre', `social.${L}.title`, { rows: 2 })}
        ${highlightsField('Mots à mettre en rose', `social.${L}.highlights`)}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('link')} Liens réseaux</h2>
        ${textField('URL Instagram', 'social.instagramUrl', { type: 'url' })}
        ${textField('URL Facebook', 'social.facebookUrl', { type: 'url', help: 'Laisser vide si pas encore créée' })}
        ${textField('URL TikTok', 'social.tiktokUrl', { type: 'url' })}
      </div>
    `;
  }

  function renderFooter() {
    const L = state.currentLang;
    const links = getByPath(state.data, `footer.${L}.legalLinks`) || [];
    return `
      ${sectionHeader('Footer', 'Bas de page et liens légaux')}
      <div class="panel">
        ${textField('Année copyright', 'footer.year')}
        ${textField('Tagline ' + L.toUpperCase(), `footer.${L}.tagline`)}
        ${textField('Titre section légal', `footer.${L}.legalTitle`)}
      </div>
      <div class="panel">
        <h2 class="panel-title">${window.icon('link')} Liens légaux ${L.toUpperCase()}</h2>
        <div class="items-list">
          ${links.map((lk, i) => `
            <div class="item-card">
              <div class="item-header has-content">
                <div class="item-info"><div class="title">${esc(lk.label)}</div></div>
                <div class="item-actions">
                  <button data-remove="footer.${L}.legalLinks.${i}" class="danger">${window.icon('trash')}</button>
                </div>
              </div>
              <div class="item-body">
                <div class="field-row">
                  <div class="field"><label>Texte affiché</label><input type="text" data-bind="footer.${L}.legalLinks.${i}.label" value="${esc(lk.label)}"></div>
                  <div class="field"><label>URL</label><input type="text" data-bind="footer.${L}.legalLinks.${i}.url" value="${esc(lk.url)}"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" data-add="footer.${L}.legalLinks" data-template="legalLink" style="margin-top:1rem">${window.icon('plus', 14)} Ajouter</button>
      </div>
    `;
  }

  // ============ DATA BINDINGS ============
  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => {
      if (o == null) return undefined;
      return /^\d+$/.test(k) ? o[parseInt(k, 10)] : o[k];
    }, obj);
  }

  function setByPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    let target = obj;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const idx = /^\d+$/.test(k) ? parseInt(k, 10) : k;
      if (target[idx] == null) {
        const nextIsNum = /^\d+$/.test(keys[i+1] || last);
        target[idx] = nextIsNum ? [] : {};
      }
      target = target[idx];
    }
    const lastKey = /^\d+$/.test(last) ? parseInt(last, 10) : last;
    target[lastKey] = value;
  }

  function attachFieldListeners() {
    $$('[data-bind]').forEach(el => {
      const handler = (e) => { setByPath(state.data, el.dataset.bind, e.target.value); markDirty(); };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });
    $$('[data-bind-bool]').forEach(el => {
      el.addEventListener('change', (e) => { setByPath(state.data, el.dataset.bindBool, e.target.checked); markDirty(); });
    });
    $$('[data-bind-num]').forEach(el => {
      el.addEventListener('change', (e) => { setByPath(state.data, el.dataset.bindNum, parseInt(e.target.value, 10)); markDirty(); });
    });
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
    $$('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => addItem(btn.dataset.add, btn.dataset.template));
    });
    $$('[data-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await modal({ title: 'Supprimer ?', message: 'Cet élément sera supprimé.', confirmLabel: 'Supprimer', danger: true });
        if (ok) removeItem(btn.dataset.remove);
      });
    });
    $$('[data-upload]').forEach(input => {
      input.addEventListener('change', (e) => handleUpload(e.target, input.dataset.upload));
    });
    // Highlights chips
    $$('[data-add-chip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const path = btn.dataset.addChip;
        const input = $(`[data-chip-input="${path}"]`);
        if (input && input.value.trim()) {
          const arr = getByPath(state.data, path) || [];
          arr.push(input.value.trim());
          setByPath(state.data, path, arr);
          input.value = '';
          markDirty();
          renderSection(state.currentSection);
        }
      });
    });
    $$('[data-chip-input]').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const path = input.dataset.chipInput;
          $(`[data-add-chip="${path}"]`)?.click();
        }
      });
    });
    $$('[data-remove-chip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const path = btn.dataset.removeChip;
        const keys = path.split('.');
        const idx = parseInt(keys.pop(), 10);
        const arr = getByPath(state.data, keys.join('.'));
        arr.splice(idx, 1);
        markDirty();
        renderSection(state.currentSection);
      });
    });
  }

  function addItem(path, template) {
    const arr = getByPath(state.data, path) || [];
    let newItem;
    if (template === 'string') newItem = '';
    else if (template === 'presBlock') newItem = { id: 'block-' + Date.now(), align: 'left', text: '', highlights: [] };
    else if (template === 'testimonial') newItem = { id: 't-' + Date.now(), stars: 5, fr: { text: '', author: '', dog: '' }, en: { text: '', author: '', dog: '' } };
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
      toast('Image > 5 Mo. Compressez avant.', 'error', 5000); return;
    }
    toast('Upload en cours…', 'info');
    try {
      const compressed = await compressImage(file);
      const path = await window.DD_GH.uploadImage(compressed, file.name);
      setByPath(state.data, targetPath, path);
      toast('Image uploadée', 'success');
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
          const MAX = 2400;
          let { width, height } = img;
          if (width > MAX) { height = height * (MAX / width); width = MAX; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
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
    toast('Publication…', 'info');
    try {
      state.data.lastUpdated = new Date().toISOString();
      const newSha = await window.DD_GH.saveData(state.data, state.sha);
      state.sha = newSha;
      state.dirty = false;
      state.saving = false;
      updateSaveStatus();
      toast('Publié ! Visible dans ~1 minute.', 'success', 5000);
    } catch (err) {
      state.saving = false;
      updateSaveStatus();
      $('#save-status')?.classList.add('error');
      toast('Erreur : ' + err.message, 'error', 6000);
    }
  }

  // ============ INIT ============
  async function initAdmin() {
    try {
      const result = await window.DD_GH.loadData();
      state.data = result.data;
      state.sha = result.sha;
      state.currentLang = result.data.defaultLang || 'fr';
      renderShell();
      switchSection('meta');
    } catch (err) {
      toast('Erreur : ' + err.message, 'error', 6000);
      setTimeout(() => { window.DD_GH.clearSession(); location.reload(); }, 3000);
    }
  }

  function boot() {
    const session = window.DD_GH.getSession();
    if (session?.token) initAdmin();
    else renderLogin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
