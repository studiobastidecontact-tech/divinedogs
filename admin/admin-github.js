/* ==========================================================================
   Divine Dogs Admin v3 — Couche GitHub API
   ========================================================================== */

(function() {
  'use strict';

  const REPO_OWNER = 'studiobastidecontact-tech';
  const REPO_NAME = 'divinedogs';
  const BRANCH = 'main';
  const DATA_PATH = 'data/data.json';
  const STORAGE_KEY = 'dd_admin_session';

  function saveSession(token, email) {
    const encoded = btoa(JSON.stringify({ token, email, ts: Date.now() }));
    localStorage.setItem(STORAGE_KEY, encoded);
  }
  function getSession() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try { return JSON.parse(atob(data)); } catch { return null; }
  }
  function clearSession() { localStorage.removeItem(STORAGE_KEY); }

  async function ghFetch(endpoint, options = {}) {
    const session = getSession();
    if (!session?.token) throw new Error('Non authentifié');
    const res = await fetch(`https://api.github.com${endpoint}`, {
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

  async function verifyAccess() {
    const user = await ghFetch('/user');
    const repo = await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}`);
    if (!repo.permissions?.push) throw new Error('Vous n\'avez pas les droits d\'écriture sur ce repo');
    return { user, repo };
  }

  async function loadData() {
    const file = await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}?ref=${BRANCH}`);
    const content = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
    return { data: JSON.parse(content), sha: file.sha };
  }

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
      method: 'PUT', body: JSON.stringify(body)
    });
    return res.content.sha;
  }

  async function uploadImage(file, filename) {
    const session = getSession();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `assets/images/${Date.now()}-${safeName}`;
    let sha = null;
    try {
      const existing = await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`);
      sha = existing.sha;
    } catch (e) {}
    const body = {
      message: `Upload: ${safeName}`,
      content: base64,
      branch: BRANCH,
      committer: {
        name: session.email?.split('@')[0] || 'Admin',
        email: session.email || 'admin@divinedogs.fr'
      }
    };
    if (sha) body.sha = sha;
    await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT', body: JSON.stringify(body)
    });
    return path;
  }

  window.DD_GH = {
    saveSession, getSession, clearSession, verifyAccess,
    loadData, saveData, uploadImage,
    REPO_OWNER, REPO_NAME, BRANCH
  };
})();
