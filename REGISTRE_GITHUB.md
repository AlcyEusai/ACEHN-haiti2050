# Registre GitHub — Haïti 2050 V4

**Mode retenu : GitHub Pages + registre JSON versionné + pull requests + GitHub Actions.**

Le registre approuvé est `data/registre-etablissements.json`. Les visiteurs peuvent consulter les fiches publiées sans API, sans SQLite et sans hébergement Render. Les contributions sont proposées par GitHub, vérifiées par `scripts/validate_registry.py` puis revues humainement dans une pull request vers `prototype/haiti2050-v4-parcours`.

## Procédure
1. Ouvrir la page `moderation.html` du prototype et suivre « Examiner les propositions ».
2. Pour ajouter une fiche, modifier `data/registre-etablissements.json` sur une branche contributrice et ouvrir une pull request ciblant `prototype/haiti2050-v4-parcours`.
3. Chaque fiche doit contenir au minimum : `id`, `name`, `category`, `source` (HTTPS), `verification`, `updatedAt`, `history` (événements avec `date`, `action`, `source`). Les coordonnées `lat`/`lon` sont nulles si elles ne sont pas vérifiables.
4. Vérifier le résultat du workflow « Haiti2050 registry review ». Les doublons suspects provoquent un échec à examiner et corriger avant fusion.
5. Les responsables du dépôt approuvent et fusionnent la pull request ; l'historique Git conserve les modifications et les discussions.

## Limitations
GitHub Pages est public : ne pas publier de secrets ni de données personnelles sensibles. Une pull request ne remplace pas une vérification de terrain. La revue humaine et les protections de branche doivent être configurées dans les paramètres GitHub du dépôt ; ce fichier ne les active pas. Le registre est initialement vide et n'importe pas automatiquement les données ADF ou OSM. Le catalogue OSM à la demande reste indépendant du registre approuvé.

Le dossier `api/` et `render.yaml` sont conservés comme code expérimental historique, **non utilisés dans l'architecture GitHub actuelle**. Aucun serveur externe n'est requis.

**Ne pas fusionner la branche V4 vers `main` avant validation du prototype.**
