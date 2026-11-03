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
