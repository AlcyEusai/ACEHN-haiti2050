# Haïti 2050 — Atlas territorial (prototype V1)

Ouvrir `index.html` dans un navigateur connecté à Internet. La carte utilise Leaflet et les tuiles OpenStreetMap, chargées en ligne. Aucun compte ni serveur n'est nécessaire pour tester.

## Fonctions
- 10 départements avec repères cartographiques approximatifs et navigation
- Répertoire **initial et non exhaustif** de communes
- Recherche dans ce répertoire
- Ajout de localités et de fiches de projets dans le navigateur (localStorage)
- Fiches de concepts pilotes pour Fond-des-Blancs

## Limites
Les points des départements sont indicatifs, pas des polygones administratifs. Les localités saisies ne sont pas vérifiées. Les exemples de projets ne sont ni approuvés ni budgétés. Les ajouts restent uniquement dans le navigateur de l'utilisateur et ne sont pas synchronisés.

## Suite recommandée
1. Obtenir des limites administratives vérifiées (ADM1, ADM2, ADM3) et des référentiels officiels de localités.
2. Importer ces données dans PostgreSQL/PostGIS et publier une API.
3. Ajouter un espace d'administration, la gestion des photos, la modération et la traçabilité des sources.
4. Superposer les plans architecturaux géoréférencés, avec avant/après et fiches cliquables.
5. Faire valider les données et projets par des experts et communautés locales.

Déploiement : déposer les fichiers à la racine d'un site statique Netlify, Cloudflare Pages ou GitHub Pages.
