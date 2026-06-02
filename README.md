# Divine Dogs — Site vitrine + Admin

Site officiel de **Divine Dogs**, éducation et rééducation canine partout en France.

🌐 **En ligne** : [divinedogs.fr](https://divinedogs.fr)  
🔐 **Admin** : [divinedogs.fr/admin/](https://divinedogs.fr/admin/)

---

## 🎯 Caractéristiques

- ✨ Site statique entièrement piloté par `data/data.json`
- 🎨 Toutes les couleurs et polices modifiables sans toucher au code
- 🔐 Panneau d'administration intégré avec authentification GitHub
- 📸 Upload d'images directement depuis l'admin (avec compression auto)
- 📝 Édition de tous les textes, services, témoignages, liens
- 🚀 Déploiement automatique GitHub Pages

---

## 📁 Structure du projet

```
divinedogs/
├── index.html              # Page d'accueil (squelette)
├── admin/
│   ├── index.html          # Panneau d'admin
│   ├── admin.css           # Styles admin
│   ├── admin-github.js     # Couche API GitHub
│   └── admin-ui.js         # Interface admin
├── assets/
│   ├── css/
│   │   └── style.css       # Styles du site
│   ├── js/
│   │   ├── icons.js        # Bibliothèque d'icônes SVG
│   │   ├── render.js       # Moteur de rendu (data → HTML)
│   │   └── main.js         # Bootstrap, comportements
│   ├── images/             # Photos (upload via admin)
│   └── icons/
│       └── favicon.svg     # Favicon
├── data/
│   └── data.json           # ⭐ SOURCE UNIQUE DE VÉRITÉ
├── pages/                  # Pages secondaires (mentions, CGV…)
├── CNAME                   # Domaine personnalisé
└── README.md
```

---

## 🔐 Accéder à l'admin

### Première connexion

1. Allez sur [divinedogs.fr/admin/](https://divinedogs.fr/admin/)
2. Vous devez fournir :
   - **Votre email** (pour signer les commits GitHub)
   - **Un token GitHub personnel** (instructions ci-dessous)

### Créer un token GitHub

Cliquez sur le lien direct fourni dans l'interface admin, ou suivez ces étapes :

1. Allez sur [github.com/settings/tokens/new](https://github.com/settings/tokens/new?scopes=repo&description=Divine%20Dogs%20Admin)
2. Description : `Divine Dogs Admin`
3. Expiration : choisissez **No expiration** (recommandé pour ne pas avoir à le refaire)
4. Scopes : cochez **uniquement `repo`** (donne accès en écriture au repo)
5. Cliquez sur **Generate token**
6. **Copiez immédiatement le token** (il commence par `ghp_…`) — vous ne pourrez plus le voir ensuite
7. Collez-le dans le champ "Token GitHub" du panneau admin

⚠️ Le token est stocké **uniquement dans votre navigateur** (localStorage), jamais envoyé ailleurs.

### Donner accès à une autre personne

Pour permettre à quelqu'un d'autre (ex : la propriétaire du site) d'utiliser l'admin :

1. Sur GitHub, allez dans **Settings → Collaborators**
2. Ajoutez son compte GitHub avec le rôle **Write** (lecture/écriture)
3. Donnez-lui les instructions ci-dessus pour qu'elle crée son propre token

---

## ✏️ Modifier le site

### Via l'admin (recommandé)

1. Connectez-vous sur [divinedogs.fr/admin/](https://divinedogs.fr/admin/)
2. Naviguez dans les sections de la sidebar
3. Faites vos modifications
4. Cliquez sur **Publier** en bas à gauche
5. Les changements sont visibles sur le site sous ~1 minute

### Via Git (mode développeur)

Tout le contenu est dans `data/data.json`. Vous pouvez :
1. Cloner le repo
2. Modifier `data/data.json` à la main
3. Commit + push sur `main`

Le site se reconstruit automatiquement.

---

## 🎨 Design

- **Palette** : Espresso `#3E2723` + Butter `#FFEDCA` (modifiable via admin)
- **Accent** : Doré chaud `#C9A57B`
- **Polices** : 
  - Zalando Sans SemiExpanded (titres + corps)
  - Caveat (accents manuscrits)
- **Style** : éditorial chaleureux, alternance clair/sombre

---

## 🚀 Déploiement

Le site est hébergé sur **GitHub Pages** :
- Tout commit sur `main` déclenche un build (~30 secondes)
- Le fichier `CNAME` configure le domaine `divinedogs.fr`
- DNS configurés chez **OVH**

---

## 🛠️ Stack technique

- HTML5 / CSS3 / JavaScript vanilla (zéro dépendance)
- GitHub API pour l'admin
- GitHub Pages pour l'hébergement
- Google Fonts pour les polices
- Aucun framework, aucun build, aucun serveur

---

## 📋 Roadmap

- [ ] Brancher le formulaire de contact (Formspree → admin)
- [ ] Photos personnalisées par la propriétaire
- [ ] Pages secondaires : mentions légales, CGV, confidentialité
- [ ] Tarifs détaillés (après immatriculation)
- [ ] Google Analytics (optionnel)
- [ ] Section blog (si besoin futur)

---

© 2026 Divine Dogs — Tous droits réservés
