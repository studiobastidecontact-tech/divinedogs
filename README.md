Démarrage du site :
# Divine Dogs v3

Site vitrine d'Elisa-Lou Jaudor — éducatrice canine comportementaliste.

## Structure

```
/                        → site public
/admin/                  → panneau d'administration (auth GitHub)
/assets/                 → CSS, JS, images, icônes
/data/data.json          → contenu du site (source de vérité)
/pages/                  → pages légales (mentions, confidentialité)
```

## Stack

- HTML/CSS/JS vanilla, zéro framework, zéro build
- Données dans `data/data.json`, rendues côté client par `render.js`
- Admin via API GitHub (token personnel) avec Personal Access Token
- Hébergé sur GitHub Pages, DNS chez OVH, domaine `divinedogs.fr`

## Polices

- **Climate Crisis** (Google Fonts) — logo "DIVINE DOGS"
- **Inter** (Google Fonts) — corps de texte (alternative moderne à Stack Sans Headline qui n'existe pas sur Google Fonts)
- **Zalando Sans SemiExpanded** (Google Fonts) — titre "Ce que Divine Dogs n'est pas"

## Palette Pantone

- Jet Black `#000000`
- Espresso `#3D2B1F`
- Hazelnut `#BBA98A`
- Dusty Rose `#C48B9F` ← couleur d'accent pour les mots impactants

## i18n

Le site est bilingue FR/EN. Toggle dans la nav. Pour l'instant les textes EN sont des placeholders, à compléter par Elisa-Lou.

## Mises à jour de contenu

Via `/admin/` avec un token GitHub. Pas besoin de toucher au code.
