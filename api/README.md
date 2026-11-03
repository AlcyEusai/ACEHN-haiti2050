# Registre persistant Haïti 2050 — prototype de développement

Le site GitHub Pages est statique : **il ne peut pas héberger une API Python ni une base SQLite**. Ce dossier contient un service distinct, à déployer séparément. Aucun hébergement ni stockage distant n'a été configuré.

## Démarrage local
```bash
pip install -r api/requirements.txt
export HAITI2050_ADMIN_TOKEN="remplacer-par-un-secret-long"
uvicorn api.main:app --reload
```
Sous PowerShell : `$env:HAITI2050_ADMIN_TOKEN="..."`.

## Flux
- `POST /api/places` : proposition enregistrée avec statut `pending`, source et événement d'audit.
- `GET /api/places` : fiches approuvées uniquement.
- `GET /api/places/{id}` : sources et historique de la fiche approuvée.
- `GET /api/admin/pending` et `GET /api/admin/duplicates` : requièrent l'en-tête `X-Admin-Token`.
- `POST /api/admin/places/{id}/review` : décision `approved` ou `rejected`, motif obligatoire ; approbation bloquée si doublon potentiel.

## Limites de sécurité avant production
Le prototype ne doit pas être exposé publiquement en l'état. Les propositions sont anonymes, sans limitation de débit ni protection anti-abus ; l'API n'a pas encore d'authentification utilisateur, de validation des domaines sources, de gestion des rôles, de contrôle géographique côté serveur, de résolution des doublons, de migrations, ni de sauvegardes automatisées. SQLite convient à une démonstration mono-instance avec disque persistant, pas à un déploiement éphémère. Une version de production exige PostgreSQL, identité des contributeurs, journaux d'audit fiables, sauvegardes, HTTPS et tests.

Le catalogue V4 en JavaScript **n'est pas encore connecté à cette API**. Les données actuelles et la branche `main` ne sont pas modifiées.

## Déploiement préparé sur Render

Le fichier `render.yaml` décrit un service Python **Starter** avec disque persistant monté dans `/var/data` (offre payante susceptible d'entraîner des frais). Le déploiement n'a pas été effectué.

1. Créer un service Render depuis la branche `prototype/haiti2050-v4-parcours` en utilisant le Blueprint `render.yaml`.
2. Définir `HAITI2050_ADMIN_TOKEN` avec un secret aléatoire long et `HAITI2050_ALLOWED_ORIGINS` avec les origines exactes autorisées, par exemple `https://alcyeusai.github.io,https://raw.githack.com`. Attention : une origine autorisée ne protège pas l'API contre les requêtes malveillantes ; la modération exige toujours le jeton.
3. Après déploiement, vérifier `https://<service>.onrender.com/api/health`.
4. Modifier `registry-config.js` pour renseigner `apiBase` avec l'URL HTTPS réelle de l'API, puis republier le prototype.
5. Tester la consultation des fiches approuvées et la page `moderation.html`. Ne jamais placer le jeton dans `registry-config.js`, GitHub ou l'URL.

### Précautions
La page de modération est une interface statique publiquement accessible mais toutes ses actions sensibles exigent le jeton côté serveur. Éviter de saisir ce jeton depuis un appareil partagé. Le prototype ne comporte pas de mécanisme permettant de clôturer un conflit de doublons : l'approbation d'une fiche liée à un conflit reste bloquée. Il faut ajouter une procédure de rapprochement auditée avant toute utilisation réelle. Les données SQLite doivent être sauvegardées hors du disque Render ; un disque persistant seul ne constitue pas une stratégie de sauvegarde.

**Ne pas ouvrir les contributions anonymes au public avant** authentification, limitation de débit, anti-abus, validation des sources et tests de sécurité.
