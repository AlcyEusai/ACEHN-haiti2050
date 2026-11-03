# Audit national du registre des établissements — 3 novembre 2026

Analyse du fichier national fourni (19 076 fiches). **Aucun nouvel établissement n'est déclaré vérifié par cet audit.**

| Contrôle | Résultat |
|---|---:|
| Fiches analysées | 19 076 |
| Identifiants dupliqués | 0 groupe |
| Groupes de noms identiques par commune, département et catégorie (normalisation accents/ponctuation) | 817 |
| Fiches sans commune | 81 |
| Fiches sans département | 62 |
| Fiches sans GPS | 0 |

## Anomalie structurante

Les noms des départements sont hétérogènes : `Centre Department`, `Sud Department`, `Artibonite Department`, `Nord-Est Department`, `Nord-Ouest Department`, ainsi que des formes françaises. L'audit des 149 communes ne peut être considéré fiable tant que ces libellés ne sont pas normalisés et rattachés au référentiel territorial.

## Règles pour l'enrichissement national

1. Réconcilier les départements et communes avec `territoires.js` (référentiel IHSI), sans changer les données brutes avant vérification.
2. Vérifier les 817 groupes de noms homonymes par GPS, source et adresse ; ne jamais dédupliquer automatiquement sur le seul nom.
3. Compléter les 81 communes et 62 départements manquants à partir de sources traçables.
4. Pour les 149 communes et toutes les catégories, croiser les fiches avec les registres publics sectoriels et les données cartographiques.
5. Ajouter uniquement les institutions sourcées, en conservant statut de vérification et date de collecte.
6. Tester les filtres et la carte avant toute fusion dans `main`.

Le rapport de couverture est un **état du registre**, pas un recensement exhaustif des institutions existantes.
