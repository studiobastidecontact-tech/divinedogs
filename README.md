# Divine Dogs — Site vitrine v3.1

Site statique (HTML/CSS/JS + data.json). Éducatrice canine comportementaliste Elisa-Lou Jodor.

## Structure
- `index.html` — accueil (hero, présentation, valeurs, contact + RGPD, avis, réseaux)
- `services.html` — page Services (6 prestations détaillées)
- `tarifs.html` — page Tarifs (grille, paiement, forfaits, FAQ tarifs)
- `mentions-legales.html` / `cgv.html` / `confidentialite.html` — pages légales
- `data/data.json` — **source unique de tout le contenu** (tout se modifie ici)
- `assets/` — css, js (icons/render/main), icônes

## Contenu
Tout le texte, les prix, les services, les mentions légales vivent dans `data/data.json`.
Modifier ce fichier = modifier le site. FR/EN gérés par langue (EN à traduire).

## Déploiement
GitHub Pages, org `studiobastidecontact-tech`, DNS OVH → divinedogs.fr

## À FAIRE
- Formulaire de contact : créer un compte Formspree, coller l'endpoint dans `data.json` → `contact.formspreeEndpoint`. Destinataire : divinedogspro@gmail.com
- Photo hero : swappable via `data.json` → `hero.backgroundImage`
- Traductions EN des textes longs
- Admin (mini-CMS) à reconstruire pour la nouvelle structure
