# Divine Dogs — Site vitrine

Site officiel de **Divine Dogs**, éducation et rééducation canine partout en France.

🌐 **En ligne :** [divinedogs.fr](https://divinedogs.fr)

---

## 📁 Structure du projet

```
divinedogs/
├── index.html              # Page d'accueil
├── admin/
│   └── index.html          # Panneau d'administration (à développer)
├── assets/
│   ├── css/
│   │   └── style.css       # Feuille de style principale
│   ├── js/
│   │   └── main.js         # Script principal (nav, animations, formulaire)
│   ├── images/             # Photos (logo, équipe, chiens)
│   ├── fonts/              # Polices locales si besoin
│   └── icons/
│       └── favicon.svg     # Favicon
├── data/
│   └── data.json           # Contenu modifiable du site
├── pages/                  # Pages secondaires (mentions, CGV…)
├── CNAME                   # Domaine personnalisé GitHub Pages
└── README.md               # Ce fichier
```

---

## 🎨 Identité visuelle

- **Palette** : Espresso `#3E2723` + Butter `#FFEDCA`
- **Accents** : Doré chaud `#C9A57B`
- **Polices** : 
  - Zalando Sans SemiExpanded (titres + corps)
  - Caveat (accents manuscrits)
- **Style** : éditorial chaleureux, alternance clair/sombre

---

## 🚀 Déploiement

Le site est hébergé sur **GitHub Pages**.

1. Tout commit sur la branche `main` déclenche un déploiement automatique
2. Le fichier `CNAME` configure le domaine personnalisé `divinedogs.fr`
3. Les DNS sont configurés chez **OVH**

### Modifier le site

- **Contenu textuel** : éditer `data/data.json` (préparé pour usage admin)
- **Styles** : éditer `assets/css/style.css`
- **Comportements** : éditer `assets/js/main.js`
- **Structure HTML** : éditer `index.html`

---

## 🔧 À venir

- [ ] Page admin avec authentification Google OAuth
- [ ] Branchement du formulaire de contact (Formspree ou Brevo)
- [ ] Remplacement des photos placeholder
- [ ] Pages secondaires (mentions légales, CGV, confidentialité)
- [ ] Intégration Google Analytics
- [ ] Tarifs détaillés (en attente d'immatriculation)

---

© 2026 Divine Dogs — Tous droits réservés
