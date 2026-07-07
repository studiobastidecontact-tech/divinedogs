/* ==========================================================================
   Divine Dogs — Admin · Couche GitHub API
   ========================================================================== */
window.DD_GH = (function() {
  'use strict';

  const CFG = {
    owner: 'studiobastidecontact-tech',
    repo: 'divinedogs',
    branch: 'main',
    dataPath: 'data/data.json',
    imageDir: 'assets/images'
  };
  const TOKEN_KEY = 'dd_admin_token';
  const API = 'https://api.github.com';

  function getToken() { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(token, remember) {
    if (remember) localStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.setItem(TOKEN_KEY, token);
  }
  function clearToken() { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); }

  function headers() {
    return { 'Authorization': 'token ' + getToken(), 'Accept': 'application/vnd.github+json' };
  }

  // Encodage base64 UTF-8 sûr
  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64decode(b64) {
    return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
  }

  // Vérifie le token en lisant le repo
  async function verify() {
    const res = await fetch(`${API}/repos/${CFG.owner}/${CFG.repo}`, { headers: headers() });
    if (res.status === 401) throw new Error('Token invalide ou expiré.');
    if (res.status === 404) throw new Error("Dépôt introuvable ou token sans accès à ce dépôt.");
    if (!res.ok) throw new Error('Erreur GitHub (' + res.status + ').');
    return await res.json();
  }

  // Récupère data.json + son sha
  async function loadData() {
    const res = await fetch(`${API}/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.dataPath}?ref=${CFG.branch}&t=${Date.now()}`, { headers: headers() });
    if (!res.ok) throw new Error('Impossible de charger data.json (' + res.status + ').');
    const json = await res.json();
    return { data: JSON.parse(b64decode(json.content)), sha: json.sha };
  }

  // Écrit data.json (commit)
  async function saveData(dataObj, sha, message) {
    const content = JSON.stringify(dataObj, null, 2);
    const res = await fetch(`${API}/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.dataPath}`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({
        message: message || 'Mise à jour du contenu via l\'admin',
        content: b64encode(content), sha, branch: CFG.branch
      })
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || 'Échec de l\'enregistrement (' + res.status + ').');
    }
    const json = await res.json();
    return json.content.sha; // nouveau sha
  }

  // Upload d'une image (base64) dans assets/images
  async function uploadImage(filename, base64NoPrefix, existingSha) {
    const path = `${CFG.imageDir}/${filename}`;
    const body = { message: 'Ajout image ' + filename, content: base64NoPrefix, branch: CFG.branch };
    if (existingSha) body.sha = existingSha;
    const res = await fetch(`${API}/repos/${CFG.owner}/${CFG.repo}/contents/${path}`, {
      method: 'PUT', headers: headers(), body: JSON.stringify(body)
    });
    if (!res.ok) {
      // si le fichier existe déjà, récupérer son sha et réessayer
      if (res.status === 422) {
        const g = await fetch(`${API}/repos/${CFG.owner}/${CFG.repo}/contents/${path}?ref=${CFG.branch}`, { headers: headers() });
        if (g.ok) { const j = await g.json(); return uploadImage(filename, base64NoPrefix, j.sha); }
      }
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || 'Échec de l\'upload image.');
    }
    return path; // chemin relatif à utiliser dans data.json
  }

  return { CFG, getToken, setToken, clearToken, verify, loadData, saveData, uploadImage, b64encode, b64decode };
})();
