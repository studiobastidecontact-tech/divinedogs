/* ==========================================================================
   Divine Dogs Admin — Couche GitHub API
   Gère l'auth, la lecture, l'écriture sur le repo GitHub
   ========================================================================== */

(function() {
  'use strict';

  // ============ Configuration ============
  const REPO_OWNER = 'studiobastidecontact-tech';
  const REPO_NAME = 'divinedogs';
  const BRANCH = 'main';
  const DATA_PATH = 'data/data.json';
  const STORAGE_KEY = 'dd_admin_session';

  // ============ Session ============
  function saveSession(token, email) {
    // Stocke avec un léger obfuscation (pas une vraie sécu, juste pour ne pas avoir le token en clair)
    const encoded = btoa(JSON.stringify({ token, email, ts: Date.now() }));
    localStorage.setItem(STORAGE_KEY, encoded);
  }

  function getSession() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(atob(data));
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ============ GitHub API ============
  async function ghFetch(endpoint, options = {}) {
    const session = getSession();
    if (!session?.token) throw new Error('Non authentifié');

    const url = `https://api.github.com${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${session.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (res.status === 401) {
      clearSession();
      throw new Error('Token invalide ou expiré');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Vérifier la validité du token et l'accès au repo
  async function verifyAccess() {
    try {
      const user = await ghFetch('/user');
      const repo = await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}`);
      
      // Vérifier que l'utilisateur a au moins un accès push
      if (!repo.permissions?.push) {
        throw new Error('Vous n\'avez pas les droits d\'écriture sur ce repo');
      }
      
      return { user, repo };
    } catch (err) {
      throw err;
    }
  }

  // Charger data.json depuis GitHub
  async function loadData() {
    const file = await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}?ref=${BRANCH}`);
    const content = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
    return {
      data: JSON.parse(content),
      sha: file.sha
    };
  }

  // Sauvegarder data.json (commit + push)
  async function saveData(data, sha, message = 'Mise à jour du contenu via admin') {
    const session = getSession();
    const content = JSON.stringify(data, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    const body = {
      message,
      content: encodedContent,
      branch: BRANCH,
      committer: {
        name: session.email?.split('@')[0] || 'Admin',
        email: session.email || 'admin@divinedogs.fr'
      }
    };
    if (sha) body.sha = sha;

    const res = await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    return res.content.sha;
  }

  // Upload d'une image
  async function uploadImage(file, filename) {
    const session = getSession();
    
    // Convertir en base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const b64 = result.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Nom de fichier sûr
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const path = `assets/images/${timestamp}-${safeName}`;

    // Vérifier s'il existe déjà
    let sha = null;
    try {
      const existing = await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`);
      sha = existing.sha;
    } catch (e) {
      // N'existe pas, c'est OK
    }

    const body = {
      message: `Upload image: ${safeName}`,
      content: base64,
      branch: BRANCH,
      committer: {
        name: session.email?.split('@')[0] || 'Admin',
        email: session.email || 'admin@divinedogs.fr'
      }
    };
    if (sha) body.sha = sha;

    await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    return path;
  }

  // ============ Expose ============
  window.DD_GH = {
    saveSession,
    getSession,
    clearSession,
    verifyAccess,
    loadData,
    saveData,
    uploadImage,
    REPO_OWNER,
    REPO_NAME,
    BRANCH
  };
})();
