/* ==========================================================================
   Divine Dogs — Admin · Interface (mini-CMS)
   ========================================================================== */
(function() {
  'use strict';
  const GH = window.DD_GH;
  const G = { data: null, sha: null, lang: 'fr', section: 'general', dirty: false };

  /* ---------- utilitaires ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => (s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
  const resolve = (path) => path.split('.').map(s => (s === 'L' ? G.lang : s));
  function getPath(obj, path) { let c = obj; for (const k of resolve(path)) { if (c == null) return undefined; c = c[k]; } return c; }
  function setPath(obj, path, val) {
    const ks = resolve(path); let c = obj;
    for (let i = 0; i < ks.length - 1; i++) {
      const k = ks[i];
      if (c[k] == null) c[k] = /^\d+$/.test(String(ks[i + 1])) ? [] : {};
      c = c[k];
    }
    c[ks[ks.length - 1]] = val;
  }
  function toast(msg, type = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.textContent = msg;
    $('#toasts').appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3800);
  }
  const markDirty = () => { G.dirty = true; $('#saveBtn')?.classList.add('pulse'); };

  /* ---------- constructeurs de champs ---------- */
  function fText(label, path, ph = '') {
    return `<div class="field"><label>${esc(label)}</label><input type="text" data-path="${path}" value="${esc(getPath(G.data, path) || '')}" placeholder="${esc(ph)}"></div>`;
  }
  function fTextarea(label, path, ph = '', rows = 4) {
    return `<div class="field"><label>${esc(label)}</label><textarea rows="${rows}" data-path="${path}" placeholder="${esc(ph)}">${esc(getPath(G.data, path) || '')}</textarea></div>`;
  }
  function fToggle(label, path) {
    const on = getPath(G.data, path) !== false;
    return `<div class="field-toggle"><label class="switch"><input type="checkbox" data-path="${path}" data-type="bool" ${on ? 'checked' : ''}><span class="slider"></span></label><span>${esc(label)}</span></div>`;
  }
  function fHighlights(label, path) {
    const arr = getPath(G.data, path) || [];
    return `<div class="field"><label>${esc(label)} <span class="hint">séparés par des virgules — affichés en rose</span></label><input type="text" data-path="${path}" data-type="csv" value="${esc(arr.join(', '))}"></div>`;
  }
  function fSelect(label, path, options) {
    const val = getPath(G.data, path);
    return `<div class="field"><label>${esc(label)}</label><select data-path="${path}">${options.map(o => `<option value="${o.v}" ${o.v === val ? 'selected' : ''}>${esc(o.t)}</option>`).join('')}</select></div>`;
  }
  function fNumber(label, path, min = 1, max = 5) {
    return `<div class="field field-sm"><label>${esc(label)}</label><input type="number" min="${min}" max="${max}" data-path="${path}" data-type="num" value="${esc(getPath(G.data, path) || min)}"></div>`;
  }
  function fImage(label, path) {
    const val = getPath(G.data, path) || '';
    return `<div class="field"><label>${esc(label)}</label>
      <div class="img-field">
        <input type="text" data-path="${path}" value="${esc(val)}" placeholder="URL ou chemin de l'image">
        <button type="button" class="btn-mini" data-upload="${path}">${window.icon('upload', 15)} Téléverser</button>
      </div>
      ${val ? `<div class="img-preview"><img src="${esc(val.startsWith('http') ? val : '../' + val)}" alt="" onerror="this.style.display='none'"></div>` : ''}
    </div>`;
  }
  function fStringList(label, listPath) {
    const arr = getPath(G.data, listPath) || [];
    return `<div class="field"><label>${esc(label)}</label>
      <div class="list-simple" data-list="${listPath}">
        ${arr.map((v, i) => `<div class="list-row"><input type="text" data-path="${listPath}.${i}" value="${esc(v)}">
          <button type="button" class="ico" data-act="up" data-list="${listPath}" data-i="${i}" title="Monter">▲</button>
          <button type="button" class="ico" data-act="down" data-list="${listPath}" data-i="${i}" title="Descendre">▼</button>
          <button type="button" class="ico del" data-act="del" data-list="${listPath}" data-i="${i}" title="Supprimer">${window.icon('trash', 14)}</button>
        </div>`).join('')}
      </div>
      <button type="button" class="btn-mini add" data-act="add-str" data-list="${listPath}">${window.icon('plus', 14)} Ajouter</button>
    </div>`;
  }

  /* Liste d'objets générique.
     itemFields: [{type,key,label,options?,lang?}]  (lang=true => sous currentLang)
     template: objet ajouté au clic sur "Ajouter" */
  function objectList(label, listPath, itemFields, template, titleKey) {
    const arr = getPath(G.data, listPath) || [];
    const items = arr.map((it, i) => {
      const head = titleKey ? (getPath(G.data, `${listPath}.${i}.${titleKey}`) || `Élément ${i + 1}`) : `Élément ${i + 1}`;
      const body = itemFields.map(f => {
        const p = `${listPath}.${i}.${f.lang ? 'L.' : ''}${f.key}`;
        if (f.type === 'text') return fText(f.label, p, f.ph || '');
        if (f.type === 'textarea') return fTextarea(f.label, p, f.ph || '', f.rows || 4);
        if (f.type === 'highlights') return fHighlights(f.label, p);
        if (f.type === 'select') return fSelect(f.label, p, f.options);
        if (f.type === 'number') return fNumber(f.label, p, f.min, f.max);
        if (f.type === 'stringlist') return fStringList(f.label, p);
        return '';
      }).join('');
      return `<div class="obj-card">
        <div class="obj-head"><strong>${esc(head)}</strong>
          <div class="obj-actions">
            <button type="button" class="ico" data-act="up" data-list="${listPath}" data-i="${i}" title="Monter">▲</button>
            <button type="button" class="ico" data-act="down" data-list="${listPath}" data-i="${i}" title="Descendre">▼</button>
            <button type="button" class="ico del" data-act="del" data-list="${listPath}" data-i="${i}" title="Supprimer">${window.icon('trash', 14)}</button>
          </div>
        </div>
        <div class="obj-body">${body}</div>
      </div>`;
    }).join('');
    return `<div class="objlist"><div class="objlist-label">${esc(label)}</div>${items}
      <button type="button" class="btn-mini add" data-act="add-obj" data-list="${listPath}" data-tpl='${esc(JSON.stringify(template))}'>${window.icon('plus', 14)} Ajouter</button>
    </div>`;
  }

  function group(title, inner, note) {
    return `<div class="group"><h3 class="group-title">${esc(title)}</h3>${note ? `<p class="group-note">${esc(note)}</p>` : ''}${inner}</div>`;
  }

  /* ---------- définitions des sections ---------- */
  const SECTIONS = [
    { id: 'general', label: 'Général & SEO', icon: 'settings', render: () => {
      return group('Titre & description (SEO Google)',
        fText('Titre de l\'onglet / Google', 'meta.L.pageTitle', '~60 caractères') +
        fTextarea('Description Google', 'meta.L.description', '~155 caractères', 2), 'Ce qui s\'affiche dans les résultats de recherche Google.')
      + group('Coordonnées',
        fText('Email de contact', 'contactInfo.email') +
        fText('Téléphone', 'contactInfo.phone') +
        fToggle('Afficher le téléphone publiquement', 'contactInfo.phonePublic') +
        fText('Horaires', 'contactInfo.hours') +
        fText('Zones d\'intervention', 'contactInfo.areas'));
    }},
    { id: 'bandeau', label: 'Bandeau d\'annonce', icon: 'tag', render: () =>
      group('Bandeau en haut du site',
        fToggle('Afficher le bandeau', 'announce.enabled') +
        fText('Texte du bandeau', 'announce.L.text'), 'Petit message rose tout en haut. Décochez pour le masquer.')
    },
    { id: 'hero', label: 'Bannière (accueil)', icon: 'image', render: () =>
      group('Bannière d\'accueil',
        fImage('Photo de fond', 'hero.backgroundImage') +
        fText('Titre principal', 'hero.L.title') +
        fHighlights('Mots en rose (dans le titre)', 'hero.L.highlights') +
        fText('Sous-titre', 'hero.L.subtitle'))
    },
    { id: 'presentation', label: 'Présentation', icon: 'layout', render: () =>
      group('Blocs de présentation',
        fToggle('Afficher la section', 'presentation.enabled') +
        objectList('Blocs de texte', 'presentation.L.blocks',
          [ { type: 'select', key: 'align', label: 'Alignement', options: [{ v: 'left', t: 'Gauche' }, { v: 'right', t: 'Droite' }] },
            { type: 'textarea', key: 'text', label: 'Texte', rows: 4 },
            { type: 'highlights', key: 'highlights', label: 'Mots en rose' } ],
          { id: 'block-' + Date.now(), align: 'left', text: '', highlights: [] }, 'text'))
    },
    { id: 'valeurs', label: 'Valeurs', icon: 'checkCircle', render: () =>
      group('Mes engagements',
        fToggle('Afficher la section', 'values.enabled') +
        fText('Sur-titre', 'values.L.eyebrow') +
        fText('Titre', 'values.L.title') +
        fHighlights('Mots en rose', 'values.L.highlights') +
        fTextarea('Devise (phrase en italique)', 'values.L.devise', '', 2) +
        fStringList('Liste des valeurs', 'values.L.items'))
    },
    { id: 'nestpas', label: 'Ce que Divine Dogs n\'est pas', icon: 'x', render: () =>
      group('Accordéon "n\'est pas"',
        fToggle('Afficher la section', 'notWhat.enabled') +
        fText('Titre', 'notWhat.L.title') +
        fStringList('Points', 'notWhat.L.items'))
    },
    { id: 'contact', label: 'Contact & formulaire', icon: 'mail', render: () =>
      `<div class="callout">${window.icon('send', 18)}<div><strong>Activer le formulaire</strong><p>Créez un compte gratuit sur <a href="https://formspree.io" target="_blank" rel="noopener">formspree.io</a>, créez un formulaire (destinataire : votre email), copiez le lien qui ressemble à <code>https://formspree.io/f/xxxx</code> et collez-le ci-dessous. Tant que ce champ est vide, le formulaire ne vous envoie rien.</p></div></div>`
      + group('Formulaire',
        fText('Lien Formspree (endpoint)', 'contact.formspreeEndpoint', 'https://formspree.io/f/xxxxxxx'))
      + group('Textes du formulaire',
        fToggle('Afficher la section contact', 'contact.enabled') +
        fText('Titre', 'contact.L.title') +
        fHighlights('Mots en rose', 'contact.L.highlights') +
        fTextarea('Texte d\'introduction', 'contact.L.description', '', 2) +
        fText('Message de confirmation (après envoi)', 'contact.L.fields.success'))
      + group('Où vont vos données ? (RGPD)',
        fToggle('Afficher l\'accordéon RGPD', 'contact.dataPrivacy.enabled') +
        fText('Titre', 'contact.dataPrivacy.L.title') +
        fTextarea('Texte', 'contact.dataPrivacy.L.body', '', 6))
    },
    { id: 'avis', label: 'Avis clients', icon: 'starFilled', render: () =>
      group('Témoignages',
        fToggle('Afficher la section', 'testimonials.enabled') +
        fText('Sur-titre', 'testimonials.L.eyebrow') +
        fText('Titre', 'testimonials.L.title') +
        fHighlights('Mots en rose', 'testimonials.L.highlights') +
        objectList('Avis (les 5 premiers s\'affichent)', 'testimonials.items',
          [ { type: 'number', key: 'stars', label: 'Étoiles (1-5)' },
            { type: 'textarea', key: 'text', label: 'Texte de l\'avis', lang: true, rows: 3 },
            { type: 'text', key: 'author', label: 'Nom de la personne', lang: true },
            { type: 'text', key: 'dog', label: 'Chien (ex : avec Iko, 3 ans)', lang: true } ],
          { id: 't-' + Date.now(), stars: 5, fr: { text: '', author: '', dog: '' }, en: { text: '', author: '', dog: '' } }, null))
    },
    { id: 'reseaux', label: 'Réseaux sociaux', icon: 'instagram', render: () =>
      group('Liens réseaux (laisser vide = icône masquée)',
        fToggle('Afficher la section', 'social.enabled') +
        fText('Titre', 'social.L.title') +
        fHighlights('Mots en rose', 'social.L.highlights') +
        fText('Instagram', 'social.instagramUrl') +
        fText('Facebook', 'social.facebookUrl') +
        fText('TikTok', 'social.tiktokUrl'))
    },
    { id: 'partenaire', label: 'Partenaire', icon: 'tag', render: () =>
      group('Carte partenaire',
        fToggle('Afficher le partenaire', 'partner.enabled') +
        fText('Sur-titre', 'partner.L.eyebrow') +
        fText('Nom du partenaire', 'partner.L.name') +
        fTextarea('Texte', 'partner.L.text', '', 2) +
        fText('Code promo', 'partner.code') +
        fText('Lien du partenaire', 'partner.url') +
        fText('Texte du bouton', 'partner.L.cta'))
    },
    { id: 'services', label: 'Page Services', icon: 'paw', render: () =>
      group('Page Services',
        fToggle('Activer la page', 'servicesPage.enabled') +
        fText('Sur-titre', 'servicesPage.L.eyebrow') +
        fText('Titre', 'servicesPage.L.title') +
        fHighlights('Mots en rose', 'servicesPage.L.highlights') +
        fTextarea('Introduction', 'servicesPage.L.intro', '', 2) +
        fText('Texte du bouton d\'appel', 'servicesPage.L.ctaLabel') +
        objectList('Prestations', 'servicesPage.L.items',
          [ { type: 'text', key: 'name', label: 'Nom de la prestation' },
            { type: 'text', key: 'duration', label: 'Durée / lieu' },
            { type: 'textarea', key: 'note', label: 'Note (encadré rose)', rows: 2 },
            { type: 'textarea', key: 'text', label: 'Description', rows: 6 },
            { type: 'text', key: 'includesTitle', label: 'Titre de la liste "ce que comprend"' },
            { type: 'stringlist', key: 'includes', label: 'Ce que comprend' } ],
          { name: 'Nouvelle prestation', duration: '', note: '', text: '', includesTitle: '', includes: [] }, 'name'))
    },
    { id: 'tarifs', label: 'Page Tarifs', icon: 'tag', render: () =>
      group('Page Tarifs',
        fToggle('Activer la page', 'tarifsPage.enabled') +
        fText('Sur-titre', 'tarifsPage.L.eyebrow') +
        fText('Titre', 'tarifsPage.L.title') +
        fHighlights('Mots en rose', 'tarifsPage.L.highlights') +
        fTextarea('Bandeau paiement', 'tarifsPage.L.paymentInfo', '', 2) +
        objectList('Grille tarifaire', 'tarifsPage.L.grid',
          [ { type: 'text', key: 'name', label: 'Prestation' },
            { type: 'text', key: 'price', label: 'Prix (ex : 80 € ou Sur devis)' },
            { type: 'text', key: 'note', label: 'Note (optionnel)' } ],
          { name: 'Nouvelle ligne', price: '', note: '' }, 'name') +
        fTextarea('Texte forfaits', 'tarifsPage.L.forfaits', '', 2) +
        fHighlights('Mots en rose (forfaits)', 'tarifsPage.L.forfaitsHighlights'))
      + group('FAQ tarifs',
        fText('Titre de la FAQ', 'tarifsPage.L.faqTitle') +
        fHighlights('Mots en rose (titre FAQ)', 'tarifsPage.L.faqHighlights') +
        objectList('Questions / réponses', 'tarifsPage.L.faq',
          [ { type: 'text', key: 'q', label: 'Question' },
            { type: 'textarea', key: 'a', label: 'Réponse', rows: 4 },
            { type: 'highlights', key: 'aHighlights', label: 'Mots en rose (réponse)' } ],
          { q: 'Nouvelle question', a: '', aHighlights: [] }, 'q'))
    },
    { id: 'legal', label: 'Pages légales', icon: 'edit', render: () =>
      group('Mentions légales',
        fText('Éditeur', 'legal.L.mentions.editor') +
        fText('Directrice de publication', 'legal.L.mentions.director') +
        fText('Hébergeur', 'legal.L.mentions.host') +
        fText('Contact', 'legal.L.mentions.contact'))
      + group('CGV',
        fTextarea('Paiement', 'legal.L.cgv.payment', '', 3) +
        fTextarea('Annulation', 'legal.L.cgv.cancellation', '', 5) +
        fTextarea('Remboursement', 'legal.L.cgv.refund', '', 5))
      + group('Confidentialité',
        fTextarea('Texte', 'legal.L.confidentialite.body', '', 8))
    },
    { id: 'pied', label: 'Pied de page', icon: 'layout', render: () =>
      group('Pied de page',
        fText('Phrase de description', 'footer.L.tagline') +
        fText('Titre section légale', 'footer.L.legalTitle'))
    },
    { id: 'apparence', label: 'Couleurs & polices', icon: 'palette', render: () => {
      const colors = [ ['espresso', 'Fond sombre (espresso)'], ['cream', 'Fond clair (crème)'], ['hazelnut', 'Beige (hazelnut)'], ['rose', 'Accent (rose)'], ['roseDeep', 'Rose foncé'], ['jetBlack', 'Noir'] ];
      const colorInputs = colors.map(([k, l]) => {
        const v = getPath(G.data, `theme.colors.${k}`) || '#000000';
        return `<div class="field-color"><input type="color" data-path="theme.colors.${k}" value="${esc(v)}"><span>${esc(l)}</span><code>${esc(v)}</code></div>`;
      }).join('');
      return group('Couleurs', `<div class="color-grid">${colorInputs}</div>`, 'Attention : modifier les couleurs change tout le site. À utiliser avec précaution.')
        + group('Polices',
          fText('Police logo / grands titres', 'theme.fonts.logo') +
          fText('Police titres', 'theme.fonts.display') +
          fText('Police corps de texte', 'theme.fonts.body'));
    }}
  ];

  /* ---------- rendu ---------- */
  function renderSidebar() {
    $('#sideNav').innerHTML = SECTIONS.map(s =>
      `<button class="side-item ${s.id === G.section ? 'active' : ''}" data-section="${s.id}">${window.icon(s.icon, 16)}<span>${esc(s.label)}</span></button>`
    ).join('');
  }
  function renderSection() {
    const s = SECTIONS.find(x => x.id === G.section);
    $('#editor').innerHTML = s ? s.render() : '';
    $('#editor').scrollTop = 0;
  }
  function renderAll() { renderSidebar(); renderSection(); $('#langLabel').textContent = G.lang.toUpperCase(); }

  /* ---------- événements ---------- */
  function bindEditorEvents() {
    const editor = $('#editorWrap');

    editor.addEventListener('input', (e) => {
      const el = e.target;
      if (!el.dataset.path) return;
      let val = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset.type === 'csv') val = el.value.split(',').map(x => x.trim()).filter(Boolean);
      if (el.dataset.type === 'num') val = parseInt(el.value, 10) || 0;
      if (el.dataset.type === 'bool') val = el.checked;
      setPath(G.data, el.dataset.path, val);
      markDirty();
      // maj live du code couleur affiché
      if (el.type === 'color') { const code = el.parentElement.querySelector('code'); if (code) code.textContent = el.value; }
    });

    editor.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (btn) { handleListAction(btn); return; }
      const up = e.target.closest('[data-upload]');
      if (up) { triggerUpload(up.dataset.upload); return; }
    });

    // navigation sections
    $('#sideNav').addEventListener('click', (e) => {
      const b = e.target.closest('[data-section]');
      if (!b) return;
      G.section = b.dataset.section; renderAll();
    });
  }

  function handleListAction(btn) {
    const listPath = btn.dataset.list;
    const arr = getPath(G.data, listPath) || [];
    const i = parseInt(btn.dataset.i, 10);
    const act = btn.dataset.act;
    if (act === 'add-str') arr.push('');
    else if (act === 'add-obj') { const tpl = JSON.parse(btn.dataset.tpl); arr.push(JSON.parse(JSON.stringify(tpl))); }
    else if (act === 'del') arr.splice(i, 1);
    else if (act === 'up' && i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; }
    else if (act === 'down' && i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; }
    setPath(G.data, listPath, arr);
    markDirty();
    renderSection();
  }

  function triggerUpload(path) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      toast('Compression et upload en cours…', 'info');
      try {
        const { base64, filename } = await compressImage(file);
        const repoPath = await GH.uploadImage(filename, base64);
        setPath(G.data, path, repoPath);
        markDirty();
        renderSection();
        toast('Image téléversée. Pensez à publier.', 'ok');
      } catch (err) { toast('Erreur upload : ' + err.message, 'err'); }
    };
    input.click();
  }

  // Compression côté client (max 2000px, jpeg 82%)
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = reject;
      img.onload = () => {
        const max = 2000;
        let { width, height } = img;
        if (width > max || height > max) { const r = Math.min(max / width, max / height); width = Math.round(width * r); height = Math.round(height * r); }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = dataUrl.split(',')[1];
        const name = 'img-' + Date.now() + '.jpg';
        resolve({ base64, filename: name });
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function save() {
    if (!G.dirty) { toast('Aucune modification à publier.', 'info'); return; }
    const btn = $('#saveBtn'); btn.disabled = true; btn.classList.add('loading');
    try {
      G.data.lastUpdated = new Date().toISOString();
      const newSha = await GH.saveData(G.data, G.sha, 'MàJ contenu via admin');
      G.sha = newSha; G.dirty = false;
      btn.classList.remove('pulse');
      toast('Publié ! Le site se met à jour dans ~1 minute.', 'ok');
    } catch (err) { toast('Erreur : ' + err.message, 'err'); }
    finally { btn.disabled = false; btn.classList.remove('loading'); }
  }

  /* ---------- login ---------- */
  async function tryLogin(token, remember) {
    GH.setToken(token, remember);
    const btn = $('#loginBtn'); btn.disabled = true; btn.textContent = 'Connexion…';
    try {
      await GH.verify();
      const { data, sha } = await GH.loadData();
      G.data = data; G.sha = sha; G.lang = data.defaultLang || 'fr';
      $('#login').classList.add('hidden');
      $('#app').classList.remove('hidden');
      bindEditorEvents();
      renderAll();
      toast('Connectée. Bienvenue !', 'ok');
    } catch (err) {
      GH.clearToken();
      $('#loginError').textContent = err.message;
      $('#loginError').classList.add('show');
    } finally { btn.disabled = false; btn.textContent = 'Se connecter'; }
  }

  function initLogin() {
    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const token = $('#tokenInput').value.trim();
      if (!token) return;
      tryLogin(token, $('#rememberInput').checked);
    });
    // auto-login si token mémorisé
    const saved = GH.getToken();
    if (saved) { $('#tokenInput').value = saved; tryLogin(saved, true); }
  }

  function initApp() {
    $('#saveBtn').addEventListener('click', save);
    $('#langBtn').addEventListener('click', () => { G.lang = G.lang === 'fr' ? 'en' : 'fr'; renderAll(); });
    $('#logoutBtn').addEventListener('click', () => {
      if (G.dirty && !confirm('Des modifications ne sont pas publiées. Se déconnecter quand même ?')) return;
      GH.clearToken(); location.reload();
    });
    window.addEventListener('beforeunload', (e) => { if (G.dirty) { e.preventDefault(); e.returnValue = ''; } });
  }

  document.addEventListener('DOMContentLoaded', () => { initLogin(); initApp(); });
})();
